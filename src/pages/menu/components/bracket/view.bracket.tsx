import { useCell } from "@hullperse/hp_utils/react";
import { Layers, Trophy } from "lucide-react";

import Button from "@/components/ui/button.component";
import { DEFAULT_VIEW } from "@/configs/overlay.config";
import { bracketStore } from "@/stores/bracket.store";
import type { BracketTableView, MatchCardView } from "@/types/bracket";
import type { OverlayPointer, OverlayState, OverlayView } from "@/types/overlay";
import type { TournamentSnapshot } from "@/types/tournament";
import ControlBracket from "./control.bracket";
import GroupsBracket from "./groups.bracket";
import ResultBracket from "./result.bracket";

function BracketView({
  snapshot,
  overlayState,
  cardView,
  showRoundTitles,
  showBackground,
  onViewChange,
  onPointerChange,
}: {
  snapshot: TournamentSnapshot;
  overlayState: OverlayState | null;
  cardView: MatchCardView;
  showRoundTitles: boolean;
  showBackground: boolean;
  onViewChange: (view: OverlayView) => void;
  onPointerChange: (pointer: OverlayPointer) => void;
}) {
  const hasGroups = (snapshot.groups?.length ?? 0) > 0;
  const initialView: BracketTableView = snapshot.matches.length === 0 ? "groups" : "bracket";
  const tableViews = useCell(bracketStore.tableViewByKey);
  const tableView = tableViews[snapshot.key] ?? initialView;
  const showGroups = hasGroups && tableView === "groups";

  const selectView = (view: BracketTableView) => {
    bracketStore.tableViewByKey.update((previous) => ({
      ...previous,
      [snapshot.key]: view,
    }));
  };

  return (
    <div className="flex h-full w-full flex-col">
      <ResultBracket snapshot={snapshot} />

      {hasGroups && (
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-2 py-1.5">
          <Button
            size="sm"
            variant={showGroups ? "ghost" : "secondary"}
            onClick={() => {
              selectView("bracket");
            }}
          >
            <Trophy className="size-3.5" />
            Плейофф
          </Button>
          <Button
            size="sm"
            variant={showGroups ? "secondary" : "ghost"}
            onClick={() => {
              selectView("groups");
            }}
          >
            <Layers className="size-3.5" />
            Группы
            <span className="tabular-nums text-text-muted">{snapshot.groups?.length}</span>
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1">
        {showGroups ? (
          <GroupsBracket snapshot={snapshot} showBackground={showBackground} />
        ) : (
          <ControlBracket
            key={snapshot.key}
            snapshot={snapshot}
            sceneView={overlayState?.view ?? DEFAULT_VIEW}
            cardView={cardView}
            showRoundTitles={showRoundTitles}
            showBackground={showBackground}
            onViewChange={onViewChange}
            onPointerChange={onPointerChange}
          />
        )}
      </div>
    </div>
  );
}

export default BracketView;
