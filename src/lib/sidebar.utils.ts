import { FREE_FOR_ALL_LABEL, MATCH_LABEL, ROUND_LABEL } from "@/configs/bracket.config";
import { SIDE_ORDER } from "@/configs/tournament.config";
import type { Match, TournamentSnapshot } from "@/types/tournament";

export const roundTitle = (snapshot: TournamentSnapshot, round: number): string => {
  const title = snapshot.rounds.find((item) => item.number === round)?.title;

  if (!title) return `${ROUND_LABEL} ${Math.abs(round)}`;
  return title;
};

export const matchResult = (match: Match, playerId: number): string => {
  const entrant = match.entrants?.find((item) => item.id === playerId);

  if (entrant) {
    if (entrant.rank === null) return "Не сыгран";
    return entrant.rank === 1 ? "Победа" : `Место ${entrant.rank}`;
  }

  if (match.winnerId === null) return "Не сыгран";

  if (match.winnerId !== playerId) return "Поражение";
  return "Победа";
};

export const compareMatches = (left: Match, right: Match): number => {
  return (
    Number(left.group === undefined) - Number(right.group === undefined) ||
    (left.group ?? "").localeCompare(right.group ?? "") ||
    SIDE_ORDER[left.side] - SIDE_ORDER[right.side] ||
    Math.abs(left.round) - Math.abs(right.round) ||
    left.order - right.order
  );
};

export const matchWon = (match: Match, playerId: number): boolean => {
  if (match.winnerId === playerId) return true;

  return match.entrants?.some((entrant) => entrant.id === playerId && entrant.rank === 1) ?? false;
};

export const matchSides = (match: Match, playerId: number) => {
  const entrant = match.entrants?.find((item) => item.id === playerId);

  if (entrant) {
    return {
      opponent: null,
      placeholder: `${FREE_FOR_ALL_LABEL} | ${String(match.entrants?.length ?? 0)} участников`,
      playerScore: entrant.score,
      opponentScore: null,
      isFfa: true,
    };
  }

  const isFirst = match.player1?.id === playerId;
  const sides = isFirst
    ? {
        opponent: match.player2,
        placeholder: match.placeholder2,
        playerScore: match.score1,
        opponentScore: match.score2,
      }
    : {
        opponent: match.player1,
        placeholder: match.placeholder1,
        playerScore: match.score2,
        opponentScore: match.score1,
      };

  return { ...sides, isFfa: false };
};

export const matchTitle = (
  snapshot: TournamentSnapshot,
  match: Match,
  showNumber: boolean,
): string => {
  const round = roundTitle(snapshot, match.round);
  const stage = match.group ? `${match.group} | ${round}` : round;
  if (!showNumber) return stage;

  return `${stage} | ${MATCH_LABEL} ${match.identifier ?? match.id}`;
};
