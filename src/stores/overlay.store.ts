import { createSignalStore } from "@hullperse/hp_utils/signal";

const store = createSignalStore();

const previewInApp = store.atom<boolean>("previewInApp", false);

export const overlayStore = {
  previewInApp,
};
