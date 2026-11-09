import {
  API_BASE_PATH,
  API_INVALID_RESPONSE,
  API_SERVER_ERROR,
  API_TIMEOUT_MS,
} from "@/configs/api.config";
import type { ApiErrorPayload, ApiRequestInit } from "@/types/api";
import { attempt, attemptSync } from "@hullperse/hp_utils/attempt";

const isErrorPayload = (value: unknown): value is ApiErrorPayload => {
  return (
    typeof value === "object" &&
    value !== null &&
    (!("error" in value) || typeof value.error === "string")
  );
};

/** Error with the HTTP status and parsed response payload. */
export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | null;

  constructor(message: string, status: number, payload: ApiErrorPayload | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/** Small same-origin HTTP client used by the API classes. */
export default class HttpApi {
  private readonly basePath: string;

  constructor(basePath: string = API_BASE_PATH) {
    this.basePath = basePath;
  }

  async get<T>(path: string, fallbackError: string, parse: (value: unknown) => T): Promise<T> {
    const response = await this.request(path, {
      fallbackError,
      method: "GET",
    });

    return this.parseJson(response, parse);
  }

  async getRoot<T>(path: string, fallbackError: string, parse: (value: unknown) => T): Promise<T> {
    const response = await this.request(
      path,
      {
        fallbackError,
        method: "GET",
      },
      "",
    );

    return this.parseJson(response, parse);
  }

  /** Sends GET and maps 404 to null. */
  async getOptional<T>(
    path: string,
    fallbackError: string,
    parse: (value: unknown) => T,
  ): Promise<T | null> {
    const [data, error] = await attempt(this.get(path, fallbackError, parse));

    if (!error) return data;
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }

  async put<T>(
    path: string,
    body: unknown,
    fallbackError: string,
    parse: (value: unknown) => T,
  ): Promise<T> {
    const response = await this.request(path, {
      body: JSON.stringify(body),
      fallbackError,
      headers: { "content-type": "application/json" },
      method: "PUT",
    });

    return this.parseJson(response, parse);
  }

  async delete(path: string, fallbackError: string): Promise<void> {
    await this.request(path, {
      fallbackError,
      method: "DELETE",
    });
  }

  async text(path: string, fallbackError: string): Promise<string> {
    const response = await this.request(path, {
      fallbackError,
      headers: { accept: "text/html" },
      method: "GET",
    });

    const [text, error] = await attempt(response.text());

    if (error) throw new ApiError(API_INVALID_RESPONSE, response.status);
    return text;
  }

  private async request(
    path: string,
    options: ApiRequestInit,
    basePath: string = this.basePath,
  ): Promise<Response> {
    const { fallbackError, ...init } = options;
    const [response, fetchError] = await attempt(
      fetch(`${basePath}${path}`, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(API_TIMEOUT_MS),
      }),
    );

    if (fetchError) throw new ApiError(API_SERVER_ERROR, 0);

    if (!response.ok) {
      const payload = await this.parseErrorPayload(response);
      const message = payload?.error ?? `${fallbackError} (${response.status})`;

      throw new ApiError(message, response.status, payload);
    }

    return response;
  }

  private async parseErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
    const [payload, error] = await attempt<unknown>(response.json());

    if (error || !isErrorPayload(payload)) return null;
    return payload;
  }

  private async parseJson<T>(response: Response, parse: (value: unknown) => T): Promise<T> {
    const [data, error] = await attempt<unknown>(response.json());

    if (error || data === undefined) {
      throw new ApiError(API_INVALID_RESPONSE, response.status);
    }

    const [parsed, parseError] = attemptSync(() => parse(data));

    if (parseError) throw new ApiError(API_INVALID_RESPONSE, response.status);
    return parsed;
  }
}
