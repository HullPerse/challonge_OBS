import { api } from "@/api/index.api";
import type { OverlaySubscription, OverlaySubscriptionHandlers } from "@/types/overlay";

let overlaySubscription: OverlaySubscription | null = null;
let overlayConnected = false;
const connectionListeners = new Set<() => void>();

const notifyConnection = () => {
  for (const listener of connectionListeners) listener();
};

export const subscribeOverlayConnection = (listener: () => void) => {
  connectionListeners.add(listener);

  return () => {
    connectionListeners.delete(listener);
  };
};

export const getOverlayConnectionSnapshot = (): boolean => overlayConnected;

/** Shares one SSE connection across every control-panel consumer. */
export const acquireOverlaySubscription = (handlers: OverlaySubscriptionHandlers) => {
  if (!overlaySubscription) {
    let current: OverlaySubscription;
    current = {
      consumers: 0,
      close: api.overlay.subscribe({
        onOpen: () => {
          if (overlaySubscription !== current) return;
          overlayConnected = true;
          notifyConnection();
        },
        onError: () => {
          if (overlaySubscription !== current) return;
          overlayConnected = false;
          notifyConnection();
        },
        onEvent: (event) => {
          if (overlaySubscription !== current) return;
          handlers.onEvent(event);
        },
      }),
    };
    overlaySubscription = current;
  }

  overlaySubscription.consumers += 1;

  return () => {
    const current = overlaySubscription;
    if (!current) return;

    current.consumers -= 1;
    if (current.consumers > 0) return;

    overlaySubscription = null;
    overlayConnected = false;
    notifyConnection();
    current.close();
  };
};
