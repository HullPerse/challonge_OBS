import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { APP_NAME } from "@/configs/server/server.config";
import { expect, test } from "bun:test";

import SingleInstance from "../singleInstance.server";

const makeDirectory = (): string => mkdtempSync(path.join(os.tmpdir(), "challonge-lock-"));

test("acquires and releases the instance lock", async () => {
  const directory = makeDirectory();
  const file = path.join(directory, "app.lock");
  const lock = new SingleInstance(file);

  expect(await lock.acquire()).toEqual({ status: "acquired" });
  expect(existsSync(file)).toBe(true);

  lock.release();
  expect(existsSync(file)).toBe(false);

  rmSync(directory, { recursive: true, force: true });
});

test("detects an already-running instance by its health endpoint", async () => {
  const directory = makeDirectory();
  const file = path.join(directory, "app.lock");
  const health = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: () => Response.json({ ok: true, db: "up", app: APP_NAME }),
  });
  const port = health.port;

  if (port === undefined) throw new Error("test health server did not bind");

  const first = new SingleInstance(file);
  const second = new SingleInstance(file);

  expect(await first.acquire()).toEqual({ status: "acquired" });
  expect(first.updatePort(port)).toBeNull();
  expect(await second.acquire()).toEqual({ status: "running", port });

  first.release();
  await health.stop(true);
  rmSync(directory, { recursive: true, force: true });
});

test("replaces a stale lock after its owner is gone", async () => {
  const directory = makeDirectory();
  const file = path.join(directory, "app.lock");
  const lock = new SingleInstance(file);

  writeFileSync(
    file,
    JSON.stringify({
      app: APP_NAME,
      pid: 999_999,
      port: 0,
      startedAt: Date.now() - 60_000,
    }),
    "utf8",
  );

  expect(await lock.acquire()).toEqual({ status: "acquired" });
  lock.release();

  rmSync(directory, { recursive: true, force: true });
});
