/** Headers added to static responses. */
export const STATIC_SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
} as const;
/** Cache-Control for hashed assets and for HTML pages. */
export const STATIC_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";
/** Cache-Control for static pages. */
export const STATIC_PAGE_CACHE_CONTROL = "no-cache";
/** File served for directory requests. */
export const STATIC_INDEX_FILE = "index.html";
/** How long the built-file manifest is reused before a rebuild. */
export const STATIC_MANIFEST_TTL_MS = 2_000;
/** Fallback content type for unknown files. */
export const DEFAULT_BINARY_CONTENT_TYPE = "application/octet-stream";
