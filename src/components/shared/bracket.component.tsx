import FitBracketButton from "@/components/shared/fitBracket.button";
import RoundHeaderToggle from "@/components/shared/roundHeaderToggle.component";
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
        const style = {
          left: NUMBER_WIDTH + PADDING + index * COLUMN_WIDTH,
          width: CARD_WIDTH,
        };

        return (
          <RoundHeaderToggle
            key={round.number}
            title={round.title}
            hidden={hidden}
            className="absolute flex h-full items-center justify-center truncate px-2 text-center text-xs text-text-secondary"
            style={style}
            onToggle={
              onToggleRound &&
              (() => {
                onToggleRound(round.number);
              })
            }
          />
        );
      })}

      {onFit && <FitBracketButton onFit={onFit} />}
    </div>
  );
}

export default BracketSectionHeader;
