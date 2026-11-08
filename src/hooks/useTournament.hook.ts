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
} from "@/types/tournament";
import {
  parseTournament,
  refreshTournament,
  refreshTournamentBySlug,
} from "@/lib/tournament/import.tournament";
import { api } from "@/api/index.api";
import { visibilityKeys } from "./useVisibility.hook";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: () => [...tournamentKeys.all, "list"] as const,
  detail: (slug: string | null) => [...tournamentKeys.all, "detail", slug] as const,
};

const writeSnapshot = async (
  queryClient: QueryClient,
  snapshot: TournamentSnapshot,
): Promise<void> => {
  queryClient.setQueryData(tournamentKeys.detail(snapshot.slug), snapshot);
  await queryClient.invalidateQueries({ queryKey: tournamentKeys.list() });
};

/** Lists saved tournaments and refreshes them every 30 seconds. */
export const useSavedTournaments = () =>
  useQuery({
    queryKey: tournamentKeys.list(),
    queryFn: () => api.tournaments.list(),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

/** Loads one saved snapshot; no request runs until a slug is selected. */
export const useTournamentSnapshot = (slug: string | null) =>
  useQuery({
    queryKey: tournamentKeys.detail(slug),
    queryFn: slug ? () => api.tournaments.get(slug) : skipToken,
    staleTime: 15_000,
    refetchInterval: slug ? 30_000 : false,
  });

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
  });
};

/** Re-fetches a saved tournament by slug and saves it. */
export const useRefreshTournamentBySlug = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => refreshTournamentBySlug(slug),
    onSuccess: (snapshot) => writeSnapshot(queryClient, snapshot),
  });
};

/** Deletes a tournament and its cached snapshot and visibility. */
export const useDeleteTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => api.tournaments.remove(slug),
    onSuccess: async (_data, slug) => {
      queryClient.removeQueries({ queryKey: tournamentKeys.detail(slug) });
      queryClient.removeQueries({ queryKey: visibilityKeys.detail(slug) });
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list() });
    },
  });
};
