import { afterEach, describe, expect, test } from "bun:test";
import { startServer, type ServerHandle } from "../start.server";

const servers: ServerHandle[] = [];

afterEach(async () => {
  for (const server of servers.splice(0)) await server.stop(true);
});

describe("startServer", () => {
  test("uses another port when the requested port is busy", () => {
    const blocker = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () => new Response("busy"),
    });
    servers.push(blocker);

    const requestedPort = blocker.port;
    if (requestedPort === undefined) throw new Error("Test blocker did not report a port");

    const result = startServer(() => new Response("ok"), requestedPort);
    servers.push(result.server);

    expect(result.requestedPort).toBe(requestedPort);
    expect(result.port).not.toBe(requestedPort);
    expect(result.switched).toBe(true);
  });

  test("propagates errors that are not EADDRINUSE", () => {
    expect(() => startServer(() => new Response("ok"), -1)).toThrow();
  });
});
