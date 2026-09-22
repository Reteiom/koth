/**
 * DEMO FIXTURES — fictional tokens used only to render the UI before the
 * backend is connected. None of these tokens, addresses or numbers exist
 * on-chain. Addresses are deliberately zero-padded so they read as fake.
 */
import type { Address, Token } from "@/lib/types";

export interface MockTokenSeed {
  token: Omit<Token, "marketCapUsd" | "priceUsd" | "volume24hUsd" | "change1hPct">;
  /** Base market cap the simulation oscillates around. */
  baseCapUsd: number;
  /** Relative amplitude of the oscillation. */
  volatility: number;
  /** Oscillation period in minutes. */
  periodMin: number;
  phase: number;
  supply: number;
}

const addr = (n: number) => `0x${n.toString(16).padStart(40, "0")}` as Address;
const created = (daysAgo: number) =>
  new Date(Date.UTC(2026, 8, 20) - daysAgo * 86_400_000).toISOString();

const SUPPLY = 1_000_000_000;

export const MOCK_TOKENS: MockTokenSeed[] = [
  {
    token: {
      address: addr(1),
      name: "Summit",
      symbol: "PEAK",
      logoUrl: null,
      description: "Demo token. Built to sit at the top.",
      createdAt: created(6),
      creator: addr(101),
      links: { website: "https://example.com" },
    },
    baseCapUsd: 412_000,
    volatility: 0.16,
    periodMin: 47,
    phase: 0.4,
    supply: SUPPLY,
  },
  {
    token: {
      address: addr(2),
      name: "Iron Crown",
      symbol: "CROWN",
      logoUrl: null,
      description: "Demo token. Heavy is the head.",
      createdAt: created(4),
      creator: addr(102),
      links: {},
    },
    baseCapUsd: 398_000,
    volatility: 0.18,
    periodMin: 38,
    phase: 2.1,
    supply: SUPPLY,
  },
  {
    token: {
      address: addr(3),
      name: "Moss",
      symbol: "MOSS",
      logoUrl: null,
      description: "Demo token. Slow growth, deep roots.",
      createdAt: created(9),
      creator: addr(103),
      links: {},
    },
    baseCapUsd: 351_000,
    volatility: 0.2,
    periodMin: 55,
    phase: 4.0,
    supply: SUPPLY,
  },
  {
    token: {
      address: addr(4),
      name: "Ember",
      symbol: "EMBR",
      logoUrl: null,
      description: "Demo token.",
      createdAt: created(2),
      creator: addr(104),
      links: {},
    },
    baseCapUsd: 288_000,
    volatility: 0.26,
    periodMin: 29,
    phase: 1.2,
    supply: SUPPLY,
  },
  {
    token: {
      address: addr(5),
      name: "Granite",
      symbol: "GRNT",
      logoUrl: null,
      description: "Demo token.",
      createdAt: created(12),
      creator: addr(105),
      links: {},
    },
    baseCapUsd: 244_000,
    volatility: 0.12,
    periodMin: 64,
    phase: 5.3,
    supply: SUPPLY,
  },
  {
    token: {
      address: addr(6),
      name: "Vanguard",
      symbol: "VNGD",
      logoUrl: null,
      description: "Demo token.",
      createdAt: created(1),
      creator: addr(106),
      links: {},
    },
    baseCapUsd: 176_000,
    volatility: 0.34,
    periodMin: 22,
    phase: 0.9,
    supply: SUPPLY,
  },
  {
    token: {
      address: addr(7),
      name: "Lantern",
      symbol: "LNTN",
      logoUrl: null,
      description: "Demo token.",
      createdAt: created(7),
      creator: addr(107),
      links: {},
    },
    baseCapUsd: 131_000,
    volatility: 0.22,
    periodMin: 41,
    phase: 3.3,
    supply: SUPPLY,
  },
  {
    token: {
      address: addr(8),
      name: "Fern",
      symbol: "FERN",
      logoUrl: null,
      description: "Demo token.",
      createdAt: created(3),
      creator: addr(108),
      links: {},
    },
    baseCapUsd: 94_000,
    volatility: 0.3,
    periodMin: 33,
    phase: 2.7,
    supply: SUPPLY,
  },
  {
    token: {
      address: addr(9),
      name: "Obsidian",
      symbol: "OBSD",
      logoUrl: null,
      description: "Demo token.",
      createdAt: created(15),
      creator: addr(109),
      links: {},
    },
    baseCapUsd: 61_000,
    volatility: 0.14,
    periodMin: 70,
    phase: 4.6,
    supply: SUPPLY,
  },
  {
    token: {
      address: addr(10),
      name: "Sprout",
      symbol: "SPRT",
      logoUrl: null,
      description: "Demo token. Launched today.",
      createdAt: created(0),
      creator: addr(110),
      links: {},
    },
    baseCapUsd: 38_000,
    volatility: 0.4,
    periodMin: 18,
    phase: 1.8,
    supply: SUPPLY,
  },
];
