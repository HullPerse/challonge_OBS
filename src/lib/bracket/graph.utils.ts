import type { SectionMatches, SectionSide } from "@/types/bracket";
import type { Match, Round, TournamentSnapshot } from "@/types/tournament";

/**
 * Splits matches into bracket sections. A grand final reset has both
 * prerequisites pointing at the same finals match, so it counts as finals too.
 */
export const partitionMatches = (snapshot: TournamentSnapshot): SectionMatches => {
  const finalsIdentifiers = new Set<number>();

  for (const match of snapshot.matches) {
    if (match.side === "finals" && match.identifier !== null) {
      finalsIdentifiers.add(match.identifier);
    }
  }

  const sections: SectionMatches = { winners: [], losers: [], finals: [] };

  for (const match of snapshot.matches) {
    const isReset =
      match.prereq1 !== null &&
      match.prereq1 === match.prereq2 &&
      finalsIdentifiers.has(match.prereq1);

    if (match.side === "finals" || isReset) sections.finals.push(match);
    else if (match.round > 0) sections.winners.push(match);
    else if (match.round < 0) sections.losers.push(match);
  }

  return sections;
};

/** Rounds of one side ordered from the first played round to the final. */
export const sectionRounds = (snapshot: TournamentSnapshot, side: SectionSide): Round[] => {
  return snapshot.rounds
    .filter((round) => round.side === side)
    .sort((left, right) => left.order - right.order);
};

/** Round buckets with matches ordered by draw order, then id. */
export const matchesByRound = (
  matches: readonly Match[],
  rounds: readonly Round[],
): Map<number, Match[]> => {
  const buckets = new Map<number, Match[]>(
    rounds.map((round): [number, Match[]] => [round.number, []]),
  );

  for (const match of matches) {
    buckets.get(match.round)?.push(match);
  }

  for (const bucket of buckets.values()) {
    bucket.sort((left, right) => left.order - right.order || left.id - right.id);
  }

  return buckets;
};

/** Indexes matches by Challonge identifier, skipping matches without one. */
export const indexMatchesByIdentifier = (matches: readonly Match[]): Map<number, Match> => {
  const index = new Map<number, Match>();

  for (const match of matches) {
    if (match.identifier !== null) {
      index.set(match.identifier, match);
    }
  }

  return index;
};

/** Indexes placed matches by Challonge identifier, skipping matches without one. */
export const indexByIdentifier = <T extends { match: Match }>(
  placed: readonly T[],
): Map<number, T> => {
  const index = new Map<number, T>();

  for (const entry of placed) {
    if (entry.match.identifier !== null) {
      index.set(entry.match.identifier, entry);
    }
  }

  return index;
};
