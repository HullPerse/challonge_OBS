import { useMemo } from "react";
import { cn } from "cn";

import SceneBracket from "@/components/bracket/scene.bracket";
import OverlayDialog from "@/components/overlay/dialog.overlay";
import OverlayHeader from "@/components/overlay/header.overlay";
import OverlayPointerComponent from "@/components/overlay/pointer.overlay";
import { useElementSize } from "@/hooks/useElementSize.hook";
import { getBracketLayout } from "@/lib/bracket/layout.utils";
import { overlayCardView } from "@/lib/bracket/match.utils";
import {
  overlayStageScale,
  overlayStageStyle,
  viewToBracketCamera,
} from "@/lib/bracket/scene.utils";
import type { OverlayScene } from "@/types/overlay";

function OverlayBracket({ scene }: { scene: OverlayScene | null }) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const tournament = scene?.tournament ?? null;
  const layout = tournament ? getBracketLayout(tournament) : null;
  const view = scene?.state.view;
  const modules = scene?.state.modules;
  const hiddenMatchIds = scene?.visibility.hiddenMatches;
  const hiddenRoundIds = scene?.visibility.hiddenRounds;
  const scale = overlayStageScale(size);

  // Keep bracket props referentially stable so pointer updates only re-render the cursor.
  const camera = useMemo(
    () => (view && layout ? viewToBracketCamera(view, layout) : null),
    [layout, view],
  );
  const hiddenMatches = useMemo(() => new Set(hiddenMatchIds ?? []), [hiddenMatchIds]);
  const hiddenRounds = useMemo(() => new Set(hiddenRoundIds ?? []), [hiddenRoundIds]);
  const cardView = useMemo(
    () => (modules && tournament ? overlayCardView(modules, tournament) : null),
    [modules, tournament],
  );

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden">
      <div
        className={cn(
          "absolute overflow-hidden",
          scene?.state.modules.background && "bracket-dots",
        )}
        style={overlayStageStyle(size, scale)}
      >
        {scene && tournament && layout && camera && cardView && (
          <SceneBracket
            layout={layout}
            pan={camera.pan}
            zoom={camera.zoom}
            hiddenMatches={hiddenMatches}
            hiddenRounds={hiddenRounds}
            activePlayerId={scene.state.highlightedPlayerId}
            cardView={cardView}
            showRoundTitles={scene.state.modules.roundTitles}
          />
        )}

        <OverlayHeader scene={scene} />

        <OverlayDialog scene={scene} />

        <OverlayPointerComponent scene={scene} />
      </div>
    </div>
  );
}

export default OverlayBracket;
