import path from "node:path";

/** SQLite path helpers. */
export default class DatabaseUtils {
  /** Keeps the special `:memory:` value, resolves everything else. */
  static resolvePath(input: string): string {
    return input === ":memory:" ? input : path.resolve(input);
  }
}
