export type CachedPage = {
  body: string;
  contentType: string;
  etag: string | null;
  lastModified: string | null;
  expiresAt: number;
};

export type LoadResult =
  | { ok: true; page: CachedPage }
  | { ok: false; status: number; error: string };
