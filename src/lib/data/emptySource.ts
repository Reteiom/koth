import type { LaunchpadDataSource } from "./source";

/**
 * Used until the launchpad backend is configured.
 *
 * It reports "nothing yet" rather than inventing tokens, so the UI renders its
 * empty states. Set NEXT_PUBLIC_LAUNCHPAD_API_URL to switch to the real API.
 */
export const emptySource: LaunchpadDataSource = {
  kind: "empty",
  getTokens: async () => [],
  getToken: async () => null,
  getLeaderboard: async () => [],
  getCurrentKing: async () => null,
  getCurrentRound: async () => null,
  getRoundHistory: async () => [],
  getRewardStats: async () => ({
    pendingFeesUsd: null,
    totalBuybackUsd: null,
    totalRoundsSettled: null,
  }),
  getTokenCompetition: async () => ({
    entry: null,
    gapToKingUsd: null,
    roundsWon: null,
    totalTimeOnThroneMs: null,
    totalBuybackUsd: null,
    totalBurnedTokens: null,
    history: [],
  }),
};
