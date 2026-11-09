import { SCHEMA_VERSION } from "@/configs/server/database.config";
import { ensureSchema } from "./ddl.db";
import { migrateToKeySchema } from "./migrations/v4-key.migration";
import type { DatabaseMigration } from "@/types/server/database";
import { attemptSync } from "@hullperse/hp_utils/attempt";
import type { Database } from "bun:sqlite";

const MIGRATIONS = [{ version: 4, run: migrateToKeySchema }] satisfies readonly DatabaseMigration[];

const readSchemaVersion = (sqlite: Database): number => {
  const row = sqlite.query<{ user_version: number }, []>("PRAGMA user_version").get();

  return row?.user_version ?? 0;
};

const writeSchemaVersion = (sqlite: Database): void => {
  sqlite.run(`PRAGMA user_version = ${SCHEMA_VERSION}`);
};

const assertSupportedVersion = (currentVersion: number): void => {
  if (currentVersion <= SCHEMA_VERSION) return;

  throw new Error(
    `Database schema version ${currentVersion} is newer than supported version ${SCHEMA_VERSION}`,
  );
};

const runMigrationTransaction = (sqlite: Database, migrate: () => void): Error | null => {
  sqlite.run("PRAGMA foreign_keys = OFF");

  const [, migrationError] = attemptSync(() => {
    sqlite.transaction(migrate)();
  });

  sqlite.run("PRAGMA foreign_keys = ON");
  return migrationError;
};

const runPendingMigrations = (sqlite: Database, currentVersion: number): void => {
  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) continue;
    migration.run(sqlite);
  }

  ensureSchema(sqlite);
  writeSchemaVersion(sqlite);
};

/** Creates the current schema or applies every pending migration. */
export const migrateDatabase = (sqlite: Database): void => {
  const currentVersion = readSchemaVersion(sqlite);
  assertSupportedVersion(currentVersion);

  if (currentVersion === SCHEMA_VERSION) {
    ensureSchema(sqlite);
    return;
  }

  const migrationError = runMigrationTransaction(sqlite, () => {
    runPendingMigrations(sqlite, currentVersion);
  });

  if (migrationError) throw migrationError;
};
