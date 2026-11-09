import { cn } from "cn";

import MatchDetails from "@/components/match/details.match";
import PlayerAvatar from "@/components/shared/avatar.component";
import { useAppDialogView } from "@/hooks/useOverlayPreview.hook";
import { matchStateLabel } from "@/lib/bracket/match.utils";
import { matchTitle } from "@/lib/sidebar.utils";
import { modalStore } from "@/stores/modal.store";
import type { Match, Player, TournamentSnapshot } from "@/types/tournament";
import HistorySidebar from "@/pages/menu/components/sidebar/history.sidebar";
import GroupCard from "./card.group";

function GroupsBracket({
  snapshot,
  showBackground,
}: {
  snapshot: TournamentSnapshot;
  showBackground: boolean;
}) {
  const view = useAppDialogView(snapshot);
  const groups = snapshot.groups ?? [];

  const openMatch = (match: Match) => {
    modalStore.open({
      overlay: { kind: "match", matchId: match.id },
      title: matchTitle(snapshot, match, true),
      description: matchStateLabel(match.state),
      className: "w-lg",
      body: <MatchDetails match={match} view={view} />,
    });
  };

  const openPlayer = (player: Player) => {
    modalStore.open({
      overlay: { kind: "player", playerId: player.id },
      title: player.name,
      description: "Матчи игрока",
      className: "w-lg",
      leading: <PlayerAvatar player={player} name={player.name} size={36} />,
      body: <HistorySidebar snapshot={snapshot} player={player} />,
    });
  };

  if (groups.length === 0) {
    return <p className="p-4 text-xs text-text-muted">Групповая стадия не найдена</p>;
  }

  return (
    <div
      className={cn(
        "h-full w-full overflow-y-auto",
        showBackground ? "bg-bracket-bg" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-text-primary">Групповая стадия</h2>
            <p className="text-[11px] text-text-muted">{groups.length} групп | таблицы и матчи</p>
          </div>
        </header>

        <div className="grid gap-3 xl:grid-cols-2">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              snapshot={snapshot}
              group={group}
              onOpenMatch={openMatch}
              onOpenPlayer={openPlayer}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default GroupsBracket;
