/**
 * Static product configuration.
 *
 * Only values that are part of the product definition live here. Anything that
 * depends on deployment (API URL, chain, explorer) comes from NEXT_PUBLIC_* env
 * variables — see `.env.example`.
 */

export const SITE = {
  name: "Peak",
  fullName: "Peak",
  tagline: "Tokens fight for the throne.",
  description:
    "A launchpad where tokens compete on market cap. Every hour the token at the Peak wins the round — and platform fees buy back and burn the winner.",
} as const;

/** Public vault address that receives platform fees. */
export const VAULT_ADDRESS = "0xe5d92f9f95cF9dCb278BE34E68C0cB3cd94a85C4";

/** Protocol fee shown in the product economics, in basis points (2000 = 20%). */
export const PROTOCOL_FEE_BPS = 2000;

/** Length of one Peak round. */
export const ROUND_DURATION_MS = 60 * 60 * 1000;

/**
 * Network the source launchpad runs on. Defaults are Robinhood Chain mainnet
 * as published at https://docs.robinhood.com/chain/connecting — env overrides
 * exist for testnet or preview deployments.
 */
export const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "Robinhood Chain";

/** Expected chain id (decimal). Robinhood Chain mainnet = 4663. */
export const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 4663);

/** Public RPC, used only when asking the wallet to add the network. */
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";

/** Block explorer base URL (Blockscout). */
export const EXPLORER_URL = (
  process.env.NEXT_PUBLIC_EXPLORER_URL || "https://robinhoodchain.blockscout.com"
).replace(/\/$/, "");

/**
 * Token page on the source launchpad. `{address}` is replaced with the token
 * address.
 */
export const TRADE_URL_TEMPLATE =
  process.env.NEXT_PUBLIC_TRADE_URL_TEMPLATE || "https://www.ponsfamily.com/launchpad/{address}";

/**
 * Base URL of the launchpad API. Defaults to this app's own chain-backed API
 * (see app/api/arena); point it at the round bot's backend once that exists.
 */
export const API_URL = (process.env.NEXT_PUBLIC_LAUNCHPAD_API_URL || "/api/arena").replace(
  /\/$/,
  "",
);

/** How often live views refresh. */
export const POLL_INTERVAL_MS = 10_000;

export function explorerAddressUrl(address: string): string | null {
  return EXPLORER_URL ? `${EXPLORER_URL}/address/${address}` : null;
}

export function explorerTxUrl(hash: string): string | null {
  return EXPLORER_URL ? `${EXPLORER_URL}/tx/${hash}` : null;
}

export function tradeUrl(address: string): string | null {
  return TRADE_URL_TEMPLATE ? TRADE_URL_TEMPLATE.replace("{address}", address) : null;
}

