import HttpApi from "@/lib/http.utils";
import {
  snapshotSchema,
  tournamentSummaryListSchema,
  tournamentVisibilitySchema,
} from "@/lib/schemas/tournament-snapshot.schema";
import type {
  TournamentSnapshot,
  TournamentSnapshotWrite,
  TournamentSummary,
  TournamentVisibility,
} from "@/types/tournament";

const parseSnapshot = (value: unknown): TournamentSnapshot => snapshotSchema.parse(value);
const parseSummaryList = (value: unknown): TournamentSummary[] =>
  tournamentSummaryListSchema.parse(value);
const parseVisibility = (value: unknown): TournamentVisibility =>
  tournamentVisibilitySchema.parse(value);

const encodeSlug = (slug: string): string => encodeURIComponent(slug);

export default class TournamentApi {
  private readonly http: HttpApi;

  constructor(http: HttpApi = new HttpApi()) {
    this.http = http;
  }

  list(): Promise<TournamentSummary[]> {
    return this.http.get("/tournaments", "Не удалось загрузить турниры", parseSummaryList);
  }

  get(slug: string): Promise<TournamentSnapshot | null> {
    return this.http.getOptional(
      `/tournaments/${encodeSlug(slug)}`,
      "Не удалось загрузить турнир",
      parseSnapshot,
    );
  }

  save(snapshot: TournamentSnapshotWrite, createOnly = false): Promise<TournamentSnapshot> {
    const query = createOnly ? "?mode=create" : "";

    return this.http.put(
      `/tournaments/${encodeSlug(snapshot.slug)}${query}`,
      snapshot,
      "Не удалось сохранить турнир",
      parseSnapshot,
    );
  }

  remove(slug: string): Promise<void> {
    return this.http.delete(`/tournaments/${encodeSlug(slug)}`, "Не удалось удалить турнир");
  }

  getVisibility(slug: string): Promise<TournamentVisibility> {
    return this.http.get(
      `/tournaments/${encodeSlug(slug)}/visibility`,
      "Не удалось загрузить видимость турнира",
      parseVisibility,
    );
  }

  saveVisibility(slug: string, visibility: TournamentVisibility): Promise<TournamentVisibility> {
    return this.http.put(
      `/tournaments/${encodeSlug(slug)}/visibility`,
      visibility,
      "Не удалось сохранить видимость турнира",
      parseVisibility,
    );
  }
}
