import { SIDE_ORDER } from "@/configs/tournament.config";
import type { Match, TournamentSnapshot } from "@/types/tournament";

export const roundTitle = (snapshot: TournamentSnapshot, round: number): string => {
  const title = snapshot.rounds.find((item) => item.number === round)?.title;

  if (!title) return `Раунд ${Math.abs(round)}`;
  return title;
};

export const matchResult = (match: Match, playerId: number): string => {
  if (match.winnerId === null) return "Не сыгран";

  if (match.winnerId !== playerId) return "Поражение";
  return "Победа";
};

export const compareMatches = (left: Match, right: Match): number => {
  return (
    SIDE_ORDER[left.side] - SIDE_ORDER[right.side] ||
    left.round - right.round ||
    left.order - right.order
  );
};

export const matchSides = (match: Match, playerId: number) => {
  const isFirst = match.player1?.id === playerId;

  return {
    opponent: isFirst ? match.player2 : match.player1,
    placeholder: isFirst ? match.placeholder2 : match.placeholder1,
    playerScore: isFirst ? match.score1 : match.score2,
    opponentScore: isFirst ? match.score2 : match.score1,
  };
};

export const matchTitle = (
  snapshot: TournamentSnapshot,
  match: Match,
  showNumber: boolean,
): string => {
  const round = roundTitle(snapshot, match.round);
  if (!showNumber) return round;

  return `${round} | Матч ${match.identifier ?? match.id}`;
};
