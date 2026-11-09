import { ChevronDown } from "lucide-react";

import Button from "@/components/ui/button.component";
import { PLAYER_PLACEHOLDER, ROUND_LABEL } from "@/configs/bracket.config";
import { matchStateLabel } from "@/lib/bracket/match.utils";
import { matchTitle } from "@/lib/sidebar.utils";
import type { GroupMatchRound, Match, TournamentSnapshot } from "@/types/tournament";

const scoreline = (match: Match): string => {
  if (match.entrants && match.entrants.length > 0) {
    return `${String(match.entrants.length)} участников`;
  }

  const first = match.player1?.name ?? match.placeholder1 ?? PLAYER_PLACEHOLDER;
  const second = match.player2?.name ?? match.placeholder2 ?? PLAYER_PLACEHOLDER;
  const firstScore = match.score1 ?? "-";
  const secondScore = match.score2 ?? "-";

  return `${first} ${String(firstScore)} : ${String(secondScore)} ${second}`;
};

function GroupMatches({
  snapshot,
  rounds,
  onOpenMatch,
}: {
  snapshot: TournamentSnapshot;
  rounds: GroupMatchRound[];
  onOpenMatch: (match: Match) => void;
}) {
  return (
    <details className="group border-t border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[11px] text-text-muted transition-colors hover:text-text-primary">
        Матчи
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
      </summary>

      <div className="max-h-80 overflow-y-auto border-t border-border bg-surface-sunken/40">
        {rounds.map((round) => (
          <div key={round.round} className="border-b border-border/60 last:border-0">
            <p className="px-3 pt-2 pb-1 text-[10px] font-medium text-text-muted">
              {ROUND_LABEL} {round.round}
            </p>
            <div className="flex flex-col">
              {round.matches.map((match) => (
                <Button
                  key={match.id}
                  type="button"
                  variant="ghost"
                  className="h-auto justify-start gap-2 rounded-none px-3 py-1.5 text-left"
                  onClick={() => {
                    onOpenMatch(match);
                  }}
                  title={matchTitle(snapshot, match, true)}
                >
                  <span className="w-8 shrink-0 text-[10px] tabular-nums text-text-muted">
                    {match.identifier ?? "-"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-text-secondary">
                    {scoreline(match)}
                  </span>
                  <span className="shrink-0 text-[10px] text-text-muted">
                    {matchStateLabel(match.state)}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export default GroupMatches;
