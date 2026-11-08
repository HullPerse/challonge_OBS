import { LOCAL_HOSTS, STATE_CHANGING_METHODS } from "@/configs/server/http.config";
import { attemptSync } from "@hullperse/hp_utils/attempt";

/** Request origin and method checks. */
export default class RequestUtils {
  /** Allows only local hosts and same-origin state-changing requests. */
  static isAllowed(request: Request, requestUrl: URL): boolean {
    if (!LOCAL_HOSTS.has(requestUrl.hostname)) return false;
    if (!STATE_CHANGING_METHODS.has(request.method)) return true;

    const origin = request.headers.get("origin");
    if (!origin) return true;

    const [originUrl, originError] = attemptSync(() => new URL(origin));

    if (originError) return false;
    return LOCAL_HOSTS.has(originUrl.hostname);
  }
}
