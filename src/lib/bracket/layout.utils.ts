import {
  CARD_HEIGHT,
  CARD_WIDTH,
  COLUMN_WIDTH,
  CONTENT_OFFSET,
  NUMBER_WIDTH,
  PADDING,
  SECTION_GAP,
} from "@/configs/bracket.config";
import { buildConnectors } from "./connector.utils";
import { partitionMatches, sectionRounds } from "./graph.utils";
import { layoutFinalsSection, placeLosers, placeWinners } from "./placement.utils";
import type { BracketLayout, BracketSection, SectionSide } from "@/types/bracket";
import type { Match, Round, TournamentSnapshot } from "@/types/tournament";

const sectionWidth = (rounds: readonly Round[]): number => {
  return NUMBER_WIDTH + PADDING * 2 + Math.max(rounds.length, 1) * COLUMN_WIDTH;
};

const layoutSection = (
  side: SectionSide,
  matches: readonly Match[],
  rounds: readonly Round[],
  top: number,
): BracketSection => {
  const roundNumbers = new Set(matches.map((match) => match.round));
  const activeRounds = rounds.filter((round) => roundNumbers.has(round.number));
  const contentTop = top + CONTENT_OFFSET;
  const placed =
    side === "winners"
      ? placeWinners(matches, activeRounds, contentTop)
      : placeLosers(matches, activeRounds, contentTop);
  const maxBottom = Math.max(contentTop, ...placed.map((entry) => entry.y + CARD_HEIGHT));

  return {
    side,
    top,
    height: Math.max(maxBottom + PADDING - top, CONTENT_OFFSET + PADDING),
    width: sectionWidth(activeRounds),
    rounds: activeRounds,
    matches: placed,
  };
};

const buildBracketLayout = (snapshot: TournamentSnapshot): BracketLayout => {
  const matches = partitionMatches(snapshot);
  const winners = layoutSection("winners", matches.winners, sectionRounds(snapshot, "winners"), 0);
  const losers = layoutSection(
    "losers",
    matches.losers,
    sectionRounds(snapshot, "losers"),
    winners.top + winners.height + SECTION_GAP,
  );
  const sections: BracketSection[] = [winners, losers];
  const finals = layoutFinalsSection(matches.finals, sections);

  if (finals) sections.push(finals);

  return {
    width: Math.max(...sections.map((section) => section.width)),
    height: Math.max(...sections.map((section) => section.top + section.height)),
    sections,
    connectors: buildConnectors(sections),
  };
};

/** Width of a section header: its round columns without the trailing gap. */
export const sectionHeaderWidth = (section: BracketSection): number => {
  return section.width - COLUMN_WIDTH + CARD_WIDTH;
};

const layoutCache = new WeakMap<TournamentSnapshot, BracketLayout>();

/** Returns the layout for a snapshot object, computing it once. */
export const getBracketLayout = (snapshot: TournamentSnapshot): BracketLayout => {
  const cached = layoutCache.get(snapshot);
  if (cached) return cached;

  const layout = buildBracketLayout(snapshot);
  layoutCache.set(snapshot, layout);
  return layout;
};
