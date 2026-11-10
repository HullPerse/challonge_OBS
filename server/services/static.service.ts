import { OVERLAY_BOOTSTRAP_ID } from "@/configs/overlay.config";
import { DIST_DIR } from "@/configs/server/app.config";
import {
  DEFAULT_BINARY_CONTENT_TYPE,
  STATIC_INDEX_FILE,
  STATIC_MANIFEST_TTL_MS,
  STATIC_SECURITY_HEADERS,
} from "@/configs/server/static.config";
import HttpUtils from "@/lib/server/http.utils";
import Logger from "@/lib/server/logger.utils";
import PathUtils from "@/lib/server/path.utils";
import StaticUtils from "@/lib/server/static.utils";
import type { StaticEntry } from "@/types/server/static";
import { attempt, attemptSync } from "@hullperse/hp_utils/attempt";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const logger = new Logger("STATIC");

/** Serves the built SPA with safe fallback routing. */
export default class StaticService {
  private manifest = new Map<string, StaticEntry>();
  private manifestAt = 0;
  private missingDistLogged = false;

  private rebuildManifest() {
    const next = new Map<string, StaticEntry>();

    const walk = (directory: string, prefix: string) => {
      const [entries, entriesError] = attemptSync(() =>
        readdirSync(directory, { withFileTypes: true }),
      );

      if (entriesError) {
        logger.warn("could not read the dist directory", { error: entriesError, directory });
        return;
      }

      for (const entry of entries) {
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
        const absolute = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          walk(absolute, relative);
          continue;
        }

        if (!entry.isFile()) continue;

        const [stat, statError] = attemptSync(() => statSync(absolute));

        if (statError) {
          logger.debug("could not stat a dist file", { file: absolute });
          continue;
        }

        next.set(relative, { size: stat.size, mtimeMs: stat.mtimeMs });
      }
    };

    walk(DIST_DIR, "");
    if (next.size > 0) this.missingDistLogged = false;
    this.manifest = next;
    this.manifestAt = Date.now();
  }

  private ensureManifest() {
    if (this.manifestAt === 0 || Date.now() - this.manifestAt > STATIC_MANIFEST_TTL_MS) {
      this.rebuildManifest();
    }
  }

  private fileResponse(
    request: Request,
    file: Blob,
    pathname: string,
    entry: StaticEntry,
  ): Response {
    const etag = StaticUtils.etag(entry);
    const headers = {
      ...STATIC_SECURITY_HEADERS,
      "cache-control": StaticUtils.cacheControl(pathname),
      "content-type": file.type || DEFAULT_BINARY_CONTENT_TYPE,
      etag,
      "last-modified": new Date(entry.mtimeMs).toUTCString(),
    };

    if (StaticUtils.matchesEtag(request.headers.get("if-none-match"), etag)) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(request.method === "HEAD" ? null : file, { headers });
  }

  private async bootstrapResponse(
    request: Request,
    file: Blob,
    bootstrap: unknown,
  ): Promise<Response> {
    const [html, htmlError] = await attempt(file.text());

    if (htmlError) {
      logger.error("could not read index.html", htmlError, { dist: DIST_DIR });
      return HttpUtils.errorRes("Not found", 404);
    }

    const payload = JSON.stringify(bootstrap)
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");
    const tag = `<script type="application/json" id="${OVERLAY_BOOTSTRAP_ID}">${payload}</script>`;
    const body = html.includes("</head>")
      ? html.replace("</head>", `${tag}</head>`)
      : `${tag}${html}`;

    return new Response(request.method === "HEAD" ? null : body, {
      headers: {
        ...STATIC_SECURITY_HEADERS,
        "cache-control": "no-store",
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  /** Serves a static file or the SPA index fallback. */
  async serve(request: Request, bootstrap?: unknown): Promise<Response> {
    if (!["GET", "HEAD"].includes(request.method)) {
      return HttpUtils.methodNotAllowed();
    }

    const [pathname, pathnameError] = attemptSync(() =>
      decodeURIComponent(new URL(request.url).pathname),
    );

    if (pathnameError || !pathname || pathname.includes("\0")) {
      return HttpUtils.errorRes("Invalid path", 400);
    }

    let relative = pathname.replace(/^\/+/, "");
    if (pathname === "/") relative = STATIC_INDEX_FILE;

    const requestedPath = path.resolve(DIST_DIR, relative);

    if (!PathUtils.isInsideDirectory(requestedPath, DIST_DIR)) {
      return HttpUtils.errorRes("Not found", 404);
    }

    this.ensureManifest();
    let entry = this.manifest.get(relative);

    if (!entry) {
      this.rebuildManifest();
      entry = this.manifest.get(relative);
    }

    if (!entry) {
      if (path.extname(pathname)) return HttpUtils.errorRes("Not found", 404);

      relative = STATIC_INDEX_FILE;
      entry = this.manifest.get(relative);

      if (!entry) {
        if (!this.missingDistLogged) {
          logger.warn("frontend build is missing; run `bun run build`", { dist: DIST_DIR });
          this.missingDistLogged = true;
        }

        return new Response("Run `bun run build` first", { status: 503 });
      }
    }

    const file = Bun.file(path.resolve(DIST_DIR, relative));

    if (relative === STATIC_INDEX_FILE && bootstrap !== undefined) {
      return this.bootstrapResponse(request, file, bootstrap);
    }

    return this.fileResponse(request, file, `/${relative}`, entry);
  }
}
