import { JSON_HEADERS, NO_STORE_HEADERS } from "@/configs/server/http.config";

/** Builds HTTP responses and reads size-limited bodies. */
export default class HttpUtils {
  static jsonRes(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: JSON_HEADERS,
    });
  }

  static errorRes(error: string, status: number): Response {
    return HttpUtils.jsonRes({ error }, status);
  }

  static methodNotAllowed(): Response {
    return HttpUtils.errorRes("Method not allowed", 405);
  }

  static notFound(): Response {
    return HttpUtils.errorRes("Not found", 404);
  }

  static htmlRes(
    body: string,
    contentType: string,
    extraHeaders: Record<string, string> = {},
  ): Response {
    return new Response(body, {
      headers: {
        ...NO_STORE_HEADERS,
        "content-type": contentType,
        ...extraHeaders,
      },
    });
  }

  /** Reads a text body; returns null when it exceeds `maxBytes`. */
  static async readTextLimited(response: Response, maxBytes: number): Promise<string | null> {
    const contentLength = response.headers.get("content-length");

    if (contentLength && Number(contentLength) > maxBytes) return null;

    const reader = response.body?.getReader();
    if (!reader) return "";

    const decoder = new TextDecoder();
    let text = "";
    let total = 0;

    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        text += decoder.decode();
        return text;
      }

      total += value.byteLength;

      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }

      text += decoder.decode(value, { stream: true });
    }
  }
}
