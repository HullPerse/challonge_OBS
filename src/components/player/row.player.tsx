import { PLAYER_PLACEHOLDER } from "@/configs/bracket.config";
import { matchResult, matchSides, matchTitle } from "@/lib/sidebar.utils";
import type { PlayerHistoryView } from "@/types/bracket";
import type { Match, Player, TournamentSnapshot } from "@/types/tournament";
import { cn } from "cn";
import PlayerAvatar from "../shared/avatar.component";

function PlayerHistoryRow({
  snapshot,
  player,
  match,
  view,
}: {
  snapshot: TournamentSnapshot;
  player: Player;
  match: Match;
  view: PlayerHistoryView;
}) {
  const { opponent, placeholder, playerScore, opponentScore } = matchSides(match, player.id);
  const name = opponent?.name ?? placeholder ?? PLAYER_PLACEHOLDER;
  const won = view.scores && match.winnerId === player.id;

  return (
    <div className="border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3 text-[11px] text-text-muted">
        <span className="truncate">{matchTitle(snapshot, match, view.matchNumbers)}</span>
        {view.scores && (
          <span className={cn("shrink-0", won && "text-accent")}>
            {matchResult(match, player.id)}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {view.avatars && <PlayerAvatar player={opponent} name={name} size={20} />}
        <span className="min-w-0 flex-1 truncate text-xs text-text-primary">{name}</span>
        {view.scores && (
          <span className="text-xs tabular-nums text-text-primary">
            {playerScore ?? "-"} : {opponentScore ?? "-"}
          </span>
        )}
      </div>
    </div>
  );
}
export default PlayerHistoryRow;
