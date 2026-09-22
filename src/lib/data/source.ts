import type {
  Address,
  LeaderboardEntry,
  RewardStats,
  Round,
  RoundResult,
  Token,
  TokenCompetition,
} from "@/lib/types";

/**
 * Everything the UI reads about the launchpad goes through this interface.
 * Components never call a source directly — they use hooks that call the
 * active source (see `./index.ts`).
 */
export interface LaunchpadDataSource {
  readonly kind: "empty" | "api";

  getTokens(): Promise<Token[]>;
  /** Resolves to null when the token is unknown. */
  getToken(address: Address): Promise<Token | null>;
  /** Ranked by market cap, descending. */
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  getCurrentKing(): Promise<LeaderboardEntry | null>;
  /** Null while no round is running or reported. */
  getCurrentRound(): Promise<Round | null>;
  /** Settled rounds, newest first. */
  getRoundHistory(limit?: number): Promise<RoundResult[]>;
  getRewardStats(): Promise<RewardStats>;
  getTokenCompetition(address: Address): Promise<TokenCompetition>;
}
