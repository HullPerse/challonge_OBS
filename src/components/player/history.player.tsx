import { compareMatches } from "@/lib/sidebar.utils";
import { snapshotMatches } from "@/lib/tournament/group.utils";
import type { PlayerHistoryView } from "@/types/bracket";
import type { Player, TournamentSnapshot } from "@/types/tournament";
import PlayerHistoryRow from "./row.player";

function PlayerHistory({
  snapshot,
  player,
  view,
}: {
  snapshot: TournamentSnapshot;
  player: Player;
  view: PlayerHistoryView;
}) {
  const matches = snapshotMatches(snapshot)
    .filter(
      (match) =>
        match.player1?.id === player.id ||
        match.player2?.id === player.id ||
        match.entrants?.some((entrant) => entrant.id === player.id),
    )
    .sort(compareMatches);

  if (matches.length === 0) {
    return <p className="py-4 text-xs text-text-muted">Матчей нет</p>;
  }

  return (
    <div className="flex flex-col">
      {matches.map((match) => (
        <PlayerHistoryRow
          key={match.id}
          snapshot={snapshot}
          player={player}
          match={match}
          view={view}
        />
      ))}
    </div>
  );
}

export default PlayerHistory;
