/**
 * Static product configuration.
 *
 * Only values that are part of the product definition live here. Anything that
 * depends on deployment (API URL, chain, explorer) comes from NEXT_PUBLIC_* env
 * variables — see `.env.example`.
 */

export const SITE = {
  name: "KOTH",
  fullName: "King of the Hill",
  tagline: "Tokens fight for the throne.",
  description:
    "A launchpad where tokens compete on market cap. Every hour the King of the Hill wins the round — and platform fees buy back and burn the winner.",
} as const;

/** Public vault address that receives platform fees. */
export const VAULT_ADDRESS = "0xe5d92f9f95cF9dCb278BE34E68C0cB3cd94a85C4";

/** Protocol fee shown in the product economics, in basis points (2000 = 20%). */
export const PROTOCOL_FEE_BPS = 2000;

/** Length of one King of the Hill round. */
export const ROUND_DURATION_MS = 60 * 60 * 1000;

/** Network the source launchpad runs on. */
export const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "Robinhood Chain";

/**
 * Expected chain id (decimal). Left empty until confirmed — when empty the
 * wallet connector does not enforce a network.
 */
export const EXPECTED_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID
  ? Number(process.env.NEXT_PUBLIC_CHAIN_ID)
  : undefined;

/** Block explorer base URL, e.g. https://explorer.example.com. Links are hidden when empty. */
export const EXPLORER_URL = (process.env.NEXT_PUBLIC_EXPLORER_URL || "").replace(/\/$/, "");

/**
 * Trade link template on the source launchpad. `{address}` is replaced with the
 * token address. Hidden when empty.
 */
export const TRADE_URL_TEMPLATE = process.env.NEXT_PUBLIC_TRADE_URL_TEMPLATE || "";

/** "mock" (default) or "api". */
export const DATA_SOURCE: "mock" | "api" =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "mock";

/** Base URL of the launchpad backend (used when DATA_SOURCE === "api"). */
export const API_URL = (process.env.NEXT_PUBLIC_LAUNCHPAD_API_URL || "").replace(/\/$/, "");

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
