import type { OverlayState } from "@/types/overlay";
import type { TournamentSnapshot, TournamentSummary } from "@/types/tournament";

export type ActiveTournamentState = {
  snapshot: TournamentSnapshot | null;
  key: string | null;
  savedTournaments: TournamentSummary[];
  overlayState: OverlayState | null;
  isLoading: boolean;
  notFound: boolean;
  isEmpty: boolean;
  error: unknown;
  selectionError: unknown;
  selecting: boolean;
  isRefreshing: boolean;
  refreshError: unknown;
  lastUpdated: number | null;
};

export type ActiveTournamentActions = {
  selectTournament: (key: string | null) => void;
  retry: () => void;
  retrySelection: () => void;
  refresh: () => void;
};
