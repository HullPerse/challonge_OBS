import FitBracketButton from "@/components/shared/fitBracket.button";
import RoundHeaderToggle from "@/components/shared/roundHeaderToggle.component";
import { HEADER_HEIGHT, NUMBER_WIDTH, PADDING } from "@/configs/bracket.config";

/** Round title above a row of the non-elimination layout. */
function BracketRoundHeader({
  round,
  title,
  top,
  width,
  hidden,
  onToggleRound,
  onFit,
}: {
  round: number;
  title: string;
  top: number;
  width: number;
  hidden: boolean;
  onToggleRound?: (round: number) => void;
  onFit?: () => void;
}) {
  const style = { left: NUMBER_WIDTH + PADDING, height: HEADER_HEIGHT };

  return (
    <div className="absolute left-0" style={{ top, width, height: HEADER_HEIGHT, zIndex: 2 }}>
      <RoundHeaderToggle
        title={title}
        hidden={hidden}
        className="absolute flex h-full items-center rounded-ui px-2 text-xs text-text-secondary"
        style={style}
        onToggle={
          onToggleRound &&
          (() => {
            onToggleRound(round);
          })
        }
      />

      {onFit && <FitBracketButton onFit={onFit} />}
    </div>
  );
}

export default BracketRoundHeader;
