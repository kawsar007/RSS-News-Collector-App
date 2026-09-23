export type RssFetchErrorType = 'network' | 'timeout' | 'parse';

/**
 * Thrown by RssParserService when a feed cannot be fetched or parsed.
 * The `type` field lets callers (NewsSourcesService, RssCollectionService)
 * react differently depending on *why* it failed, instead of treating
 * every failure identically.
 */
export class RssFetchException extends Error {
  constructor(
    public readonly type: RssFetchErrorType,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'RssFetchException';
  }
}
