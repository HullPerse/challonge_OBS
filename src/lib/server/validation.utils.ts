/** Shared validation helpers. */
export default class ValidationUtils {
  /** Type guard for safe integer identifiers. */
  static isSafeInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isSafeInteger(value);
  }
}
