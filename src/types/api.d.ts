import type { OverlayEvent } from "@/types/overlay";

export type ApiErrorPayload = {
  error?: string;
  issues?: unknown;
};

export type ApiHealth = {
  ok: boolean;
  db: "up" | "down";
  app?: string;
  uptime?: number;
};

export type ApiRequestInit = RequestInit & {
  fallbackError: string;
};

export type OverlayStreamHandlers = {
  onEvent: (event: OverlayEvent) => void;
  onOpen?: () => void;
  onError?: (error: unknown) => void;
};
