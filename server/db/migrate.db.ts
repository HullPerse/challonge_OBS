import { OVERLAY_CURSOR_SIZE } from "@/configs/overlay.config";
import { SCHEMA_VERSION } from "@/configs/server/database.config";
import type { Database } from "bun:sqlite";

const createTables = (sqlite: Database) => {
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS tournaments (
      slug TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      tournament_type TEXT NOT NULL,
      source_url TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      match_count INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tournament_visibility (
      slug TEXT PRIMARY KEY NOT NULL REFERENCES tournaments(slug) ON DELETE CASCADE,
      hidden_matches TEXT NOT NULL DEFAULT '[]',
      hidden_rounds TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS overlay_state (
      id INTEGER PRIMARY KEY NOT NULL,
      active_slug TEXT REFERENCES tournaments(slug) ON DELETE SET NULL,
      view TEXT NOT NULL,
      pointer TEXT NOT NULL,
      pointer_size INTEGER NOT NULL DEFAULT ${OVERLAY_CURSOR_SIZE.default},
      modules TEXT NOT NULL,
      revision INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
};

const addOverlayPointerSize = (sqlite: Database) => {
  const columns = sqlite.query<{ name: string }, []>("PRAGMA table_info(overlay_state)").all();

  if (columns.some((column) => column.name === "pointer_size")) return;

  sqlite.run(
    `ALTER TABLE overlay_state ADD COLUMN pointer_size INTEGER NOT NULL DEFAULT ${OVERLAY_CURSOR_SIZE.default}`,
  );
};

const migrateLegacyVisibility = (sqlite: Database) => {
  const foreignKeys = sqlite.query("PRAGMA foreign_key_list(tournament_visibility)").all();
  if (foreignKeys.length > 0) return;

  sqlite.run(`
    CREATE TABLE tournament_visibility_new (
      slug TEXT PRIMARY KEY NOT NULL REFERENCES tournaments(slug) ON DELETE CASCADE,
      hidden_matches TEXT NOT NULL DEFAULT '[]',
      hidden_rounds TEXT NOT NULL DEFAULT '[]'
    );
    INSERT INTO tournament_visibility_new (slug, hidden_matches, hidden_rounds)
      SELECT slug, hidden_matches, hidden_rounds FROM tournament_visibility
      WHERE slug IN (SELECT slug FROM tournaments);
    DROP TABLE tournament_visibility;
    ALTER TABLE tournament_visibility_new RENAME TO tournament_visibility;
  `);
};

export const migrateDatabase = (sqlite: Database) => {
  const versionRow = sqlite.query<{ user_version: number }, []>("PRAGMA user_version").get();
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > SCHEMA_VERSION) {
    throw new Error(
      `Database schema version ${currentVersion} is newer than supported version ${SCHEMA_VERSION}`,
    );
  }

  if (currentVersion < SCHEMA_VERSION) {
    const insides = () => {
      createTables(sqlite);
      addOverlayPointerSize(sqlite);
      migrateLegacyVisibility(sqlite);
      sqlite.run(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    };

    sqlite.transaction(insides)();
    return;
  }

  createTables(sqlite);
  addOverlayPointerSize(sqlite);
  migrateLegacyVisibility(sqlite);
};
