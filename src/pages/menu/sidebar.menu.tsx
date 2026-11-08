import { modalStore } from "@/stores/modal.store";
import type { Player, TournamentSnapshot } from "@/types/tournament";
import { useState } from "react";
import HistorySidebar from "./components/sidebar/history.sidebar";
import { Input } from "@/components/ui/input.component";
import Button from "@/components/ui/button.component";
import { X } from "lucide-react";
import ListSidebar from "./components/sidebar/list.sidebar";
import PlayerAvatar from "@/components/shared/avatar.component";

function SidebarMenu({ snapshot }: { snapshot: TournamentSnapshot }) {
  const [query, setQuery] = useState<string>("");

  const participants = snapshot.participants;
  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const filteredParticipants = normalizedQuery
    ? participants.filter(
        (participant) =>
          participant.name.toLocaleLowerCase("ru").includes(normalizedQuery) ||
          String(participant.seed) === normalizedQuery,
      )
    : participants;

  const openHistory = (player: Player) => {
    modalStore.open({
      overlay: { kind: "player", playerId: player.id },
      title: player.name,
      description: "Матчи игрока",
      className: "w-lg",
      leading: <PlayerAvatar player={player} name={player.name} size={36} />,
      body: <HistorySidebar snapshot={snapshot} player={player} />,
    });
  };

  return (
    <aside className="flex h-full w-70 flex-col border-r border-border bg-surface">
      {/* TOP */}
      <section className="flex flex-row gap-2 h-11 items-center justify-between border-b border-border px-3">
        <h2 className="text-xs font-medium text-text-secondary">Игроки</h2>
        <span className="text-[11px] tabular-nums text-text-muted">
          {normalizedQuery
            ? `${filteredParticipants.length} / ${participants.length}`
            : participants.length}
        </span>
      </section>

      {/* SEARCH */}
      <section className="p-2">
        <div className="relative">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Поиск игрока"
            aria-label="Поиск игрока"
            className="pr-8"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setQuery("");
              }}
              aria-label="Очистить поиск"
              className="absolute top-1/2 right-1 size-6 -translate-y-1/2"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </section>

      {/* PLAYERS */}
      <ListSidebar
        filtered={filteredParticipants}
        participants={participants}
        onPlayerClick={openHistory}
      />
    </aside>
  );
}

export default SidebarMenu;
