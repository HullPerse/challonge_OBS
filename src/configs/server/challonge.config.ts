/** Browser user agent sent to Challonge. */
export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
/** Max proxied HTML size in bytes. */
export const MAX_PROXY_BYTES = 5_000_000;
/** Allowed path shape for proxied module pages. */
export const TARGET_PATH = /^\/[A-Za-z0-9][A-Za-z0-9_-]*\/module$/;
/** How long a proxied page may be reused without revalidation. */
export const CHALLONGE_CACHE_TTL_MS = 10_000;
/** Maximum proxied pages kept in memory. */
export const CHALLONGE_CACHE_LIMIT = 8;
/** Proxy request timeout; keep below API_TIMEOUT_MS so upstream errors surface first. */
export const PROXY_TIMEOUT_MS = 20_000;
/** Headers sent to Challonge and the default proxied content type. */
export const PROXY_ACCEPT = "text/html,application/xhtml+xml";
export const DEFAULT_HTML_CONTENT_TYPE = "text/html; charset=utf-8";
