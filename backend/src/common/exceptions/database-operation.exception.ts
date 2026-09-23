/**
 * Wraps unexpected database errors (connection loss, constraint issues
 * we didn't anticipate, etc.) so callers can distinguish "the database
 * itself had a problem" from "the RSS feed had a problem."
 */
export class DatabaseOperationException extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'DatabaseOperationException';
  }
}
