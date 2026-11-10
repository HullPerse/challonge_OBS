import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  APP_NAME,
  LOCK_PROBE_TIMEOUT_MS,
  LOCK_START_WAIT_MS,
  LOCK_WAIT_MS,
} from "@/configs/server/server.config";
import { isRecord } from "@/lib/object.utils";
import { attempt, attemptSync } from "@hullperse/hp_utils/attempt";

type LockData = {
  app: typeof APP_NAME;
  pid: number;
  port: number;
  startedAt: number;
};

export type LockAcquireResult =
  | { status: "acquired" }
  | { status: "running"; port: number }
  | { status: "unavailable"; error: Error };

const errorCode = (error: Error): unknown => (error as Error & { code?: unknown }).code;

const isAlreadyExists = (error: Error): boolean => errorCode(error) === "EEXIST";

/** Prevents a second server from starting on a new port while the app is already running. */
export default class SingleInstance {
  readonly file: string;

  constructor(file: string) {
    this.file = file;
  }

  /** Claims the lock or returns the port of the already-running instance. */
  async acquire(): Promise<LockAcquireResult> {
    for (let index = 0; index < 3; index += 1) {
      const existing = this.read();

      if (existing) {
        if (await this.probe(existing.port)) return { status: "running", port: existing.port };

        const age = Date.now() - existing.startedAt;

        if (age <= LOCK_START_WAIT_MS && this.isAlive(existing.pid)) {
          const port = await this.waitForHealth(existing.pid);
          if (port !== null) return { status: "running", port };
        }

        this.remove();
      }

      const [, writeError] = attemptSync(() => {
        mkdirSync(path.dirname(this.file), { recursive: true });
        writeFileSync(this.file, JSON.stringify(this.data(0)), {
          encoding: "utf8",
          flag: "wx",
        });
      });

      if (!writeError) return { status: "acquired" };
      if (!isAlreadyExists(writeError)) return { status: "unavailable", error: writeError };
    }

    return { status: "unavailable", error: new Error("Could not acquire the instance lock") };
  }

  /** Publishes the port the server actually bound. */
  updatePort(port: number): Error | null {
    const current = this.read();

    if (!current || current.pid !== process.pid) {
      return new Error("The instance lock is not owned by this process");
    }

    const [, error] = attemptSync(() => {
      writeFileSync(this.file, JSON.stringify({ ...current, port }), "utf8");
    });

    return error;
  }

  /** Removes the lock only when this process owns it. */
  release(): void {
    const current = this.read();
    if (current && current.pid !== process.pid) return;
    this.remove();
  }

  private read(): LockData | null {
    const [contents, readError] = attemptSync(() => readFileSync(this.file, "utf8"));
    if (readError) return null;

    const [parsed, parseError] = attemptSync<unknown>(() => JSON.parse(contents));
    if (parseError || !isRecord(parsed)) return null;

    const { app, pid, port, startedAt } = parsed;

    if (
      app !== APP_NAME ||
      typeof pid !== "number" ||
      !Number.isInteger(pid) ||
      pid <= 0 ||
      typeof port !== "number" ||
      !Number.isInteger(port) ||
      port < 0 ||
      port > 65_535 ||
      typeof startedAt !== "number" ||
      !Number.isFinite(startedAt)
    ) {
      return null;
    }

    return { app: APP_NAME, pid, port, startedAt };
  }

  private data(port: number): LockData {
    return { app: APP_NAME, pid: process.pid, port, startedAt: Date.now() };
  }

  private async probe(port: number): Promise<boolean> {
    if (port <= 0) return false;

    const [response, responseError] = await attempt(
      fetch(`http://127.0.0.1:${port}/health`, {
        signal: AbortSignal.timeout(LOCK_PROBE_TIMEOUT_MS),
        headers: { accept: "application/json" },
      }),
    );

    if (responseError) return false;

    const [payload, payloadError] = await attempt<unknown>(response.json());
    if (payloadError || !isRecord(payload)) return false;

    return payload.app === APP_NAME;
  }

  private async waitForHealth(pid: number): Promise<number | null> {
    const deadline = Date.now() + LOCK_WAIT_MS;

    while (Date.now() < deadline) {
      const current = this.read();

      if (current?.pid === pid && (await this.probe(current.port))) return current.port;
      await Bun.sleep(250);
    }

    return null;
  }

  private isAlive(pid: number): boolean {
    const [, error] = attemptSync(() => process.kill(pid, 0));
    if (!error) return true;

    return errorCode(error) === "EPERM";
  }

  private remove(): void {
    attemptSync(() => {
      rmSync(this.file, { force: true });
    });
  }
}
