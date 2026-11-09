import { createSignalStore } from "@hullperse/hp_utils/signal";

import { DEFAULT_POINTER } from "@/configs/overlay.config";
import type { OverlayPointer } from "@/types/overlay";

const store = createSignalStore();

const pointer = store.atom<OverlayPointer>("pointer", { ...DEFAULT_POINTER });

export const pointerStore = {
  pointer,
};
