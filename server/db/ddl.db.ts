import { OVERLAY_CURSOR_SIZE } from "@/configs/overlay.config";
import type { Database } from "bun:sqlite";

export const createTables = (sqlite: Database): void => {
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS tournaments (
      key TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL,
      host TEXT NOT NULL,
      name TEXT NOT NULL,
      tournament_type TEXT NOT NULL,
      source_url TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      match_count INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS tournaments_slug_idx ON tournaments(slug);
    CREATE TABLE IF NOT EXISTS tournament_visibility (
      key TEXT PRIMARY KEY NOT NULL REFERENCES tournaments(key) ON DELETE CASCADE,
      hidden_matches TEXT NOT NULL DEFAULT '[]',
      hidden_rounds TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS overlay_state (
      id INTEGER PRIMARY KEY NOT NULL,
      active_key TEXT REFERENCES tournaments(key) ON DELETE SET NULL,
      view TEXT NOT NULL,
      pointer TEXT NOT NULL,
      pointer_size INTEGER NOT NULL DEFAULT ${OVERLAY_CURSOR_SIZE.default},
      modules TEXT NOT NULL,
      revision INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
};

export const tableExists = (sqlite: Database, table: string): boolean => {
  const row = sqlite
    .query<{ name: string }, [string]>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    )
    .get(table);

  return row !== null;
};

export const columnExists = (sqlite: Database, table: string, column: string): boolean => {
  if (!tableExists(sqlite, table)) return false;

  const columns = sqlite.query<{ name: string }, []>(`PRAGMA table_info(${table})`).all();
  return columns.some((entry) => entry.name === column);
};

const addOverlayPointerSize = (sqlite: Database): void => {
  if (!tableExists(sqlite, "overlay_state")) return;
  if (columnExists(sqlite, "overlay_state", "pointer_size")) return;

  sqlite.run(
    `ALTER TABLE overlay_state ADD COLUMN pointer_size INTEGER NOT NULL DEFAULT ${OVERLAY_CURSOR_SIZE.default}`,
  );
};

/** Creates missing tables and brings the overlay schema up to date. */
export const ensureSchema = (sqlite: Database): void => {
  createTables(sqlite);
  addOverlayPointerSize(sqlite);
};
