import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createDatabase } from "../db/client.db";

describe("database migration", () => {
  test("adds overlay state to a v1 database and keeps tournaments", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "challonge-obs-migrate-"));
    const databasePath = path.join(directory, "legacy.sqlite");

    try {
      const legacy = new Database(databasePath);
      legacy.run(`
        CREATE TABLE tournaments (
          slug TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          tournament_type TEXT NOT NULL,
          source_url TEXT NOT NULL,
          fetched_at INTEGER NOT NULL,
          match_count INTEGER NOT NULL,
          snapshot TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE tournament_visibility (
          slug TEXT PRIMARY KEY NOT NULL,
          hidden_matches TEXT NOT NULL DEFAULT '[]',
          hidden_rounds TEXT NOT NULL DEFAULT '[]'
        );
        INSERT INTO tournaments VALUES (
          'legacy', 'Legacy', 'double elimination',
          'https://challonge.com/legacy', 1, 0, '{}', 1
        );
        PRAGMA user_version = 1;
      `);
      legacy.close();

      const database = createDatabase(databasePath);

      try {
        const version = database.sqlite
          .query<{ user_version: number }, []>("PRAGMA user_version")
          .get();

        expect(version?.user_version).toBe(3);

        const tournament = database.sqlite
          .query<{ slug: string }, []>("SELECT slug FROM tournaments WHERE slug = 'legacy'")
          .get();

        expect(tournament?.slug).toBe("legacy");

        database.sqlite.run(`
          INSERT INTO overlay_state
            (id, active_slug, view, pointer, modules, revision, updated_at)
          VALUES
            (1, 'legacy', '{}', '{}', '{}', 1, 1);
          DELETE FROM tournaments WHERE slug = 'legacy';
        `);

        const overlay = database.sqlite
          .query<{ active_slug: string | null; pointer_size: number }, []>(
            "SELECT active_slug, pointer_size FROM overlay_state WHERE id = 1",
          )
          .get();

        expect(overlay?.active_slug).toBeNull();
        expect(overlay?.pointer_size).toBe(48);
      } finally {
        database.close();
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
