import { Trophy } from "lucide-react";

import { groupMatchRounds, groupStandings } from "@/lib/tournament/group.utils";
import type { Match, Player, TournamentGroup, TournamentSnapshot } from "@/types/tournament";
import GroupMatches from "./matches.group";
import GroupStandings from "./standings.group";

function GroupCard({
  snapshot,
  group,
  onOpenMatch,
  onOpenPlayer,
}: {
  snapshot: TournamentSnapshot;
  group: TournamentGroup;
  onOpenMatch: (match: Match) => void;
  onOpenPlayer: (player: Player) => void;
}) {
  const standings = groupStandings(group);
  const rounds = groupMatchRounds(group);

  return (
    <section className="flex min-w-0 flex-col rounded-ui border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Trophy className="size-3.5 text-accent" aria-hidden="true" />
          <h3 className="text-xs font-medium text-text-primary">{group.name}</h3>
        </div>
        <span className="text-[10px] tabular-nums text-text-muted">
          {standings.length} игроков | {group.matches.length} матчей
        </span>
      </header>

      <GroupStandings standings={standings} onOpenPlayer={onOpenPlayer} />
      <GroupMatches snapshot={snapshot} rounds={rounds} onOpenMatch={onOpenMatch} />
    </section>
  );
}

export default GroupCard;
