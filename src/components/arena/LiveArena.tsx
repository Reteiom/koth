"use client";

import Link from "next/link";
import { useRef } from "react";
import { useCurrentRound, useLeaderboard } from "@/lib/data/hooks";
import { formatDuration, formatPct, formatUsd } from "@/lib/format";
import { useFlip } from "@/lib/hooks";
import type { LeaderboardEntry } from "@/lib/types";
import { AnimatedValue } from "@/components/ui/AnimatedValue";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TokenAvatar } from "@/components/ui/TokenAvatar";
import { Countdown, isWaitingForFirstRound } from "./Countdown";

const usd = (v: number) => formatUsd(v);

/** The live Peak panel: current king, countdown and closest challengers. */
export function LiveArena() {
  const board = useLeaderboard();
  const round = useCurrentRound();
  const listRef = useRef<HTMLOListElement>(null);

  const entries = board.data ?? [];
  const king = entries[0];
  const challengers = entries.slice(1, 5);
  useFlip(listRef, entries.map((e) => e.token.address).join());

  return (
    <div className="arena card" id="arena">
      <div className="arena-top">
        <div className="arena-title">
          <span className="pill-tag">
            <span className="live-dot" /> Live
          </span>
          <span className="arena-round">
            Round <span className="num">{round.data ? `#${round.data.id}` : "—"}</span>
          </span>
        </div>
      </div>

      {board.status === "loading" && <ArenaSkeleton />}
      {board.status === "error" && !board.data && (
        <ErrorState title="Arena data unavailable" error={board.error} onRetry={board.refetch} />
      )}
      {board.data && entries.length === 0 && (
        <EmptyState
          icon="mountain"
          title="The hill is empty"
          action={
            <Link href="/launch" className="btn btn-primary btn-sm">
              Launch the first token <Icon name="arrowRight" className="arrow" />
            </Link>
          }
        >
          No tokens are competing yet. The first launch takes the throne.
        </EmptyState>
      )}

      {king && (
        <div className="arena-grid">
          {/* Keyed by address: a new king remounts and plays the crowning animation. */}
          <KingPanel key={king.token.address} entry={king} />

          <div className="arena-side">
            <Countdown
              variant="hero"
              endsAt={round.data?.endsAt}
              startsAt={round.data?.startsAt}
              waiting={isWaitingForFirstRound(round)}
            />

            <div className="challengers">
              <div className="challengers-head">
                <span>Challengers</span>
                <span>Gap to throne</span>
              </div>
              {challengers.length === 0 ? (
                <p className="challengers-empty">No challengers yet. The throne is uncontested.</p>
              ) : (
                <ol ref={listRef}>
                  {challengers.map((e) => (
                    <ChallengerRow key={e.token.address} entry={e} kingCap={king.token.marketCapUsd} />
                  ))}
                </ol>
              )}
              <Link href="/leaderboard" className="link challengers-more">
                Full leaderboard <Icon name="arrowRight" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KingPanel({ entry }: { entry: LeaderboardEntry }) {
  const { token } = entry;
  const change = token.change1hPct;
  return (
    <Link href={`/tokens/${token.address}`} className="king">
      <div className="king-glow" aria-hidden="true" />
      <div className="king-crown" aria-hidden="true">
        <Icon name="crown" />
      </div>
      <div className="king-id">
        <div className="king-avatar">
          <TokenAvatar symbol={token.symbol} address={token.address} logoUrl={token.logoUrl} size={76} />
        </div>
        <div className="king-name">
          <StatusBadge status="king" />
          <h3>{token.name}</h3>
          <span className="muted mono">${token.symbol}</span>
        </div>
      </div>

      <div className="king-cap">
        <span className="stat-label">Market cap</span>
        <AnimatedValue value={token.marketCapUsd} format={usd} className="king-cap-value" />
      </div>

      <dl className="king-stats">
        <div>
          <dt>Rank</dt>
          <dd className="num">#1</dd>
        </div>
        <div>
          <dt>1H change</dt>
          <dd className={`num ${change === null ? "" : change >= 0 ? "up" : "down"}`}>
            {formatPct(change)}
          </dd>
        </div>
        <div>
          <dt>On top this round</dt>
          <dd className="num">{formatDuration(entry.timeOnTopMs)}</dd>
        </div>
      </dl>
      <span className="king-cta">
        View token <Icon name="arrowRight" />
      </span>
    </Link>
  );
}

function ChallengerRow({ entry, kingCap }: { entry: LeaderboardEntry; kingCap: number | null }) {
  const { token } = entry;
  const cap = token.marketCapUsd;
  const ratio = cap !== null && kingCap ? Math.min(1, cap / kingCap) : 0;
  const gap = cap !== null && kingCap !== null ? kingCap - cap : null;
  return (
    <li data-flip-key={token.address}>
      <Link href={`/tokens/${token.address}`} className="challenger">
        <span className="challenger-rank num">{entry.rank}</span>
        <TokenAvatar symbol={token.symbol} address={token.address} logoUrl={token.logoUrl} size={34} />
        <span className="challenger-id">
          <span className="challenger-name">{token.name}</span>
          <span className="challenger-cap num">{formatUsd(cap)}</span>
        </span>
        <span className="challenger-gap">
          <span className="num">{gap === null ? "—" : `−${formatUsd(gap)}`}</span>
          <span className="gap-bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${ratio})` }} />
          </span>
        </span>
      </Link>
    </li>
  );
}

function ArenaSkeleton() {
  return (
    <div className="arena-grid" aria-busy="true" aria-label="Loading arena">
      <div className="king king-loading">
        <div className="king-id">
          <Skeleton width={76} height={76} radius={22} />
          <div style={{ display: "grid", gap: 10 }}>
            <Skeleton width={70} height={22} radius={99} />
            <Skeleton width={180} height={30} />
          </div>
        </div>
        <Skeleton width={220} height={48} />
        <Skeleton height={56} />
      </div>
      <div className="arena-side">
        <Skeleton height={124} radius={18} />
        <div style={{ display: "grid", gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={52} radius={14} />
          ))}
        </div>
      </div>
    </div>
  );
}
