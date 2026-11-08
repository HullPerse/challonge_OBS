import { animate, type JSAnimation } from "animejs";
import { useEffect, type RefObject } from "react";
import { RESIZE_DURATION_MS, RESIZE_EPSILON_PX } from "@/configs/ui.config";
import { prefersReducedMotion } from "@/lib/motion.utils";
import type { BoxSize } from "@/types/ui";

const measure = (element: HTMLElement): BoxSize => ({
  width: element.offsetWidth,
  height: element.offsetHeight,
});

const sameSize = (a: BoxSize, b: BoxSize): boolean =>
  Math.abs(a.width - b.width) < RESIZE_EPSILON_PX &&
  Math.abs(a.height - b.height) < RESIZE_EPSILON_PX;

const viewportSize = (): BoxSize => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

/**
 * Animates the popup box between content sizes instead of snapping.
 * Viewport resizes are not animated, and the observer ignores the sizes the
 * animation itself writes, otherwise every frame would start a new tween.
 */
const startModalResize = (element: HTMLElement | null, enabled: boolean): (() => void) => {
  let observer: ResizeObserver | null = null;
  let animation: JSAnimation | null = null;
  let isClipped = false;

  const clearSize = () => {
    if (element === null) return;
    element.style.width = "";
    element.style.height = "";
  };

  const releaseClip = () => {
    if (element === null || !isClipped) return;
    isClipped = false;
    element.style.overflow = "";
  };

  const cleanup = () => {
    observer?.disconnect();
    observer = null;
    animation?.cancel();
    animation = null;
    clearSize();
    releaseClip();
  };

  if (element === null || !enabled) return cleanup;
  if (typeof ResizeObserver === "undefined") return cleanup;
  if (prefersReducedMotion()) return cleanup;

  const target = element;
  let previous = measure(target);
  let viewport = viewportSize();

  const clip = () => {
    if (isClipped) return;
    isClipped = true;
    target.style.overflow = "hidden";
  };

  const animateTo = (from: BoxSize, to: BoxSize) => {
    previous = to;
    clip();
    animation = animate(target, {
      width: [`${from.width}px`, `${to.width}px`],
      height: [`${from.height}px`, `${to.height}px`],
      duration: RESIZE_DURATION_MS,
      ease: "inOutQuad",
      onComplete: () => {
        animation = null;
        clearSize();
        const settled = measure(target);
        if (!sameSize(to, settled)) {
          animateTo(to, settled);
          return;
        }
        previous = settled;
        releaseClip();
      },
    });
  };

  observer = new ResizeObserver(() => {
    const next = measure(target);
    const nextViewport = viewportSize();
    const viewportMoved =
      nextViewport.width !== viewport.width || nextViewport.height !== viewport.height;
    viewport = nextViewport;

    if (viewportMoved) {
      animation?.cancel();
      animation = null;
      clearSize();
      releaseClip();
      previous = next;
      return;
    }

    if (animation !== null) return;

    if (sameSize(previous, next)) {
      previous = next;
      return;
    }

    animateTo(previous, next);
  });
  observer.observe(target);

  return cleanup;
};

/** Keeps a resizing modal from snapping between content sizes. */
export const useModalResize = (elementRef: RefObject<HTMLElement | null>, enabled: boolean) => {
  useEffect(() => startModalResize(elementRef.current, enabled), [elementRef, enabled]);
};
