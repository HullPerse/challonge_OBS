import { OVERLAY_BOOTSTRAP_ID } from "@/configs/overlay.config";
import { overlaySyncEventSchema } from "@/lib/schemas/overlay.schema";
import type { OverlaySyncEvent } from "@/types/overlay";
import { attemptSync } from "@hullperse/hp_utils/attempt";

/** Reads the first-paint payload written into the overlay HTML. */
export const readOverlayBootstrap = (): OverlaySyncEvent | null => {
  const element = document.getElementById(OVERLAY_BOOTSTRAP_ID);
  if (!element?.textContent) return null;

  const [data, error] = attemptSync(() => JSON.parse(element.textContent) as unknown);
  if (error) return null;

  const parsed = overlaySyncEventSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
};
