/** Returns the thrown error's message, or `fallback` for non-Error values. */
export const errorMessage = (error: unknown, fallback: string): string | null => {
  if (!error) return null;
  return error instanceof Error ? error.message : fallback;
};
