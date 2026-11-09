import { useEffect, useRef } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TournamentVisibility } from "@/types/tournament";
import { api } from "@/api/index.api";
import { EMPTY_VISIBILITY, VISIBILITY_WRITE_DELAY_MS } from "@/configs/store.config";
import { toggleId } from "@/lib/store.utils";
import type { PendingVisibility } from "@/types/store";
import { useCoalescedMutation } from "./useCoalescedMutation.hook";

export const visibilityKeys = {
  all: ["visibility"],
  detail: (key: string | null) => [...visibilityKeys.all, key],
};

/** Loads visibility and hides matches and rounds through the query cache. */
export const useVisibility = (key: string | null) => {
  const queryClient = useQueryClient();
  const serverRef = useRef<TournamentVisibility>(EMPTY_VISIBILITY);
  const latestRef = useRef<TournamentVisibility | null>(null);
  const pendingRef = useRef<boolean>(false);

  const query = useQuery({
    queryKey: visibilityKeys.detail(key),
    queryFn: key ? () => api.tournaments.getVisibility(key) : skipToken,
  });

  const mutation = useMutation<
    TournamentVisibility,
    Error,
    PendingVisibility,
    TournamentVisibility
  >({
    mutationKey: visibilityKeys.detail(key),
    scope: { id: visibilityKeys.detail(key).join(":") },
    mutationFn: ({ key: target, visibility }: PendingVisibility) =>
      api.tournaments.saveVisibility(target, visibility),
    onMutate: ({ key: target, visibility, previous }) => {
      queryClient.setQueryData(visibilityKeys.detail(target), visibility);
      return previous;
    },

    onSuccess: (saved, { key: target, visibility }) => {
      serverRef.current = saved;

      if (latestRef.current !== visibility) return;

      pendingRef.current = false;
      latestRef.current = saved;
      queryClient.setQueryData(visibilityKeys.detail(target), saved);
    },

    onError: (_error, { key: target, previous, visibility }) => {
      if (latestRef.current !== visibility) return;

      pendingRef.current = false;
      latestRef.current = previous;
      queryClient.setQueryData(visibilityKeys.detail(target), previous);
    },
  });

  const coalesced = useCoalescedMutation(mutation, VISIBILITY_WRITE_DELAY_MS, {
    flushOnUnmount: true,
  });

  useEffect(() => {
    if (!query.data || pendingRef.current) return;

    latestRef.current = null;
    serverRef.current = query.data;
  }, [query.data]);

  const update = (next: (previous: TournamentVisibility) => TournamentVisibility) => {
    if (!key || !query.isSuccess) return;

    const queryKey = visibilityKeys.detail(key);
    const current = queryClient.getQueryData<TournamentVisibility>(queryKey) ?? EMPTY_VISIBILITY;
    const visibility = next(current);

    queryClient.setQueryData(queryKey, visibility);
    pendingRef.current = true;
    latestRef.current = visibility;
    coalesced.mutate({
      key,
      visibility,
      previous: serverRef.current,
    });
  };

  const visibility = query.data ?? EMPTY_VISIBILITY;
  const hiddenMatches = new Set(visibility.hiddenMatches);
  const hiddenRounds = new Set(visibility.hiddenRounds);

  return {
    visibility,
    hiddenMatches,
    hiddenRounds,
    hiddenCount: hiddenMatches.size + hiddenRounds.size,
    isLoading: query.isPending,
    loadError: query.error,
    saveError: mutation.error,
    isSaving: mutation.isPending,
    toggleMatch: (matchId: number) => {
      update((previous) => ({
        ...previous,
        hiddenMatches: toggleId(previous.hiddenMatches, matchId),
      }));
    },
    toggleRound: (round: number) => {
      update((previous) => ({
        ...previous,
        hiddenRounds: toggleId(previous.hiddenRounds, round),
      }));
    },
    clear: () => {
      update(() => EMPTY_VISIBILITY);
    },
  };
};
