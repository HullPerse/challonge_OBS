import PlayerHistory from "@/components/player/history.player";
import { useAppDialogView } from "@/hooks/useOverlayPreview.hook";
import type { Player, TournamentSnapshot } from "@/types/tournament";

function HistorySidebar({ snapshot, player }: { snapshot: TournamentSnapshot; player: Player }) {
  const view = useAppDialogView(snapshot);

  return <PlayerHistory snapshot={snapshot} player={player} view={view} />;
}

export default HistorySidebar;
