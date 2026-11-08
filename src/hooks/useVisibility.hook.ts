import { useCallback, useEffect, useRef } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TournamentVisibility } from "@/types/tournament";
import { api } from "@/api/index.api";
import { EMPTY_VISIBILITY, VISIBILITY_WRITE_DELAY_MS } from "@/configs/store.config";
import { toggleId } from "@/lib/store.utils";
import type { PendingVisibility } from "@/types/store";

export const visibilityKeys = {
  all: ["visibility"],
  detail: (slug: string | null) => [...visibilityKeys.all, slug],
};

/** Loads visibility and hides matches and rounds through the query cache. */
export const useVisibility = (slug: string | null) => {
  const queryClient = useQueryClient();
  const serverRef = useRef<TournamentVisibility>(EMPTY_VISIBILITY);
  const pendingRef = useRef<PendingVisibility | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery({
    queryKey: visibilityKeys.detail(slug),
    queryFn: slug ? () => api.tournaments.getVisibility(slug) : skipToken,
  });

  const mutation = useMutation<
    TournamentVisibility,
    Error,
    PendingVisibility,
    TournamentVisibility
  >({
    mutationKey: visibilityKeys.detail(slug),
    scope: { id: visibilityKeys.detail(slug).join(":") },

    mutationFn: ({ slug: target, visibility }: PendingVisibility) =>
      api.tournaments.saveVisibility(target, visibility),

    onMutate: ({ slug: target, visibility, previous }) => {
      queryClient.setQueryData(visibilityKeys.detail(target), visibility);
      return previous;
    },

    onSuccess: (saved, { slug: target }) => {
      serverRef.current = saved;
      if (!pendingRef.current) {
        queryClient.setQueryData(visibilityKeys.detail(target), saved);
      }
    },

    onError: (_error, { slug: target, previous }) => {
      if (!pendingRef.current) {
        queryClient.setQueryData(visibilityKeys.detail(target), previous);
      }
    },
  });

  const mutateRef = useRef<typeof mutation.mutate>(mutation.mutate);

  useEffect(() => {
    mutateRef.current = mutation.mutate;
  }, [mutation.mutate]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const pending = pendingRef.current;
    if (!pending) return;

    pendingRef.current = null;
    mutateRef.current(pending);
  }, []);

  useEffect(() => {
    if (!query.data || pendingRef.current) return;
    serverRef.current = query.data;
  }, [query.data]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const pending = pendingRef.current;
      if (!pending) return;

      pendingRef.current = null;
      mutateRef.current(pending);
    };
  }, []);

  const update = (next: (previous: TournamentVisibility) => TournamentVisibility) => {
    if (!slug || !query.isSuccess) return;

    const key = visibilityKeys.detail(slug);
    const current = queryClient.getQueryData<TournamentVisibility>(key) ?? EMPTY_VISIBILITY;
    const visibility = next(current);

    queryClient.setQueryData(key, visibility);
    pendingRef.current = {
      slug,
      visibility,
      previous: pendingRef.current?.previous ?? serverRef.current,
    };

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, VISIBILITY_WRITE_DELAY_MS);
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
