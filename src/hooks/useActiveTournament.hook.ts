import { useCallback, useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from "react";
import { useMutation } from "@tanstack/react-query";
import { DEFAULT_VIEW } from "@/configs/overlay.config";
import { resolveSelectionState } from "@/lib/tournament/selection.utils";
import { activeTournamentActions, activeTournamentStore } from "@/stores/activeTournament.store";
import type { ActiveTournamentActions, ActiveTournamentState } from "@/types/activeTournament";
import { useOverlayState, useSelectTournament } from "./useOverlay.hook";
import {
  useRefreshTournament,
  useSavedTournaments,
  useTournamentSnapshot,
} from "./useTournament.hook";

export const activeTournamentSelectors = {
  snapshot: (state: ActiveTournamentState) => state.snapshot,
  key: (state: ActiveTournamentState) => state.key,
  savedTournaments: (state: ActiveTournamentState) => state.savedTournaments,
  overlayState: (state: ActiveTournamentState) => state.overlayState,
  isLoading: (state: ActiveTournamentState) => state.isLoading,
  notFound: (state: ActiveTournamentState) => state.notFound,
  isEmpty: (state: ActiveTournamentState) => state.isEmpty,
  error: (state: ActiveTournamentState) => state.error,
  selectionError: (state: ActiveTournamentState) => state.selectionError,
  selecting: (state: ActiveTournamentState) => state.selecting,
  isRefreshing: (state: ActiveTournamentState) => state.isRefreshing,
  refreshError: (state: ActiveTournamentState) => state.refreshError,
  lastUpdated: (state: ActiveTournamentState) => state.lastUpdated,
} satisfies Record<string, (state: ActiveTournamentState) => unknown>;

const useActiveSelection = () => {
  const overlay = useOverlayState();
  const saved = useSavedTournaments();
  const select = useSelectTournament();
  const savedList = useMemo(() => saved.data ?? [], [saved.data]);
  const activeKey = overlay.data?.activeKey ?? null;
  const selection = resolveSelectionState({
    isSavedReady: saved.isSuccess,
    isOverlayReady: overlay.isSuccess,
    isSelectionFailed: select.isError,
    activeKey,
    savedList,
  });
  const resolvedKey = selection.status === "ready" ? selection.key : null;
  const targetKey = selection.status === "selecting" ? selection.targetKey : null;
  const selectMutation = select.mutate;
  const selectVariables = select.variables;
  const resetSelection = select.reset;
  const selectionFailed = select.isError;
  const refetchSaved = saved.refetch;
  const refetchOverlay = overlay.refetch;

  const isLoading =
    overlay.isPending ||
    saved.isPending ||
    selection.status === "loading" ||
    selection.status === "selecting";

  useEffect(() => {
    if (targetKey === null || !overlay.data) return;
    if (select.isPending || select.isError) return;

    selectMutation({
      activeKey: targetKey,
      view: overlay.data.view,
    });
  }, [overlay.data, select.isError, select.isPending, selectMutation, targetKey]);

  const selectTournament = useCallback(
    (key: string | null) => {
      if (key === overlay.data?.activeKey) return;

      selectMutation({
        activeKey: key,
        view: overlay.data?.view ?? DEFAULT_VIEW,
      });
    },
    [overlay.data?.activeKey, overlay.data?.view, selectMutation],
  );

  const retrySelection = useCallback(() => {
    if (selectVariables) {
      selectMutation(selectVariables);
      return;
    }

    resetSelection();
  }, [resetSelection, selectMutation, selectVariables]);

  const retry = useCallback(async (): Promise<void> => {
    await Promise.all([refetchSaved(), refetchOverlay()]);
    if (selectionFailed) retrySelection();
  }, [refetchOverlay, refetchSaved, retrySelection, selectionFailed]);

  return {
    savedList,
    resolvedKey,
    overlayState: overlay.data ?? null,
    isLoading,
    isEmpty: saved.isSuccess && savedList.length === 0,
    error: saved.error ?? overlay.error,
    selectionError: select.error,
    selecting: select.isPending,
    selectTournament,
    retry,
    retrySelection,
  };
};

const useActiveTournamentData = () => {
  const selection = useActiveSelection();
  const tournament = useTournamentSnapshot(selection.resolvedKey);
  const refresh = useRefreshTournament();
  const snapshot = tournament.data ?? null;

  const retryMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await selection.retry();
      if (selection.resolvedKey) await tournament.refetch();
    },
  });

  const retryMutationNow = retryMutation.mutate;
  const refreshNow = refresh.mutate;
  const refreshPending = refresh.isPending;

  const retry = useCallback((): void => {
    retryMutationNow();
  }, [retryMutationNow]);

  const refreshTournamentNow = useCallback((): void => {
    if (snapshot && !refreshPending) refreshNow(snapshot);
  }, [refreshNow, refreshPending, snapshot]);

  return {
    snapshot,
    key: selection.resolvedKey,
    savedTournaments: selection.savedList,
    overlayState: selection.overlayState,
    isLoading: selection.isLoading || tournament.isLoading,
    notFound: tournament.isSuccess && tournament.data === null,
    isEmpty: selection.isEmpty,
    error: selection.error ?? tournament.error,
    selectionError: selection.selectionError,
    selecting: selection.selecting,
    isRefreshing: refresh.isPending,
    refreshError: refresh.variables?.key === selection.resolvedKey ? refresh.error : null,
    lastUpdated: snapshot?.fetchedAt ?? null,
    selectTournament: selection.selectTournament,
    retry,
    retrySelection: selection.retrySelection,
    refresh: refreshTournamentNow,
  };
};

/** Runs once at the menu root and publishes the React Query result into the store. */
export const useActiveTournamentSync = (): void => {
  const tournament = useActiveTournamentData();
  const state = useMemo<ActiveTournamentState>(
    () => ({
      snapshot: tournament.snapshot,
      key: tournament.key,
      savedTournaments: tournament.savedTournaments,
      overlayState: tournament.overlayState,
      isLoading: tournament.isLoading,
      notFound: tournament.notFound,
      isEmpty: tournament.isEmpty,
      error: tournament.error,
      selectionError: tournament.selectionError,
      selecting: tournament.selecting,
      isRefreshing: tournament.isRefreshing,
      refreshError: tournament.refreshError,
      lastUpdated: tournament.lastUpdated,
    }),
    [
      tournament.error,
      tournament.isEmpty,
      tournament.isLoading,
      tournament.isRefreshing,
      tournament.key,
      tournament.lastUpdated,
      tournament.notFound,
      tournament.overlayState,
      tournament.refreshError,
      tournament.savedTournaments,
      tournament.selectionError,
      tournament.selecting,
      tournament.snapshot,
    ],
  );
  const actions = useMemo<ActiveTournamentActions>(
    () => ({
      selectTournament: tournament.selectTournament,
      retry: tournament.retry,
      retrySelection: tournament.retrySelection,
      refresh: tournament.refresh,
    }),
    [tournament.refresh, tournament.retry, tournament.retrySelection, tournament.selectTournament],
  );

  useLayoutEffect(() => {
    activeTournamentStore.setState(state);
    activeTournamentStore.setActions(actions);
  }, [actions, state]);
};

/** Subscribes a component to one stable slice of the active-tournament state. */
export const useActiveTournamentSelector = <T>(
  selector: (state: ActiveTournamentState) => T,
): T => {
  const getSnapshot = useCallback(() => selector(activeTournamentStore.state.get()), [selector]);

  return useSyncExternalStore(activeTournamentStore.state.subscribe, getSnapshot, getSnapshot);
};

/** Stable action handles; they do not subscribe to state changes. */
export const useActiveTournamentActions = (): ActiveTournamentActions => activeTournamentActions;
