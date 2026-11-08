import type {
  Match,
  MatchIdentity,
  MatchMetadata,
  MatchParticipants,
  Player,
  RawMatch,
  RawPlayer,
  RawStore,
  Round,
  RoundSide,
} from "@/types/tournament";

/** Challonge encodes losers rounds as negative numbers. */
const sideOfRound = (round: number): RoundSide => {
  return round > 0 ? "winners" : "losers";
};

/** Fallback title for a round missing from the store. */
const defaultRoundTitle = (round: number): string => {
  return round > 0 ? `Round ${round}` : `Losers Round ${Math.abs(round)}`;
};

/** Seeds are 1-based; unseeded players sort last. */
const seedRank = (player: Player): number => {
  return player.seed > 0 ? player.seed : Number.MAX_SAFE_INTEGER;
};

const toPlayer = (raw: RawPlayer | null | undefined): Player | null => {
  if (!raw) return null;

  return {
    id: raw.id,
    seed: raw.seed ?? 0,
    name: raw.display_name,
    avatar: raw.portrait_url ?? null,
  };
};

const toMatchIdentity = (raw: RawMatch, order: number, fallbackId: number): MatchIdentity => {
  return {
    id: raw.id ?? fallbackId,
    identifier: raw.identifier ?? null,
    rawIdentifier: raw.raw_identifier ?? null,
    round: raw.round,
    side: sideOfRound(raw.round),
    order,
    state: raw.state,
  };
};

const toMatchParticipants = (raw: RawMatch): MatchParticipants => {
  return {
    player1: toPlayer(raw.player1),
    player2: toPlayer(raw.player2),
    placeholder1: raw.player1_placeholder_text ?? null,
    placeholder2: raw.player2_placeholder_text ?? null,
    score1: raw.scores?.[0] ?? null,
    score2: raw.scores?.[1] ?? null,
    winnerId: raw.winner_id ?? null,
    loserId: raw.loser_id ?? null,
  };
};

const toMatchMetadata = (raw: RawMatch): MatchMetadata => {
  return {
    scheduledTime: raw.scheduled_time ?? null,
    station: raw.station == null ? null : String(raw.station),
    prereq1: raw.player1_prereq_identifier ?? null,
    prereq2: raw.player2_prereq_identifier ?? null,
    prereq1IsLoser: raw.player1_is_prereq_match_loser ?? false,
    prereq2IsLoser: raw.player2_is_prereq_match_loser ?? false,
    md5: raw.md5 ?? null,
  };
};

const toMatch = (raw: RawMatch, order: number, fallbackId: number): Match => {
  return {
    ...toMatchIdentity(raw, order, fallbackId),
    ...toMatchParticipants(raw),
    ...toMatchMetadata(raw),
  };
};

/** Marks matches fed by both a winners and a losers match as the `finals` side. Mutates `matches`. */
const resolveFinalMatches = (matches: Match[]): void => {
  const byIdentifier = new Map<number, Match>();

  for (const match of matches) {
    if (match.identifier !== null) {
      byIdentifier.set(match.identifier, match);
    }
  }

  for (const match of matches) {
    if (match.round <= 0) continue;

    const first = match.prereq1 === null ? undefined : byIdentifier.get(match.prereq1);

    const second = match.prereq2 === null ? undefined : byIdentifier.get(match.prereq2);

    const hasWinner = [first, second].some((prerequisite) => prerequisite?.side === "winners");

    const hasLoser = [first, second].some((prerequisite) => prerequisite?.side === "losers");

    if (hasWinner && hasLoser) {
      match.side = "finals";
    }
  }
};

/** Flattens the store's rounds into matches in store order and resolves the `finals` side. */
export const toMatches = (store: RawStore): Match[] => {
  const matches = Object.values(store.matches_by_round)
    .flat()
    .map((match, index) => toMatch(match, index, -index - 1));

  resolveFinalMatches(matches);
  return matches;
};

/** Builds round metadata from the store, appending rounds only present in matches. */
export const toRounds = (rawRounds: RawStore["rounds"], matches: Match[]): Round[] => {
  const rounds: Round[] = rawRounds
    .map((round) => ({
      number: round.number,
      title: round.title,
      side: sideOfRound(round.number),
      order: Math.abs(round.number),
    }))
    .sort((left, right) => {
      if (left.side !== right.side) {
        return left.side === "winners" ? -1 : 1;
      }

      return left.order - right.order;
    });

  const existingRounds = new Set(rounds.map(({ number }) => number));

  for (const roundNumber of new Set(matches.map(({ round }) => round))) {
    if (existingRounds.has(roundNumber)) continue;

    rounds.push({
      number: roundNumber,
      title: defaultRoundTitle(roundNumber),
      side: sideOfRound(roundNumber),
      order: Math.abs(roundNumber),
    });

    existingRounds.add(roundNumber);
  }

  return rounds;
};

/** Collects unique players from the store and matches, sorted by seed then name. */
export const collectParticipants = (
  rawParticipants: RawStore["participants"],
  matches: Match[],
): Player[] => {
  const participants = new Map<number, Player>();

  for (const raw of rawParticipants ?? []) {
    const participant = toPlayer(raw);
    if (participant) participants.set(participant.id, participant);
  }

  for (const match of matches) {
    for (const participant of [match.player1, match.player2]) {
      if (participant) participants.set(participant.id, participant);
    }
  }

  return [...participants.values()].sort(
    (left, right) => seedRank(left) - seedRank(right) || left.name.localeCompare(right.name),
  );
};
