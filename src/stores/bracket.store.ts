import { createSignalStore } from "@hullperse/hp_utils/signal";

import type { BracketTableView } from "@/types/bracket";

const store = createSignalStore();

const zoom = store.atom<number>("zoom", 1);
const pan = store.atom<{ x: number; y: number }>("pan", { x: 0, y: 0 });
const fittedSlug = store.atom<string | null>("fittedSlug", null);
const highlightedPlayerId = store.atom<number | null>("highlightedPlayerId", null);
const tableViewByKey = store.atom<Record<string, BracketTableView>>("tableViewByKey", {});

export const bracketStore = {
  zoom,
  pan,
  fittedSlug,
  highlightedPlayerId,
  tableViewByKey,
  batch: store.batch,
};
