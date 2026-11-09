import HiddenBracket from "@/components/bracket/hidden.bracket";
import MatchCard from "@/components/match/card.match";
import BracketSectionHeader from "@/components/shared/bracket.component";
import BracketRoundHeader from "@/components/shared/bracketRound.component";
import { SECTION_GAP } from "@/configs/bracket.config";
import { visibleConnectors } from "@/lib/bracket/visibility.utils";
import type { BracketLayout, BracketPoint, MatchCardView } from "@/types/bracket";
import type { Match } from "@/types/tournament";

function SceneBracket({
  layout,
  pan,
  zoom,
  hiddenMatches,
  hiddenRounds,
  activePlayerId,
  cardView,
  showRoundTitles,
  onToggleRound,
  onFit,
  onOpenMatch,
  onHideMatch,
  onRestoreMatch,
  onHighlightPlayer,
}: {
  layout: BracketLayout;
  pan: BracketPoint;
  zoom: number;
  hiddenMatches: ReadonlySet<number>;
  hiddenRounds: ReadonlySet<number>;
  activePlayerId: number | null;
  cardView: MatchCardView;
  showRoundTitles: boolean;
  onToggleRound?: (round: number) => void;
  onFit?: () => void;
  onOpenMatch?: (match: Match) => void;
  onHideMatch?: (matchId: number) => void;
  onRestoreMatch?: (matchId: number) => void;
  onHighlightPlayer?: (playerId: number | null) => void;
}) {
  const connectors = visibleConnectors(layout.connectors, {
    hiddenMatches,
    hiddenRounds,
  });
  const secondarySection = layout.sections.at(1);

  return (
    <div
      className="absolute top-0 left-0"
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px)`,
        transformOrigin: "0 0",
      }}
    >
      <div style={{ width: layout.width, height: layout.height, zoom }}>
        {showRoundTitles &&
          layout.sections.map((section) =>
            section.rounds.length > 0 ? (
              <BracketSectionHeader
                key={section.side}
                section={section}
                hiddenRounds={hiddenRounds}
                onToggleRound={onToggleRound}
                onFit={section.side === "winners" ? onFit : undefined}
              />
            ) : null,
          )}

        {showRoundTitles &&
          layout.roundRows?.map((row, index) => (
            <BracketRoundHeader
              key={row.round}
              round={row.round}
              title={row.title}
              top={row.top}
              width={layout.width}
              hidden={hiddenRounds.has(row.round)}
              onToggleRound={onToggleRound}
              onFit={index === 0 ? onFit : undefined}
            />
          ))}

        {secondarySection && (
          <div
            className="absolute left-0 h-px bg-border"
            style={{
              top: secondarySection.top - SECTION_GAP / 2,
              width: layout.width,
            }}
          />
        )}

        <svg
          className="pointer-events-none absolute top-0 left-0 stroke-bracket-line"
          width={layout.width}
          height={layout.height}
          shapeRendering="geometricPrecision"
          aria-hidden="true"
        >
          {connectors.map((connector) => (
            <path
              key={connector.id}
              d={connector.d}
              fill="none"
              strokeWidth={2}
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
          ))}
        </svg>

        {layout.sections.flatMap((section) =>
          section.matches.map((placed) => {
            if (hiddenRounds.has(placed.match.round)) return null;

            if (hiddenMatches.has(placed.match.id)) {
              if (!onRestoreMatch) return null;
              const restore = onRestoreMatch;

              return (
                <HiddenBracket
                  key={`hidden-${placed.match.id}`}
                  left={placed.x}
                  top={placed.y}
                  height={placed.height}
                  identifier={placed.match.identifier}
                  onRestore={() => {
                    restore(placed.match.id);
                  }}
                />
              );
            }

            return (
              <MatchCard
                key={placed.match.id}
                match={placed.match}
                left={placed.x}
                top={placed.y}
                height={placed.height}
                view={cardView}
                activePlayerId={activePlayerId}
                onHighlightPlayer={onHighlightPlayer}
                onOpen={
                  onOpenMatch
                    ? () => {
                        onOpenMatch(placed.match);
                      }
                    : undefined
                }
                onHide={
                  onHideMatch
                    ? () => {
                        onHideMatch(placed.match.id);
                      }
                    : undefined
                }
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

export default SceneBracket;
