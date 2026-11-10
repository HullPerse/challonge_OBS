import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { DEFAULT_SETTINGS, SETTINGS_FILE } from "@/configs/server/settings.config";
import { settingsSchema } from "@/lib/schemas/server/settings.schema";
import Logger from "@/lib/server/logger.utils";
import { isRecord } from "@/lib/object.utils";
import PathUtils from "@/lib/server/path.utils";
import type { ServerSettings, SettingsSaveResult } from "@/types/server/settings";
import { attemptSync } from "@hullperse/hp_utils/attempt";

const logger = new Logger("SETTINGS");

/** Loads and safely updates the local settings file. */
export default class SettingsUtils {
  static load(): ServerSettings {
    const file = PathUtils.resolveProjectPath(SETTINGS_FILE);

    if (!existsSync(file)) {
      if (!PathUtils.isStandalone()) return DEFAULT_SETTINGS;
      return SettingsUtils.createDefaults(file);
    }

    return SettingsUtils.loadFile(file);
  }

  static loadFile(file: string): ServerSettings {
    if (!existsSync(file)) return SettingsUtils.createDefaults(file);

    const [contents, readError] = attemptSync(() => readFileSync(file, "utf8"));
    if (readError) {
      logger.error("could not read settings; using defaults", readError, { file });
      return DEFAULT_SETTINGS;
    }

    const [parsed, parseError] = attemptSync<unknown>(() => JSON.parse(contents));
    if (parseError) {
      logger.warn("invalid JSON in settings; using defaults", { error: parseError, file });
      return DEFAULT_SETTINGS;
    }

    const result = settingsSchema.safeParse(parsed);
    if (!result.success) {
      logger.warn("invalid settings values; using defaults", { error: result.error, file });
      return DEFAULT_SETTINGS;
    }

    return { ...DEFAULT_SETTINGS, ...result.data };
  }

  static save(patch: Partial<ServerSettings>): SettingsSaveResult {
    return SettingsUtils.saveFile(PathUtils.resolveProjectPath(SETTINGS_FILE), patch);
  }

  /** Merges a patch, preserving unknown keys, and replaces the file atomically. */
  static saveFile(file: string, patch: Partial<ServerSettings>): SettingsSaveResult {
    let base: Record<string, unknown> = {};

    if (existsSync(file)) {
      const [contents, readError] = attemptSync(() => readFileSync(file, "utf8"));

      if (readError) {
        logger.warn("could not read settings before save", { error: readError, file });
      } else {
        const [parsed, parseError] = attemptSync<unknown>(() => JSON.parse(contents));

        if (parseError || !isRecord(parsed)) {
          SettingsUtils.backup(file);
        } else {
          const baseResult = settingsSchema.safeParse(parsed);

          if (baseResult.success) base = parsed;
          else SettingsUtils.backup(file);
        }
      }
    }

    const candidate = { ...DEFAULT_SETTINGS, ...base, ...patch };
    const result = settingsSchema.safeParse(candidate);

    if (!result.success) {
      logger.error("refusing to save invalid settings", result.error, { file });
      return { ok: false, error: new Error("Settings values are invalid") };
    }

    const merged = { ...DEFAULT_SETTINGS, ...base, ...result.data };
    const temp = `${file}.${process.pid}.tmp`;

    const [, writeError] = attemptSync(() => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(temp, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
      renameSync(temp, file);
    });

    if (writeError) {
      attemptSync(() => {
        rmSync(temp, { force: true });
      });
      logger.error("could not save settings", writeError, { file });
      return { ok: false, error: writeError };
    }

    logger.info("settings saved", { file, keys: Object.keys(patch) });
    return { ok: true, settings: merged };
  }

  private static createDefaults(file: string): ServerSettings {
    const [, error] = attemptSync(() => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, `${JSON.stringify(DEFAULT_SETTINGS, null, 2)}\n`, "utf8");
    });

    if (error) logger.error("could not create settings file", error, { file });
    return DEFAULT_SETTINGS;
  }

  private static backup(file: string): string | null {
    const backup = `${file}.${Date.now()}.bak`;
    const [, error] = attemptSync(() => {
      renameSync(file, backup);
    });

    if (error) {
      logger.warn("could not back up invalid settings", { error, file });
      return null;
    }

    logger.warn("backed up invalid settings", { file, backup });
    return backup;
  }
}
