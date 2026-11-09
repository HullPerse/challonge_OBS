import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useCell } from "@hullperse/hp_utils/react";

import { INTERACTIVE_SELECTOR } from "@/configs/bracket.config";
import { useElementSize } from "@/hooks/useElementSize.hook";
import { useLatestRef } from "@/hooks/useLatestRef.hook";
import { usePointerMirror } from "@/hooks/usePointerMirror.hook";
import { getBracketLayout } from "@/lib/bracket/layout.utils";
import { bracketPointToPointer, bracketPanToView } from "@/lib/bracket/scene.utils";
import { fitCamera, sameView, wheelZoom, zoomAtPoint } from "@/lib/bracket/viewport.utils";
import { bracketStore } from "@/stores/bracket.store";
import type { BracketCameraOptions, DragState } from "@/types/bracket";
import type { OverlayView } from "@/types/overlay";

export const useBracketCamera = ({
  snapshot,
  sceneView,
  onViewChange,
  onPointerChange,
}: BracketCameraOptions) => {
  const zoom = useCell(bracketStore.zoom);
  const pan = useCell(bracketStore.pan);
  const { ref: canvasRef, size: viewport } = useElementSize<HTMLDivElement>();
  const layout = snapshot ? getBracketLayout(snapshot) : null;
  const viewportReady = viewport.width > 0 && viewport.height > 0;
  const [dragging, setDragging] = useState<boolean>(false);
  const dragRef = useRef<DragState | null>(null);

  const viewCallbackRef = useLatestRef<((view: OverlayView) => void) | undefined>(onViewChange);
  const sceneViewRef = useLatestRef<OverlayView | undefined>(sceneView);
  const viewportRef = useLatestRef<{ width: number; height: number }>(viewport);

  const viewFrameRef = useRef<number | null>(null);
  const pendingViewRef = useRef<OverlayView | null>(null);
  const lastViewRef = useRef<OverlayView | null>(null);

  const { hidePointer, queuePointer } = usePointerMirror(onPointerChange);

  const fit = useCallback(() => {
    if (!layout) return;

    const camera = fitCamera(layout, viewport);
    if (!camera) return;

    bracketStore.batch(() => {
      bracketStore.zoom.set(camera.zoom);
      bracketStore.pan.set(camera.pan);
    });
  }, [layout, viewport]);

  const center = useCallback(() => {
    if (!layout || !viewport.width || !viewport.height) return;

    bracketStore.pan.set({
      x: (viewport.width - layout.width * zoom) / 2,
      y: (viewport.height - layout.height * zoom) / 2,
    });
  }, [layout, viewport, zoom]);

  useEffect(() => {
    if (!snapshot || !layout) return;
    if (!viewport.width || !viewport.height) return;
    if (bracketStore.fittedSlug.get() === snapshot.key) return;

    fit();
    bracketStore.fittedSlug.set(snapshot.key);
  }, [fit, layout, snapshot, viewport.height, viewport.width]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target;
      if (target !== document.body && target !== canvasRef.current) return;

      event.preventDefault();
      center();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvasRef, center]);

  useEffect(() => {
    if (!layout || !viewportReady) return;

    const next = bracketPanToView(pan, zoom, viewportRef.current, layout);
    if (!next) return;
    if (lastViewRef.current && sameView(lastViewRef.current, next)) return;

    lastViewRef.current = next;
    pendingViewRef.current = next;
    if (viewFrameRef.current !== null) return;

    viewFrameRef.current = window.requestAnimationFrame(() => {
      viewFrameRef.current = null;
      const pending = pendingViewRef.current;
      pendingViewRef.current = null;
      if (pending) viewCallbackRef.current?.(pending);
    });
  }, [layout, pan, viewCallbackRef, viewportReady, viewportRef, zoom]);

  useEffect(() => {
    const element = canvasRef.current;

    const handleWheel = (event: WheelEvent) => {
      if (!element || !layout) return;
      event.preventDefault();

      const rect = element.getBoundingClientRect();
      const camera = {
        zoom: bracketStore.zoom.get(),
        pan: bracketStore.pan.get(),
      };
      const next = zoomAtPoint(camera, wheelZoom(camera.zoom, event.deltaY), {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });

      bracketStore.batch(() => {
        bracketStore.zoom.set(next.zoom);
        bracketStore.pan.set(next.pan);
      });
    };

    element?.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      element?.removeEventListener("wheel", handleWheel);
    };
  }, [canvasRef, layout]);

  useEffect(() => {
    return () => {
      if (viewFrameRef.current !== null) window.cancelAnimationFrame(viewFrameRef.current);
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR))
    ) {
      return;
    }

    const currentPan = bracketStore.pan.get();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: currentPan.x,
      panY: currentPan.y,
    };
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const view = sceneViewRef.current;
    if (view && layout && onPointerChange) {
      const rect = event.currentTarget.getBoundingClientRect();
      const next = bracketPointToPointer(
        { x: event.clientX - rect.left, y: event.clientY - rect.top },
        pan,
        zoom,
        layout,
        view,
        event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)
          ? "link"
          : "default",
      );

      if (next) queuePointer(next);
      else hidePointer();
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    bracketStore.pan.set({
      x: drag.panX + (event.clientX - drag.startX),
      y: drag.panY + (event.clientY - drag.startY),
    });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return {
    canvasRef,
    dragging,
    fit,
    handlePointerDown,
    handlePointerEnd,
    handlePointerMove,
    hidePointer,
    layout,
    pan,
    zoom,
  };
};
