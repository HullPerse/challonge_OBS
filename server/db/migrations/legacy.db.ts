import { CHALLONGE_DOMAIN, isChallongeHost } from "@/configs/tournament.config";
import { OVERLAY_CURSOR_SIZE } from "@/configs/overlay.config";
import { isRecord } from "@/lib/object.utils";
import { tournamentKey } from "@/lib/tournament/slug.tournament";
import { columnExists, tableExists } from "../ddl.db";
import type { LegacyOverlay, LegacyTournament, LegacyVisibility } from "@/types/server/database";
import { attemptSync } from "@hullperse/hp_utils/attempt";
import type { Database } from "bun:sqlite";

const keyFromSource = (sourceUrl: string, slug: string): string => {
  const [url, error] = attemptSync(() => new URL(sourceUrl));
  const host = !error && isChallongeHost(url.hostname) ? url.hostname : CHALLONGE_DOMAIN;

  return tournamentKey(host, slug);
};

const addSnapshotKey = (raw: string, key: string): string => {
  const [snapshot, error] = attemptSync<unknown>(() => JSON.parse(raw));
  if (error || !isRecord(snapshot)) return raw;

  return JSON.stringify({ ...snapshot, key });
};

export const readLegacyTournaments = (sqlite: Database): LegacyTournament[] => {
  return sqlite
    .query<LegacyTournament, []>(
      "SELECT slug, name, tournament_type, source_url, fetched_at, match_count, snapshot, updated_at FROM tournaments",
    )
    .all();
};

export const readLegacyVisibility = (sqlite: Database): LegacyVisibility[] => {
  if (!tableExists(sqlite, "tournament_visibility")) return [];

  return sqlite
    .query<LegacyVisibility, []>(
      "SELECT slug, hidden_matches, hidden_rounds FROM tournament_visibility",
    )
    .all();
};

export const readLegacyOverlay = (sqlite: Database): LegacyOverlay[] => {
  if (!tableExists(sqlite, "overlay_state")) return [];

  const pointerSize = columnExists(sqlite, "overlay_state", "pointer_size") ? ", pointer_size" : "";

  return sqlite
    .query<LegacyOverlay, []>(
      `SELECT id, active_slug, view, pointer, modules, revision, updated_at${pointerSize} FROM overlay_state`,
    )
    .all();
};

export const buildKeyBySlug = (rows: LegacyTournament[]): Map<string, string> => {
  return new Map(rows.map((row) => [row.slug, keyFromSource(row.source_url, row.slug)]));
};

export const writeLegacyTournaments = (
  sqlite: Database,
  rows: LegacyTournament[],
  keyBySlug: Map<string, string>,
): void => {
  for (const row of rows) {
    const key = keyBySlug.get(row.slug) ?? keyFromSource(row.source_url, row.slug);

    sqlite.run(
      `INSERT INTO tournaments
        (key, slug, host, name, tournament_type, source_url, fetched_at, match_count, snapshot, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        key,
        row.slug,
        key.slice(0, key.indexOf("/")),
        row.name,
        row.tournament_type,
        row.source_url,
        row.fetched_at,
        row.match_count,
        addSnapshotKey(row.snapshot, key),
        row.updated_at,
      ],
    );
  }
};

export const writeLegacyVisibility = (
  sqlite: Database,
  rows: LegacyVisibility[],
  keyBySlug: Map<string, string>,
): void => {
  for (const row of rows) {
    const key = keyBySlug.get(row.slug);
    if (!key) continue;

    sqlite.run(
      "INSERT INTO tournament_visibility (key, hidden_matches, hidden_rounds) VALUES (?, ?, ?)",
      [key, row.hidden_matches, row.hidden_rounds],
    );
  }
};

export const writeLegacyOverlay = (
  sqlite: Database,
  rows: LegacyOverlay[],
  keyBySlug: Map<string, string>,
): void => {
  for (const row of rows) {
    const activeKey = row.active_slug ? (keyBySlug.get(row.active_slug) ?? null) : null;

    sqlite.run(
      `INSERT INTO overlay_state
        (id, active_key, view, pointer, pointer_size, modules, revision, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        activeKey,
        row.view,
        row.pointer,
        row.pointer_size ?? OVERLAY_CURSOR_SIZE.default,
        row.modules,
        row.revision,
        row.updated_at,
      ],
    );
  }
};
