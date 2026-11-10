import { APP_NAME } from "@/configs/server/server.config";
import HttpUtils from "@/lib/server/http.utils";
import { Elysia } from "elysia";
import type { DatabaseClient } from "../db/client.db";

/** Exposes SQLite readiness and app identity at `/health`. */
export const healthPlugin = (database: DatabaseClient) =>
  new Elysia({ name: "health" }).get("/health", () => {
    const identity = { app: APP_NAME, uptime: Math.round(process.uptime()) };

    if (!database.isHealthy()) {
      return HttpUtils.jsonRes({ ...identity, ok: false, db: "down" }, 503);
    }

    return HttpUtils.jsonRes({ ...identity, ok: true, db: "up" });
  });
