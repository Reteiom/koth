import { NextResponse } from "next/server";
import { getCurrentRound, getLeaderboard, getToken, getTokens } from "@/lib/chain/arena";
import type { RewardStats, TokenCompetition } from "@/lib/types";

/**
 * Chain-backed launchpad API.
 *
 * Serves the endpoints described in lib/data/apiSource.ts from on-chain data,
 * so tokens launched here show up on the site without a separate backend.
 * Round settlement, buybacks and burns are the bot's job — those endpoints
 * report "nothing yet" until it fills them in.
 */
export const revalidate = 0;

const EMPTY_REWARDS: RewardStats = {
  pendingFeesUsd: null,
  totalBuybackUsd: null,
  totalRoundsSettled: null,
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "cache-control": "public, max-age=10, stale-while-revalidate=30" },
  });
}

export async function GET(_request: Request, ctx: RouteContext<"/api/arena/[[...path]]">) {
  const { path = [] } = await ctx.params;
  const route = path.join("/");

  try {
    if (route === "" || route === "tokens") return json(await getTokens());
    if (route === "leaderboard") return json(await getLeaderboard());
    if (route === "king") return json((await getLeaderboard(1))[0] ?? null);
    if (route === "rounds/current") return json(await getCurrentRound());
    if (route === "rounds/history") return json([]);
    if (route === "rewards") return json(EMPTY_REWARDS);

    if (path[0] === "tokens" && path[1]) {
      const address = path[1];
      if (path[2] === "competition") {
        const board = await getLeaderboard();
        const entry = board.find((e) => e.token.address.toLowerCase() === address.toLowerCase());
        const king = board[0]?.token.marketCapUsd ?? null;
        const competition: TokenCompetition = {
          entry: entry ?? null,
          gapToKingUsd:
            entry && king !== null && entry.token.marketCapUsd !== null
              ? king - entry.token.marketCapUsd
              : null,
          // Everything below is round history, which the bot reports.
          roundsWon: null,
          totalTimeOnThroneMs: null,
          totalBuybackUsd: null,
          totalBurnedTokens: null,
          history: [],
        };
        return json(competition);
      }
      if (!path[2]) {
        const token = await getToken(address);
        // Not ours or not a token: an answer, not an error — the page says so.
        return json(token ?? null);
      }
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : "Chain read failed";
    return json({ error: message }, 502);
  }
}
