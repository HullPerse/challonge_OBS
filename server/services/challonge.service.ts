import {
  CHALLONGE_CACHE_LIMIT,
  CHALLONGE_CACHE_TTL_MS,
  CHALLONGE_RETRY_ATTEMPTS,
  CHALLONGE_RETRY_DELAY_MS,
  DEFAULT_HTML_CONTENT_TYPE,
  MAX_PROXY_BYTES,
  PROXY_ACCEPT,
  PROXY_TIMEOUT_MS,
  TARGET_PATH,
  USER_AGENT,
} from "@/configs/server/challonge.config";
import { isChallongeHost } from "@/configs/tournament.config";
import HttpUtils from "@/lib/server/http.utils";
import Logger from "@/lib/server/logger.utils";
import type { CachedPage, LoadResult } from "@/types/server/challonge";
import { attempt, attemptRetry, attemptSync } from "@hullperse/hp_utils/attempt";

const logger = new Logger("CHALLONGE");

type FetchLike = (input: URL, init?: RequestInit) => Promise<Response>;

class ChallongeHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Challonge responded ${status}`);
    this.name = "ChallongeHttpError";
    this.status = status;
  }
}

const isRetryableStatus = (status: number): boolean => status >= 500 || status === 429;

/** Proxies allowed Challonge module pages with revalidation and single-flight. */
export default class ChallongeService {
  private readonly pages = new Map<string, CachedPage>();
  private readonly inflight = new Map<string, Promise<LoadResult>>();
  private readonly fetcher: FetchLike;

  constructor(fetcher: FetchLike = fetch) {
    this.fetcher = fetcher;
  }

  private isAllowedTarget(data: URL): boolean {
    const isHttps = data.protocol === "https:";
    const isAllowedHost = isChallongeHost(data.hostname);
    const isAllowedPath = TARGET_PATH.test(data.pathname);

    return isHttps && isAllowedHost && isAllowedPath;
  }

  /** Fetches and returns an allowed Challonge module page. */
  async proxy(req: Request): Promise<Response> {
    if (req.method !== "GET") return HttpUtils.methodNotAllowed();

    const raw = new URL(req.url).searchParams.get("url");

    if (!raw) return HttpUtils.errorRes("Missing url", 400);

    const [target, targetError] = attemptSync(() => new URL(raw));

    if (targetError || !this.isAllowedTarget(target)) {
      return HttpUtils.errorRes("Only https://challonge.com/<slug>/module is allowed", 403);
    }

    const key = target.href;
    const cached = this.pages.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return this.pageResponse(cached);
    }

    const [result, resultError] = await attempt(this.load(target, key, cached));

    if (resultError) {
      logger.error("proxy failed", resultError, { target: target.href });
      return HttpUtils.errorRes("Challonge request failed", 502);
    }

    if (!result.ok) {
      const context = { target: target.href, status: result.status };

      if (result.status >= 500) logger.error(result.error, result.cause, context);
      else logger.warn(result.error, { ...context, error: result.cause });

      return HttpUtils.errorRes(result.error, result.status);
    }

    return this.pageResponse(result.page);
  }

  private load(target: URL, key: string, cached?: CachedPage): Promise<LoadResult> {
    const pending = this.inflight.get(key);
    if (pending) return pending;

    const request = (async (): Promise<LoadResult> => {
      const [result, error] = await attempt(this.fetchPage(target, key, cached));

      this.inflight.delete(key);

      if (error) {
        return { ok: false, status: 502, error: "Challonge request failed", cause: error };
      }

      return result;
    })();

    this.inflight.set(key, request);
    return request;
  }

  private async fetchPage(target: URL, key: string, cached?: CachedPage): Promise<LoadResult> {
    const headers: Record<string, string> = {
      accept: PROXY_ACCEPT,
      "user-agent": USER_AGENT,
    };

    if (cached?.etag) headers["if-none-match"] = cached.etag;
    if (cached?.lastModified) {
      headers["if-modified-since"] = cached.lastModified;
    }

    const [response, responseError] = await this.requestWithRetry(target, headers);

    if (responseError) return this.responseFailure(responseError);

    const [resolved, resolvedError] = attemptSync(() => new URL(response.url));

    if (resolvedError || !this.isAllowedTarget(resolved)) {
      return {
        ok: false,
        status: 502,
        error: "Challonge redirected outside the allowlist",
        cause: resolvedError,
      };
    }

    if (response.status === 304 && cached) {
      cached.expiresAt = Date.now() + CHALLONGE_CACHE_TTL_MS;
      this.remember(key, cached);
      return { ok: true, page: cached };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Challonge responded ${response.status}`,
      };
    }

    const [body, bodyError] = await attempt(HttpUtils.readTextLimited(response, MAX_PROXY_BYTES));

    if (bodyError || body === null) {
      return {
        ok: false,
        status: 502,
        error: bodyError ? "Failed to read Challonge response" : "Challonge response is too large",
        cause: bodyError,
      };
    }

    const page: CachedPage = {
      body,
      contentType: response.headers.get("content-type") ?? DEFAULT_HTML_CONTENT_TYPE,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
      expiresAt: Date.now() + CHALLONGE_CACHE_TTL_MS,
    };

    this.remember(key, page);
    return { ok: true, page };
  }

  private responseFailure(error: Error): LoadResult {
    const status = error instanceof ChallongeHttpError ? error.status : 502;

    return {
      ok: false,
      status,
      error: error.message,
      cause: error,
    };
  }

  private requestWithRetry(
    target: URL,
    headers: Record<string, string>,
  ): Promise<[Response, null] | [null, Error]> {
    const request = async (): Promise<Response> => {
      const response = await this.fetcher(target, {
        redirect: "follow",
        signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
        headers,
      });

      if (isRetryableStatus(response.status)) throw new ChallongeHttpError(response.status);
      return response;
    };

    return attemptRetry(request, {
      attempts: CHALLONGE_RETRY_ATTEMPTS,
      delay: CHALLONGE_RETRY_DELAY_MS,
      backoff: 2,
      shouldRetry: (error, attemptIndex) => {
        logger.debug("retrying Challonge request", {
          target: target.href,
          attempt: attemptIndex,
          error,
        });
        return true;
      },
    });
  }

  private remember(key: string, page: CachedPage) {
    this.pages.delete(key);
    this.pages.set(key, page);

    while (this.pages.size > CHALLONGE_CACHE_LIMIT) {
      const oldest = this.pages.keys().next().value;
      if (oldest === undefined) break;
      this.pages.delete(oldest);
    }
  }

  private pageResponse(page: CachedPage): Response {
    return HttpUtils.htmlRes(page.body, page.contentType, {
      ...(page.etag ? { etag: page.etag } : {}),
      ...(page.lastModified ? { "last-modified": page.lastModified } : {}),
    });
  }
}
