/** Public app identity used by `/health` and the single-instance lock. */
export const APP_NAME = "challonge-obs";

/** Number of consecutive ports tried after the requested one. */
export const PORT_SCAN_ATTEMPTS = 20;

/** How long a health probe may take while checking an existing instance. */
export const LOCK_PROBE_TIMEOUT_MS = 750;

/** How long a fresh lock owner may take to publish its actual port. */
export const LOCK_START_WAIT_MS = 10_000;

/** How long to wait for a starting instance to answer `/health`. */
export const LOCK_WAIT_MS = 5_000;

/** File name placed next to the SQLite database. */
export const LOCK_FILE_NAME = "app.lock";
