import { clamp } from "@hullperse/hp_utils/math";

import {
  FIT_MAX_ZOOM,
  FIT_PADDING,
  MAX_ZOOM,
  MIN_ZOOM,
  WHEEL_ZOOM_FACTOR,
} from "@/configs/bracket.config";
import type { BracketCamera, BracketPoint, BracketSize } from "@/types/bracket";
import type { OverlayPointer, OverlayView } from "@/types/overlay";

const EPSILON = 0.0001;

/** Fits the whole bracket into the viewport with a small padding. */
export const fitCamera = (layout: BracketSize, viewport: BracketSize): BracketCamera | null => {
  if (!viewport.width || !viewport.height || !layout.width || !layout.height) {
    return null;
  }

  const zoom = clamp(
    Math.min(
      (viewport.width - FIT_PADDING) / layout.width,
      (viewport.height - FIT_PADDING) / layout.height,
      FIT_MAX_ZOOM,
    ),
    MIN_ZOOM,
    MAX_ZOOM,
  );

  return {
    zoom,
    pan: {
      x: (viewport.width - layout.width * zoom) / 2,
      y: (viewport.height - layout.height * zoom) / 2,
    },
  };
};

/** Zooms around a viewport point, keeping the content under it in place. */
export const zoomAtPoint = (
  camera: BracketCamera,
  nextZoom: number,
  point: BracketPoint,
): BracketCamera => {
  const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  const contentX = (point.x - camera.pan.x) / camera.zoom;
  const contentY = (point.y - camera.pan.y) / camera.zoom;

  return {
    zoom,
    pan: { x: point.x - contentX * zoom, y: point.y - contentY * zoom },
  };
};

export const wheelZoom = (zoom: number, deltaY: number): number => {
  return zoom * (deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR);
};

export const sameView = (first: OverlayView, second: OverlayView): boolean => {
  return (
    Math.abs(first.zoom - second.zoom) < EPSILON &&
    Math.abs(first.centerX - second.centerX) < EPSILON &&
    Math.abs(first.centerY - second.centerY) < EPSILON
  );
};

export const samePointer = (first: OverlayPointer, second: OverlayPointer): boolean => {
  return (
    first.visible === second.visible &&
    first.cursor === second.cursor &&
    Math.abs(first.x - second.x) < EPSILON &&
    Math.abs(first.y - second.y) < EPSILON
  );
};
