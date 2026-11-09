import PlayerAvatar from "@/components/shared/avatar.component";
import type { GroupStanding, Player } from "@/types/tournament";

function GroupStandings({
  standings,
  onOpenPlayer,
}: {
  standings: GroupStanding[];
  onOpenPlayer: (player: Player) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-70 border-collapse text-xs">
        <thead>
          <tr className="border-b border-border text-[10px] text-text-muted">
            <th className="w-7 py-1.5 pl-3 text-left font-normal">#</th>
            <th className="py-1.5 text-left font-normal">Игрок</th>
            <th className="w-8 text-center font-normal" title="Игры">
              И
            </th>
            <th className="w-8 text-center font-normal" title="Победы">
              В
            </th>
            <th className="w-8 text-center font-normal" title="Поражения">
              П
            </th>
            <th className="w-10 pr-3 text-center font-normal" title="Разница сетов">
              ±
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, index) => (
            <tr
              key={standing.player.id}
              className="border-b border-border/60 last:border-0 hover:bg-surface-hover/40"
            >
              <td className="py-1 pl-3 tabular-nums text-text-muted">{index + 1}</td>
              <td className="min-w-0 py-1">
                <button
                  type="button"
                  className="flex w-full min-w-0 items-center gap-2 text-left hover:cursor-pointer"
                  onClick={() => {
                    onOpenPlayer(standing.player);
                  }}
                  title={`История игрока ${standing.player.name}`}
                >
                  <PlayerAvatar player={standing.player} name={standing.player.name} size={18} />
                  <span className="truncate text-text-secondary">{standing.player.name}</span>
                  {standing.player.seed > 0 && (
                    <span className="shrink-0 text-[10px] tabular-nums text-text-muted">
                      #{standing.player.seed}
                    </span>
                  )}
                </button>
              </td>
              <td className="text-center tabular-nums text-text-muted">{standing.played}</td>
              <td className="text-center tabular-nums text-text-primary">{standing.wins}</td>
              <td className="text-center tabular-nums text-text-muted">{standing.losses}</td>
              <td className="pr-3 text-center tabular-nums text-text-secondary">
                {standing.scoreDifference > 0 ? "+" : ""}
                {standing.scoreDifference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GroupStandings;
