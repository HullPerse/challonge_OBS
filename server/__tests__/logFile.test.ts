import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "bun:test";

import LogFile from "../../src/lib/server/logFile.utils";

test("rotates log files and keeps the configured number of backups", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "challonge-log-"));
  const file = path.join(directory, "server.log");
  const log = new LogFile(file, 40, 2);

  log.write("a".repeat(25));
  log.write("b".repeat(25));
  log.write("c".repeat(25));

  expect(readFileSync(file, "utf8")).toContain("c");
  expect(readFileSync(`${file}.1`, "utf8")).toContain("b");
  expect(readFileSync(`${file}.2`, "utf8")).toContain("a");
  expect(existsSync(`${file}.3`)).toBe(false);

  rmSync(directory, { recursive: true, force: true });
});
