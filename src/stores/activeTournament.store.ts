import { createSignalStore } from "@hullperse/hp_utils/signal";

import type { ActiveTournamentActions, ActiveTournamentState } from "@/types/activeTournament";

const store = createSignalStore();

const INITIAL_STATE: ActiveTournamentState = {
  snapshot: null,
  key: null,
  savedTournaments: [],
  overlayState: null,
  isLoading: true,
  notFound: false,
  isEmpty: false,
  error: null,
  selectionError: null,
  selecting: false,
  isRefreshing: false,
  refreshError: null,
  lastUpdated: null,
};

const state = store.atom<ActiveTournamentState>("activeTournament", INITIAL_STATE);
const actions = store.atom<ActiveTournamentActions | null>("activeTournamentActions", null);

export const activeTournamentActions: ActiveTournamentActions = {
  selectTournament: (key: string | null) => actions.get()?.selectTournament(key),
  retry: () => actions.get()?.retry(),
  retrySelection: () => actions.get()?.retrySelection(),
  refresh: () => actions.get()?.refresh(),
};

export const activeTournamentStore = {
  state,
  setState: state.set,
  setActions: actions.set,
};
