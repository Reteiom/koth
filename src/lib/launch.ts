/**
 * Token launch through the launchpad contract (see lib/contracts/launchpad.ts).
 *
 * The transaction is always simulated before the wallet is asked to sign, so
 * reverts surface as a message instead of a failed transaction.
 */
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  keccak256,
  parseEther,
  toHex,
  BaseError,
  UserRejectedRequestError,
} from "viem";
import {
  LAUNCHPAD_ADDRESS,
  LAUNCH_CONFIG_ID,
  LAUNCH_DEX_ID,
  LAUNCH_SALT_PREFIX,
  launchpadAbi,
  launchpadChain,
} from "@/lib/contracts/launchpad";
import { LAUNCHES_OPEN, VAULT_ADDRESS } from "@/lib/config";
import type { Eip1193Provider } from "@/lib/wallet/eip1193";
import type { LaunchTokenInput, LaunchTokenResult } from "@/lib/types";

export class LaunchPausedError extends Error {
  constructor(message = "Launches are currently paused on the launchpad contract.") {
    super(message);
    this.name = "LaunchPausedError";
  }
}

export class LaunchRejectedError extends Error {
  constructor() {
    super("The transaction was rejected in your wallet.");
    this.name = "LaunchRejectedError";
  }
}

export const LIMITS = {
  nameMax: 32,
  symbolMin: 2,
  symbolMax: 10,
  descriptionMax: 280,
} as const;

export type LaunchErrors = Partial<Record<keyof LaunchTokenInput, string>>;

function isHttpOrIpfs(value: string) {
  if (value.startsWith("ipfs://")) return value.length > "ipfs://".length;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function isUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function validateLaunch(input: LaunchTokenInput): LaunchErrors {
  const errors: LaunchErrors = {};
  const name = input.name.trim();
  const symbol = input.symbol.trim();

  if (!name) errors.name = "Name is required.";
  else if (name.length > LIMITS.nameMax) errors.name = `Keep it under ${LIMITS.nameMax} characters.`;

  if (!symbol) errors.symbol = "Ticker is required.";
  else if (!/^[A-Z0-9]+$/.test(symbol)) errors.symbol = "Use letters A–Z and digits only.";
  else if (symbol.length < LIMITS.symbolMin || symbol.length > LIMITS.symbolMax)
    errors.symbol = `${LIMITS.symbolMin}–${LIMITS.symbolMax} characters.`;

  if (input.description.length > LIMITS.descriptionMax)
    errors.description = `Keep it under ${LIMITS.descriptionMax} characters.`;

  if (!input.image.trim()) errors.image = "Image link is required.";
  else if (!isHttpOrIpfs(input.image.trim())) errors.image = "Use an https:// or ipfs:// link.";

  if (input.website && !isUrl(input.website)) errors.website = "Enter a full URL (https://…).";
  if (input.x && !isUrl(input.x)) errors.x = "Enter a full URL (https://x.com/…).";
  if (input.telegram && !isUrl(input.telegram)) errors.telegram = "Enter a full URL (https://t.me/…).";

  const buy = input.initialBuyEth.trim();
  if (buy) {
    if (!/^\d*\.?\d*$/.test(buy) || Number(buy) < 0) errors.initialBuyEth = "Enter an amount in ETH.";
    else if (Number(buy) > 0 && Number(buy) < 0.0001) errors.initialBuyEth = "Too small — use at least 0.0001.";
  }

  return errors;
}

function publicClient() {
  return createPublicClient({ chain: launchpadChain, transport: http() });
}

/** Contract state the launch form needs: whether launches are on and the fee. */
export async function getLaunchInfo(): Promise<{ enabled: boolean; feeWei: bigint }> {
  const client = publicClient();
  const [enabled, feeWei] = await Promise.all([
    client.readContract({ address: LAUNCHPAD_ADDRESS, abi: launchpadAbi, functionName: "launchEnabled" }),
    client.readContract({ address: LAUNCHPAD_ADDRESS, abi: launchpadAbi, functionName: "launchFee" }),
  ]);
  return { enabled, feeWei };
}

/**
 * Per-launch salt: our marker followed by 28 random bytes, so the launch stays
 * unique and is still recognisable as ours on-chain.
 */
function newSalt(symbol: string): `0x${string}` {
  const random = keccak256(toHex(`${symbol}:${Date.now()}:${Math.random()}`));
  return `${LAUNCH_SALT_PREFIX}${random.slice(2 + 8)}` as `0x${string}`;
}

export async function launchToken(
  input: LaunchTokenInput,
  provider: Eip1193Provider,
): Promise<LaunchTokenResult> {
  // Guard here too, not only in the form: nothing reaches the wallet while paused.
  if (!LAUNCHES_OPEN) throw new LaunchPausedError("Launching from this site is paused for now.");

  const walletClient = createWalletClient({ chain: launchpadChain, transport: custom(provider) });
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("Connect a wallet to launch.");

  const client = publicClient();
  const { enabled, feeWei } = await getLaunchInfo();
  if (!enabled) throw new LaunchPausedError();

  const initialBuyWei = input.initialBuyEth.trim() ? parseEther(input.initialBuyEth.trim()) : 0n;
  const params = {
    name: input.name.trim(),
    symbol: input.symbol.trim(),
    logo: input.image.trim(),
    description: input.description.trim(),
    socials: {
      twitter: input.x.trim(),
      telegram: input.telegram.trim(),
      discord: "",
      website: input.website.trim(),
      farcaster: "",
    },
    // The token's share of trading fees funds the platform's buyback & burn,
    // so its fee wallet is the vault rather than the creator.
    feeWallet: VAULT_ADDRESS as `0x${string}`,
  } as const;

  try {
    const { request, result } = await client.simulateContract({
      account,
      address: LAUNCHPAD_ADDRESS,
      abi: launchpadAbi,
      functionName: "launchToken",
      args: [params, LAUNCH_CONFIG_ID, LAUNCH_DEX_ID, newSalt(params.symbol)],
      value: feeWei + initialBuyWei,
    });

    const txHash = await walletClient.writeContract(request);
    await client.waitForTransactionReceipt({ hash: txHash });
    return { address: result, txHash };
  } catch (error) {
    if (error instanceof BaseError && error.walk((e) => e instanceof UserRejectedRequestError)) {
      throw new LaunchRejectedError();
    }
    throw error;
  }
}
