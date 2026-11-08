import type { MouseEvent } from "react";

import MatchMeta from "@/components/match/meta.match";
import MatchNumber from "@/components/match/number.match";
import PlayerRow from "@/components/bracket/player.bracket";
import { cardStyle, matchLabel, winnerSide } from "@/lib/bracket/match.utils";
import type { MatchCardView } from "@/types/bracket";
import type { Match } from "@/types/tournament";

function MatchCard({
  match,
  left,
  top,
  view,
  activePlayerId = null,
  onOpen,
  onHide,
  onHighlightPlayer,
}: {
  match: Match;
  left: number;
  top: number;
  view: MatchCardView;
  activePlayerId?: number | null;
  onOpen?: () => void;
  onHide?: () => void;
  onHighlightPlayer?: (playerId: number | null) => void;
}) {
  const firstWins = winnerSide(match) === "first";
  const secondWins = winnerSide(match) === "second";
  const dimmed = view.completedDim && match.state === "complete";
  const style = cardStyle(left, top, dimmed);

  const content = (
    <>
      <MatchMeta match={match} view={view} />
      <MatchNumber match={match} view={view} />
      <span className="block overflow-hidden rounded-ui-lg bg-bracket-card ring-1 ring-bracket-border">
        <PlayerRow
          player={match.player1}
          placeholder={match.placeholder1}
          score={match.score1}
          winner={firstWins}
          view={view}
          activePlayerId={activePlayerId}
          onHighlightPlayer={onHighlightPlayer}
        />
        <span className="block h-px bg-bracket-divider" />
        <PlayerRow
          player={match.player2}
          placeholder={match.placeholder2}
          score={match.score2}
          winner={secondWins}
          view={view}
          activePlayerId={activePlayerId}
          onHighlightPlayer={onHighlightPlayer}
        />
      </span>
    </>
  );

  if (!onOpen) {
    return (
      <div className="absolute" style={style}>
        {content}
      </div>
    );
  }

  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onHide?.();
  };

  return (
    <button
      type="button"
      aria-label={matchLabel(match, onHide !== undefined)}
      className="absolute cursor-pointer text-left outline-none focus-visible:outline-2 focus-visible:outline-accent"
      style={style}
      onClick={onOpen}
      onContextMenu={onHide ? handleContextMenu : undefined}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onPointerLeave={() => {
        onHighlightPlayer?.(null);
      }}
    >
      {content}
    </button>
  );
}

export default MatchCard;
