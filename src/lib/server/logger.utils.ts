import {
  COLOR_ENABLED,
  COLOR_MAP,
  LEVEL_PRIORITY,
  LOG_FILE_ENABLED,
  LOG_FILE_KEEP,
  LOG_FILE_MAX_BYTES,
  LOG_LEVEL,
} from "@/configs/server/logger.config";
import LogFile from "@/lib/server/logFile.utils";
import PathUtils from "@/lib/server/path.utils";
import type { LogContext, LogLevel, LogLevelName } from "@/types/server/logger";
import { attemptSync } from "@hullperse/hp_utils/attempt";

/** Small dependency-free logger with levels, scopes, context, and error causes. */
export default class Logger {
  private readonly author: string;
  private readonly level: LogLevelName;
  private static readonly logFile: LogFile | null = Logger.createLogFile();

  constructor(author = "SYSTEM", level: LogLevelName = LOG_LEVEL) {
    this.author = author.toUpperCase();
    this.level = level;
  }

  private static createLogFile(): LogFile | null {
    if (!LOG_FILE_ENABLED) return null;
    if (!PathUtils.isStandalone() && Bun.env.LOG_FILE !== "1") return null;

    const [file, error] = attemptSync(
      () =>
        new LogFile(
          PathUtils.resolveProjectPath("data", "logs", "server.log"),
          LOG_FILE_MAX_BYTES,
          LOG_FILE_KEEP,
        ),
    );

    if (error) {
      process.stderr.write(`[LOGGER] file logging disabled: ${error.message}\n`);
      return null;
    }

    return file;
  }

  private static paint(color: string, text: string): string {
    if (!COLOR_ENABLED) return text;

    const ansi = Bun.color(color, "ansi");
    return ansi ? `${ansi}${text}\u001B[0m` : text;
  }

  private static timestamp(): string {
    const now = new Date();
    const pad = (value: number): string => value.toString().padStart(2, "0");

    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  private static formatError(error: unknown): string {
    if (error instanceof Error) {
      const lines = [error.stack ?? `${error.name}: ${error.message}`];
      const details = error as Error & { cause?: unknown; code?: unknown };

      if (details.cause !== undefined) {
        lines.push(`  cause: ${Logger.formatError(details.cause).replace(/\n/g, "\n  ")}`);
      }

      if (details.code !== undefined) {
        const code =
          typeof details.code === "string" || typeof details.code === "number"
            ? String(details.code)
            : Bun.inspect(details.code, { depth: 1, colors: false });

        lines.push(`  code: ${code}`);
      }
      return lines.join("\n");
    }

    if (typeof error === "string") return error;
    return Bun.inspect(error, { depth: 4, colors: false });
  }

  private static formatContext(context: LogContext): string {
    const entries = Object.entries(context).filter(([, value]) => value !== undefined);
    if (entries.length === 0) return "";

    return ` ${Bun.inspect(Object.fromEntries(entries), { depth: 3, colors: false })}`;
  }

  private enabled(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level];
  }

  private format(
    message: string,
    level: LogLevel,
    context?: LogContext,
    error?: unknown,
    color = true,
  ): string {
    const suffix = context === undefined ? "" : Logger.formatContext(context);
    const details = error === undefined ? "" : `\n${Logger.formatError(error)}`;
    const timestamp = `[${Logger.timestamp()}]`;
    const scope = `[${this.author}]`;
    const paintedTimestamp = color ? Logger.paint("grey", timestamp) : timestamp;
    const paintedScope = color ? Logger.paint(COLOR_MAP[level], scope) : scope;

    return `${paintedTimestamp} ${paintedScope} ${message}${suffix}${details}`;
  }

  private emit(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
    if (!this.enabled(level)) return;

    const line = this.format(message, level, context, error);

    switch (level) {
      case "debug":
        console.debug(line);
        break;
      case "error":
        console.error(line);
        break;
      case "info":
        console.info(line);
        break;
      case "warn":
        console.warn(line);
        break;
      default:
        console.log(line);
    }

    Logger.logFile?.write(this.format(message, level, context, error, false));
  }

  log(message: string, context?: LogContext) {
    this.emit("log", message, context);
  }

  debug(message: string, context?: LogContext) {
    this.emit("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.emit("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.emit("warn", message, context);
  }

  error(message: string, error?: unknown, context?: LogContext) {
    this.emit("error", message, context, error);
  }

  success(message: string, context?: LogContext) {
    this.emit("success", message, context);
  }
}
