import { playerName } from "@/lib/bracket/match.utils";
import type { MatchDialogView } from "@/types/bracket";
import type { Player } from "@/types/tournament";
import { cn } from "cn";
import PlayerAvatar from "../shared/avatar.component";
import { Trophy } from "lucide-react";

function MatchPlayer({
  player,
  placeholder,
  score,
  winner,
  view,
}: {
  player: Player | null;
  placeholder: string | null;
  score: number | null;
  winner: boolean;
  view: MatchDialogView;
}) {
  const name = playerName(player, placeholder);
  const isWinner = view.scores && winner;

  const getNote = () => {
    if (!player) return "Участник ещё не определён";
    if (!view.seeds) return null;
    return `Seed ${player.seed > 0 ? player.seed : "-"}`;
  };

  const note = getNote();

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-ui border px-3 py-2.5",
        isWinner ? "border-bracket-accent bg-bracket-highlight" : "border-border bg-surface-sunken",
      )}
    >
      {view.avatars && <PlayerAvatar player={player} name={name} size={30} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm text-text-primary">{name}</span>
          {isWinner && (
            <>
              <Trophy className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
              <span className="sr-only">Победитель</span>
            </>
          )}
        </div>
        {note && <div className="text-[10px] text-text-muted">{note}</div>}
      </div>
      {view.scores && (
        <span
          className={cn(
            "flex h-9 w-10 shrink-0 items-center justify-center rounded-ui text-base tabular-nums",
            isWinner ? "bg-accent text-accent-ink" : "bg-surface-elevated text-text-primary",
          )}
        >
          {score ?? "-"}
        </span>
      )}
    </div>
  );
}

export default MatchPlayer;
