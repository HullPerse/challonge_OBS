import type { CSSProperties } from "react";

import {
  CARD_WIDTH,
  CONTROL_CARD_VIEW,
  CONTROL_DIALOG_VIEW,
  MATCH_LABEL,
  MATCH_STATE_LABELS,
  PLAYER_PLACEHOLDER,
} from "@/configs/bracket.config";
import type { MatchCardView, MatchDialogView } from "@/types/bracket";
import type { OverlayModules } from "@/types/overlay";
import type { Match, MatchEntrant, Player, TournamentSnapshot } from "@/types/tournament";

export const playerName = (player: Player | null, placeholder: string | null): string => {
  return player?.name ?? placeholder ?? PLAYER_PLACEHOLDER;
};

export const matchStateLabel = (state: string): string => {
  return MATCH_STATE_LABELS[state] ?? state;
};

export const matchLabel = (match: Match, canHide: boolean): string => {
  return `${MATCH_LABEL} ${match.identifier ?? match.id}. Открыть детали.${canHide ? " Правый клик - скрыть." : ""}`;
};

export const cardStyle = (
  left: number,
  top: number,
  dimmed: boolean,
  height?: number,
): CSSProperties => {
  return {
    left,
    top,
    width: CARD_WIDTH,
    ...(height === undefined ? {} : { height }),
    opacity: dimmed ? 0.72 : 1,
    transition: "opacity 160ms ease",
  };
};

/** Free-for-all entrants ordered by final place when the match is complete. */
export const orderedEntrants = (match: Match): MatchEntrant[] => {
  const entrants = match.entrants ?? [];
  if (!entrants.some((entrant) => entrant.rank !== null)) return entrants;

  return [...entrants].sort(
    (left, right) =>
      (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER),
  );
};

/** Card features controlled by overlay modules, with snapshot hiding applied. */
export const overlayCardView = (
  modules: OverlayModules,
  snapshot: TournamentSnapshot,
): MatchCardView => {
  return {
    seeds: modules.seeds && !snapshot.hideSeeds,
    avatars: modules.avatars,
    scores: modules.scores,
    matchNumbers: modules.matchNumbers && !snapshot.hideIdentifiers,
    schedule: modules.schedule,
    stations: modules.stations,
    completedDim: modules.completedDim,
  };
};

/** Dialog fields controlled by overlay modules, with snapshot hiding applied. */
export const overlayDialogView = (
  modules: OverlayModules,
  snapshot: TournamentSnapshot,
): MatchDialogView => {
  return {
    seeds: modules.seeds && !snapshot.hideSeeds,
    avatars: modules.avatars,
    scores: modules.scores,
    matchNumbers: modules.matchNumbers && !snapshot.hideIdentifiers,
    schedule: modules.schedule,
    stations: modules.stations,
  };
};

/** Card fields for the control panel, optionally mirroring the overlay modules. */
export const appCardView = (
  previewInApp: boolean,
  modules: OverlayModules | null,
  snapshot: TournamentSnapshot | null,
): MatchCardView => {
  return previewInApp && modules && snapshot
    ? overlayCardView(modules, snapshot)
    : CONTROL_CARD_VIEW;
};

/** Dialog fields for the control panel, optionally mirroring the overlay modules. */
export const appDialogView = (
  previewInApp: boolean,
  modules: OverlayModules | null,
  snapshot: TournamentSnapshot | null,
): MatchDialogView => {
  return previewInApp && modules && snapshot
    ? overlayDialogView(modules, snapshot)
    : CONTROL_DIALOG_VIEW;
};

/** Which player row won, if the match has a recorded winner. */
export const winnerSide = (match: Match): "first" | "second" | null => {
  if (match.winnerId === null) return null;
  if (match.player1?.id === match.winnerId) return "first";
  if (match.player2?.id === match.winnerId) return "second";

  return null;
};
