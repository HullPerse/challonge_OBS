import { cn } from "cn";

import PlayerAvatar from "@/components/shared/avatar.component";
import { playerName } from "@/lib/bracket/match.utils";
import type { MatchCardView } from "@/types/bracket";
import type { Player } from "@/types/tournament";

function PlayerRow({
  player,
  placeholder,
  score,
  winner,
  view,
  activePlayerId,
  onHighlightPlayer,
}: {
  player: Player | null;
  placeholder: string | null;
  score: number | null;
  winner: boolean;
  view: MatchCardView;
  activePlayerId: number | null;
  onHighlightPlayer?: (playerId: number | null) => void;
}) {
  const name = playerName(player, placeholder);
  const seed = player?.seed ?? 0;
  const highlighted = player?.id === activePlayerId;

  return (
    <span
      className={cn("flex h-6 items-center", highlighted && "bg-bracket-highlight")}
      style={highlighted ? { boxShadow: "inset 2px 0 0 var(--bracket-accent)" } : undefined}
      onPointerEnter={() => {
        if (player && onHighlightPlayer) onHighlightPlayer(player.id);
      }}
      onPointerLeave={() => {
        if (player && onHighlightPlayer) onHighlightPlayer(null);
      }}
    >
      {view.seeds && (
        <span className="flex size-6 shrink-0 items-center justify-center bg-bracket-card-alt text-[10px] tabular-nums text-bracket-ink">
          {seed > 0 ? seed : ""}
        </span>
      )}
      {view.avatars && (
        <span className="flex size-6 shrink-0 items-center justify-center">
          <PlayerAvatar player={player} name={name} size={18} />
        </span>
      )}
      <span
        className={cn(
          "flex h-6 min-w-0 flex-1 items-center truncate pl-1.5 text-xs text-white",
          !player && "opacity-70",
        )}
      >
        {name}
      </span>
      {view.scores && (
        <span
          className={cn(
            "flex h-6 w-8 shrink-0 items-center justify-center text-xs tabular-nums",
            winner ? "bg-bracket-accent text-accent-ink" : "bg-bracket-card-alt text-bracket-ink",
          )}
        >
          {score ?? "-"}
        </span>
      )}
    </span>
  );
}

export default PlayerRow;
