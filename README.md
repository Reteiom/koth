# Peak — token launchpad

Tokens compete on market cap in one-hour rounds. The token at the Peak wins the
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
| `/` | Hero, live Peak arena, leaderboard, reward loop, protocol fee, how it works, history |
| `/leaderboard` | Full live leaderboard |
| `/tokens` | All tokens (search, sort) |
| `/tokens/[address]` | Token page: stats, throne status, countdown, position history, buyback & burn |
| `/history` | Throne History — settled rounds |
| `/how-it-works` | Full rules, reward loop, fees, FAQ |
| `/launch` | Launch form (validation + states; contract call is an integration point) |

## Data layer

All UI reads go through `LaunchpadDataSource` (`src/lib/data/source.ts`):

`getTokens · getToken · getLeaderboard · getCurrentKing · getCurrentRound · getRoundHistory · getRewardStats · getTokenCompetition`

- `src/lib/data/emptySource.ts` — used until the API is configured: reports no
  data so the UI renders its empty states. No fake tokens anywhere.
- `src/lib/data/apiSource.ts` — HTTP source for the bot's backend. The expected
  endpoints are listed at the top of the file.
- Set `NEXT_PUBLIC_LAUNCHPAD_API_URL` to switch to the API automatically.

Components use hooks from `src/lib/data/hooks.ts` (polling, loading / error /
empty states).

## Integration points

- **Backend data** — implement the endpoints in `apiSource.ts`, then set
  `NEXT_PUBLIC_LAUNCHPAD_API_URL`.
- **Token launch** — live. `launchToken()` in `src/lib/launch.ts` calls the
  launchpad contract `0x0c37a24f5d23a486fa692d1500881d698b1f77a4` (the same one
  ponsfamily.com uses), simulating first and reading `launchFee()` per launch.
  The contract can pause launches (`launchEnabled()`), and the form says so.
- **Image uploads** — `POST /api/upload` stores the token image in Vercel Blob
  and returns its public URL, which is what the contract stores. Needs a Blob
  store (`BLOB_READ_WRITE_TOKEN`); without one the form asks for a link.
- **Wallet** — `src/lib/wallet/WalletProvider.tsx` (injected EIP-1193).
  Detects the wrong network and offers a switch to Robinhood Chain (adds the
  chain to the wallet if needed).
- **Network** — Robinhood Chain mainnet: chain id `4663`, explorer
  `https://robinhoodchain.blockscout.com` (source:
  https://docs.robinhood.com/chain/connecting).
- **Trade links** — `https://www.ponsfamily.com/launchpad/{address}`.

See `.env.example` for every variable.

## Economics shown in the UI

- Protocol fee: **20%** (`PROTOCOL_FEE_BPS` in `src/lib/config.ts`)
- Fee vault: `0xe5d92f9f95cF9dCb278BE34E68C0cB3cd94a85C4`
- Round length: 1 hour
