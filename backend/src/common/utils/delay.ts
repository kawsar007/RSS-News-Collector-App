/**
 * Simple sleep helper. Used for both retry backoff and inter-source
 * rate limiting. Deliberately not a library — this one line is all
 * we need at this project's scale.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
