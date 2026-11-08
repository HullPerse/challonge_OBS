import HttpUtils from "@/lib/server/http.utils";
import type { AppServices } from "@/types/server/services";
import { Elysia } from "elysia";
import type { DatabaseClient } from "./db/client.db";
import { errorPlugin, healthPlugin, requestGuardPlugin } from "./plugins/index.plugin";
import { createApiRoutes } from "./routes/index.route";
import { createServices } from "./services/index.service";

/** Builds the Elysia app and owns its services. */
export class Application {
  private readonly database: DatabaseClient;
  private readonly services: AppServices;

  constructor(database: DatabaseClient) {
    this.database = database;
    this.services = createServices(database);
  }

  private fallback(request: Request): Promise<Response> | Response {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return HttpUtils.notFound();
    }

    const isOverlay = pathname === "/overlay" || pathname === "/overlay/";
    const bootstrap = isOverlay ? this.services.overlay.getBootstrap() : undefined;

    return this.services.staticFiles.serve(request, bootstrap);
  }

  /** Creates the Elysia handler used by Bun and tests. */
  create() {
    return new Elysia()
      .use(requestGuardPlugin)
      .use(errorPlugin)
      .use(healthPlugin(this.database))
      .use(createApiRoutes(this.services))
      .get("*", ({ request }) => this.fallback(request))
      .head("*", ({ request }) => this.fallback(request));
  }

  close() {
    this.services.overlay.close();
  }
}

/** Creates an app for one database. */
export const createApp = (database: DatabaseClient) => {
  return new Application(database).create();
};
