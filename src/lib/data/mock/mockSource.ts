/**
 * Mock implementation of LaunchpadDataSource.
 *
 * Simulates a live arena from the demo fixtures: market caps oscillate over
 * time so the leaderboard reshuffles and the throne changes hands. Everything
 * is derived from the clock, so all views agree with each other.
 *
 * QA helpers — append to any URL:
 *   ?demo=empty  → no tokens
 *   ?demo=error  → every request fails
 *   ?demo=slow   → 3s latency
 */
import { ROUND_DURATION_MS } from "@/lib/config";
import type {
  Address,
  LeaderboardEntry,
  PositionPoint,
  RewardStats,
  Round,
  RoundResult,
  Token,
  TokenCompetition,
  TokenStatus,
} from "@/lib/types";
import type { LaunchpadDataSource } from "../source";
import { MOCK_TOKENS, type MockTokenSeed } from "./fixtures";

const MINUTE = 60_000;
/** Mock round ids count from this epoch so they look reasonable. */
const ROUND_EPOCH = Date.UTC(2026, 0, 1);

type Scenario = "normal" | "empty" | "error" | "slow";

function scenario(): Scenario {
  if (typeof window === "undefined") return "normal";
  const value = new URLSearchParams(window.location.search).get("demo");
  return value === "empty" || value === "error" || value === "slow" ? value : "normal";
}

async function respond<T>(value: () => T, emptyValue?: () => T): Promise<T> {
  const mode = scenario();
  const latency = mode === "slow" ? 3000 : 250 + Math.random() * 350;
  await new Promise((r) => setTimeout(r, latency));
  if (mode === "error") throw new Error("Demo error: the data service is unavailable.");
  if (mode === "empty" && emptyValue) return emptyValue();
  return value();
}

function capAt(seed: MockTokenSeed, t: number): number {
  const m = t / MINUTE;
  const created = Date.parse(seed.token.createdAt);
  if (t < created) return 0;
  const wave =
    0.65 * Math.sin((2 * Math.PI * m) / seed.periodMin + seed.phase) +
    0.35 * Math.sin((2 * Math.PI * m) / (seed.periodMin * 2.7) + seed.phase * 1.7) +
    0.04 * Math.sin(m * 7.3 + seed.phase);
  return Math.round(seed.baseCapUsd * (1 + seed.volatility * wave));
}

function ranked(t: number): { seed: MockTokenSeed; cap: number }[] {
  return MOCK_TOKENS.map((seed) => ({ seed, cap: capAt(seed, t) }))
    .filter((x) => x.cap > 0)
    .sort((a, b) => b.cap - a.cap);
}

function kingAt(t: number): MockTokenSeed | null {
  return ranked(t)[0]?.seed ?? null;
}

function roundStart(t: number): number {
  return Math.floor(t / ROUND_DURATION_MS) * ROUND_DURATION_MS;
}

function roundId(start: number): number {
  return Math.floor((start - ROUND_EPOCH) / ROUND_DURATION_MS) + 1;
}

function toToken(seed: MockTokenSeed, t: number): Token {
  const cap = capAt(seed, t);
  const hourAgo = capAt(seed, t - ROUND_DURATION_MS);
  return {
    ...seed.token,
    marketCapUsd: cap,
    priceUsd: cap / seed.supply,
    volume24hUsd: Math.round(cap * (0.35 + 0.15 * Math.sin(seed.phase))),
    change1hPct: hourAgo > 0 ? ((cap - hourAgo) / hourAgo) * 100 : null,
  };
}

/** Minutes a token has been #1 between `from` and `to`, sampled per minute. */
function timeOnTop(address: Address, from: number, to: number): number {
  let minutes = 0;
  for (let t = from; t < to; t += MINUTE) {
    if (kingAt(t)?.token.address === address) minutes++;
  }
  return minutes * MINUTE;
}

function statusFor(rank: number, change1hPct: number | null): TokenStatus {
  if (rank === 1) return "king";
  if (rank <= 5) return "challenger";
  if (change1hPct !== null && change1hPct > 5) return "rising";
  return "idle";
}

function leaderboardAt(t: number): LeaderboardEntry[] {
  const start = roundStart(t);
  return ranked(t).map(({ seed }, i) => {
    const token = toToken(seed, t);
    const rank = i + 1;
    return {
      rank,
      token,
      status: statusFor(rank, token.change1hPct),
      timeOnTopMs: timeOnTop(seed.token.address, start, t),
    };
  });
}

function settledRound(start: number): RoundResult | null {
  const end = start + ROUND_DURATION_MS;
  const winner = kingAt(end - 1);
  if (!winner) return null;
  const cap = capAt(winner, end - 1);
  // Demo-only reward figures. Real values will come from the bot.
  const buybackUsd = Math.round(900 + (cap % 1700));
  const price = cap / winner.supply;
  return {
    roundId: roundId(start),
    endedAt: new Date(end).toISOString(),
    winner: {
      address: winner.token.address,
      name: winner.token.name,
      symbol: winner.token.symbol,
      logoUrl: winner.token.logoUrl,
    },
    marketCapUsd: cap,
    timeOnTopMs: timeOnTop(winner.token.address, start, end),
    buybackUsd,
    burnedTokens: Math.round(buybackUsd / price),
    buybackTxHash: null,
    burnTxHash: null,
  };
}

function history(t: number, limit: number): RoundResult[] {
  const current = roundStart(t);
  const out: RoundResult[] = [];
  for (let i = 1; i <= limit; i++) {
    const r = settledRound(current - i * ROUND_DURATION_MS);
    if (r) out.push(r);
  }
  return out;
}

const HISTORY_WINDOW = 24;

export const mockSource: LaunchpadDataSource = {
  kind: "mock",

  getTokens: () =>
    respond(
      () => {
        const now = Date.now();
        return ranked(now).map(({ seed }) => toToken(seed, now));
      },
      () => [],
    ),

  getToken: (address) =>
    respond(
      () => {
        const seed = MOCK_TOKENS.find(
          (s) => s.token.address.toLowerCase() === address.toLowerCase(),
        );
        return seed ? toToken(seed, Date.now()) : null;
      },
      () => null,
    ),

  getLeaderboard: () => respond(() => leaderboardAt(Date.now()), () => []),

  getCurrentKing: () => respond(() => leaderboardAt(Date.now())[0] ?? null, () => null),

  getCurrentRound: () =>
    respond(
      () => {
        const now = Date.now();
        const start = roundStart(now);
        return {
          id: roundId(start),
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(start + ROUND_DURATION_MS).toISOString(),
          kingAddress: kingAt(now)?.token.address ?? null,
        } satisfies Round;
      },
      () => {
        const start = roundStart(Date.now());
        return {
          id: roundId(start),
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(start + ROUND_DURATION_MS).toISOString(),
          kingAddress: null,
        };
      },
    ),

  getRoundHistory: (limit = HISTORY_WINDOW) =>
    respond(() => history(Date.now(), limit), () => []),

  getRewardStats: () =>
    respond(
      (): RewardStats => {
        const h = history(Date.now(), HISTORY_WINDOW);
        const elapsed = Date.now() - roundStart(Date.now());
        return {
          pendingFeesUsd: Math.round(300 + (elapsed / ROUND_DURATION_MS) * 1400),
          totalBuybackUsd: h.reduce((s, r) => s + (r.buybackUsd ?? 0), 0),
          totalRoundsSettled: h.length,
        };
      },
      () => ({ pendingFeesUsd: null, totalBuybackUsd: null, totalRoundsSettled: null }),
    ),

  getTokenCompetition: (address) =>
    respond(
      (): TokenCompetition => {
        const now = Date.now();
        const board = leaderboardAt(now);
        const entry =
          board.find((e) => e.token.address.toLowerCase() === address.toLowerCase()) ?? null;
        const kingCap = board[0]?.token.marketCapUsd ?? null;
        const past = history(now, HISTORY_WINDOW);
        const won = past.filter((r) => r.winner.address === entry?.token.address);
        const seed = MOCK_TOKENS.find((s) => s.token.address === entry?.token.address);

        const points: PositionPoint[] = [];
        const current = roundStart(now);
        for (let i = HISTORY_WINDOW; i >= 1; i--) {
          const end = current - (i - 1) * ROUND_DURATION_MS - 1;
          const order = ranked(end);
          const idx = order.findIndex((x) => x.seed.token.address === entry?.token.address);
          points.push({
            roundId: roundId(current - i * ROUND_DURATION_MS),
            at: new Date(end + 1).toISOString(),
            rank: idx >= 0 ? idx + 1 : null,
            marketCapUsd: seed && idx >= 0 ? capAt(seed, end) : null,
          });
        }

        return {
          entry,
          gapToKingUsd:
            entry && kingCap !== null && entry.token.marketCapUsd !== null
              ? kingCap - entry.token.marketCapUsd
              : null,
          roundsWon: entry ? won.length : null,
          totalTimeOnThroneMs: entry
            ? won.reduce((s, r) => s + (r.timeOnTopMs ?? 0), 0) + (entry.timeOnTopMs ?? 0)
            : null,
          totalBuybackUsd: entry ? won.reduce((s, r) => s + (r.buybackUsd ?? 0), 0) : null,
          totalBurnedTokens: entry ? won.reduce((s, r) => s + (r.burnedTokens ?? 0), 0) : null,
          history: points,
        };
      },
      () => ({
        entry: null,
        gapToKingUsd: null,
        roundsWon: null,
        totalTimeOnThroneMs: null,
        totalBuybackUsd: null,
        totalBurnedTokens: null,
        history: [],
      }),
    ),
};
