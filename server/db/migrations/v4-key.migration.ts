import { columnExists, createTables, tableExists } from "../ddl.db";
import {
  buildKeyBySlug,
  readLegacyOverlay,
  readLegacyTournaments,
  readLegacyVisibility,
  writeLegacyOverlay,
  writeLegacyTournaments,
  writeLegacyVisibility,
} from "./legacy.db";
import type { Database } from "bun:sqlite";

const LEGACY_TABLES = ["tournaments", "tournament_visibility", "overlay_state"] as const;

const legacyTableName = (table: (typeof LEGACY_TABLES)[number]): string => `${table}_legacy`;

const renameLegacyTables = (sqlite: Database): void => {
  for (const table of LEGACY_TABLES) {
    if (!tableExists(sqlite, table)) continue;

    sqlite.run(`ALTER TABLE ${table} RENAME TO ${legacyTableName(table)}`);
  }
};

const dropLegacyTables = (sqlite: Database): void => {
  for (const table of LEGACY_TABLES) {
    const legacyTable = legacyTableName(table);
    if (!tableExists(sqlite, legacyTable)) continue;

    sqlite.run(`DROP TABLE ${legacyTable}`);
  }
};

/** Rebuilds v3 tables around the unique `host/slug` key. */
export const migrateToKeySchema = (sqlite: Database): void => {
  if (!tableExists(sqlite, "tournaments") || columnExists(sqlite, "tournaments", "key")) return;

  const tournaments = readLegacyTournaments(sqlite);
  const visibility = readLegacyVisibility(sqlite);
  const overlay = readLegacyOverlay(sqlite);
  const keyBySlug = buildKeyBySlug(tournaments);

  renameLegacyTables(sqlite);
  createTables(sqlite);
  writeLegacyTournaments(sqlite, tournaments, keyBySlug);
  writeLegacyVisibility(sqlite, visibility, keyBySlug);
  writeLegacyOverlay(sqlite, overlay, keyBySlug);
  dropLegacyTables(sqlite);
};
