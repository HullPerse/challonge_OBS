import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { attempt, attemptSync } from "@hullperse/hp_utils/attempt";
import { DEV_UI_URL } from "../src/configs/dev.config";

const projectRoot = resolve(import.meta.dir, "..");
const runtimeFile = resolve(projectRoot, "data/dev-runtime.json");
const READY_TIMEOUT_MS = 15_000;
const scriptStartedAt = Date.now();

type Child = ReturnType<typeof Bun.spawn>;

let server: Child | null = null;
let ui: Child | null = null;
let stopping = false;

const children = (): Child[] => [server, ui].filter((child): child is Child => child !== null);

const runQuietly = (args: string[]): void => {
  Bun.spawnSync(args, { stdout: "ignore", stderr: "ignore" });
};

const killTree = (child: Child): void => {
  if (child.exitCode !== null) return;

  if (process.platform === "win32") {
    runQuietly(["taskkill", "/PID", String(child.pid), "/T", "/F"]);
    return;
  }

  child.kill("SIGTERM");
};

const cleanupScript = (): string => {
  const quotedRoot = `'${projectRoot.replaceAll("'", "''")}'`;

  return [
    `$root = ${quotedRoot}`,
    "Get-CimInstance Win32_Process |",
    "Where-Object {",
    "  $_.ProcessId -ne $PID -and",
    "  $_.Name -match '^(bun|vite|node)\\.exe$' -and",
    '  $_.CommandLine -like "*$root*" -and',
    "  $_.CommandLine -match 'vite|index\\.server\\.ts|dev:server|dev:ui'",
    "} |",
    "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
  ].join("\n");
};

const cleanupWindowsOrphans = (): void => {
  runQuietly(["powershell", "-NoProfile", "-NonInteractive", "-Command", cleanupScript()]);
};

const startWindowsWatchdog = (): void => {
  if (process.platform !== "win32") return;

  const script = [
    `$parent = ${process.pid}`,
    "Wait-Process -Id $parent -ErrorAction SilentlyContinue",
    "Start-Sleep -Milliseconds 500",
    cleanupScript(),
  ].join("\n");
  const encoded = Buffer.from(script, "utf16le").toString("base64");

  Bun.spawn(
    [
      "cmd.exe",
      "/c",
      "start",
      "",
      "/min",
      "powershell",
      "-NoProfile",
      "-NonInteractive",
      "-EncodedCommand",
      encoded,
    ],
    {
      detached: true,
      stdin: "ignore",
      stdout: "ignore",
      stderr: "ignore",
      windowsHide: true,
    },
  );
};

const readRuntimePort = (since: number): number | null => {
  if (!existsSync(runtimeFile)) return null;

  const [parsed, parseError] = attemptSync<unknown>(() =>
    JSON.parse(readFileSync(runtimeFile, "utf8")),
  );

  if (parseError || typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const port = (parsed as { port?: unknown }).port;
  const startedAt = (parsed as { startedAt?: unknown }).startedAt;

  if (typeof startedAt !== "number" || startedAt < since) return null;
  return typeof port === "number" && Number.isInteger(port) ? port : null;
};

const waitForServerPort = async (since: number): Promise<number> => {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const port = readRuntimePort(since);
    if (port !== null) return port;

    if (server && server.exitCode !== null) {
      throw new Error(`dev server exited with code ${server.exitCode}`);
    }

    await Bun.sleep(100);
  }

  throw new Error("dev server did not report its port in time");
};

const shutdown = (code: number): void => {
  if (stopping) return;
  stopping = true;

  for (const child of children()) killTree(child);
  if (process.platform === "win32") cleanupWindowsOrphans();
  rmSync(runtimeFile, { force: true });
  process.exitCode = code;
};

process.on("SIGINT", () => {
  shutdown(0);
});

process.on("SIGTERM", () => {
  shutdown(0);
});

const main = async (): Promise<void> => {
  rmSync(runtimeFile, { force: true });

  server = Bun.spawn(["bun", "run", "dev:server"], {
    cwd: projectRoot,
    env: {
      ...Bun.env,
      BROWSER_URL: DEV_UI_URL,
      DEV_RUNTIME_FILE: runtimeFile,
    },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const port = await waitForServerPort(scriptStartedAt);
  console.log(`dev: api on http://127.0.0.1:${port}`);

  ui = Bun.spawn(["bun", "run", "dev:ui"], {
    cwd: projectRoot,
    env: {
      ...Bun.env,
      DEV_API_PORT: String(port),
    },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const code = await Promise.race(children().map((child) => child.exited));
  shutdown(code);
};

startWindowsWatchdog();

const [, error] = await attempt(main());

if (error) {
  console.error("dev: failed to start", error);
  shutdown(1);
}
