import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { createTables } from "../db/ddl.db";
import * as schema from "../db/schema.db";

type TableInfoRow = {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
};

const sqliteDefault = (value: unknown): string => {
  return typeof value === "string" ? `'${value}'` : String(value);
};

describe("database schema", () => {
  test("DDL columns match the Drizzle definitions", () => {
    const sqlite = new Database(":memory:");

    try {
      createTables(sqlite);

      for (const table of [
        schema.tournaments,
        schema.tournamentVisibility,
        schema.overlayState,
      ] as const) {
        const config = getTableConfig(table);
        const actual = sqlite.query<TableInfoRow, []>(`PRAGMA table_info(${config.name})`).all();

        expect(actual.map(({ name, type, notnull, pk }) => ({ name, type, notnull, pk }))).toEqual(
          config.columns.map((column) => ({
            name: column.name,
            type: column.getSQLType().toUpperCase(),
            notnull: column.notNull ? 1 : 0,
            pk: column.primary ? 1 : 0,
          })),
        );

        for (const column of config.columns) {
          if (!column.hasDefault || column.default === undefined) continue;

          const actualColumn = actual.find((row) => row.name === column.name);
          expect(actualColumn?.dflt_value).toBe(sqliteDefault(column.default));
        }
      }
    } finally {
      sqlite.close();
    }
  });
});
