import { HOST, IDLE_TIMEOUT_SECONDS, MAX_JSON_BYTES } from "@/configs/server/app.config";
import { MAX_PORT } from "@/configs/server/env.config";
import { PORT_SCAN_ATTEMPTS } from "@/configs/server/server.config";
import Logger from "@/lib/server/logger.utils";
import { attemptSync } from "@hullperse/hp_utils/attempt";

const logger = new Logger("SERVER");

type ServerFetch = (request: Request) => Response | Promise<Response>;

export type ServerHandle = ReturnType<typeof Bun.serve>;

export type StartServerResult = {
  server: ServerHandle;
  port: number;
  requestedPort: number;
  switched: boolean;
};

const isAddressInUse = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "EADDRINUSE"
  );
};

const buildPorts = (requestedPort: number): number[] => {
  if (requestedPort === 0) return [0];

  const nextPorts = Array.from(
    { length: PORT_SCAN_ATTEMPTS },
    (_, index) => requestedPort + index + 1,
  ).filter((port) => port <= MAX_PORT);

  return [requestedPort, ...nextPorts, 0];
};

/** Starts Bun on the requested port, then nearby ports, then an OS-assigned port. */
export const startServer = (fetch: ServerFetch, requestedPort: number): StartServerResult => {
  for (const port of buildPorts(requestedPort)) {
    const [server, error] = attemptSync(() =>
      Bun.serve({
        hostname: HOST,
        port,
        idleTimeout: IDLE_TIMEOUT_SECONDS,
        maxRequestBodySize: MAX_JSON_BYTES,
        fetch,
      }),
    );

    if (error) {
      if (!isAddressInUse(error)) throw error;
      logger.debug("port is busy; trying next", { port });
      continue;
    }

    const actualPort = server.port;
    if (actualPort === undefined) throw new Error("Bun.serve did not report a port");

    const switched = requestedPort !== 0 && actualPort !== requestedPort;

    if (switched) {
      logger.warn("port is busy; using another", {
        requestedPort,
        port: actualPort,
      });
    }

    return { server, port: actualPort, requestedPort, switched };
  }

  throw new Error(`Could not find a free port near ${requestedPort}`);
};
