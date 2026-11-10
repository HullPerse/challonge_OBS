import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BROWSER_HOST, DATABASE_PATH, HOST, OPEN_BROWSER, SETTINGS } from "@/configs/server/app.config";
import { LOCK_FILE_NAME } from "@/configs/server/server.config";
import BrowserUtils from "@/lib/server/browser.utils";
import EnvUtils from "@/lib/server/env.utils";
import Logger from "@/lib/server/logger.utils";
import { isRecord } from "@/lib/object.utils";
import PathUtils from "@/lib/server/path.utils";
import SettingsUtils from "@/lib/server/settings.utils";
import { attempt, attemptSync } from "@hullperse/hp_utils/attempt";
import { Application } from "./app.server";
import { createDatabase, type DatabaseClient } from "./db/client.db";
import SingleInstance from "./singleInstance.server";
import { startServer, type ServerHandle } from "./start.server";

const logger = new Logger("SERVER");
const runtimeFile = Bun.env.DEV_RUNTIME_FILE?.trim();
const lockFile = DATABASE_PATH === ":memory:" ? null : path.join(path.dirname(DATABASE_PATH), LOCK_FILE_NAME);
let instanceLock = runtimeFile || lockFile === null ? null : new SingleInstance(lockFile);

let database: DatabaseClient | null = null;
let application: Application | null = null;
let server: ServerHandle | null = null;
let stopping = false;
let resolveShutdown: ((code: number) => void) | null = null;
const shutdownSignal = new Promise<number>((resolve) => {
  resolveShutdown = resolve;
});

const writeRuntime = (port: number): void => {
  if (!runtimeFile) return;

  const [, error] = attemptSync(() => {
    mkdirSync(path.dirname(runtimeFile), { recursive: true });
    writeFileSync(
      runtimeFile,
      `${JSON.stringify({ pid: process.pid, port, startedAt: Date.now() })}\n`,
      "utf8",
    );
  });

  if (error) logger.warn("could not write the dev runtime file", { error, file: runtimeFile });
};

const removeRuntime = (): void => {
  if (!runtimeFile || !existsSync(runtimeFile)) return;

  const [contents, readError] = attemptSync(() => readFileSync(runtimeFile, "utf8"));

  if (!readError) {
    const [parsed, parseError] = attemptSync<unknown>(() => JSON.parse(contents));

    if (!parseError && isRecord(parsed) && parsed.pid !== process.pid) return;
  }

  const [, error] = attemptSync(() => {
    rmSync(runtimeFile, { force: true });
  });

  if (error) logger.warn("could not remove the dev runtime file", { error, file: runtimeFile });
};

const shutdown = async (code: number): Promise<void> => {
  if (stopping) return;
  stopping = true;

  logger.info("shutting down", { code });

  if (server) {
    const currentServer = server;
    server = null;

    const [, stopError] = await attempt(
      Promise.race([
        (async () => {
          await currentServer.stop(true);
        })(),
        Bun.sleep(3_000).then(() => {
          throw new Error("Server stop timed out");
        }),
      ]),
    );

    if (stopError) logger.error("server stop failed", stopError);
  }

  if (application) {
    const currentApplication = application;
    application = null;

    const [, closeError] = attemptSync(() => {
      currentApplication.close();
    });

    if (closeError) logger.error("application close failed", closeError);
  }

  if (database) {
    const currentDatabase = database;
    database = null;

    const [, closeError] = attemptSync(() => {
      currentDatabase.close();
    });

    if (closeError) logger.error("database close failed", closeError);
  }

  instanceLock?.release();
  instanceLock = null;
  removeRuntime();
  process.exitCode = code;
};

const pauseBeforeExit = async (): Promise<void> => {
  if (!PathUtils.isStandalone() || !process.stdin.isTTY) return;

  process.stdout.write("Press Enter to close...");
  await new Promise<void>((resolve) => {
    process.stdin.resume();
    process.stdin.once("data", () => {
      resolve();
    });
  });
};

const requestShutdown = (code: number): void => {
  resolveShutdown?.(code);
};

const fatal = (message: string, error: unknown): void => {
  logger.error(message, error);
  requestShutdown(1);
};

const claimInstanceLock = async (): Promise<boolean> => {
  if (!instanceLock) return true;

  const lockResult = await instanceLock.acquire();

  if (lockResult.status === "running") {
    const url = `http://${BROWSER_HOST}:${lockResult.port}`;
    logger.info("already running", {
      server: url,
      overlay: `${url}/overlay`,
    });

    if (OPEN_BROWSER) await BrowserUtils.open(url);
    return false;
  }

  if (lockResult.status === "unavailable") {
    logger.warn("single-instance guard unavailable", {
      error: lockResult.error,
      file: instanceLock.file,
    });
    instanceLock = null;
  }

  return true;
};

const resolveBrowserUrl = (port: number): string => {
  const configured = Bun.env.BROWSER_URL?.trim();

  return configured === undefined || configured.length === 0
    ? `http://${BROWSER_HOST}:${port}`
    : configured;
};

process.on("uncaughtException", (error) => {
  fatal("uncaught exception", error);
});

process.on("unhandledRejection", (reason) => {
  fatal("unhandled rejection", reason);
});

process.on("SIGINT", () => {
  requestShutdown(0);
});

process.on("SIGTERM", () => {
  requestShutdown(0);
});

const start = async (): Promise<number> => {
  if (!(await claimInstanceLock())) return 0;

  database = createDatabase();
  logger.info("database ready", { path: database.path });

  application = new Application(database);
  const app = application.create();
  const requestedPort = EnvUtils.parsePort(Bun.env.PORT, SETTINGS.port);
  const result = startServer(app.fetch, requestedPort);
  server = result.server;

  const lockError = instanceLock?.updatePort(result.port) ?? null;
  if (lockError) {
    logger.warn("could not update the instance lock", {
      error: lockError,
      file: instanceLock?.file,
    });
  }

  if (result.switched && !Bun.env.PORT?.trim()) {
    const saved = SettingsUtils.save({ port: result.port });

    if (saved.ok) logger.info("saved the new port", { port: result.port });
    else logger.warn("could not save the new port", { error: saved.error, port: result.port });
  }

  const serverUrl = `http://${HOST}:${result.port}`;
  const browserUrl = resolveBrowserUrl(result.port);

  logger.info("listening", {
    server: serverUrl,
    browser: browserUrl,
    overlay: `${serverUrl}/overlay`,
  });

  writeRuntime(result.port);

  if (PathUtils.isStandalone() && OPEN_BROWSER) await BrowserUtils.open(browserUrl);

  const code = await shutdownSignal;
  await shutdown(code);
  return code;
};

const main = async (): Promise<void> => {
  const [code, error] = await attempt(start());

  if (error) {
    logger.error("startup failed", error);
    await shutdown(1);
    await pauseBeforeExit();
    return;
  }

  if (code !== 0) await pauseBeforeExit();
};

await main();
