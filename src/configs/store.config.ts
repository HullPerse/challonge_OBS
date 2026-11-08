import type { TournamentVisibility } from "@/types/tournament";

export const EMPTY_VISIBILITY: TournamentVisibility = {
  hiddenMatches: [],
  hiddenRounds: [],
};

/** Delay before a burst of visibility toggles becomes one request. */
export const VISIBILITY_WRITE_DELAY_MS = 180;
