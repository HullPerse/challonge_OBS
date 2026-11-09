import HttpApi from "@/lib/http.utils";
import {
  snapshotSchema,
  tournamentSummaryListSchema,
  tournamentVisibilitySchema,
} from "@/lib/schemas/tournament-snapshot.schema";
import { splitTournamentKey } from "@/lib/tournament/slug.tournament";
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

const keyPath = (key: string): string => {
  const parts = splitTournamentKey(key);
  if (!parts) throw new Error("Некорректный идентификатор турнира");

  return `/tournaments/${encodeURIComponent(parts.host)}/${encodeURIComponent(parts.slug)}`;
};

export default class TournamentApi {
  private readonly http: HttpApi;

  constructor(http: HttpApi = new HttpApi()) {
    this.http = http;
  }

  list(): Promise<TournamentSummary[]> {
    return this.http.get("/tournaments", "Не удалось загрузить турниры", parseSummaryList);
  }

  get(key: string): Promise<TournamentSnapshot | null> {
    return this.http.getOptional(keyPath(key), "Не удалось загрузить турнир", parseSnapshot);
  }

  save(snapshot: TournamentSnapshotWrite, createOnly = false): Promise<TournamentSnapshot> {
    const query = createOnly ? "?mode=create" : "";

    return this.http.put(
      `${keyPath(snapshot.key)}${query}`,
      snapshot,
      "Не удалось сохранить турнир",
      parseSnapshot,
    );
  }

  remove(key: string): Promise<void> {
    return this.http.delete(keyPath(key), "Не удалось удалить турнир");
  }

  getVisibility(key: string): Promise<TournamentVisibility> {
    return this.http.get(
      `${keyPath(key)}/visibility`,
      "Не удалось загрузить видимость турнира",
      parseVisibility,
    );
  }

  saveVisibility(key: string, visibility: TournamentVisibility): Promise<TournamentVisibility> {
    return this.http.put(
      `${keyPath(key)}/visibility`,
      visibility,
      "Не удалось сохранить видимость турнира",
      parseVisibility,
    );
  }
}
