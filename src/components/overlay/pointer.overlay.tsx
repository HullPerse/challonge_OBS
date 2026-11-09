import { useCell } from "@hullperse/hp_utils/react";

import {
  OVERLAY_CURSOR_OFFSETS,
  OVERLAY_CURSOR_SIZE,
  OVERLAY_STAGE_HEIGHT,
  OVERLAY_STAGE_WIDTH,
} from "@/configs/overlay.config";
import { pointerStore } from "@/stores/pointer.store";
import type { OverlayScene } from "@/types/overlay";

function OverlayPointerComponent({ scene }: { scene: OverlayScene | null }) {
  const pointer = useCell(pointerStore.pointer);
  const enabled = scene?.state.modules.pointer ?? false;
  const size = scene?.state.pointerSize ?? OVERLAY_CURSOR_SIZE.default;

  if (!enabled || !pointer.visible) return null;

  const isLink = pointer.cursor === "link";
  const offset = OVERLAY_CURSOR_OFFSETS[pointer.cursor];
  const ratio = size / OVERLAY_CURSOR_SIZE.default;

  return (
    <img
      src={isLink ? "/cursors/link.png" : "/cursors/normal.png"}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute z-30"
      style={{
        left: 0,
        top: 0,
        width: size,
        height: size,
        transform: `translate3d(${pointer.x * OVERLAY_STAGE_WIDTH}px, ${pointer.y * OVERLAY_STAGE_HEIGHT}px, 0) translate(${offset.x * ratio}px, ${offset.y * ratio}px)`,
        willChange: "transform",
      }}
    />
  );
}

export default OverlayPointerComponent;
