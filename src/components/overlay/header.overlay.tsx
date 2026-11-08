import ImageComponent from "@/components/ui/image.component";
import { ORGANIZATOR_NAME } from "@/configs/tournament.config";
import type { OverlayScene } from "@/types/overlay";
import LiveBadge from "./live.overlay";

function OverlayHeader({ scene }: { scene: OverlayScene | null }) {
  const snapshot = scene?.tournament;
  if (!snapshot) return null;

  const showHeader = scene.state.modules.header;
  const showLiveBadge = scene.state.modules.liveBadge;

  if (!showHeader) {
    if (!showLiveBadge) return null;

    return (
      <div className="absolute top-7 left-7 z-10">
        <LiveBadge />
      </div>
    );
  }

  return (
    <header className="absolute top-7 left-7 z-10 flex w-70 items-center gap-3 rounded-ui border border-black/30 bg-surface-panel px-3 py-2.5">
      <span className="flex size-9 shrink-0 overflow-hidden rounded-ui border border-black/25">
        <ImageComponent src="/podpivasgaming.png" alt="" className="h-full w-full" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-text-primary">{snapshot.name}</h2>
          {showLiveBadge && <LiveBadge />}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-text-muted">
          <span className="truncate">{snapshot.tournamentType}</span>
          <span aria-hidden="true" className="text-border-strong">
            |
          </span>
          <span className="shrink-0 text-accent">{ORGANIZATOR_NAME}</span>
        </div>
      </div>
    </header>
  );
}

export default OverlayHeader;
