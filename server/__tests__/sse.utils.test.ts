import { describe, expect, test } from "bun:test";
import { createSseHub } from "@/lib/server/sse.utils";

describe("SSE hub", () => {
  test("broadcasts one serialized payload and evicts a failing client", () => {
    const chunks: string[] = [];
    const hub = createSseHub<{ match: number }>({ heartbeatMs: 0 });

    hub.subscribe((chunk) => chunks.push(chunk));
    hub.subscribe(() => {
      throw new Error("client disconnected");
    });

    expect(hub.size).toBe(2);
    expect(hub.publish({ match: 7 })).toBe(1);
    expect(chunks).toEqual(['data: {"match":7}\n\n']);
    expect(hub.size).toBe(1);
  });

  test("sends heartbeat frames only to connected clients", () => {
    const chunks: string[] = [];
    const hub = createSseHub({ heartbeatMs: 0 });
    const unsubscribe = hub.subscribe((chunk) => chunks.push(chunk));

    expect(hub.heartbeat()).toBe(1);
    expect(chunks).toEqual([": heartbeat\n\n"]);

    unsubscribe();
    expect(hub.heartbeat()).toBe(0);
    expect(hub.size).toBe(0);
  });

  test("opens an SSE stream and removes it when the request aborts", async () => {
    const controller = new AbortController();
    const hub = createSseHub({ heartbeatMs: 0 });
    const response = hub.connect(
      new Request("http://127.0.0.1:8787/events", { signal: controller.signal }),
    );

    expect(response.headers.get("content-type")).toBe("text/event-stream; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(hub.size).toBe(1);

    const reader = response.body?.getReader();
    if (!reader) throw new Error("SSE response has no body");

    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toBe("retry: 3000\n\n");

    const connected = await reader.read();
    expect(new TextDecoder().decode(connected.value)).toBe(": connected\n\n");

    controller.abort();
    expect(hub.size).toBe(0);

    await reader.cancel();
  });

  test("releases consumers that cancel the stream without leaking clients", async () => {
    const hub = createSseHub({ heartbeatMs: 0 });

    for (let cycle = 0; cycle < 3; cycle += 1) {
      const response = hub.connect(new Request("http://127.0.0.1:8787/events"));
      const reader = response.body?.getReader();
      if (!reader) throw new Error("SSE response has no body");

      await reader.read();
      expect(hub.size).toBe(1);

      await reader.cancel();
      expect(hub.size).toBe(0);
    }
  });

  test("closes every stream on shutdown", async () => {
    const hub = createSseHub({ heartbeatMs: 0 });
    const response = hub.connect(new Request("http://127.0.0.1:8787/events"));
    const reader = response.body?.getReader();
    if (!reader) throw new Error("SSE response has no body");

    expect(new TextDecoder().decode((await reader.read()).value)).toBe("retry: 3000\n\n");
    expect(new TextDecoder().decode((await reader.read()).value)).toBe(": connected\n\n");

    hub.close();

    expect(hub.size).toBe(0);
    expect((await reader.read()).done).toBe(true);
  });
});
