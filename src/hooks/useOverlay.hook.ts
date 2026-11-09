import { useEffect, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { OVERLAY_WRITE_DELAY_MS } from "@/configs/overlay.config";
import { LIVE_REFRESH_INTERVAL_MS, OVERLAY_STATE_STALE_MS } from "@/configs/query.config";
import { api } from "@/api/index.api";
import type {
  OverlayEvent,
  OverlayFocusPatch,
  OverlayModulesPatch,
  OverlayMutationContext,
  OverlayPointer,
  OverlayPointerSizeInput,
  OverlaySetViewInput,
  OverlayState,
} from "@/types/overlay";
import { applyStateEvent } from "@/lib/bracket/overlay.utils";
import {
  acquireOverlaySubscription,
  getOverlayConnectionSnapshot,
  subscribeOverlayConnection,
} from "@/lib/overlay/subscription.utils";
import { useCoalescedMutation } from "./useCoalescedMutation.hook";
import { tournamentKeys } from "./useTournament.hook";
import { visibilityKeys } from "./useVisibility.hook";

const overlayKeys = {
  state: ["overlay", "state"] as const,
};

/** Writes state only when it is at least as new as the cached one. */
const writeOverlayState = (queryClient: QueryClient, state: OverlayState) => {
  queryClient.setQueryData<OverlayState>(overlayKeys.state, (previous) =>
    !previous || state.revision >= previous.revision ? state : previous,
  );
};

const useOptimisticOverlayMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<OverlayState>,
  apply: (state: OverlayState, variables: TVariables) => OverlayState,
  scopeId?: string,
) => {
  const queryClient = useQueryClient();

  return useMutation<OverlayState, Error, TVariables, OverlayMutationContext>({
    mutationFn,
    ...(scopeId ? { scope: { id: scopeId } } : {}),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: overlayKeys.state });
      const previous = queryClient.getQueryData<OverlayState>(overlayKeys.state);

      if (previous) {
        queryClient.setQueryData(overlayKeys.state, apply(previous, variables));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(overlayKeys.state, context.previous);
      }
    },
    onSuccess: (state) => {
      writeOverlayState(queryClient, state);
    },
  });
};

const writeEventState = (queryClient: QueryClient, event: OverlayEvent) => {
  if (event.type === "tournament" || event.type === "visibility") return;

  queryClient.setQueryData<OverlayState>(overlayKeys.state, (previous) =>
    applyStateEvent(previous, event),
  );
};

const writeRelatedState = (queryClient: QueryClient, event: OverlayEvent) => {
  if (event.type === "sync" || event.type === "state") {
    const key = event.state.activeKey;
    if (!key) return;

    if (event.tournament !== undefined) {
      queryClient.setQueryData(tournamentKeys.detail(key), event.tournament);
    }
    if (event.visibility !== undefined) {
      queryClient.setQueryData(visibilityKeys.detail(key), event.visibility);
    }
    return;
  }

  if (event.type === "tournament") {
    queryClient.setQueryData(tournamentKeys.detail(event.tournament.key), event.tournament);
    queryClient.setQueryData(visibilityKeys.detail(event.tournament.key), event.visibility);
    return;
  }

  if (event.type === "visibility") {
    const state = queryClient.getQueryData<OverlayState>(overlayKeys.state);
    if (!state?.activeKey) return;

    queryClient.setQueryData(visibilityKeys.detail(state.activeKey), event.visibility);
  }
};

/** Loads overlay state and keeps it fresh through SSE while connected. */
export const useOverlayState = () => {
  const queryClient = useQueryClient();
  const connected = useSyncExternalStore(
    subscribeOverlayConnection,
    getOverlayConnectionSnapshot,
    getOverlayConnectionSnapshot,
  );

  useEffect(() => {
    return acquireOverlaySubscription({
      onEvent: (event) => {
        writeEventState(queryClient, event);
        writeRelatedState(queryClient, event);
      },
    });
  }, [queryClient]);

  return useQuery({
    queryKey: overlayKeys.state,
    queryFn: () => api.overlay.getState(),
    staleTime: OVERLAY_STATE_STALE_MS,
    refetchInterval: connected ? false : LIVE_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
  });
};

export const useOverlayFocus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: OverlayFocusPatch) => api.overlay.setFocus(patch),
    onSuccess: (state) => {
      writeOverlayState(queryClient, state);
    },
  });
};

export const useSetOverlayView = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: OverlaySetViewInput) => api.overlay.setView(input),
    onSuccess: (state) => {
      writeOverlayState(queryClient, state);
    },
  });

  return useCoalescedMutation(mutation, OVERLAY_WRITE_DELAY_MS);
};

export const useSetOverlayModules = () => {
  return useOptimisticOverlayMutation(
    (patch: OverlayModulesPatch) => api.overlay.setModules(patch),
    (state, patch) => ({ ...state, modules: { ...state.modules, ...patch } }),
    "overlay-modules",
  );
};

export const useSetPointerSize = () => {
  return useOptimisticOverlayMutation(
    (input: OverlayPointerSizeInput) => api.overlay.setPointerSize(input),
    (state, input) => ({ ...state, pointerSize: input.pointerSize }),
  );
};

export const useSetOverlayPointer = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (pointer: OverlayPointer) => api.overlay.setPointer(pointer),
    onSuccess: (state) => {
      writeOverlayState(queryClient, state);
    },
  });

  return useCoalescedMutation(mutation, OVERLAY_WRITE_DELAY_MS);
};

export const useSelectTournament = () => {
  return useOptimisticOverlayMutation(
    (input: OverlaySetViewInput) => api.overlay.setView(input),
    (state, input) => ({ ...state, activeKey: input.activeKey }),
  );
};
