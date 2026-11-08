import { useCell } from "@hullperse/hp_utils/react";

import { appCardView, appDialogView } from "@/lib/bracket/match.utils";
import { overlayStore } from "@/stores/overlay.store";
import type { MatchCardView, MatchDialogView } from "@/types/bracket";
import type { OverlayState } from "@/types/overlay";
import type { TournamentSnapshot } from "@/types/tournament";
import { useOverlayState } from "./useOverlay.hook";

/** Local overlay-preview switch; it is not part of the server state. */
export const usePreviewInApp = (): boolean => useCell(overlayStore.previewInApp);

/** Card fields and round headings for the control panel preview. */
export const useAppBracketView = (
  overlayState: OverlayState | null,
  snapshot: TournamentSnapshot | null,
): { cardView: MatchCardView; showRoundTitles: boolean } => {
  const previewInApp = usePreviewInApp();

  return {
    cardView: appCardView(previewInApp, overlayState?.modules ?? null, snapshot),
    showRoundTitles: !previewInApp || !overlayState || overlayState.modules.roundTitles,
  };
};

/** Dialog fields for the control panel, optionally mirroring the overlay modules. */
export const useAppDialogView = (snapshot: TournamentSnapshot): MatchDialogView => {
  const previewInApp = usePreviewInApp();
  const overlay = useOverlayState();

  return appDialogView(previewInApp, overlay.data?.modules ?? null, snapshot);
};
