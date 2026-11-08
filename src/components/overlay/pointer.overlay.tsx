import {
  OVERLAY_CURSOR_OFFSETS,
  OVERLAY_CURSOR_SIZE,
  OVERLAY_STAGE_HEIGHT,
  OVERLAY_STAGE_WIDTH,
} from "@/configs/overlay.config";
import type { OverlayScene } from "@/types/overlay";

function OverlayPointerComponent({ scene }: { scene: OverlayScene | null }) {
  const pointer = scene?.state.pointer;
  const enabled = scene?.state.modules.pointer ?? false;
  const size = scene?.state.pointerSize ?? OVERLAY_CURSOR_SIZE.default;

  if (!enabled || !pointer?.visible) return null;

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
        left: pointer.x * OVERLAY_STAGE_WIDTH,
        top: pointer.y * OVERLAY_STAGE_HEIGHT,
        width: size,
        height: size,
        transform: `translate(${offset.x * ratio}px, ${offset.y * ratio}px)`,
      }}
    />
  );
}

export default OverlayPointerComponent;
