import PathUtils from "@/lib/server/path.utils";
import SettingsUtils from "@/lib/server/settings.utils";

/** Server bind address and port. */
export const HOST = "127.0.0.1";
/** Local address used when opening the standalone app in a browser. */
export const BROWSER_HOST = "127.0.0.1";
export const SETTINGS = SettingsUtils.load();
const OPEN_BROWSER_VALUE = Bun.env.OPEN_BROWSER?.trim().toLowerCase();
export const OPEN_BROWSER =
  OPEN_BROWSER_VALUE === undefined
    ? SETTINGS.open_browser
    : OPEN_BROWSER_VALUE !== "0" && OPEN_BROWSER_VALUE !== "false";
/** Max accepted JSON body size in bytes. */
export const MAX_JSON_BYTES = 5_000_000;
/** Bun server idle timeout in seconds. */
export const IDLE_TIMEOUT_SECONDS = 60;

/** Built frontend directory. */
export const DIST_DIR = PathUtils.resolveDistPath();
/** SQLite file path; DB_PATH overrides settings.db_path. */
export const DATABASE_PATH = Bun.env.DB_PATH ?? PathUtils.resolveProjectPath(SETTINGS.db_path);

/** API routes handled by the server; anything else is rejected. */
export const KNOWN_API_PATH =
  /^\/api\/(?:tournaments(?:\/[^/]+(?:\/visibility)?)?|challonge|overlay(?:\/(?:events|state|pointer|pointer-size|modules|focus))?)$/;
