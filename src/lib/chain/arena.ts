/**
 * Reads the arena straight from the chain.
 *
 * Only tokens launched through this site are listed. Every launch from here
 * marks its salt with LAUNCH_SALT_PREFIX, so ours can be told apart from other
 * launches on the same contract by reading the launch transaction. Market
 * caps come from each token's pool price; names, images and socials come from
 * the token contracts. Runs on the server only — see app/api/arena.
 *
 * The public RPC is rate limited, so reads are batched through Multicall3,
 * immutable data is cached for the lifetime of the server process, and only
 * the tokens actually shown get their metadata loaded.
 */
import {
  createPublicClient,
  decodeFunctionData,
  http,
  parseAbi,
  parseAbiItem,
  type Address,
  type PublicClient,
} from "viem";
import {
  ARENA_FROM_BLOCK,
  LAUNCHPAD_ADDRESS,
  LAUNCH_SALT_PREFIX,
  launchpadAbi,
  launchpadChain,
} from "@/lib/contracts/launchpad";
import { ROUND_DURATION_MS } from "@/lib/config";
import type { LeaderboardEntry, Round, Token, TokenStatus } from "@/lib/types";

const TOKEN_LAUNCHED = parseAbiItem(
  "event TokenLaunched(address indexed token, address indexed deployer, address indexed dexFactory, address pairToken, address pool, uint256 dexId, uint256 launchConfigId, uint256 positionId, uint256 restrictionsEndBlock, uint256 initialBuyAmount)",
);

const tokenAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function logo() view returns (string)",
  "function description() view returns (string)",
  "function socials() view returns (string twitter, string telegram, string discord, string website, string farcaster)",
]);

const poolAbi = parseAbi([
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
]);


/** How many tokens the site ranks. */
const BOARD_SIZE = Number(process.env.ARENA_BOARD_SIZE || 100);

const LAUNCHES_TTL_MS = 30_000;
const PRICE_TTL_MS = 30_000;
const ETH_PRICE_TTL_MS = 60_000;

interface Launch {
  address: Address;
  key: string;
  pool: Address;
  creator: Address;
  blockNumber: bigint;
  source: Address;
  txHash: `0x${string}`;
  configId: bigint;
  /** Quote token of the pool (WETH). */
  pairToken: Address;
  /** True when the token is token0 of its pool, which inverts the price. */
  isToken0: boolean;
  supply: number;
}

interface TokenMeta {
  name: string;
  symbol: string;
  logoUrl: string | null;
  description: string | null;
  socials: { twitter: string; telegram: string; website: string };
  createdAt: string;
}

let client: PublicClient | null = null;
function rpc(): PublicClient {
  client ??= createPublicClient({
    chain: launchpadChain,
    transport: http(undefined, { batch: { wait: 20 }, retryCount: 4, retryDelay: 400 }),
  }) as PublicClient;
  return client;
}

/* ------------------------------------------------------------------ caches */

const launches = new Map<string, Launch>();
let launchesScannedTo: bigint | null = null;
let launchesCheckedAt = 0;

const configSupply = new Map<string, number>();
/** Whether a launch came from this site — immutable, so cached for good. */
const ownLaunch = new Map<string, boolean>();
const meta = new Map<string, TokenMeta>();

let capCache: { at: number; byToken: Map<string, number> } | null = null;
let ethUsdCache: { at: number; value: number | null } | null = null;

/** Shares one in-flight refresh between concurrent requests. */
const inFlight = new Map<string, Promise<unknown>>();
function once<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = run().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

async function chunked<T, R>(
  items: T[],
  size: number,
  run: (chunk: T[]) => Promise<R[]>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await run(items.slice(i, i + size))));
  }
  return out;
}

/* ----------------------------------------------------------------- loading */

async function loadLaunches(): Promise<Launch[]> {
  if (launchesScannedTo !== null && Date.now() - launchesCheckedAt < LAUNCHES_TTL_MS) {
    return [...launches.values()];
  }
  return once("launches", async () => {
    const head = await rpc().getBlockNumber();
    const from = launchesScannedTo === null ? ARENA_FROM_BLOCK : launchesScannedTo + 1n;
    if (head >= from) {
      const logs = await rpc().getLogs({
        address: LAUNCHPAD_ADDRESS,
        event: TOKEN_LAUNCHED,
        fromBlock: from,
        toBlock: head,
      });
      for (const log of logs) {
        const { token, pool, deployer, pairToken, launchConfigId } = log.args;
        if (!token || !pool || !deployer || !pairToken) continue;
        launches.set(token.toLowerCase(), {
          address: token,
          key: token.toLowerCase(),
          pool,
          creator: deployer,
          blockNumber: log.blockNumber,
          source: log.address as Address,
          txHash: log.transactionHash,
          configId: launchConfigId ?? 0n,
          pairToken,
          isToken0: token.toLowerCase() < pairToken.toLowerCase(),
          supply: 0,
        });
      }
    }
    launchesScannedTo = head;
    launchesCheckedAt = Date.now();
    return [...launches.values()];
  });
}

/**
 * True when the launch came from this site: its transaction called launchToken
 * with a salt carrying our marker.
 */
async function isOurs(launch: Launch): Promise<boolean> {
  const cached = ownLaunch.get(launch.key);
  if (cached !== undefined) return cached;
  let mine = false;
  try {
    const tx = await rpc().getTransaction({ hash: launch.txHash });
    const { args } = decodeFunctionData({ abi: launchpadAbi, data: tx.input });
    const salt = args?.[3];
    mine = typeof salt === "string" && salt.toLowerCase().startsWith(LAUNCH_SALT_PREFIX);
  } catch {
    mine = false;
  }
  ownLaunch.set(launch.key, mine);
  return mine;
}

/** The launches this site made, newest first. */
async function ourLaunches(): Promise<Launch[]> {
  const all = await loadLaunches();
  const mine: Launch[] = [];
  await chunked(all, 10, async (chunk) => {
    const flags = await Promise.all(chunk.map(isOurs));
    chunk.forEach((launch, index) => {
      if (flags[index]) mine.push(launch);
    });
    return [];
  });
  return mine;
}

/** Every token of a launch config shares its supply, so it is read once per config. */
async function loadSupplies(items: Launch[]): Promise<void> {
  const key = (l: Launch) => `${l.source.toLowerCase()}:${l.configId}`;
  const needed = [...new Map(items.map((l) => [key(l), l])).values()].filter(
    (l) => !configSupply.has(key(l)),
  );
  if (needed.length > 0) {
    const results = await rpc().multicall({
      allowFailure: true,
      contracts: needed.map(
        (l) =>
          ({
            address: l.source,
            abi: launchpadAbi,
            functionName: "getLaunchConfig",
            args: [l.configId],
          }) as const,
      ),
    });
    needed.forEach((l, index) => {
      const config = results[index];
      if (config.status !== "success") return;
      const totalSupply = (config.result as readonly unknown[])[3] as bigint;
      configSupply.set(key(l), Number(totalSupply) / 1e18);
    });
  }
  for (const launch of items) launch.supply = configSupply.get(key(launch)) ?? 0;
}

/** Market cap of every token in ETH, from its pool price. */
async function loadCaps(items: Launch[]): Promise<Map<string, number>> {
  if (capCache && Date.now() - capCache.at < PRICE_TTL_MS) return capCache.byToken;

  return once("caps", async () => {
    const byToken = new Map<string, number>();
    await chunked(items, 50, async (chunk) => {
      const results = await rpc().multicall({
        allowFailure: true,
        contracts: chunk.map(
          (l) => ({ address: l.pool, abi: poolAbi, functionName: "slot0" }) as const,
        ),
      });
      chunk.forEach((l, index) => {
        const slot0 = results[index];
        if (slot0.status !== "success" || l.supply <= 0) return;
        const tick = Number((slot0.result as readonly unknown[])[1]);
        // Uniswap v3 tick → price of token1 quoted in token0.
        const price1In0 = Math.pow(1.0001, tick);
        const priceInEth = l.isToken0 ? price1In0 : 1 / price1In0;
        if (!Number.isFinite(priceInEth)) return;
        byToken.set(l.key, priceInEth * l.supply);
      });
      return [];
    });
    capCache = { at: Date.now(), byToken };
    return byToken;
  });
}

async function loadMeta(items: Launch[]): Promise<void> {
  const missing = items.filter((l) => !meta.has(l.key));
  if (missing.length === 0) return;

  const blocks = [...new Set(missing.map((l) => l.blockNumber))];
  const times = new Map<bigint, number>();
  await chunked(blocks, 10, async (chunk) => {
    await Promise.all(
      chunk.map(async (blockNumber) => {
        const block = await rpc().getBlock({ blockNumber, includeTransactions: false });
        times.set(blockNumber, Number(block.timestamp) * 1000);
      }),
    );
    return [];
  });

  await chunked(missing, 25, async (chunk) => {
    const results = await rpc().multicall({
      allowFailure: true,
      contracts: chunk.flatMap((l) => [
        { address: l.address, abi: tokenAbi, functionName: "name" } as const,
        { address: l.address, abi: tokenAbi, functionName: "symbol" } as const,
        { address: l.address, abi: tokenAbi, functionName: "logo" } as const,
        { address: l.address, abi: tokenAbi, functionName: "description" } as const,
        { address: l.address, abi: tokenAbi, functionName: "socials" } as const,
      ]),
    });
    chunk.forEach((l, index) => {
      const at = index * 5;
      const name = results[at];
      const symbol = results[at + 1];
      const logo = results[at + 2];
      const description = results[at + 3];
      const socials = results[at + 4];
      if (name.status !== "success" || symbol.status !== "success") return;
      const social =
        socials.status === "success" ? (socials.result as readonly string[]) : ["", "", "", "", ""];
      meta.set(l.key, {
        name: name.result as string,
        symbol: symbol.result as string,
        logoUrl: logo.status === "success" && logo.result ? (logo.result as string) : null,
        description:
          description.status === "success" && description.result
            ? (description.result as string)
            : null,
        socials: { twitter: social[0] ?? "", telegram: social[1] ?? "", website: social[3] ?? "" },
        createdAt: new Date(times.get(l.blockNumber) ?? Date.now()).toISOString(),
      });
    });
    return [];
  });
}

/** ETH price in USD so market caps can be shown in dollars. Null if unavailable. */
async function ethUsd(): Promise<number | null> {
  if (ethUsdCache && Date.now() - ethUsdCache.at < ETH_PRICE_TTL_MS) return ethUsdCache.value;
  let value: number | null = null;
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", {
      signal: AbortSignal.timeout(4000),
    });
    const json = (await res.json()) as { data?: { amount?: string } };
    const amount = Number(json.data?.amount);
    value = Number.isFinite(amount) ? amount : null;
  } catch {
    value = null;
  }
  ethUsdCache = { at: Date.now(), value };
  return value;
}

function toToken(launch: Launch, capEth: number | null, usd: number | null): Token | null {
  const info = meta.get(launch.key);
  if (!info) return null;
  const marketCapUsd = capEth !== null && usd !== null ? capEth * usd : null;
  return {
    address: launch.address,
    name: info.name,
    symbol: info.symbol,
    logoUrl: info.logoUrl,
    description: info.description,
    createdAt: info.createdAt,
    creator: launch.creator,
    links: {
      website: info.socials.website || undefined,
      x: info.socials.twitter || undefined,
      telegram: info.socials.telegram || undefined,
    },
    marketCapUsd,
    priceUsd: marketCapUsd !== null && launch.supply > 0 ? marketCapUsd / launch.supply : null,
    // Volume and the hourly change need trade history, which the round bot keeps.
    volume24hUsd: null,
    change1hPct: null,
  };
}

/* ------------------------------------------------------------------ public */

/** Top tokens by market cap, highest first. */
export async function getTokens(limit = BOARD_SIZE): Promise<Token[]> {
  const items = await ourLaunches();
  await loadSupplies(items);
  const [caps, usd] = await Promise.all([loadCaps(items), ethUsd()]);

  const ranked = [...items].sort((a, b) => (caps.get(b.key) ?? -1) - (caps.get(a.key) ?? -1));
  const top = ranked.slice(0, limit);
  await loadMeta(top);

  return top
    .map((launch) => toToken(launch, caps.get(launch.key) ?? null, usd))
    .filter((t): t is Token => t !== null);
}

export async function getToken(address: string): Promise<Token | null> {
  const items = await ourLaunches();
  const launch = items.find((l) => l.key === address.toLowerCase());
  if (!launch) return null;
  await loadSupplies([launch]);
  const [caps, usd] = await Promise.all([loadCaps(items), ethUsd()]);
  await loadMeta([launch]);
  return toToken(launch, caps.get(launch.key) ?? null, usd);
}

function statusFor(rank: number): TokenStatus {
  if (rank === 1) return "king";
  if (rank <= 5) return "challenger";
  return "idle";
}

export async function getLeaderboard(limit = BOARD_SIZE): Promise<LeaderboardEntry[]> {
  const tokens = await getTokens(limit);
  return tokens.map((token, index) => ({
    rank: index + 1,
    token,
    status: statusFor(index + 1),
    // Time on top is tracked by the round bot, not by the chain.
    timeOnTopMs: null,
  }));
}

/**
 * When counting starts. Until ROUNDS_START_AT is set the counter stays at 0:
 * the hourly clock still runs, but no round has been played yet.
 */
const ROUNDS_START_AT = process.env.ROUNDS_START_AT
  ? Date.parse(process.env.ROUNDS_START_AT)
  : null;

function roundNumber(now: number): number {
  if (ROUNDS_START_AT === null || Number.isNaN(ROUNDS_START_AT) || now < ROUNDS_START_AT) return 0;
  return Math.floor((now - ROUNDS_START_AT) / ROUND_DURATION_MS) + 1;
}

/** Rounds run on the hour; winners are settled by the bot. */
export async function getCurrentRound(): Promise<Round> {
  const board = await getLeaderboard(1);
  const now = Date.now();
  const start = Math.floor(now / ROUND_DURATION_MS) * ROUND_DURATION_MS;
  return {
    id: roundNumber(now),
    startsAt: new Date(start).toISOString(),
    endsAt: new Date(start + ROUND_DURATION_MS).toISOString(),
    kingAddress: board[0]?.token.address ?? null,
  };
}
