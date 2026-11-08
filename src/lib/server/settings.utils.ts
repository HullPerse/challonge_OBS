import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { DEFAULT_SETTINGS, SETTINGS_FILE } from "@/configs/server/settings.config";
import { settingsSchema } from "@/lib/schemas/server/settings.schema";
import PathUtils from "@/lib/server/path.utils";
import type { ServerSettings } from "@/types/server/settings";
import { attemptSync } from "@hullperse/hp_utils/attempt";

/** Loads or creates the settings file used by the standalone executable. */
export default class SettingsUtils {
  static load(): ServerSettings {
    if (!PathUtils.isStandalone()) return DEFAULT_SETTINGS;

    return SettingsUtils.loadFile(PathUtils.resolveProjectPath(SETTINGS_FILE));
  }

  static loadFile(file: string): ServerSettings {
    if (!existsSync(file)) {
      const [, writeError] = attemptSync(() => {
        writeFileSync(file, `${JSON.stringify(DEFAULT_SETTINGS, null, 2)}\n`, "utf8");
      });

      if (writeError) console.error(`Settings: could not create ${file}`, writeError);
      return DEFAULT_SETTINGS;
    }

    const [contents, readError] = attemptSync(() => readFileSync(file, "utf8"));
    if (readError) {
      console.error(`Settings: could not read ${file}`, readError);
      return DEFAULT_SETTINGS;
    }

    const [parsed, parseError] = attemptSync(() => JSON.parse(contents) as unknown);
    if (parseError) {
      console.error(`Settings: invalid JSON in ${file}; using defaults`);
      return DEFAULT_SETTINGS;
    }

    const result = settingsSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`Settings: invalid values in ${file}; using defaults`);
      return DEFAULT_SETTINGS;
    }

    return { ...DEFAULT_SETTINGS, ...result.data };
  }
}
