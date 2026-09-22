/**
 * Domain model for the launchpad UI.
 *
 * Every metric that the backend may not be able to provide is nullable. The UI
 * renders `null` as "unavailable" — never as 0.
 */

export type Address = `0x${string}`;

/** Competitive status of a token in the current round. */
export type TokenStatus = "king" | "challenger" | "rising" | "idle";

export interface Token {
  address: Address;
  name: string;
  symbol: string;
  /** Absolute or relative URL of the token image. Null → generated avatar. */
  logoUrl: string | null;
  description: string | null;
  createdAt: string; // ISO timestamp
  creator: Address | null;
  links: {
    website?: string;
    x?: string;
    telegram?: string;
  };
  /** Market cap in USD. The competition metric. */
  marketCapUsd: number | null;
  priceUsd: number | null;
  volume24hUsd: number | null;
  /** Percent change of market cap over the last hour, e.g. 12.4 = +12.4%. */
  change1hPct: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  token: Token;
  status: TokenStatus;
  /** Milliseconds this token has been #1 during the current round. */
  timeOnTopMs: number | null;
}

export interface Round {
  id: number;
  startsAt: string; // ISO
  endsAt: string; // ISO
  /** Current leader address, if any tokens are competing. */
  kingAddress: Address | null;
}

export interface RoundResult {
  roundId: number;
  endedAt: string; // ISO
  winner: Pick<Token, "address" | "name" | "symbol" | "logoUrl">;
  /** Winner market cap at settlement. */
  marketCapUsd: number | null;
  /** How long the winner held #1 during the round. */
  timeOnTopMs: number | null;
  /** Fees spent on the buyback, in USD. Null until reported by the bot. */
  buybackUsd: number | null;
  /** Tokens burned after the buyback (whole tokens). */
  burnedTokens: number | null;
  buybackTxHash: string | null;
  burnTxHash: string | null;
}

export interface RewardStats {
  /** Fees accrued for the current round and not yet used. Null if unknown. */
  pendingFeesUsd: number | null;
  totalBuybackUsd: number | null;
  totalRoundsSettled: number | null;
}

/** Per-token history point, one per settled round. */
export interface PositionPoint {
  roundId: number;
  at: string; // ISO
  rank: number | null;
  marketCapUsd: number | null;
}

export interface TokenCompetition {
  entry: LeaderboardEntry | null;
  /** Market cap gap to the current king (0 if this token is king). */
  gapToKingUsd: number | null;
  /** Rounds this token has won. */
  roundsWon: number | null;
  /** Total time spent as king across all rounds. */
  totalTimeOnThroneMs: number | null;
  totalBuybackUsd: number | null;
  totalBurnedTokens: number | null;
  history: PositionPoint[];
}

export interface LaunchTokenInput {
  name: string;
  symbol: string;
  description: string;
  image: File | null;
  website: string;
  x: string;
  telegram: string;
}

export interface LaunchTokenResult {
  address: Address;
  txHash: string | null;
}
