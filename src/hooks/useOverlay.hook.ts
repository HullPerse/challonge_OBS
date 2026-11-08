import { useEffect, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/api/index.api";
import type {
  OverlayEvent,
  OverlayFocusPatch,
  OverlayModulesPatch,
  OverlayPointer,
  OverlayPointerSizeInput,
  OverlaySetViewInput,
  OverlayState,
} from "@/types/overlay";
import { applyStateEvent } from "@/lib/bracket/overlay.utils";
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

type OverlayMutationContext = {
  previous: OverlayState | undefined;
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
    const slug = event.state.activeSlug;
    if (!slug) return;

    if (event.tournament !== undefined) {
      queryClient.setQueryData(tournamentKeys.detail(slug), event.tournament);
    }
    if (event.visibility !== undefined) {
      queryClient.setQueryData(visibilityKeys.detail(slug), event.visibility);
    }
    return;
  }

  if (event.type === "tournament") {
    queryClient.setQueryData(tournamentKeys.detail(event.tournament.slug), event.tournament);
    queryClient.setQueryData(visibilityKeys.detail(event.tournament.slug), event.visibility);
    return;
  }

  if (event.type === "visibility") {
    const state = queryClient.getQueryData<OverlayState>(overlayKeys.state);
    if (!state?.activeSlug) return;

    queryClient.setQueryData(visibilityKeys.detail(state.activeSlug), event.visibility);
  }
};

type OverlaySubscription = {
  consumers: number;
  close: () => void;
};

let overlaySubscription: OverlaySubscription | null = null;
let overlayConnected = false;
const connectionListeners = new Set<() => void>();

const notifyConnection = () => {
  for (const listener of connectionListeners) listener();
};

const subscribeConnection = (listener: () => void) => {
  connectionListeners.add(listener);

  return () => {
    connectionListeners.delete(listener);
  };
};

const getConnectionSnapshot = (): boolean => overlayConnected;

/** Shares one SSE connection across every control-panel consumer. */
const acquireOverlaySubscription = (queryClient: QueryClient) => {
  if (!overlaySubscription) {
    let current: OverlaySubscription;
    current = {
      consumers: 0,
      close: api.overlay.subscribe({
        onOpen: () => {
          if (overlaySubscription !== current) return;
          overlayConnected = true;
          notifyConnection();
        },
        onError: () => {
          if (overlaySubscription !== current) return;
          overlayConnected = false;
          notifyConnection();
        },
        onEvent: (event) => {
          if (overlaySubscription !== current) return;
          writeEventState(queryClient, event);
          writeRelatedState(queryClient, event);
        },
      }),
    };
    overlaySubscription = current;
  }

  overlaySubscription.consumers += 1;

  return () => {
    const current = overlaySubscription;
    if (!current) return;

    current.consumers -= 1;
    if (current.consumers > 0) return;

    overlaySubscription = null;
    overlayConnected = false;
    notifyConnection();
    current.close();
  };
};

/** Loads overlay state and keeps it fresh through SSE while connected. */
export const useOverlayState = () => {
  const queryClient = useQueryClient();
  const connected = useSyncExternalStore(
    subscribeConnection,
    getConnectionSnapshot,
    getConnectionSnapshot,
  );

  useEffect(() => {
    return acquireOverlaySubscription(queryClient);
  }, [queryClient]);

  return useQuery({
    queryKey: overlayKeys.state,
    queryFn: () => api.overlay.getState(),
    staleTime: 10_000,
    refetchInterval: connected ? false : 30_000,
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

  return useMutation({
    mutationFn: (input: OverlaySetViewInput) => api.overlay.setView(input),
    onSuccess: (state) => {
      writeOverlayState(queryClient, state);
    },
  });
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

  return useMutation({
    mutationFn: (pointer: OverlayPointer) => api.overlay.setPointer(pointer),
    onSuccess: (state) => {
      writeOverlayState(queryClient, state);
    },
  });
};

export const useSelectTournament = () => {
  return useOptimisticOverlayMutation(
    (input: OverlaySetViewInput) => api.overlay.setView(input),
    (state, input) => ({ ...state, activeSlug: input.activeSlug }),
  );
};
