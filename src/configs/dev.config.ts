import DevSettingsUtils from "../lib/server/dev-settings.utils.ts";

/** Vite dev server address shared by the dev runner and startup log. */
export const DEV_UI_HOST = "127.0.0.1";
export const DEV_UI_PORT = DevSettingsUtils.resolveVitePort();
export const DEV_UI_URL = `http://${DEV_UI_HOST}:${DEV_UI_PORT}`;

/** API origin used by the Vite dev proxy. */
export const DEV_API_URL = `http://${DEV_UI_HOST}:${DevSettingsUtils.resolveApiPort()}`;
