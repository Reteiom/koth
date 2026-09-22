/**
 * HTTP implementation of LaunchpadDataSource.
 *
 * Enable with NEXT_PUBLIC_DATA_SOURCE=api and NEXT_PUBLIC_LAUNCHPAD_API_URL.
 * The backend (fed by the King of the Hill bot) is expected to serve JSON that
 * matches the types in `@/lib/types`:
 *
 *   GET /tokens                        → Token[]
 *   GET /tokens/:address               → Token            (404 → null)
 *   GET /tokens/:address/competition   → TokenCompetition
 *   GET /leaderboard                   → LeaderboardEntry[]
 *   GET /king                          → LeaderboardEntry | null
 *   GET /rounds/current                → Round
 *   GET /rounds/history?limit=N        → RoundResult[]
 *   GET /rewards                       → RewardStats
 */
import { API_URL } from "@/lib/config";
import type { LaunchpadDataSource } from "./source";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function get<T>(path: string, opts: { nullOn404?: boolean } = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError("Launchpad API URL is not configured.", null);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { accept: "application/json" } });
  } catch {
    throw new ApiError("Could not reach the launchpad API.", null);
  }
  if (res.status === 404 && opts.nullOn404) return null as T;
  if (!res.ok) throw new ApiError(`Launchpad API responded with ${res.status}.`, res.status);
  return (await res.json()) as T;
}

const enc = encodeURIComponent;

export const apiSource: LaunchpadDataSource = {
  kind: "api",
  getTokens: () => get("/tokens"),
  getToken: (address) => get(`/tokens/${enc(address)}`, { nullOn404: true }),
  getLeaderboard: () => get("/leaderboard"),
  getCurrentKing: () => get("/king", { nullOn404: true }),
  getCurrentRound: () => get("/rounds/current"),
  getRoundHistory: (limit = 24) => get(`/rounds/history?limit=${limit}`),
  getRewardStats: () => get("/rewards"),
  getTokenCompetition: (address) => get(`/tokens/${enc(address)}/competition`),
};
