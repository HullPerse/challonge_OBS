import HttpUtils from "@/lib/server/http.utils";
import { Elysia } from "elysia";
import type { DatabaseClient } from "../db/client.db";

/** Exposes SQLite readiness at `/health`. */
export const healthPlugin = (database: DatabaseClient) =>
  new Elysia({ name: "health" }).get("/health", () => {
    if (!database.isHealthy()) {
      return HttpUtils.jsonRes({ ok: false, db: "down" }, 503);
    }

    return HttpUtils.jsonRes({ ok: true, db: "up" });
  });
