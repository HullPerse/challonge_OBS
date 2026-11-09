import { Eye } from "lucide-react";

import { CARD_HEIGHT, CARD_WIDTH } from "@/configs/bracket.config";

function HiddenBracket({
  left,
  top,
  height = CARD_HEIGHT,
  identifier,
  onRestore,
}: {
  left: number;
  top: number;
  height?: number;
  identifier: number | null;
  onRestore: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Вернуть скрытый матч ${identifier ?? ""}`}
      title="Вернуть матч"
      className="group absolute flex cursor-pointer items-center justify-center rounded-ui-lg border border-dashed border-transparent text-text-muted transition-colors hover:border-border-strong hover:bg-surface/10 focus-visible:border-accent focus-visible:outline-none"
      style={{ left, top, width: CARD_WIDTH, height }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={onRestore}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onRestore();
      }}
    >
      <span className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <Eye className="size-3" />
        <span className="text-[10px]">Вернуть</span>
      </span>
    </button>
  );
}

export default HiddenBracket;
