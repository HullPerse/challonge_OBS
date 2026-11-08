import { useEffect, useRef } from "react";
import { useCell } from "@hullperse/hp_utils/react";

import { INTERACTIVE_SELECTOR } from "@/configs/bracket.config";
import { clientToStagePoint } from "@/lib/bracket/scene.utils";
import { samePointer } from "@/lib/bracket/viewport.utils";
import { bracketStore } from "@/stores/bracket.store";
import { modalStore } from "@/stores/modal.store";
import type { OverlayModal, OverlayPointer, OverlayState } from "@/types/overlay";
import { useOverlayFocus, useSetOverlayPointer } from "./useOverlay.hook";

const pointerFromEvent = (event: PointerEvent): OverlayPointer => {
  const point = clientToStagePoint(event.clientX, event.clientY, {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  return {
    x: point.x,
    y: point.y,
    visible: true,
    cursor:
      event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)
        ? "link"
        : "default",
  };
};

const sameModal = (left: OverlayModal | null, right: OverlayModal | null): boolean => {
  if (left === right) return true;
  if (!left || !right) return false;
  if (left.kind === "match" && right.kind === "match") return left.matchId === right.matchId;
  if (left.kind === "player" && right.kind === "player") return left.playerId === right.playerId;
  return false;
};

/** Mirrors bracket hover and the open control-panel dialog to the overlay. */
export const useOverlayFocusSync = (overlayState: OverlayState | null | undefined) => {
  const focus = useOverlayFocus();
  const { mutate: setOverlayPointer } = useSetOverlayPointer();
  const { mutate } = focus;
  const highlightedPlayerId = useCell(bracketStore.highlightedPlayerId);
  const content = useCell(modalStore.content);
  const isModalOpen = useCell(modalStore.isOpen);
  const overlayModal = isModalOpen ? (content?.overlay ?? null) : null;
  const previousModalRef = useRef<OverlayModal | null>(null);
  const lastPointerRef = useRef<OverlayPointer | null>(null);
  const sentPointerRef = useRef<OverlayPointer | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointerEnabled = overlayState?.modules.pointer ?? false;
  const focusModalOpen = overlayState?.modal != null;

  useEffect(() => {
    const remember = (event: PointerEvent) => {
      lastPointerRef.current = pointerFromEvent(event);
    };

    window.addEventListener("pointermove", remember, { passive: true });
    return () => {
      window.removeEventListener("pointermove", remember);
    };
  }, []);

  useEffect(() => {
    mutate({ highlightedPlayerId });
  }, [highlightedPlayerId, mutate]);

  useEffect(() => {
    if (sameModal(previousModalRef.current, overlayModal)) return;

    previousModalRef.current = overlayModal;
    mutate({ modal: overlayModal });
  }, [mutate, overlayModal]);

  useEffect(() => {
    const enabled = focusModalOpen && pointerEnabled;

    const send = (pointer: OverlayPointer) => {
      const previous = sentPointerRef.current;
      if (previous && samePointer(previous, pointer)) return;

      sentPointerRef.current = pointer;
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const pending = sentPointerRef.current;
        if (pending) setOverlayPointer(pending);
      });
    };

    const handleMove = (event: PointerEvent) => {
      if (enabled) send(pointerFromEvent(event));
    };

    if (enabled) {
      sentPointerRef.current = null;
      const initial = lastPointerRef.current;
      if (initial) send(initial);
      window.addEventListener("pointermove", handleMove, { passive: true });
    }

    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (!enabled) return;

      const lastPointer = sentPointerRef.current ?? lastPointerRef.current;
      if (lastPointer) {
        setOverlayPointer({ ...lastPointer, visible: false });
      }
    };
  }, [focusModalOpen, pointerEnabled, setOverlayPointer]);

  return focus;
};
