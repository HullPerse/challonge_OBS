import { MAX_PORT } from "@/configs/server/env.config";

/** Environment value parsing. */
export default class EnvUtils {
  /** Parses a port, using the fallback for an empty value and rejecting bad ranges. */
  static parsePort(value: string | undefined, fallback: number): number {
    const raw = value?.trim();
    const port = raw ? Number(raw) : fallback;

    if (!Number.isInteger(port) || port < 0 || port > MAX_PORT) {
      throw new Error("PORT must be an integer between 0 and 65535");
    }

    return port;
  }
}
