import {
  SSE_CONNECTED_FRAME,
  SSE_HEADERS,
  SSE_HEARTBEAT_FRAME,
  SSE_HEARTBEAT_MS,
  SSE_RETRY_FRAME,
} from "@/configs/server/http.config";
import type { SseClient, SseHubOptions } from "@/types/server/sse";
import { attemptSync } from "@hullperse/hp_utils/attempt";

/** Keeps SSE clients, broadcasts events and sends heartbeats. */
export class SseHub<T> {
  private readonly clients = new Set<SseClient>();
  private readonly heartbeatMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: SseHubOptions = {}) {
    this.heartbeatMs = options.heartbeatMs ?? SSE_HEARTBEAT_MS;
  }

  get size(): number {
    return this.clients.size;
  }

  /** Registers a raw writer; returns an unsubscribe callback. */
  subscribe(write: (chunk: string) => void): () => void {
    const client: SseClient = {
      close: () => {
        return;
      },
      write: (chunk) => {
        const [, error] = attemptSync(() => {
          write(chunk);
        });
        return !error;
      },
    };

    this.clients.add(client);
    this.startTimer();

    return () => {
      this.remove(client);
    };
  }

  /** Sends an event to all clients; returns how many received it. */
  publish(event: T): number {
    return this.broadcast(this.format(event));
  }

  /** Sends a heartbeat comment frame to all clients. */
  heartbeat(): number {
    return this.broadcast(SSE_HEARTBEAT_FRAME);
  }

  /** Opens an SSE stream response and registers it for broadcasts. */
  connect(request: Request, initial?: T): Response {
    const encoder = new TextEncoder();
    let client: SseClient | null = null;

    const stream = new ReadableStream<Uint8Array>({
      cancel: () => {
        if (!client) return;
        this.remove(client);
      },
      start: (controller) => {
        let open = true;
        const close = () => {
          if (!open) return;
          open = false;
          controller.close();
        };

        client = {
          close,
          write: (chunk) => {
            if (!open) return false;

            const [, error] = attemptSync(() => {
              controller.enqueue(encoder.encode(chunk));
            });

            if (error) open = false;
            return !error;
          },
        };

        this.clients.add(client);
        this.startTimer();
        client.write(SSE_RETRY_FRAME);
        client.write(SSE_CONNECTED_FRAME);
        if (initial !== undefined) client.write(this.format(initial));

        request.signal.addEventListener(
          "abort",
          () => {
            if (!client) return;
            this.remove(client);
            close();
          },
          { once: true },
        );
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  }

  /** Closes every client and stops the heartbeat timer. */
  close() {
    this.stopTimer();
    for (const client of this.clients) client.close();
    this.clients.clear();
  }

  private format(event: T): string {
    return `data: ${JSON.stringify(event)}\n\n`;
  }

  private broadcast(chunk: string): number {
    let delivered = 0;

    for (const client of this.clients) {
      if (client.write(chunk)) {
        delivered += 1;
      } else {
        this.remove(client);
      }
    }

    return delivered;
  }

  private remove(client: SseClient) {
    this.clients.delete(client);
    if (this.clients.size === 0) this.stopTimer();
  }

  private startTimer() {
    if (this.timer || this.heartbeatMs <= 0) return;

    this.timer = setInterval(() => this.heartbeat(), this.heartbeatMs);
    this.timer.unref();
  }

  private stopTimer() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}

/** Creates a ready-to-use SSE hub. */
export const createSseHub = <T>(options?: SseHubOptions): SseHub<T> => {
  return new SseHub<T>(options);
};
