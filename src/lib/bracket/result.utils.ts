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

  const final = findFinal(snapshot);
  if (!final || final.winnerId === null) return null;

  const winnerIsFirst = final.player1?.id === final.winnerId;
  const winner = winnerIsFirst ? final.player1 : final.player2;
  if (!winner) return null;

  const loser = winnerIsFirst ? final.player2 : final.player1;
  const winnerScore = winnerIsFirst ? final.score1 : final.score2;
  const loserScore = winnerIsFirst ? final.score2 : final.score1;
  const score =
    winnerScore !== null && loserScore !== null ? `${winnerScore} : ${loserScore}` : "-";

  return { winner, loser, score };
};
