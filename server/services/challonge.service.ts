import {
  CHALLONGE_CACHE_LIMIT,
  CHALLONGE_CACHE_TTL_MS,
  DEFAULT_HTML_CONTENT_TYPE,
  MAX_PROXY_BYTES,
  PROXY_ACCEPT,
  PROXY_TIMEOUT_MS,
  TARGET_PATH,
  USER_AGENT,
} from "@/configs/server/challonge.config";
import { isChallongeHost } from "@/configs/tournament.config";
import HttpUtils from "@/lib/server/http.utils";
import type { CachedPage, LoadResult } from "@/types/server/challonge";
import { attempt, attemptSync } from "@hullperse/hp_utils/attempt";

/** Proxies allowed Challonge module pages with revalidation and single-flight. */
export default class ChallongeService {
  private readonly pages = new Map<string, CachedPage>();
  private readonly inflight = new Map<string, Promise<LoadResult>>();

  private isAllowedTarget(data: URL): boolean {
    const isHttps = data.protocol === "https:";
    const isAllowedHost = isChallongeHost(data.hostname);
    const isAllowedPath = TARGET_PATH.test(data.pathname);

    return isHttps && isAllowedHost && isAllowedPath;
  }

  /** Fetches and returns an allowed Challonge module page. */
  async proxy(req: Request): Promise<Response> {
    if (req.method !== "GET") return HttpUtils.methodNotAllowed();

    const raw = new URL(req.url).searchParams.get("url");

    if (!raw) return HttpUtils.errorRes("Missing url", 400);

    const [target, targetError] = attemptSync(() => new URL(raw));

    if (targetError || !this.isAllowedTarget(target)) {
      return HttpUtils.errorRes("Only https://challonge.com/<slug>/module is allowed", 403);
    }

    const key = target.href;
    const cached = this.pages.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return this.pageResponse(cached);
    }

    const [result, resultError] = await attempt(this.load(target, key, cached));

    if (resultError) {
      console.error("challonge: proxy failed", resultError);
      return HttpUtils.errorRes("Challonge request failed", 502);
    }

    if (!result.ok) {
      console.error(`challonge: ${result.error}`, target.href);
      return HttpUtils.errorRes(result.error, result.status);
    }

    return this.pageResponse(result.page);
  }

  private load(target: URL, key: string, cached?: CachedPage): Promise<LoadResult> {
    const pending = this.inflight.get(key);
    if (pending) return pending;

    const request = (async (): Promise<LoadResult> => {
      const [result, error] = await attempt(this.fetchPage(target, key, cached));

      this.inflight.delete(key);

      if (error) {
        return { ok: false, status: 502, error: "Challonge request failed" };
      }

      return result;
    })();

    this.inflight.set(key, request);
    return request;
  }

  private async fetchPage(target: URL, key: string, cached?: CachedPage): Promise<LoadResult> {
    const headers: Record<string, string> = {
      accept: PROXY_ACCEPT,
      "user-agent": USER_AGENT,
    };

    if (cached?.etag) headers["if-none-match"] = cached.etag;
    if (cached?.lastModified) {
      headers["if-modified-since"] = cached.lastModified;
    }

    const [response, responseError] = await attempt(
      fetch(target, {
        redirect: "follow",
        signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
        headers,
      }),
    );

    if (responseError) {
      return { ok: false, status: 502, error: "Challonge request failed" };
    }

    const [resolved, resolvedError] = attemptSync(() => new URL(response.url));

    if (resolvedError || !this.isAllowedTarget(resolved)) {
      return {
        ok: false,
        status: 502,
        error: "Challonge redirected outside the allowlist",
      };
    }

    if (response.status === 304 && cached) {
      cached.expiresAt = Date.now() + CHALLONGE_CACHE_TTL_MS;
      this.remember(key, cached);
      return { ok: true, page: cached };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Challonge responded ${response.status}`,
      };
    }

    const [body, bodyError] = await attempt(HttpUtils.readTextLimited(response, MAX_PROXY_BYTES));

    if (bodyError || body === null) {
      return {
        ok: false,
        status: 502,
        error: bodyError ? "Failed to read Challonge response" : "Challonge response is too large",
      };
    }

    const page: CachedPage = {
      body,
      contentType: response.headers.get("content-type") ?? DEFAULT_HTML_CONTENT_TYPE,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
      expiresAt: Date.now() + CHALLONGE_CACHE_TTL_MS,
    };

    this.remember(key, page);
    return { ok: true, page };
  }

  private remember(key: string, page: CachedPage) {
    this.pages.delete(key);
    this.pages.set(key, page);

    while (this.pages.size > CHALLONGE_CACHE_LIMIT) {
      const oldest = this.pages.keys().next().value;
      if (oldest === undefined) break;
      this.pages.delete(oldest);
    }
  }

  private pageResponse(page: CachedPage): Response {
    return HttpUtils.htmlRes(page.body, page.contentType, {
      ...(page.etag ? { etag: page.etag } : {}),
      ...(page.lastModified ? { "last-modified": page.lastModified } : {}),
    });
  }
}
