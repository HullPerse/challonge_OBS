import {
  HOST,
  IDLE_TIMEOUT_SECONDS,
  MAX_JSON_BYTES,
  OPEN_BROWSER,
  PORT,
} from "@/configs/server/app.config";
import { Application } from "./app.server";
import { createDatabase } from "./db/client.db";
import BrowserUtils from "@/lib/server/browser.utils";
import PathUtils from "@/lib/server/path.utils";
import { attempt } from "@hullperse/hp_utils/attempt";

const database = createDatabase();
const application = new Application(database);
const app = application.create();

const server = Bun.serve({
  hostname: HOST,
  port: PORT,
  idleTimeout: IDLE_TIMEOUT_SECONDS,
  maxRequestBodySize: MAX_JSON_BYTES,
  fetch: app.fetch,
});

const appUrl = `http://${HOST}:${server.port}`;
console.log(`App: ${appUrl}`);

if (PathUtils.isStandalone() && OPEN_BROWSER) {
  await BrowserUtils.open(appUrl);
}

let stopping = false;

const shutdown = async (): Promise<void> => {
  if (stopping) return;
  stopping = true;

  console.log(`Shutting down`);

  const [, error] = await attempt(server.stop(true));
  if (error) console.error("App: stop failed", error);

  application.close();
  database.close();
};

const signal = new Promise<void>((resolve) => {
  process.on("SIGINT", () => {
    resolve();
  });
  process.on("SIGTERM", () => {
    resolve();
  });
});

await signal;
await shutdown();
