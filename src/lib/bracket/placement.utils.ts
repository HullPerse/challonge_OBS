import {
  CARD_GAP,
  CARD_HEIGHT,
  CARD_WIDTH,
  COLUMN_WIDTH,
  LOSERS_DROP_IN_ROUND,
  NUMBER_WIDTH,
  PADDING,
  ROOT_PITCH,
} from "@/configs/bracket.config";
import { indexByIdentifier, indexMatchesByIdentifier, matchesByRound } from "./graph.utils";
import type { BracketSection, PlacedMatch, RawPlacement } from "@/types/bracket";
import type { Match, Round } from "@/types/tournament";

const columnX = (column: number): number => {
  return NUMBER_WIDTH + PADDING + column * COLUMN_WIDTH;
};

const roundColumns = (rounds: readonly Round[]): Map<number, number> => {
  return new Map(rounds.map((round, index): [number, number] => [round.number, index]));
};

/** Keeps relative spacing and moves the topmost match to `contentTop`. */
const stackFromTop = (placements: readonly RawPlacement[], contentTop: number): PlacedMatch[] => {
  const top = Math.min(...placements.map((placement) => placement.y));

  return placements.map((placement) => ({
    match: placement.match,
    x: placement.x,
    y: contentTop + placement.y - top,
  }));
};

/** Walks rounds backwards and gives every feeder the parent slot it feeds. */
const assignFeederSlots = (
  buckets: Map<number, Match[]>,
  rounds: readonly Round[],
  slots: Map<number, number>,
  byIdentifier: Map<number, Match>,
) => {
  for (let index = rounds.length - 2; index >= 0; index -= 1) {
    const childRound = rounds.at(index);
    const parentRound = rounds.at(index + 1);
    if (!childRound || !parentRound) continue;

    for (const parent of buckets.get(parentRound.number) ?? []) {
      const parentSlot = slots.get(parent.id);
      if (parentSlot === undefined) continue;

      const feeders = [
        [parent.prereq1, 0],
        [parent.prereq2, 1],
      ] as const;

      for (const [identifier, offset] of feeders) {
        if (identifier === null) continue;

        const child = byIdentifier.get(identifier);
        if (!child || child.round !== childRound.number) continue;

        slots.set(child.id, parentSlot * 2 + offset);
      }
    }
  }
};

/** Places matches without a parent link into the first free slot. */
const fillEmptySlots = (
  buckets: Map<number, Match[]>,
  rounds: readonly Round[],
  slots: Map<number, number>,
) => {
  const used = new Set(slots.values());
  let nextSlot = 0;

  for (const round of rounds) {
    for (const match of buckets.get(round.number) ?? []) {
      if (slots.has(match.id)) continue;

      while (used.has(nextSlot)) nextSlot += 1;
      slots.set(match.id, nextSlot);
      used.add(nextSlot);
      nextSlot += 1;
    }
  }
};

/**
 * Seeds winners matches into a binary tree: the last round takes consecutive
 * slots, and every earlier match takes the slot of the parent it feeds.
 */
const seedWinnersSlots = (
  matches: readonly Match[],
  rounds: readonly Round[],
): Map<number, number> => {
  const slots = new Map<number, number>();
  const lastRound = rounds.at(-1);
  if (!lastRound) return slots;

  const buckets = matchesByRound(matches, rounds);
  const finalMatches = buckets.get(lastRound.number) ?? [];

  for (const [index, match] of finalMatches.entries()) {
    slots.set(match.id, index);
  }

  assignFeederSlots(buckets, rounds, slots, indexMatchesByIdentifier(matches));
  fillEmptySlots(buckets, rounds, slots);

  return slots;
};

export const placeWinners = (
  matches: readonly Match[],
  rounds: readonly Round[],
  contentTop: number,
): PlacedMatch[] => {
  if (matches.length === 0 || rounds.length === 0) return [];

  const slots = seedWinnersSlots(matches, rounds);
  const columns = roundColumns(rounds);

  const placements = matches.map((match): RawPlacement => {
    const column = columns.get(match.round) ?? 0;
    const slot = slots.get(match.id) ?? 0;
    const span = 2 ** column;

    return {
      match,
      x: columnX(column),
      y: ROOT_PITCH * (span * slot + (span - 1) / 2 - 0.5),
    };
  });

  return stackFromTop(placements, contentTop);
};

/**
 * Losers rows double their pitch every two rounds, which leaves room for
 * matches dropping in from the winners bracket.
 */
const rawLosersPlacements = (
  matches: readonly Match[],
  rounds: readonly Round[],
): RawPlacement[] => {
  const buckets = matchesByRound(matches, rounds);
  const columns = roundColumns(rounds);
  const placements: RawPlacement[] = [];

  for (const round of rounds) {
    const ordinal = Math.abs(round.number);
    const step = 2 ** Math.floor((ordinal - 1) / 2);
    const offset = step / 2 - (Math.floor(ordinal / 2) - 1) / 2;
    const x = columnX(columns.get(round.number) ?? 0);

    for (const [index, match] of (buckets.get(round.number) ?? []).entries()) {
      placements.push({ match, x, y: offset + step * index });
    }
  }

  return placements;
};

/**
 * A local feeder would otherwise sit a full pitch away from its round -2
 * parent; pull it next to the parent and leave the rest of the round alone.
 */
const attachLocalFeeders = (placed: readonly PlacedMatch[]): PlacedMatch[] => {
  const byIdentifier = indexByIdentifier(placed);
  const moved = new Map<number, number>();

  for (const parent of placed) {
    if (parent.match.round !== LOSERS_DROP_IN_ROUND) continue;

    const feeders = [
      [parent.match.prereq1, parent.match.prereq1IsLoser, -1],
      [parent.match.prereq2, parent.match.prereq2IsLoser, 1],
    ] as const;

    for (const [identifier, isLoser, direction] of feeders) {
      if (identifier === null || isLoser) continue;

      const feeder = byIdentifier.get(identifier);
      if (!feeder || feeder.match.round <= parent.match.round) continue;

      moved.set(feeder.match.id, parent.y + (direction * ROOT_PITCH) / 2);
    }
  }

  return placed.map((entry) => {
    const y = moved.get(entry.match.id);
    return y === undefined ? entry : { ...entry, y };
  });
};

export const placeLosers = (
  matches: readonly Match[],
  rounds: readonly Round[],
  contentTop: number,
): PlacedMatch[] => {
  if (matches.length === 0 || rounds.length === 0) return [];

  const placements = stackFromTop(rawLosersPlacements(matches, rounds), contentTop);

  return attachLocalFeeders(placements);
};

export const layoutFinalsSection = (
  matches: readonly Match[],
  sections: readonly BracketSection[],
): BracketSection | null => {
  if (matches.length === 0) return null;

  const winnersFinal =
    sections
      .find((section) => section.side === "winners")
      ?.matches.reduce<PlacedMatch | null>(
        (best, placed) => (!best || placed.match.round > best.match.round ? placed : best),
        null,
      ) ?? null;

  const ordered = [...matches].sort(
    (left, right) => left.round - right.round || left.order - right.order,
  );
  const main = ordered.find((match) => match.side === "finals") ?? ordered.at(0);
  if (!main) return null;

  const maxRight = Math.max(
    0,
    ...sections.flatMap((section) => section.matches.map((placed) => placed.x + CARD_WIDTH)),
  );
  const fallbackCenter =
    sections.length > 0
      ? sections.reduce((sum, section) => sum + section.top + section.height / 2, 0) /
        sections.length
      : 0;
  const x = winnersFinal ? winnersFinal.x + COLUMN_WIDTH : maxRight + CARD_GAP;
  const y = winnersFinal ? winnersFinal.y + ROOT_PITCH / 2 : fallbackCenter;
  const sequence = [main, ...ordered.filter((match) => match.id !== main.id)];
  const placed = sequence.map((match, index): PlacedMatch => ({
    match,
    x: x + index * COLUMN_WIDTH,
    y,
  }));

  return {
    side: "finals",
    top: 0,
    height: y + CARD_HEIGHT + PADDING,
    width: x + (sequence.length - 1) * COLUMN_WIDTH + CARD_WIDTH + PADDING,
    rounds: [],
    matches: placed,
  };
};
