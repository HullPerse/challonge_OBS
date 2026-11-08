import { KNOWN_API_PATH } from "@/configs/server/app.config";
import HttpUtils from "@/lib/server/http.utils";
import { Elysia } from "elysia";

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

    console.error("App: unhandled request error", error);
    return HttpUtils.errorRes("Internal server error", 500);
  },
);
