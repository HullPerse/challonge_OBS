import { Eye, EyeOff, Layers } from "lucide-react";

import Button from "@/components/ui/button.component";
import { SIDE_ORDER } from "@/configs/tournament.config";
import { useVisibility } from "@/hooks/useVisibility.hook";
import { compareMatches, roundTitle } from "@/lib/sidebar.utils";
import type { TournamentSnapshot } from "@/types/tournament";

function HiddenHeader({ snapshot }: { snapshot: TournamentSnapshot }) {
  const { hiddenMatches, hiddenRounds, toggleMatch, toggleRound, clear } = useVisibility(
    snapshot.slug,
  );

  const rounds = snapshot.rounds
    .filter((round) => hiddenRounds.has(round.number))
    .sort(
      (left, right) => SIDE_ORDER[left.side] - SIDE_ORDER[right.side] || left.order - right.order,
    );

  const matches = snapshot.matches
    .filter((match) => hiddenMatches.has(match.id))
    .sort(compareMatches);

  if (rounds.length === 0 && matches.length === 0) {
    return (
      <p className="flex items-center gap-2 text-xs text-text-muted">
        <Eye className="size-4" />
        Скрытых матчей и раундов нет
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {rounds.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-[11px] font-medium text-text-muted">
            <Layers className="size-3" />
            Раунды
            <span className="tabular-nums">{rounds.length}</span>
          </h3>
          <div className="mt-2 flex flex-col gap-1.5">
            {rounds.map((round) => (
              <div
                key={round.number}
                className="flex items-center gap-3 border border-border bg-surface-panel px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-text-primary">{round.title}</div>
                  <div className="mt-0.5 text-[10px] text-text-muted">
                    {round.side === "winners" ? "Winners bracket" : "Losers bracket"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    toggleRound(round.number);
                  }}
                >
                  <Eye className="size-3.5" />
                  Показать
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {matches.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-[11px] font-medium text-text-muted">
            <EyeOff className="size-3" />
            Матчи
            <span className="tabular-nums">{matches.length}</span>
          </h3>
          <div className="mt-2 flex flex-col gap-1.5">
            {matches.map((match) => {
              const first = match.player1?.name ?? match.placeholder1 ?? "TBD";
              const second = match.player2?.name ?? match.placeholder2 ?? "TBD";

              return (
                <div
                  key={match.id}
                  className="flex items-center gap-3 border border-border bg-surface-panel px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-text-muted">
                      {roundTitle(snapshot, match.round)} | Матч {match.identifier ?? match.id}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-text-primary">
                      {first} <span className="text-text-muted">vs</span> {second}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      toggleMatch(match.id);
                    }}
                  >
                    <Eye className="size-3.5" />
                    Показать
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={clear}>
          <EyeOff className="size-3.5" />
          Показать все
        </Button>
      </div>
    </div>
  );
}

export default HiddenHeader;
