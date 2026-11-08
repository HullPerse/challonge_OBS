import PlayerAvatar from "@/components/shared/avatar.component";
import MatchDetails from "@/components/match/details.match";
import PlayerHistory from "@/components/player/history.player";
import Button from "@/components/ui/button.component";
import OverlayDialogFrame from "@/components/overlay/frame.overlay";
import { matchStateLabel, overlayDialogView } from "@/lib/bracket/match.utils";
import { roundTitle } from "@/lib/sidebar.utils";
import type { OverlayScene } from "@/types/overlay";

function OverlayDialog({ scene }: { scene: OverlayScene | null }) {
  const modal = scene?.state.modal ?? null;
  const snapshot = scene?.tournament ?? null;

  if (!scene || !modal || !snapshot) return null;

  const view = overlayDialogView(scene.state.modules, snapshot);

  if (modal.kind === "match") {
    const match = snapshot.matches.find((item) => item.id === modal.matchId);
    if (!match) return null;

    const title = view.matchNumbers ? `Матч ${match.identifier ?? match.id}` : "Матч";

    return (
      <OverlayDialogFrame
        title={title}
        description={`${roundTitle(snapshot, match.round)} | ${matchStateLabel(match.state)}`}
      >
        <MatchDetails match={match} view={view} />
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
          <Button
            variant="secondary"
            className="invisible ml-auto"
            tabIndex={-1}
            aria-hidden="true"
          >
            Скрыть матч
          </Button>
        </div>
      </OverlayDialogFrame>
    );
  }

  const player = snapshot.participants.find((item) => item.id === modal.playerId);
  if (!player) return null;

  return (
    <OverlayDialogFrame
      title={player.name}
      description="Матчи игрока"
      leading={
        view.avatars ? <PlayerAvatar player={player} name={player.name} size={36} /> : undefined
      }
    >
      <PlayerHistory snapshot={snapshot} player={player} view={view} />
    </OverlayDialogFrame>
  );
}

export default OverlayDialog;
