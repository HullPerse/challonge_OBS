import type { LogLevel, LogLevelName } from "@/types/server/logger";

export const COLOR_ENABLED = process.stdout.isTTY === true && Bun.env.NO_COLOR === undefined;

export const COLOR_MAP: Record<LogLevel, string> = {
  debug: "magenta",
  error: "red",
  info: "cyan",
  log: "white",
  success: "green",
  warn: "yellow",
};

export const LEVEL_PRIORITY: Record<LogLevelName, number> = {
  debug: 10,
  log: 20,
  info: 20,
  success: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

export const LOG_LEVEL: LogLevelName = (() => {
  const value = Bun.env.LOG_LEVEL?.trim().toLowerCase();

  if (value && Object.hasOwn(LEVEL_PRIORITY, value)) return value as LogLevelName;
  return "info";
})();

const positiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/** `LOG_FILE=0` disables file logs; `LOG_FILE=1` enables them outside a compiled exe. */
export const LOG_FILE_ENABLED = Bun.env.LOG_FILE !== "0";
export const LOG_FILE_MAX_BYTES = positiveInteger(Bun.env.LOG_FILE_MAX_BYTES, 1_000_000);
export const LOG_FILE_KEEP = positiveInteger(Bun.env.LOG_FILE_KEEP, 3);
