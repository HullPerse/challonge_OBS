/** Headers for JSON API responses. */
export const JSON_HEADERS = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
};

/** Headers for responses that must never be cached. */
export const NO_STORE_HEADERS = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

/** Headers for server-sent event streams. */
export const SSE_HEADERS = {
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive",
  "content-type": "text/event-stream; charset=utf-8",
  "x-accel-buffering": "no",
};

/** SSE keep-alive interval, reconnect hint and frames. */
export const SSE_HEARTBEAT_MS = 15_000;
const SSE_RETRY_MS = 3_000;
export const SSE_RETRY_FRAME = `retry: ${SSE_RETRY_MS}\n\n`;
export const SSE_CONNECTED_FRAME = ": connected\n\n";
export const SSE_HEARTBEAT_FRAME = ": heartbeat\n\n";

/** Hosts considered local, and methods that need an origin check. */
export const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
export const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
