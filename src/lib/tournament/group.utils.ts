import type {
  GroupMatchRound,
  GroupStanding,
  Match,
  Player,
  TournamentGroup,
  TournamentSnapshot,
} from "@/types/tournament";

const emptyStanding = (player: Player): GroupStanding => ({
  player,
  played: 0,
  wins: 0,
  losses: 0,
  ties: 0,
  score: 0,
  scoreDifference: 0,
});

const applyMatch = (
  standings: Map<number, GroupStanding>,
  player: Player | null,
  score: number | null,
  opponentScore: number | null,
  outcome: "win" | "loss" | "tie",
): void => {
  if (!player) return;

  const standing = standings.get(player.id) ?? emptyStanding(player);
  const own = score ?? 0;
  const other = opponentScore ?? 0;

  standing.played += 1;
  standing.score += own;
  standing.scoreDifference += own - other;
  const outcomeFields = { win: "wins", loss: "losses", tie: "ties" } as const;
  standing[outcomeFields[outcome]] += 1;

  standings.set(player.id, standing);
};

/**
 * Builds group standings from match results. The order follows Challonge's
 * primary rules: match wins, then losses, then score difference.
 */
export const groupStandings = (group: TournamentGroup): GroupStanding[] => {
  const standings = new Map<number, GroupStanding>();

  for (const match of group.matches) {
    if (!match.player1 || !match.player2) continue;

    if (match.winnerId === null) {
      if (match.state !== "complete") continue;

      applyMatch(standings, match.player1, match.score1, match.score2, "tie");
      applyMatch(standings, match.player2, match.score2, match.score1, "tie");
      continue;
    }

    const firstWon = match.winnerId === match.player1.id;

    applyMatch(standings, match.player1, match.score1, match.score2, firstWon ? "win" : "loss");
    applyMatch(standings, match.player2, match.score2, match.score1, firstWon ? "loss" : "win");
  }

  return [...standings.values()].sort(
    (left, right) =>
      right.wins - left.wins ||
      left.losses - right.losses ||
      right.scoreDifference - left.scoreDifference ||
      right.score - left.score ||
      (left.player.seed || Number.MAX_SAFE_INTEGER) -
        (right.player.seed || Number.MAX_SAFE_INTEGER) ||
      left.player.name.localeCompare(right.player.name),
  );
};

/** Groups matches by their Challonge round number, in order. */
export const groupMatchRounds = (group: TournamentGroup): GroupMatchRound[] => {
  const rounds = new Map<number, Match[]>();

  for (const match of group.matches) {
    const bucket = rounds.get(match.round);

    if (bucket) bucket.push(match);
    else rounds.set(match.round, [match]);
  }

  return [...rounds.entries()]
    .sort(([left], [right]) => left - right)
    .map(([round, matches]) => ({
      round,
      matches: [...matches].sort((left, right) => left.order - right.order || left.id - right.id),
    }));
};

/** Every match in the snapshot, including nested group-stage matches. */
export const snapshotMatches = (snapshot: TournamentSnapshot): Match[] => {
  return [...(snapshot.groups ?? []).flatMap((group) => group.matches), ...snapshot.matches];
};
