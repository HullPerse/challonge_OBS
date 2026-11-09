import { useCallback, useEffect, useRef } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { CoalescedMutationOptions } from "@/types/hooks";

/**
 * Coalesces high-frequency mutations: at most one request is in flight and the
 * latest value is sent after it settles, with a small throttle window.
 */
export const useCoalescedMutation = <TData, TError extends Error, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables>,
  delayMs: number,
  options: CoalescedMutationOptions = {},
) => {
  const pendingRef = useRef<TVariables | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const disposedRef = useRef<boolean>(false);
  const mutateRef = useRef<typeof mutation.mutate>(mutation.mutate);
  const flushRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    mutateRef.current = mutation.mutate;
  }, [mutation.mutate]);

  const flush = useCallback(() => {
    if (inFlightRef.current) return;

    const pending = pendingRef.current;
    if (pending === null) return;

    pendingRef.current = null;
    inFlightRef.current = true;
    mutateRef.current(pending, {
      onSettled: () => {
        inFlightRef.current = false;

        if (disposedRef.current) {
          flushRef.current?.();
          return;
        }

        if (pendingRef.current === null || timerRef.current !== null) return;

        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          flushRef.current?.();
        }, delayMs);
      },
    });
  }, [delayMs]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const queue = useCallback(
    (variables: TVariables) => {
      pendingRef.current = variables;
      if (inFlightRef.current || timerRef.current !== null) return;

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        flushRef.current?.();
      }, delayMs);
    },
    [delayMs],
  );

  useEffect(() => {
    disposedRef.current = false;

    return () => {
      disposedRef.current = true;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;

      if (!options.flushOnUnmount) {
        pendingRef.current = null;
        return;
      }

      if (pendingRef.current !== null && !inFlightRef.current) {
        flushRef.current?.();
      }
    };
  }, [options.flushOnUnmount]);

  return { ...mutation, mutate: queue };
};
