import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DEFAULT_SETTINGS } from "@/configs/server/settings.config";
import SettingsUtils from "@/lib/server/settings.utils";

const makeSettingsFile = () => {
  const directory = mkdtempSync(path.join(tmpdir(), "challonge-obs-settings-"));

  return { directory, file: path.join(directory, "settings.json") };
};

describe("settings file", () => {
  test("creates defaults on first run", () => {
    const { directory, file } = makeSettingsFile();

    try {
      expect(SettingsUtils.loadFile(file)).toEqual(DEFAULT_SETTINGS);
      expect(readFileSync(file, "utf8")).toBe(`${JSON.stringify(DEFAULT_SETTINGS, null, 2)}\n`);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("fills a missing db_path from defaults", () => {
    const { directory, file } = makeSettingsFile();

    try {
      writeFileSync(file, JSON.stringify({ port: 19_000, open_browser: false }));

      expect(SettingsUtils.loadFile(file)).toEqual({
        ...DEFAULT_SETTINGS,
        port: 19_000,
        open_browser: false,
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("reads a custom db_path", () => {
    const { directory, file } = makeSettingsFile();

    try {
      writeFileSync(
        file,
        JSON.stringify({
          port: 19_000,
          vite_port: 24_000,
          open_browser: false,
          db_path: "custom/db.sqlite",
        }),
      );

      expect(SettingsUtils.loadFile(file)).toEqual({
        port: 19_000,
        vite_port: 24_000,
        open_browser: false,
        db_path: "custom/db.sqlite",
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
