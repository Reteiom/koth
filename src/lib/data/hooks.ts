"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POLL_INTERVAL_MS } from "@/lib/config";
import type { Address } from "@/lib/types";
import { launchpad } from "./index";

export type Query<T> =
  | { status: "loading"; data: undefined; error: undefined; refetch: () => void }
  | { status: "error"; data: T | undefined; error: Error; refetch: () => void }
  | { status: "success"; data: T; error: undefined; refetch: () => void };

/**
 * Minimal data hook: loads once, optionally polls, keeps the last good data
 * while refreshing, and exposes errors without throwing.
 */
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  { poll = false }: { poll?: boolean } = {},
): Query<T> {
  const [state, setState] = useState<{ key: string; data?: T; error?: Error }>({ key });
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(() => {
    let cancelled = false;
    fetcherRef.current().then(
      (data) => !cancelled && setState({ key, data }),
      (error: unknown) =>
        !cancelled &&
        setState((prev) => ({
          key,
          data: prev.key === key ? prev.data : undefined,
          error: error instanceof Error ? error : new Error(String(error)),
        })),
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    const cancel = run();
    if (!poll) return cancel;
    const id = setInterval(run, POLL_INTERVAL_MS);
    return () => {
      cancel();
      clearInterval(id);
    };
  }, [run, poll]);

  const refetch = useCallback(() => {
    setState({ key });
    run();
  }, [key, run]);

  // Data from a previous key is stale — treat as loading.
  const current = state.key === key ? state : { key };
  if (current.error) {
    return { status: "error", data: current.data, error: current.error, refetch };
  }
  if (current.data !== undefined) {
    return { status: "success", data: current.data, error: undefined, refetch };
  }
  return { status: "loading", data: undefined, error: undefined, refetch };
}

export const useLeaderboard = () =>
  useQuery("leaderboard", () => launchpad.getLeaderboard(), { poll: true });

export const useCurrentRound = () =>
  useQuery("round", () => launchpad.getCurrentRound(), { poll: true });

export const useTokens = () => useQuery("tokens", () => launchpad.getTokens(), { poll: true });

export const useToken = (address: Address) =>
  useQuery(`token:${address}`, () => launchpad.getToken(address), { poll: true });

export const useTokenCompetition = (address: Address) =>
  useQuery(`competition:${address}`, () => launchpad.getTokenCompetition(address), {
    poll: true,
  });

export const useRoundHistory = (limit?: number) =>
  useQuery(`history:${limit ?? "all"}`, () => launchpad.getRoundHistory(limit), { poll: true });

export const useRewardStats = () =>
  useQuery("rewards", () => launchpad.getRewardStats(), { poll: true });
