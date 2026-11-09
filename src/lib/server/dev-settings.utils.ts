import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { attemptSync } from "@hullperse/hp_utils/attempt";

import { MAX_PORT } from "../../configs/server/env.config.ts";
import { DEFAULT_SETTINGS, SETTINGS_FILE } from "../../configs/server/settings.config.ts";
import { isRecord } from "../../lib/object.utils.ts";

const isPort = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_PORT;
};

const parsePort = (value: string | undefined): number | null => {
  const raw = value?.trim();
  if (!raw) return null;

  const port = Number(raw);
  return isPort(port) ? port : null;
};

/** Reads dev-only ports without mixing file IO into the config module. */
export default class DevSettingsUtils {
  /** Vite dev port from settings.json, with VITE_PORT taking precedence. */
  static resolveVitePort(): number {
    const envPort = parsePort(process.env.VITE_PORT);
    if (envPort !== null) return envPort;

    const file = path.resolve(process.cwd(), SETTINGS_FILE);
    if (!existsSync(file)) return DEFAULT_SETTINGS.vite_port;

    const [contents, readError] = attemptSync(() => readFileSync(file, "utf8"));
    if (readError) return DEFAULT_SETTINGS.vite_port;

    const [parsed, parseError] = attemptSync<unknown>(() => JSON.parse(contents));
    if (parseError || !isRecord(parsed)) return DEFAULT_SETTINGS.vite_port;

    return isPort(parsed.vite_port) ? parsed.vite_port : DEFAULT_SETTINGS.vite_port;
  }

  /** API port used by the dev server, matching PORT in the server config. */
  static resolveApiPort(): number {
    return parsePort(process.env.PORT) ?? DEFAULT_SETTINGS.port;
  }
}
