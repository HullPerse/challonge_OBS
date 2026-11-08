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
  const camera = scene && layout ? viewToBracketCamera(scene.state.view, layout) : null;
  const scale = overlayStageScale(size);

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden">
      <div
        className={cn(
          "absolute overflow-hidden",
          scene?.state.modules.background && "bracket-dots",
        )}
        style={overlayStageStyle(size, scale)}
      >
        {scene && tournament && layout && camera && (
          <SceneBracket
            layout={layout}
            pan={camera.pan}
            zoom={camera.zoom}
            hiddenMatches={new Set(scene.visibility.hiddenMatches)}
            hiddenRounds={new Set(scene.visibility.hiddenRounds)}
            activePlayerId={scene.state.highlightedPlayerId}
            cardView={overlayCardView(scene.state.modules, tournament)}
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
