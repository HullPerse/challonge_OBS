import PlayerAvatar from "@/components/shared/avatar.component";
import Button from "@/components/ui/button.component";
import { bracketStore } from "@/stores/bracket.store";
import type { Player } from "@/types/tournament";

function ListSidebar({
  filtered,
  participants,
  onPlayerClick,
}: {
  filtered: Player[];
  participants: Player[];
  onPlayerClick: (player: Player) => void;
}) {
  if (filtered.length === 0) {
    const getText = () => {
      if (participants.length === 0) return "Список игроков пока пуст";
      return "Игрок не найден.";
    };

    return <p className="px-2 py-3 text-xs text-text-muted">{getText()}</p>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-2 pb-2 gap-1">
      {filtered.map((player) => (
        <Button
          key={player.id}
          variant="ghost"
          className="flex w-full cursor-pointer px-2 py-1 text-left transition-colors items-center rounded-ui border-border border"
          onClick={() => {
            onPlayerClick(player);
          }}
          onPointerEnter={() => {
            bracketStore.highlightedPlayerId.set(player.id);
          }}
          onPointerLeave={() => {
            bracketStore.highlightedPlayerId.set(null);
          }}
        >
          <span className="w-4 shrink-0 text-center text-[10px] tabular-nums text-text-muted">
            {player.seed > 0 ? player.seed : "-"}
          </span>
          <PlayerAvatar player={player} name={player.name} size={22} />
          <span className="flex-1 truncate text-xs text-text-secondary group-hover:text-text-primary">
            {player.name}
          </span>
        </Button>
      ))}
    </div>
  );
}

export default ListSidebar;
