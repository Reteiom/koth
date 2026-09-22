"use client";

import Link from "next/link";
import { useRef } from "react";
import { useLeaderboard } from "@/lib/data/hooks";
import { formatDuration, formatPct, formatUsd } from "@/lib/format";
import { useFlip } from "@/lib/hooks";
import type { LeaderboardEntry } from "@/lib/types";
import { AnimatedValue } from "@/components/ui/AnimatedValue";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TokenAvatar } from "@/components/ui/TokenAvatar";

const usd = (v: number) => formatUsd(v);

export function LeaderboardTable({ limit }: { limit?: number }) {
  const board = useLeaderboard();
  const bodyRef = useRef<HTMLDivElement>(null);
  const rows = (board.data ?? []).slice(0, limit);
  useFlip(bodyRef, rows.map((r) => r.token.address).join());

  return (
    <div className="lb card" role="table" aria-label="Peak leaderboard">
      <div className="lb-row lb-head" role="row">
        <span role="columnheader">#</span>
        <span role="columnheader">Token</span>
        <span role="columnheader" className="lb-right">
          Market cap
        </span>
        <span role="columnheader" className="lb-right lb-hide-sm">
          1H
        </span>
        <span role="columnheader" className="lb-hide-md">
          Status
        </span>
        <span role="columnheader" className="lb-right lb-hide-md">
          Time on top
        </span>
      </div>

      {board.status === "loading" && (
        <div aria-busy="true">
          {Array.from({ length: limit ?? 8 }, (_, i) => (
            <div className="lb-row" key={i}>
              <Skeleton width={16} />
              <span className="lb-token">
                <Skeleton width={34} height={34} radius={11} />
                <Skeleton width={120} />
              </span>
              <Skeleton width={70} style={{ justifySelf: "end" }} />
              <Skeleton width={44} style={{ justifySelf: "end" }} />
              <Skeleton width={80} height={22} radius={99} />
              <Skeleton width={50} style={{ justifySelf: "end" }} />
            </div>
          ))}
        </div>
      )}

      {board.status === "error" && !board.data && (
        <ErrorState title="Leaderboard unavailable" error={board.error} onRetry={board.refetch} />
      )}

      {board.data && rows.length === 0 && (
        <EmptyState icon="mountain" title="No tokens in the arena">
          Tokens appear here as soon as they launch.
        </EmptyState>
      )}

      <div ref={bodyRef} role="rowgroup">
        {rows.map((entry) => (
          <Row key={entry.token.address} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function Row({ entry }: { entry: LeaderboardEntry }) {
  const { token, rank } = entry;
  const change = token.change1hPct;
  const isKing = entry.status === "king";
  return (
    <Link
      href={`/tokens/${token.address}`}
      className={`lb-row lb-item${isKing ? " is-king" : ""}`}
      role="row"
      data-flip-key={token.address}
    >
      <span role="cell" className="lb-rank num">
        {isKing ? <Icon name="crown" /> : rank}
      </span>
      <span role="cell" className="lb-token">
        <TokenAvatar symbol={token.symbol} address={token.address} logoUrl={token.logoUrl} size={34} />
        <span className="lb-token-text">
          <span className="lb-name">{token.name}</span>
          <span className="lb-sub">
            <span className="mono">${token.symbol}</span>
            <span className="lb-show-md">
              <StatusBadge status={entry.status} />
            </span>
          </span>
        </span>
      </span>
      <span role="cell" className="lb-right lb-cap">
        <AnimatedValue value={token.marketCapUsd} format={usd} />
        <span className={`lb-show-sm num ${change === null ? "muted" : change >= 0 ? "up" : "down"}`}>
          {formatPct(change)}
        </span>
      </span>
      <span
        role="cell"
        className={`lb-right lb-hide-sm num ${change === null ? "muted" : change >= 0 ? "up" : "down"}`}
      >
        {formatPct(change)}
      </span>
      <span role="cell" className="lb-hide-md">
        <StatusBadge status={entry.status} />
      </span>
      <span role="cell" className="lb-right lb-hide-md num muted-2">
        {entry.timeOnTopMs ? formatDuration(entry.timeOnTopMs) : "—"}
      </span>
    </Link>
  );
}
