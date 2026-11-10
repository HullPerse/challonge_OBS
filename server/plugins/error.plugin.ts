import { KNOWN_API_PATH } from "@/configs/server/app.config";
import HttpUtils from "@/lib/server/http.utils";
import Logger from "@/lib/server/logger.utils";
import { Elysia } from "elysia";

const logger = new Logger("HTTP");

/** Maps request errors to the shared JSON error shape. */
export const errorPlugin = new Elysia({ name: "error-handler" }).onError(
  { as: "global" },
  ({ code, error, request }) => {
    if (code === "PARSE") return HttpUtils.errorRes("Invalid JSON body", 400);

    if (code === "NOT_FOUND") {
      const pathname = new URL(request.url).pathname;

      if (!KNOWN_API_PATH.test(pathname)) return HttpUtils.notFound();
      return HttpUtils.methodNotAllowed();
    }

    logger.error("unhandled request error", error, {
      code,
      method: request.method,
      path: new URL(request.url).pathname,
    });

    return HttpUtils.errorRes("Internal server error", 500);
  },
);
