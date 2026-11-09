import {
  CARD_HEIGHT,
  CARD_WIDTH,
  COLUMN_WIDTH,
  CONTENT_OFFSET,
  ENTRANT_ROW_HEIGHT,
  MATCH_ROW_GAP,
  NUMBER_WIDTH,
  PADDING,
  ROUND_COLUMNS,
  SECTION_GAP,
} from "@/configs/bracket.config";
import { isEliminationTournament } from "@/configs/tournament.config";
import { buildConnectors } from "./connector.utils";
import { partitionMatches, sectionRounds } from "./graph.utils";
import { layoutFinalsSection, placeLosers, placeWinners } from "./placement.utils";
import type {
  BracketLayout,
  BracketRoundRow,
  BracketSection,
  PlacedMatch,
  SectionSide,
} from "@/types/bracket";
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

/** Height of one card: free-for-all cards grow with their entrant list. */
const matchCardHeight = (match: Match): number => {
  const entrants = match.entrants?.length ?? 0;

  return entrants > 0 ? entrants * ENTRANT_ROW_HEIGHT : CARD_HEIGHT;
};

/**
 * Swiss, round-robin and free-for-all tournaments are not elimination trees:
 * matches of a round follow draw order, wrap into up to ROUND_COLUMNS columns
 * (Challonge's SchedulePlotter does the same), and there are no connectors.
 */
const buildRoundRowsLayout = (snapshot: TournamentSnapshot): BracketLayout => {
  const roundTitles = new Map(snapshot.rounds.map((round) => [round.number, round.title]));
  const matchesByRoundNumber = new Map<number, Match[]>();

  for (const match of snapshot.matches) {
    const bucket = matchesByRoundNumber.get(match.round);

    if (bucket) bucket.push(match);
    else matchesByRoundNumber.set(match.round, [match]);
  }

  const roundNumbers = [...matchesByRoundNumber.keys()].sort((left, right) => left - right);
  const roundColumnCount = (matches: readonly Match[]): number => {
    return Math.max(1, Math.min(matches.length, ROUND_COLUMNS));
  };
  const maxColumns = Math.max(
    1,
    ...[...matchesByRoundNumber.values()].map((matches) => roundColumnCount(matches)),
  );
  const width = NUMBER_WIDTH + PADDING * 2 + maxColumns * COLUMN_WIDTH;
  const roundRows: BracketRoundRow[] = [];
  const placed: PlacedMatch[] = [];
  let top = 0;

  for (const roundNumber of roundNumbers) {
    const matches = [...(matchesByRoundNumber.get(roundNumber) ?? [])].sort(
      (left, right) => left.order - right.order || left.id - right.id,
    );
    const columns = roundColumnCount(matches);
    const rowHeights = new Map<number, number>();

    for (const [index, match] of matches.entries()) {
      const row = Math.floor(index / columns);
      rowHeights.set(row, Math.max(rowHeights.get(row) ?? 0, matchCardHeight(match)));
    }

    roundRows.push({
      round: roundNumber,
      title: roundTitles.get(roundNumber) ?? `Round ${roundNumber}`,
      top,
    });

    const rowTops = new Map<number, number>();
    let rowTop = top + CONTENT_OFFSET;

    const rows = [...rowHeights.entries()].sort((left, right) => left[0] - right[0]);

    for (const [row, rowHeight] of rows) {
      rowTops.set(row, rowTop);
      rowTop += Math.max(CARD_HEIGHT, rowHeight) + MATCH_ROW_GAP;
    }

    for (const [index, match] of matches.entries()) {
      const height = matchCardHeight(match);
      const column = index % columns;
      const row = Math.floor(index / columns);

      placed.push({
        match,
        x: NUMBER_WIDTH + PADDING + column * COLUMN_WIDTH,
        y: rowTops.get(row) ?? top + CONTENT_OFFSET,
        ...(height === CARD_HEIGHT ? {} : { height }),
      });
    }

    const contentHeight = rowTop - top - CONTENT_OFFSET - MATCH_ROW_GAP;

    top += CONTENT_OFFSET + Math.max(CARD_HEIGHT, contentHeight) + SECTION_GAP;
  }

  const height = roundNumbers.length === 0 ? PADDING * 2 : top - SECTION_GAP + PADDING;
  const sections: BracketSection[] =
    placed.length === 0
      ? []
      : [{ side: "rounds", top: 0, height, width, rounds: [], matches: placed }];

  return { width, height, sections, connectors: [], roundRows };
};

const buildBracketLayout = (snapshot: TournamentSnapshot): BracketLayout => {
  if (!isEliminationTournament(snapshot.tournamentType)) return buildRoundRowsLayout(snapshot);

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
