import HttpUtils from "@/lib/server/http.utils";
import RequestUtils from "@/lib/server/request.utils";
import { Elysia } from "elysia";

/** Rejects foreign hosts and cross-origin state changes. */
export const requestGuardPlugin = new Elysia({
  name: "request-guard",
}).onRequest(({ request }) => {
  const requestUrl = new URL(request.url);

  if (RequestUtils.isAllowed(request, requestUrl)) {
    return null;
  }

  return HttpUtils.errorRes("Forbidden host or origin", 403);
});
