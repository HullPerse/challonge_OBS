import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { DEFAULT_VIEW } from "@/configs/overlay.config";
import { resolveSelectionState } from "@/lib/tournament/selection.utils";
import { useOverlayState, useSelectTournament } from "./useOverlay.hook";
import {
  useRefreshTournament,
  useSavedTournaments,
  useTournamentSnapshot,
} from "./useTournament.hook";

const useActiveSelection = () => {
  const overlay = useOverlayState();
  const saved = useSavedTournaments();
  const select = useSelectTournament();
  const savedList = saved.data ?? [];
  const activeSlug = overlay.data?.activeSlug ?? null;
  const selection = resolveSelectionState({
    isSavedReady: saved.isSuccess,
    isOverlayReady: overlay.isSuccess,
    isSelectionFailed: select.isError,
    activeSlug,
    savedList,
  });
  const resolvedSlug = selection.status === "ready" ? selection.slug : null;
  const targetSlug = selection.status === "selecting" ? selection.targetSlug : null;
  const selectMutation = select.mutate;

  const isLoading =
    overlay.isPending ||
    saved.isPending ||
    selection.status === "loading" ||
    selection.status === "selecting";

  useEffect(() => {
    if (targetSlug === null || !overlay.data) return;
    if (select.isPending || select.isError) return;

    selectMutation({
      activeSlug: targetSlug,
      view: overlay.data.view,
    });
  }, [overlay.data, select.isError, select.isPending, selectMutation, targetSlug]);

  const selectTournament = (slug: string | null) => {
    if (slug === overlay.data?.activeSlug) return;

    selectMutation({
      activeSlug: slug,
      view: overlay.data?.view ?? DEFAULT_VIEW,
    });
  };

  const retrySelection = () => {
    if (select.variables) {
      selectMutation(select.variables);
      return;
    }

    select.reset();
  };

  const retry = async (): Promise<void> => {
    await Promise.all([saved.refetch(), overlay.refetch()]);
    if (select.isError) retrySelection();
  };

  return {
    savedList,
    resolvedSlug,
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

export const useActiveTournament = () => {
  const selection = useActiveSelection();
  const tournament = useTournamentSnapshot(selection.resolvedSlug);
  const refresh = useRefreshTournament();
  const snapshot = tournament.data ?? null;

  const retryMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await selection.retry();
      if (selection.resolvedSlug) await tournament.refetch();
    },
  });

  const retry = (): void => {
    retryMutation.mutate();
  };

  const refreshTournamentNow = () => {
    if (snapshot && !refresh.isPending) refresh.mutate(snapshot);
  };

  return {
    snapshot,
    slug: selection.resolvedSlug,
    savedTournaments: selection.savedList,
    overlayState: selection.overlayState,
    isLoading: selection.isLoading || tournament.isLoading,
    notFound: tournament.isSuccess && tournament.data === null,
    isEmpty: selection.isEmpty,
    error: selection.error ?? tournament.error,
    selectionError: selection.selectionError,
    selecting: selection.selecting,
    isRefreshing: refresh.isPending,
    refreshError: refresh.variables?.slug === selection.resolvedSlug ? refresh.error : null,
    lastUpdated: snapshot?.fetchedAt ?? null,
    selectTournament: selection.selectTournament,
    retry,
    retrySelection: selection.retrySelection,
    refresh: refreshTournamentNow,
  };
};
