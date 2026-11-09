import { useEffect } from "react";
import { useCell } from "@hullperse/hp_utils/react";
import { cn } from "cn";

import SceneBracket from "@/components/bracket/scene.bracket";
import { MATCH_LABEL } from "@/configs/bracket.config";
import VisibilityError from "@/components/shared/visibilityError.component";
import { useBracketCamera } from "@/hooks/useBracketCamera.hook";
import { useVisibility } from "@/hooks/useVisibility.hook";
import { matchStateLabel } from "@/lib/bracket/match.utils";
import { roundTitle } from "@/lib/sidebar.utils";
import { bracketStore } from "@/stores/bracket.store";
import { modalStore } from "@/stores/modal.store";
import type { OverlayPointer, OverlayView } from "@/types/overlay";
import type { MatchCardView } from "@/types/bracket";
import type { Match, TournamentSnapshot } from "@/types/tournament";
import DetailsBracket from "./details.bracket";

function ControlBracket({
  snapshot,
  sceneView,
  cardView,
  showRoundTitles,
  showBackground,
  onViewChange,
  onPointerChange,
}: {
  snapshot: TournamentSnapshot;
  sceneView: OverlayView;
  cardView: MatchCardView;
  showRoundTitles: boolean;
  showBackground: boolean;
  onViewChange: (view: OverlayView) => void;
  onPointerChange: (pointer: OverlayPointer) => void;
}) {
  const activePlayerId = useCell(bracketStore.highlightedPlayerId);
  const { hiddenMatches, hiddenRounds, toggleMatch, toggleRound, saveError } = useVisibility(
    snapshot.key,
  );
  const {
    canvasRef,
    dragging,
    fit,
    handlePointerDown,
    handlePointerEnd,
    handlePointerMove,
    hidePointer,
    layout,
    pan,
    zoom,
  } = useBracketCamera({
    snapshot,
    sceneView,
    onViewChange,
    onPointerChange,
  });

  useEffect(() => {
    bracketStore.highlightedPlayerId.set(null);
  }, [snapshot.key]);

  useEffect(() => {
    return () => {
      bracketStore.highlightedPlayerId.set(null);
    };
  }, []);

  const setHighlightedPlayer = (playerId: number | null) => {
    bracketStore.highlightedPlayerId.set(playerId);
  };

  const openMatch = (match: Match) => {
    modalStore.open({
      overlay: { kind: "match", matchId: match.id },
      title: `${MATCH_LABEL} ${match.identifier ?? match.id}`,
      description: `${roundTitle(snapshot, match.round)} | ${matchStateLabel(match.state)}`,
      className: "w-lg",
      body: <DetailsBracket snapshot={snapshot} match={match} />,
    });
  };

  if (!layout) return null;

  return (
    <div
      ref={canvasRef}
      role="application"
      aria-label="Сетка турнира"
      tabIndex={-1}
      className={cn(
        "relative h-full w-full select-none overflow-hidden outline-none",
        showBackground && "bracket-dots",
      )}
      style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={() => {
        setHighlightedPlayer(null);
        hidePointer();
      }}
    >
      <SceneBracket
        layout={layout}
        pan={pan}
        zoom={zoom}
        hiddenMatches={hiddenMatches}
        hiddenRounds={hiddenRounds}
        activePlayerId={activePlayerId}
        cardView={cardView}
        showRoundTitles={showRoundTitles}
        onToggleRound={toggleRound}
        onFit={fit}
        onOpenMatch={openMatch}
        onHideMatch={toggleMatch}
        onRestoreMatch={toggleMatch}
        onHighlightPlayer={setHighlightedPlayer}
      />

      <VisibilityError
        error={saveError}
        className="pointer-events-none absolute bottom-3 left-1/2 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-ui border border-accent/40 bg-surface/95 px-3 py-1.5 text-center text-[11px] shadow"
      />
    </div>
  );
}

export default ControlBracket;
