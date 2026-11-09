import type { ServerSettings } from "../../types/server/settings";

/** File generated next to the standalone executable on first run. */
export const SETTINGS_FILE = "settings.json";
/** Defaults used when settings.json does not exist. */
export const DEFAULT_SETTINGS: ServerSettings = {
  port: 8787,
  vite_port: 22_848,
  open_browser: true,
  db_path: "data/challonge.sqlite",
};
