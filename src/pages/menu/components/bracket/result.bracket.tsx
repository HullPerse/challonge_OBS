import { Crown } from "lucide-react";

import { tournamentResult } from "@/lib/bracket/result.utils";
import type { TournamentSnapshot } from "@/types/tournament";

function ResultBracket({ snapshot }: { snapshot: TournamentSnapshot }) {
  const result = tournamentResult(snapshot);
  if (!result) return null;

  return (
    <div
      className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-surface px-4 text-xs"
      aria-label="Результат турнира"
    >
      <Crown className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
      <span className="max-w-60 truncate font-medium text-text-primary">{result.winner.name}</span>
      <span className="rounded-ui bg-bracket-highlight px-1.5 py-0.5 tabular-nums text-text-primary">
        {result.score}
      </span>
      {result.loser && (
        <span className="max-w-50 truncate text-text-muted">{result.loser.name}</span>
      )}
    </div>
  );
}

export default ResultBracket;
