# KOTH — King of the Hill launchpad

Tokens compete on market cap in one-hour rounds. The King of the Hill wins the
round, and platform fees buy back and burn the winner.

This repo is the **frontend / product layer** only. Round settlement, buyback,
burn and market-cap monitoring are handled by a separate bot and are not
implemented here.

## Stack

Next.js (App Router) · TypeScript · plain CSS (design tokens in
`src/app/globals.css`, components in `src/app/components.css`). Deploys to
Vercel with zero config.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Routes

| Route | Page |
| --- | --- |
| `/` | Hero, live King of the Hill, leaderboard, reward loop, protocol fee, how it works, history |
| `/leaderboard` | Full live leaderboard |
| `/tokens` | All tokens (search, sort) |
| `/tokens/[address]` | Token page: stats, throne status, countdown, position history, buyback & burn |
| `/history` | Throne History — settled rounds |
| `/how-it-works` | Full rules, reward loop, fees, FAQ |
| `/launch` | Launch form (validation + states; contract call is an integration point) |

## Data layer

All UI reads go through `LaunchpadDataSource` (`src/lib/data/source.ts`):

`getTokens · getToken · getLeaderboard · getCurrentKing · getCurrentRound · getRoundHistory · getRewardStats · getTokenCompetition`

- `src/lib/data/mock/` — simulated demo arena (fictional tokens). The UI shows a
  **Demo data** badge whenever this source is active.
- `src/lib/data/apiSource.ts` — HTTP source for the bot's backend. The expected
  endpoints are listed at the top of the file.
- Switch with `NEXT_PUBLIC_DATA_SOURCE=api` + `NEXT_PUBLIC_LAUNCHPAD_API_URL`.

Components use hooks from `src/lib/data/hooks.ts` (polling, loading / error /
empty states). No component imports mock data directly.

QA: append `?demo=empty`, `?demo=error` or `?demo=slow` to any URL while on
mock data.

## Integration points

- **Backend data** — implement the endpoints in `apiSource.ts`.
- **Token launch** — `launchToken()` in `src/lib/launch.ts`; set
  `NEXT_PUBLIC_LAUNCH_ENABLED=true` when wired.
- **Wallet** — `src/lib/wallet/WalletProvider.tsx` (injected EIP-1193). Set
  `NEXT_PUBLIC_CHAIN_ID` to enable the wrong-network check.
- **Explorer / trade links** — `NEXT_PUBLIC_EXPLORER_URL`,
  `NEXT_PUBLIC_TRADE_URL_TEMPLATE`.

See `.env.example` for every variable.

## Economics shown in the UI

- Protocol fee: **20%** (`PROTOCOL_FEE_BPS` in `src/lib/config.ts`)
- Fee vault: `0xe5d92f9f95cF9dCb278BE34E68C0cB3cd94a85C4`
- Round length: 1 hour
