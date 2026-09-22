import { defineChain, parseAbi } from "viem";
import { EXPLORER_URL, EXPECTED_CHAIN_ID, NETWORK_NAME, RPC_URL } from "@/lib/config";

/**
 * The launchpad contract tokens are created through — the same one the source
 * launchpad (ponsfamily.com) uses on Robinhood Chain: it is the contract that
 * emitted every recent TokenLaunched event, and its launches are enabled.
 */
export const LAUNCHPAD_ADDRESS = (process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT ||
  "0xf4fc0cd27fc8ecf17e55ee4c3f7201897df3eb75") as `0x${string}`;

/**
 * Older launchpad deployments. New tokens always go through LAUNCHPAD_ADDRESS,
 * but tokens launched earlier still belong in the arena.
 */
export const LEGACY_LAUNCHPAD_ADDRESSES = (
  process.env.NEXT_PUBLIC_LEGACY_LAUNCHPADS || "0x0c37a24f5d23a486fa692d1500881d698b1f77a4"
)
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean) as `0x${string}`[];

/** Launch config and DEX selected for new tokens (the launchpad's defaults). */
export const LAUNCH_CONFIG_ID = BigInt(process.env.NEXT_PUBLIC_LAUNCH_CONFIG_ID || 0);
export const LAUNCH_DEX_ID = BigInt(process.env.NEXT_PUBLIC_LAUNCH_DEX_ID || 0);

export const launchpadAbi = parseAbi([
  "function launchEnabled() view returns (bool)",
  "function launchFee() view returns (uint256)",
  "function launchToken((string name, string symbol, string logo, string description, (string twitter, string telegram, string discord, string website, string farcaster) socials, address feeWallet) params, uint256 launchConfigId, uint256 dexId, bytes32 salt) payable returns (address token)",
  "function getLaunchConfig(uint256 id) view returns (address pairToken, uint256 reserved, int24 startingTick, uint256 totalSupply, uint16 maxWalletBps, uint16 maxTxBps, uint32 restrictionBlocks, uint24 poolFee, bool enabled, bool routerRequiresDeadline)",
  "event TokenLaunched(address indexed token, address indexed deployer, address indexed dexFactory, address pairToken, address pool, uint256 dexId, uint256 launchConfigId, uint256 positionId, uint256 restrictionsEndBlock, uint256 initialBuyAmount)",
]);

export const launchpadChain = defineChain({
  id: EXPECTED_CHAIN_ID,
  name: NETWORK_NAME,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  // Standard Multicall3 deployment, used to batch the arena reads.
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
  blockExplorers: EXPLORER_URL
    ? { default: { name: "Explorer", url: EXPLORER_URL } }
    : undefined,
});
