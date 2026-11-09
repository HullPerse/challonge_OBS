import { resolve } from "node:path";
import { DEV_UI_URL } from "../src/configs/dev.config";

const projectRoot = resolve(import.meta.dir, "..");

const children = [
  Bun.spawn(["bun", "run", "dev:server"], {
    env: { ...Bun.env, BROWSER_URL: DEV_UI_URL },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }),
  Bun.spawn(["bun", "run", "dev:ui"], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }),
];

type Child = (typeof children)[number];

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

startWindowsWatchdog();

let stopping = false;

const shutdown = (code: number): void => {
  if (stopping) return;
  stopping = true;

  for (const child of children) killTree(child);
  if (process.platform === "win32") cleanupWindowsOrphans();
  process.exitCode = code;
};

process.on("SIGINT", () => {
  shutdown(0);
});

process.on("SIGTERM", () => {
  shutdown(0);
});

const code = await Promise.race(children.map((child) => child.exited));
shutdown(code);
