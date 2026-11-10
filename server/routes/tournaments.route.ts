import { MAX_KEY_LENGTH, MAX_SLUG_LENGTH, SLUG } from "@/configs/server/validation.config";
import { isChallongeHost } from "@/configs/tournament.config";
import HttpUtils from "@/lib/server/http.utils";
import Logger from "@/lib/server/logger.utils";
import { snapshotWriteSchema, visibilitySchema } from "@/lib/schemas/server/tournament.schema";
import { tournamentKey } from "@/lib/tournament/slug.tournament";
import type { TournamentRoutesOptions } from "@/types/server/routes";
import { Elysia } from "elysia";
import type TournamentService from "../services/tournament.service";

const logger = new Logger("TOURNAMENTS");

export default class TournamentRoutes {
  private readonly tournaments: TournamentService;
  private readonly options: TournamentRoutesOptions;

  constructor(tournaments: TournamentService, options: TournamentRoutesOptions = {}) {
    this.tournaments = tournaments;
    this.options = options;
  }

  private validSlug(slug: string): string | null {
    const valid = slug.length <= MAX_SLUG_LENGTH && SLUG.test(slug);
    if (!valid) return null;
    return slug.toLowerCase();
  }

  private validKey(host: string, slug: string): string | null {
    const validSlug = this.validSlug(slug);
    if (!validSlug) return null;
    if (!isChallongeHost(host)) return null;
    if (host.length + validSlug.length + 1 > MAX_KEY_LENGTH) return null;

    return tournamentKey(host, validSlug);
  }

  private get(key: string): Response {
    const snapshot = this.tournaments.get(key);

    if (!snapshot) return HttpUtils.notFound();
    return HttpUtils.jsonRes(snapshot);
  }

  private save(key: string, slug: string, body: unknown, createOnly = false): Response {
    const parsed = snapshotWriteSchema.safeParse(body);
    if (!parsed.success) {
      logger.debug("invalid snapshot", { issues: parsed.error.issues });
      return HttpUtils.jsonRes({ error: "Invalid snapshot", issues: parsed.error.issues }, 400);
    }

    if (parsed.data.key !== key || parsed.data.slug !== slug) {
      logger.warn("key mismatch", {
        key,
        snapshotKey: parsed.data.key,
        slug,
        snapshotSlug: parsed.data.slug,
      });
      return HttpUtils.errorRes("Tournament key mismatch", 400);
    }

    if (createOnly && this.tournaments.exists(key)) {
      return HttpUtils.jsonRes({ error: "Турнир уже сохранён" }, 409);
    }

    const saved = this.tournaments.save(parsed.data);
    this.options.onSaved?.(saved);
    return HttpUtils.jsonRes(saved);
  }

  private remove(key: string): Response {
    if (!this.tournaments.remove(key)) return HttpUtils.notFound();

    this.options.onDeleted?.(key);
    return HttpUtils.jsonRes({ deleted: true });
  }

  private getVisibility(key: string): Response {
    if (!this.tournaments.exists(key)) return HttpUtils.notFound();

    return HttpUtils.jsonRes(this.tournaments.getVisibility(key));
  }

  private saveVisibility(key: string, body: unknown): Response {
    if (!this.tournaments.exists(key)) return HttpUtils.notFound();

    const parsed = visibilitySchema.safeParse(body);
    if (!parsed.success) {
      return HttpUtils.jsonRes({ error: "Invalid visibility", issues: parsed.error.issues }, 400);
    }

    const saved = this.tournaments.saveVisibility(key, parsed.data);

    this.options.onVisibilitySaved?.(key, saved);
    return HttpUtils.jsonRes(saved);
  }

  private getByKey(host: string, rawSlug: string): Response {
    const key = this.validKey(host, rawSlug);
    if (!key) return HttpUtils.errorRes("Invalid tournament host or slug", 400);

    return this.get(key);
  }

  private saveByKey(host: string, rawSlug: string, body: unknown, createOnly: boolean): Response {
    const key = this.validKey(host, rawSlug);
    if (!key) return HttpUtils.errorRes("Invalid tournament host or slug", 400);

    return this.save(key, rawSlug.toLowerCase(), body, createOnly);
  }

  private removeByKey(host: string, rawSlug: string): Response {
    const key = this.validKey(host, rawSlug);
    if (!key) return HttpUtils.errorRes("Invalid tournament host or slug", 400);

    return this.remove(key);
  }

  private getVisibilityByKey(host: string, rawSlug: string): Response {
    const key = this.validKey(host, rawSlug);
    if (!key) return HttpUtils.errorRes("Invalid tournament host or slug", 400);

    return this.getVisibility(key);
  }

  private saveVisibilityByKey(host: string, rawSlug: string, body: unknown): Response {
    const key = this.validKey(host, rawSlug);
    if (!key) return HttpUtils.errorRes("Invalid tournament host or slug", 400);

    return this.saveVisibility(key, body);
  }

  plugin() {
    return new Elysia({ name: "tournaments" })
      .get("/api/tournaments", () => HttpUtils.jsonRes(this.tournaments.list()))
      .post("/api/tournaments", () => HttpUtils.methodNotAllowed())
      .get("/api/tournaments/:host/:slug", ({ params }) => this.getByKey(params.host, params.slug))
      .put("/api/tournaments/:host/:slug", ({ params, body, query }) =>
        this.saveByKey(params.host, params.slug, body, query.mode === "create"),
      )
      .delete("/api/tournaments/:host/:slug", ({ params }) =>
        this.removeByKey(params.host, params.slug),
      )
      .post("/api/tournaments/:host/:slug", () => HttpUtils.methodNotAllowed())
      .get("/api/tournaments/:host/:slug/visibility", ({ params }) =>
        this.getVisibilityByKey(params.host, params.slug),
      )
      .put("/api/tournaments/:host/:slug/visibility", ({ params, body }) =>
        this.saveVisibilityByKey(params.host, params.slug, body),
      )
      .post("/api/tournaments/:host/:slug/visibility", () => HttpUtils.methodNotAllowed());
  }
}
