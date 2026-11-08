import {
  STATIC_ASSET_CACHE_CONTROL,
  STATIC_PAGE_CACHE_CONTROL,
} from "@/configs/server/static.config";

/** Static file response helpers. */
export default class StaticUtils {
  /** Picks the Cache-Control value for a static file path. */
  static cacheControl(pathname: string): string {
    if (pathname.startsWith("/assets/")) return STATIC_ASSET_CACHE_CONTROL;
    return STATIC_PAGE_CACHE_CONTROL;
  }

  /** Builds a weak validator from the file size and modification time. */
  static etag(entry: { size: number; mtimeMs: number }): string {
    return `W/"${entry.size}-${Math.trunc(entry.mtimeMs)}"`;
  }

  /** Checks an If-None-Match header against one validator. */
  static matchesEtag(header: string | null, etag: string): boolean {
    if (!header) return false;

    return header.split(",").some((value) => {
      const normalized = value.trim();
      return normalized === etag || normalized === "*";
    });
  }
}
