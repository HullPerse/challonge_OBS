import { MAX_SLUG_LENGTH, SLUG } from "@/configs/server/validation.config";
import HttpUtils from "@/lib/server/http.utils";
import { snapshotWriteSchema, visibilitySchema } from "@/lib/schemas/server/tournament.schema";
import type { TournamentRoutesOptions } from "@/types/server/routes";
import { Elysia } from "elysia";
import type TournamentService from "../services/tournament.service";

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
    return slug;
  }

  private get(rawSlug: string): Response {
    const slug = this.validSlug(rawSlug);
    if (!slug) return HttpUtils.errorRes("Invalid slug", 400);

    const snapshot = this.tournaments.get(slug);

    if (!snapshot) return HttpUtils.notFound();
    return HttpUtils.jsonRes(snapshot);
  }

  private save(rawSlug: string, body: unknown, createOnly = false): Response {
    const slug = this.validSlug(rawSlug);
    if (!slug) return HttpUtils.errorRes("Invalid slug", 400);

    const parsed = snapshotWriteSchema.safeParse(body);
    if (!parsed.success) {
      return HttpUtils.jsonRes({ error: "Invalid snapshot", issues: parsed.error.issues }, 400);
    }

    if (parsed.data.slug !== slug) {
      return HttpUtils.errorRes("Slug mismatch", 400);
    }

    if (createOnly && this.tournaments.exists(slug)) {
      return HttpUtils.jsonRes({ error: "Турнир уже сохранён" }, 409);
    }

    const saved = this.tournaments.save(parsed.data);
    this.options.onSaved?.(saved);
    return HttpUtils.jsonRes(saved);
  }

  private remove(rawSlug: string): Response {
    const slug = this.validSlug(rawSlug);
    if (!slug) return HttpUtils.errorRes("Invalid slug", 400);

    if (!this.tournaments.remove(slug)) return HttpUtils.notFound();

    this.options.onDeleted?.(slug);
    return HttpUtils.jsonRes({ deleted: true });
  }

  private getVisibility(rawSlug: string): Response {
    const slug = this.validSlug(rawSlug);
    if (!slug) return HttpUtils.errorRes("Invalid slug", 400);
    if (!this.tournaments.exists(slug)) return HttpUtils.notFound();

    return HttpUtils.jsonRes(this.tournaments.getVisibility(slug));
  }

  private saveVisibility(rawSlug: string, body: unknown): Response {
    const slug = this.validSlug(rawSlug);
    if (!slug) return HttpUtils.errorRes("Invalid slug", 400);
    if (!this.tournaments.exists(slug)) return HttpUtils.notFound();

    const parsed = visibilitySchema.safeParse(body);
    if (!parsed.success) {
      return HttpUtils.jsonRes({ error: "Invalid visibility", issues: parsed.error.issues }, 400);
    }

    const saved = this.tournaments.saveVisibility(slug, parsed.data);

    this.options.onVisibilitySaved?.(slug, saved);
    return HttpUtils.jsonRes(saved);
  }

  plugin() {
    return new Elysia({ name: "tournaments" })
      .get("/api/tournaments", () => HttpUtils.jsonRes(this.tournaments.list()))
      .post("/api/tournaments", () => HttpUtils.methodNotAllowed())
      .get("/api/tournaments/:slug", ({ params }) => this.get(params.slug))
      .put("/api/tournaments/:slug", ({ params, body, query }) =>
        this.save(params.slug, body, query.mode === "create"),
      )
      .delete("/api/tournaments/:slug", ({ params }) => this.remove(params.slug))
      .post("/api/tournaments/:slug", () => HttpUtils.methodNotAllowed())
      .get("/api/tournaments/:slug/visibility", ({ params }) => this.getVisibility(params.slug))
      .put("/api/tournaments/:slug/visibility", ({ params, body }) =>
        this.saveVisibility(params.slug, body),
      )
      .post("/api/tournaments/:slug/visibility", () => HttpUtils.methodNotAllowed());
  }
}
