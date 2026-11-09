import { useCallback } from "react";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  ImportInput,
  ImportStageHandler,
  TournamentSnapshot,
  TournamentSnapshotWrite,
  TournamentSummary,
} from "@/types/tournament";
import {
  parseTournament,
  refreshTournament,
  refreshTournamentByKey,
} from "@/lib/tournament/import.tournament";
import { api } from "@/api/index.api";
import {
  LIVE_REFRESH_INTERVAL_MS,
  SAVED_TOURNAMENTS_STALE_MS,
  TOURNAMENT_SNAPSHOT_STALE_MS,
} from "@/configs/query.config";
import { visibilityKeys } from "./useVisibility.hook";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: () => [...tournamentKeys.all, "list"] as const,
  detail: (key: string | null) => [...tournamentKeys.all, "detail", key] as const,
};

const writeSnapshot = async (
  queryClient: QueryClient,
  snapshot: TournamentSnapshot,
): Promise<void> => {
  queryClient.setQueryData(tournamentKeys.detail(snapshot.key), snapshot);
  await queryClient.invalidateQueries({ queryKey: tournamentKeys.list() });
};

/** Lists saved tournaments and refreshes them every 30 seconds. */
export const useSavedTournaments = () =>
  useQuery({
    queryKey: tournamentKeys.list(),
    queryFn: () => api.tournaments.list(),
    staleTime: SAVED_TOURNAMENTS_STALE_MS,
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  });

/** Loads one saved snapshot; no request runs until a tournament key is selected. */
export const useTournamentSnapshot = (key: string | null) =>
  useQuery({
    queryKey: tournamentKeys.detail(key),
    queryFn: key ? () => api.tournaments.get(key) : skipToken,
    staleTime: TOURNAMENT_SNAPSHOT_STALE_MS,
    refetchInterval: key ? LIVE_REFRESH_INTERVAL_MS : false,
  });

/** Warms the snapshot cache before a tournament is selected. */
export const usePrefetchTournament = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (key: string): void => {
      queryClient
        .prefetchQuery({
          queryKey: tournamentKeys.detail(key),
          queryFn: () => api.tournaments.get(key),
          staleTime: TOURNAMENT_SNAPSHOT_STALE_MS,
        })
        .catch(() => null);
    },
    [queryClient],
  );
};

/** Saves a snapshot on the server; `createOnly` rejects an existing slug. */
export const useSaveTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      snapshot,
      createOnly,
    }: {
      snapshot: TournamentSnapshotWrite;
      createOnly: boolean;
    }) => api.tournaments.save(snapshot, createOnly),
    onSuccess: (snapshot) => writeSnapshot(queryClient, snapshot),
  });
};

/** Parses or downloads a tournament without saving it. */
export const useParseTournament = (onStage?: ImportStageHandler) => {
  return useMutation({
    mutationFn: (input: ImportInput) => parseTournament(input, onStage),
  });
};

/** Re-fetches a tournament from Challonge and saves it. */
export const useRefreshTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (snapshot: TournamentSnapshot) => refreshTournament(snapshot),
    onSuccess: (snapshot) => writeSnapshot(queryClient, snapshot),
    onError: (error, snapshot) => {
      console.error(`Не удалось обновить турнир ${snapshot.key}`, error);
    },
  });
};

/** Re-fetches a saved tournament by host/slug key and saves it. */
export const useRefreshTournamentByKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (key: string) => refreshTournamentByKey(key),
    onSuccess: (snapshot) => writeSnapshot(queryClient, snapshot),
    onError: (error, key) => {
      console.error(`Не удалось обновить турнир ${key}`, error);
    },
  });
};

/** Deletes a tournament and its cached snapshot and visibility. */
export const useDeleteTournament = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previous: TournamentSummary[] | undefined }>({
    mutationFn: (key: string) => api.tournaments.remove(key),
    onMutate: async (key) => {
      await queryClient.cancelQueries({ queryKey: tournamentKeys.list() });
      const previous = queryClient.getQueryData<TournamentSummary[]>(tournamentKeys.list());

      if (previous) {
        queryClient.setQueryData<TournamentSummary[]>(
          tournamentKeys.list(),
          previous.filter((item) => item.key !== key),
        );
      }

      return { previous };
    },
    onError: (_error, _key, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tournamentKeys.list(), context.previous);
      }
    },
    onSuccess: (_data, key) => {
      queryClient.removeQueries({ queryKey: tournamentKeys.detail(key) });
      queryClient.removeQueries({ queryKey: visibilityKeys.detail(key) });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list() });
    },
  });
};
