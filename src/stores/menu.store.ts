import { createSignalStore } from "@hullperse/hp_utils/signal";

const store = createSignalStore();

const playerQuery = store.atom<string>("playerQuery", "");
const sidebarOpen = store.atom<boolean>("sidebarOpen", false);
const overlayPanelOpen = store.atom<boolean>("overlayPanelOpen", false);

export const menuStore = {
  playerQuery,
  sidebarOpen,
  overlayPanelOpen,
};
