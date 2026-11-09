import { QueryClient } from "@tanstack/react-query";

/** Query timing shared by hooks and the default cache policy. */
export const SAVED_TOURNAMENTS_STALE_MS = 10_000;
export const TOURNAMENT_SNAPSHOT_STALE_MS = 15_000;
export const OVERLAY_STATE_STALE_MS = 10_000;
export const LIVE_REFRESH_INTERVAL_MS = 30_000;

/** Shared TanStack Query client and its cache defaults. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
