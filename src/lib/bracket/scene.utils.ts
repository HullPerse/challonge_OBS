import {
  OVERLAY_POINTER_RANGE,
  OVERLAY_STAGE_HEIGHT,
  OVERLAY_STAGE_WIDTH,
  OVERLAY_VIEW_LIMITS,
} from "@/configs/overlay.config";
import type { BracketCamera, BracketPoint, BracketSize } from "@/types/bracket";
import type { OverlayPointer, OverlayView } from "@/types/overlay";

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

/** Match the bracket width so the overlay is not zoomed out by a short viewport. */
const stageScale = (viewport: BracketSize): number => {
  return OVERLAY_STAGE_WIDTH / viewport.width;
};

/** Converts bracket pan/zoom to overlay view coordinates. */
export const bracketPanToView = (
  pan: BracketPoint,
  zoom: number,
  viewport: BracketSize,
  layout: BracketSize,
): OverlayView | null => {
  if (!viewport.width || !viewport.height || !layout.width || !layout.height) {
    return null;
  }

  return {
    zoom: clamp(
      zoom * stageScale(viewport),
      OVERLAY_VIEW_LIMITS.zoom.min,
      OVERLAY_VIEW_LIMITS.zoom.max,
    ),
    centerX: clamp(
      (viewport.width / 2 - pan.x) / (layout.width * zoom),
      OVERLAY_VIEW_LIMITS.centerX.min,
      OVERLAY_VIEW_LIMITS.centerX.max,
    ),
    centerY: clamp(
      (viewport.height / 2 - pan.y) / (layout.height * zoom),
      OVERLAY_VIEW_LIMITS.centerY.min,
      OVERLAY_VIEW_LIMITS.centerY.max,
    ),
  };
};

/** Scale of the fixed 1920x1080 stage inside the current overlay viewport. */
export const overlayStageScale = (viewport: BracketSize): number => {
  return viewport.width > 0 && viewport.height > 0
    ? Math.min(viewport.width / OVERLAY_STAGE_WIDTH, viewport.height / OVERLAY_STAGE_HEIGHT)
    : 1;
};

/** Maps a browser client point onto the scaled, letterboxed overlay stage. */
export const clientToStagePoint = (
  clientX: number,
  clientY: number,
  viewport: BracketSize,
): BracketPoint => {
  const scale = overlayStageScale(viewport);
  const stageWidth = OVERLAY_STAGE_WIDTH * scale;
  const stageHeight = OVERLAY_STAGE_HEIGHT * scale;
  const offsetX = (viewport.width - stageWidth) / 2;
  const offsetY = (viewport.height - stageHeight) / 2;

  return {
    x: clamp((clientX - offsetX) / stageWidth, 0, 1),
    y: clamp((clientY - offsetY) / stageHeight, 0, 1),
  };
};

/** Position and scale for the fixed overlay stage. */
export const overlayStageStyle = (viewport: BracketSize, scale: number) => {
  return {
    width: OVERLAY_STAGE_WIDTH,
    height: OVERLAY_STAGE_HEIGHT,
    left: (viewport.width - OVERLAY_STAGE_WIDTH * scale) / 2,
    top: (viewport.height - OVERLAY_STAGE_HEIGHT * scale) / 2,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };
};

/** Converts an overlay view back to bracket pan/zoom for the fixed stage. */
export const viewToBracketCamera = (
  view: OverlayView,
  layout: BracketSize,
): BracketCamera | null => {
  if (!layout.width || !layout.height) return null;

  return {
    zoom: view.zoom,
    pan: {
      x: OVERLAY_STAGE_WIDTH / 2 - view.centerX * layout.width * view.zoom,
      y: OVERLAY_STAGE_HEIGHT / 2 - view.centerY * layout.height * view.zoom,
    },
  };
};

/** Maps the bracket content point onto the overlay camera, so resizing does not move the cursor. */
export const bracketPointToPointer = (
  point: BracketPoint,
  pan: BracketPoint,
  zoom: number,
  layout: BracketSize,
  view: OverlayView,
  cursor: OverlayPointer["cursor"],
): OverlayPointer | null => {
  if (!layout.width || !layout.height || !zoom) return null;

  const contentX = (point.x - pan.x) / zoom;
  const contentY = (point.y - pan.y) / zoom;
  const x = 0.5 + ((contentX - view.centerX * layout.width) * view.zoom) / OVERLAY_STAGE_WIDTH;
  const y = 0.5 + ((contentY - view.centerY * layout.height) * view.zoom) / OVERLAY_STAGE_HEIGHT;

  if (x < OVERLAY_POINTER_RANGE.min || x > OVERLAY_POINTER_RANGE.max) return null;
  if (y < OVERLAY_POINTER_RANGE.min || y > OVERLAY_POINTER_RANGE.max) return null;

  return { x, y, visible: true, cursor };
};
