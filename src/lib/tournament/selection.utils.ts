import type { SelectionInput, SelectionState } from "@/types/tournament";

/** Resolves which tournament should be active and what blocks the choice. */
export const resolveSelectionState = ({
  isSavedReady,
  isOverlayReady,
  isSelectionFailed,
  activeKey,
  savedList,
}: SelectionInput): SelectionState => {
  if (!isSavedReady || !isOverlayReady) return { status: "loading" };
  if (isSelectionFailed) return { status: "failed" };

  if (activeKey === null) return { status: "ready", key: null };

  const activeIsKnown = savedList.some((item) => item.key === activeKey);
  if (activeIsKnown) return { status: "ready", key: activeKey };

  const fallbackKey = savedList.at(0)?.key ?? null;
  if (fallbackKey === null) return { status: "ready", key: null };

  return { status: "selecting", targetKey: fallbackKey };
};
