export type LogLevel = "debug" | "error" | "success" | "info" | "log" | "warn";

export type LogLevelName = LogLevel | "silent";

export type LogContext = Record<string, unknown>;
