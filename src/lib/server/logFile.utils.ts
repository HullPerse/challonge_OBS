import { appendFileSync, existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { attemptSync } from "@hullperse/hp_utils/attempt";

const errorCode = (error: Error): unknown => (error as Error & { code?: unknown }).code;

/** Appends plain-text log lines to a size-rotated file. */
export default class LogFile {
  private readonly file: string;
  private readonly maxBytes: number;
  private readonly keep: number;
  private size = 0;
  private failed = false;

  constructor(file: string, maxBytes: number, keep: number) {
    this.file = file;
    this.maxBytes = maxBytes;
    this.keep = keep;

    const [, directoryError] = attemptSync(() => {
      mkdirSync(path.dirname(file), { recursive: true });
    });

    if (directoryError) {
      this.disable(directoryError);
      return;
    }

    const [stats, statError] = attemptSync(() => statSync(file));

    if (statError && errorCode(statError) !== "ENOENT") {
      this.disable(statError);
      return;
    }

    this.size = stats?.size ?? 0;
  }

  write(line: string): void {
    if (this.failed) return;

    const payload = `${line}\n`;
    const bytes = Buffer.byteLength(payload, "utf8");

    if (this.size + bytes > this.maxBytes && !this.rotate()) return;

    const [, error] = attemptSync(() => {
      appendFileSync(this.file, payload, "utf8");
    });

    if (error) {
      this.disable(error);
      return;
    }

    this.size += bytes;
  }

  private rotate(): boolean {
    const [, error] = attemptSync(() => {
      rmSync(`${this.file}.${this.keep}`, { force: true });

      for (let index = this.keep - 1; index >= 1; index -= 1) {
        const source = `${this.file}.${index}`;
        if (!existsSync(source)) continue;
        renameSync(source, `${this.file}.${index + 1}`);
      }

      if (existsSync(this.file)) renameSync(this.file, `${this.file}.1`);
    });

    if (error) {
      this.disable(error);
      return false;
    }

    this.size = 0;
    return true;
  }

  private disable(error: Error): void {
    this.failed = true;
    process.stderr.write(`[LOGGER] file logging disabled: ${error.message}\n`);
  }
}
