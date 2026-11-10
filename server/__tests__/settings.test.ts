import { describe, expect, test } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

  test("saves a patch while preserving unknown keys", () => {
    const { directory, file } = makeSettingsFile();

    try {
      writeFileSync(file, JSON.stringify({ port: 19_000, custom_flag: true }));

      expect(SettingsUtils.saveFile(file, { port: 19_001 })).toMatchObject({ ok: true });

      const saved = JSON.parse(readFileSync(file, "utf8")) as {
        port?: number;
        custom_flag?: boolean;
        db_path?: string;
      };

      expect(saved.port).toBe(19_001);
      expect(saved.custom_flag).toBe(true);
      expect(saved.db_path).toBe(DEFAULT_SETTINGS.db_path);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("backs up invalid JSON before saving", () => {
    const { directory, file } = makeSettingsFile();

    try {
      writeFileSync(file, "{");

      expect(SettingsUtils.saveFile(file, { port: 19_002 })).toMatchObject({ ok: true });
      expect(readdirSync(directory).filter((name) => name.endsWith(".bak"))).toHaveLength(1);
      expect(JSON.parse(readFileSync(file, "utf8"))).toMatchObject({ port: 19_002 });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("rejects an invalid patch without replacing the file", () => {
    const { directory, file } = makeSettingsFile();

    try {
      writeFileSync(file, JSON.stringify({ port: 19_003 }));

      expect(SettingsUtils.saveFile(file, { port: 0 })).toMatchObject({ ok: false });
      expect(JSON.parse(readFileSync(file, "utf8"))).toMatchObject({ port: 19_003 });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
