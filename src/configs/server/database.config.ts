/** Current schema version. */
export const SCHEMA_VERSION = 4;
/** PRAGMA executed after database writes. */
export const OPTIMIZE_PRAGMA = "PRAGMA optimize";
/** How often a long-running connection refreshes the query planner. */
export const OPTIMIZE_INTERVAL_MS = 30 * 60_000;
/** PRAGMAs applied to every connection. */
export const DATABASE_PRAGMAS = [
  "PRAGMA journal_mode = WAL;",
  "PRAGMA foreign_keys = ON;",
  "PRAGMA busy_timeout = 5000;",
  "PRAGMA synchronous = NORMAL;",
  "PRAGMA cache_size = -20000;",
  "PRAGMA temp_store = MEMORY;",
] as const;
