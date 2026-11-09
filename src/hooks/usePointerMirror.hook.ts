import { useCallback, useEffect, useRef } from "react";

import { useLatestRef } from "@/hooks/useLatestRef.hook";
import { samePointer } from "@/lib/bracket/viewport.utils";
import type { OverlayPointer, PointerHandler } from "@/types/overlay";

/** Mirrors bracket pointer positions to the overlay, one update per frame. */
export const usePointerMirror = (onPointerChange: PointerHandler | undefined) => {
  const callbackRef = useLatestRef<PointerHandler | undefined>(onPointerChange);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<OverlayPointer | null>(null);
  const lastRef = useRef<OverlayPointer | null>(null);

  const queuePointer = useCallback(
    (next: OverlayPointer) => {
      if (!callbackRef.current) return;
      if (lastRef.current && samePointer(lastRef.current, next)) return;

      lastRef.current = next;
      pendingRef.current = next;
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;

        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) callbackRef.current?.(pending);
      });
    },
    [callbackRef],
  );

  const hidePointer = useCallback(() => {
    const last = lastRef.current;
    if (!last?.visible || !callbackRef.current) return;

    const next = { ...last, visible: false };
    lastRef.current = next;

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingRef.current = null;
    callbackRef.current(next);
  }, [callbackRef]);

  useEffect(() => {
    window.addEventListener("blur", hidePointer);

    return () => {
      window.removeEventListener("blur", hidePointer);
    };
  }, [hidePointer]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return { hidePointer, queuePointer };
};
