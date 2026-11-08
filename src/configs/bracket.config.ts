import type { MatchCardView, MatchDialogView } from "@/types/bracket";

/** Bracket card size and horizontal spacing, in px. */
export const CARD_WIDTH = 200;
export const CARD_HEIGHT = 45;
export const CARD_GAP = 96;
export const COLUMN_WIDTH = CARD_WIDTH + CARD_GAP;
/** Vertical pitch between adjacent bracket slots, in px. */
export const ROOT_PITCH = 79;
/** Section header height, gaps and padding, in px. */
export const HEADER_HEIGHT = 32;
const HEADER_CONTENT_GAP = 28;
export const SECTION_GAP = 30;
export const NUMBER_WIDTH = 22;
export const PADDING = 12;
export const CONTENT_OFFSET = HEADER_HEIGHT + HEADER_CONTENT_GAP;

/** Card features always visible in the control panel. */
export const CONTROL_CARD_VIEW: MatchCardView = {
  seeds: true,
  avatars: true,
  scores: true,
  matchNumbers: true,
  schedule: true,
  stations: false,
  completedDim: false,
};

/** Detail fields always visible in the control panel. */
export const CONTROL_DIALOG_VIEW: MatchDialogView = {
  seeds: true,
  avatars: true,
  scores: true,
  matchNumbers: true,
  schedule: true,
  stations: true,
};

/** First losers round that receives drop-ins from the winners bracket. */
export const LOSERS_DROP_IN_ROUND = -2;

/** Bracket camera limits and steps. */
export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 3;
export const WHEEL_ZOOM_FACTOR = 1.1;
export const FIT_PADDING = 32;
export const FIT_MAX_ZOOM = 1.15;

/** Elements that switch the mirrored OBS cursor to a link. */
export const INTERACTIVE_SELECTOR =
  "button, a, input, select, textarea, [role='button'], [data-cursor='link']";

/** Slot label before a player is known. */
export const PLAYER_PLACEHOLDER = "TBD";
export const STATION_PREFIX = "Стол";

/** Challonge match state labels. Unknown states fall back to the raw value. */
export const MATCH_STATE_LABELS: Record<string, string> = {
  complete: "Завершён",
  open: "Ожидает",
  pending: "Ожидает",
  underway: "Идёт",
};
