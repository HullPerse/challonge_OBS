import { isEliminationTournament } from "@/configs/tournament.config";
import type { BracketResult } from "@/types/bracket";
import type { Match, TournamentSnapshot } from "@/types/tournament";

const latestWinner = (matches: readonly Match[]): Match | null => {
  return matches.reduce<Match | null>((best, match) => {
    if (match.winnerId === null) return best;
    if (!best) return match;
    if (match.round !== best.round) return match.round > best.round ? match : best;

    return match.order >= best.order ? match : best;
  }, null);
};

const findFinal = (snapshot: TournamentSnapshot): Match | null => {
  const maxWinnersRound = snapshot.matches.reduce(
    (max, match) => (match.side === "winners" ? Math.max(max, match.round) : max),
    0,
  );
  const finals = snapshot.matches.filter((match) => match.side === "finals");
  const candidates =
    finals.length > 0
      ? finals
      : snapshot.matches.filter(
          (match) => match.side === "winners" && match.round === maxWinnersRound,
        );
  const decision = latestWinner(candidates);
  if (!decision || decision.identifier === null) return decision;

  const reset = latestWinner(
    snapshot.matches.filter(
      (match) =>
        match.id !== decision.id &&
        match.prereq1 === decision.identifier &&
        match.prereq2 === decision.identifier,
    ),
  );

  return reset ?? decision;
};

/** Winner, runner-up and score of a completed tournament. */
export const tournamentResult = (snapshot: TournamentSnapshot): BracketResult | null => {
  if (snapshot.state !== "complete") return null;
  if (!isEliminationTournament(snapshot.tournamentType)) return null;

  const final = findFinal(snapshot);
  if (!final || final.winnerId === null) return null;

  const winnerIsFirst = final.player1?.id === final.winnerId;
  const sides = winnerIsFirst
    ? {
        winner: final.player1,
        loser: final.player2,
        winnerScore: final.score1,
        loserScore: final.score2,
      }
    : {
        winner: final.player2,
        loser: final.player1,
        winnerScore: final.score2,
        loserScore: final.score1,
      };
  const { winner, loser, winnerScore, loserScore } = sides;
  if (!winner) return null;
  const score =
    winnerScore !== null && loserScore !== null ? `${winnerScore} : ${loserScore}` : "-";

  return { winner, loser, score };
};
