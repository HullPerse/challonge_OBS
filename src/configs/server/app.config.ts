import EnvUtils from "@/lib/server/env.utils";
import PathUtils from "@/lib/server/path.utils";
import SettingsUtils from "@/lib/server/settings.utils";

/** Server bind address and port. */
export const HOST = "127.0.0.1";
/** Local address used when opening the standalone app in a browser. */
export const BROWSER_HOST = "127.0.0.1";
const SETTINGS = SettingsUtils.load();
export const PORT = EnvUtils.parsePort(Bun.env.PORT, SETTINGS.port);
export const OPEN_BROWSER =
  Bun.env.OPEN_BROWSER === undefined ? SETTINGS.open_browser : Bun.env.OPEN_BROWSER !== "0";
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
