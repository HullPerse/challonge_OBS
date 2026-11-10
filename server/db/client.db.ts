import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DATABASE_PATH } from "@/configs/server/app.config";
import {
  DATABASE_PRAGMAS,
  OPTIMIZE_INTERVAL_MS,
  OPTIMIZE_PRAGMA,
} from "@/configs/server/database.config";
import DatabaseUtils from "@/lib/server/database.utils";
import Logger from "@/lib/server/logger.utils";
import { attemptSync } from "@hullperse/hp_utils/attempt";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema.db";
import { migrateDatabase } from "./migrate.db";

const logger = new Logger("DATABASE");

/** Owns the SQLite connection, pragmas, migration, and health check. */
export class DatabaseClient {
  readonly path: string;
  readonly orm: BunSQLiteDatabase<typeof schema>;
  readonly sqlite: Database;
  private optimizeTimer: ReturnType<typeof setInterval> | null = null;
  private healthErrorLogged = false;
  private optimizeErrorLogged = false;

  constructor(databasePath?: string) {
    this.path = DatabaseUtils.resolvePath(databasePath ?? DATABASE_PATH);

    if (this.path !== ":memory:") mkdirSync(path.dirname(this.path), { recursive: true });

    this.sqlite = new Database(this.path);
    for (const pragma of DATABASE_PRAGMAS) this.sqlite.run(pragma);
    migrateDatabase(this.sqlite);

    this.orm = drizzle(this.sqlite, { schema });

    this.optimizeTimer = setInterval(() => {
      this.optimize();
    }, OPTIMIZE_INTERVAL_MS);
    this.optimizeTimer.unref();
  }

  /** Runs a real SQLite query and reports readiness. */
  isHealthy(): boolean {
    const [row, error] = attemptSync(() =>
      this.sqlite.query<{ ok: number }, []>("SELECT 1 AS ok").get(),
    );

    if (error) {
      if (!this.healthErrorLogged) {
        logger.warn("database health check failed", { error });
        this.healthErrorLogged = true;
      }

      return false;
    }

    this.healthErrorLogged = false;
    return row?.ok === 1;
  }

  /** Optimizes and closes the SQLite connection. */
  close() {
    if (this.optimizeTimer) {
      clearInterval(this.optimizeTimer);
      this.optimizeTimer = null;
    }

    this.optimize();
    this.sqlite.close();
  }

  private optimize() {
    const [, error] = attemptSync(() => this.sqlite.run(OPTIMIZE_PRAGMA));

    if (!error) {
      this.optimizeErrorLogged = false;
      return;
    }

    if (!this.optimizeErrorLogged) {
      logger.warn("database optimize failed", { error });
      this.optimizeErrorLogged = true;
    }
  }
}

/** Opens and migrates a database; `:memory:` is allowed. */
export const createDatabase = (databasePath?: string): DatabaseClient =>
  new DatabaseClient(databasePath);
