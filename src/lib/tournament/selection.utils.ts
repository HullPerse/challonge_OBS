import type { SelectionState, TournamentSummary } from "@/types/tournament";

type SelectionInput = {
  isSavedReady: boolean;
  isOverlayReady: boolean;
  isSelectionFailed: boolean;
  activeSlug: string | null;
  savedList: readonly TournamentSummary[];
};

/** Resolves which tournament should be active and what blocks the choice. */
export const resolveSelectionState = ({
  isSavedReady,
  isOverlayReady,
  isSelectionFailed,
  activeSlug,
  savedList,
}: SelectionInput): SelectionState => {
  if (!isSavedReady || !isOverlayReady) return { status: "loading" };
  if (isSelectionFailed) return { status: "failed" };

  if (activeSlug === null) return { status: "ready", slug: null };

  const activeIsKnown = savedList.some((item) => item.slug === activeSlug);
  if (activeIsKnown) return { status: "ready", slug: activeSlug };

  const fallbackSlug = savedList.at(0)?.slug ?? null;
  if (fallbackSlug === null) return { status: "ready", slug: null };

  return { status: "selecting", targetSlug: fallbackSlug };
};
