import { Maximize2 } from "lucide-react";
import { cn } from "cn";

import Button from "@/components/ui/button.component";
import {
  CARD_GAP,
  CARD_WIDTH,
  COLUMN_WIDTH,
  HEADER_HEIGHT,
  NUMBER_WIDTH,
  PADDING,
} from "@/configs/bracket.config";
import { sectionHeaderWidth } from "@/lib/bracket/layout.utils";
import type { BracketSection } from "@/types/bracket";

function BracketSectionHeader({
  section,
  hiddenRounds,
  onToggleRound,
  onFit,
}: {
  section: BracketSection;
  hiddenRounds?: ReadonlySet<number>;
  onToggleRound?: (round: number) => void;
  onFit?: () => void;
}) {
  const headerWidth = sectionHeaderWidth(section) + (onFit ? CARD_GAP : 0);

  return (
    <div
      className="absolute left-0 flex items-center bg-bracket-header"
      style={{
        top: section.top,
        width: headerWidth,
        height: HEADER_HEIGHT,
        zIndex: 2,
      }}
      onPointerDown={(event) => {
        if (onToggleRound) event.stopPropagation();
      }}
    >
      <span
        className="shrink-0 text-center text-[10px] font-medium text-text-muted"
        style={{ width: NUMBER_WIDTH }}
      >
        {section.side === "winners" ? "W" : "L"}
      </span>

      {section.rounds.map((round, index) => {
        const hidden = hiddenRounds?.has(round.number) ?? false;
        const className = cn(
          "absolute flex h-full items-center justify-center truncate px-2 text-center text-xs text-text-secondary",
          hidden && "line-through opacity-40",
        );
        const style = {
          left: NUMBER_WIDTH + PADDING + index * COLUMN_WIDTH,
          width: CARD_WIDTH,
        };

        if (!onToggleRound) {
          return (
            <span key={round.number} className={className} style={style}>
              {round.title}
            </span>
          );
        }

        return (
          <button
            key={round.number}
            type="button"
            aria-pressed={!hidden}
            aria-label={`${round.title}. ${hidden ? "Показать раунд" : "Скрыть раунд"}`}
            onClick={() => {
              onToggleRound(round.number);
            }}
            className={cn(
              className,
              "transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent",
            )}
            style={style}
            title={hidden ? "Показать раунд" : "Скрыть раунд"}
          >
            {round.title}
          </button>
        );
      })}

      {onFit && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onFit}
          className="absolute top-0 right-0 h-full gap-1.5 rounded-none border-y-0 border-r-0 border-l border-border-strong bg-surface-panel px-2 text-[11px] text-text-primary hover:bg-surface-hover"
          style={{ width: CARD_GAP }}
          title="Вписать всю сетку"
        >
          <Maximize2 className="size-3.5" />
          Вся сетка
        </Button>
      )}
    </div>
  );
}

export default BracketSectionHeader;
