"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLeaderboard } from "@/lib/data/hooks";
import { formatPct, formatRelative, formatUsd } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { DemoBadge, EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TokenAvatar } from "@/components/ui/TokenAvatar";

type Sort = "cap" | "change" | "new";

const SORTS: { id: Sort; label: string }[] = [
  { id: "cap", label: "Market cap" },
  { id: "change", label: "1H change" },
  { id: "new", label: "Newest" },
];

export function TokenGrid() {
  // The leaderboard already carries every token plus its rank and status.
  const board = useLeaderboard();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("cap");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (board.data ?? []).filter(
      (e) =>
        !q ||
        e.token.name.toLowerCase().includes(q) ||
        e.token.symbol.toLowerCase().includes(q) ||
        e.token.address.toLowerCase() === q,
    );
    const by = {
      cap: (a: (typeof list)[0], b: (typeof list)[0]) => a.rank - b.rank,
      change: (a: (typeof list)[0], b: (typeof list)[0]) =>
        (b.token.change1hPct ?? -Infinity) - (a.token.change1hPct ?? -Infinity),
      new: (a: (typeof list)[0], b: (typeof list)[0]) =>
        Date.parse(b.token.createdAt) - Date.parse(a.token.createdAt),
    }[sort];
    return [...list].sort(by);
  }, [board.data, query, sort]);

  return (
    <>
      <div className="page-toolbar">
        <label className="search">
          <Icon name="search" />
          <span className="sr-only">Search tokens</span>
          <input
            type="search"
            placeholder="Search name, ticker or address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="segmented" role="group" aria-label="Sort tokens">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={sort === s.id ? "is-active" : undefined}
              aria-pressed={sort === s.id}
              onClick={() => setSort(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <DemoBadge />
      </div>

      {board.status === "loading" && (
        <div className="token-grid" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="token-card card" key={i}>
              <div className="token-card-top">
                <Skeleton width={44} height={44} radius={14} />
                <Skeleton width={80} height={22} radius={99} />
              </div>
              <Skeleton width="60%" height={20} />
              <Skeleton width="40%" height={26} />
            </div>
          ))}
        </div>
      )}

      {board.status === "error" && !board.data && (
        <div className="card">
          <ErrorState title="Tokens unavailable" error={board.error} onRetry={board.refetch} />
        </div>
      )}

      {board.data && items.length === 0 && (
        <div className="card">
          {query ? (
            <EmptyState icon="search" title="No matches">
              Nothing matches “{query}”. Try a ticker or the full contract address.
            </EmptyState>
          ) : (
            <EmptyState
              icon="rocket"
              title="No tokens yet"
              action={
                <Link href="/launch" className="btn btn-primary btn-sm">
                  Launch a Token <Icon name="arrowRight" className="arrow" />
                </Link>
              }
            >
              Be the first to enter the arena.
            </EmptyState>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="token-grid">
          {items.map((e) => {
            const change = e.token.change1hPct;
            return (
              <Link
                href={`/tokens/${e.token.address}`}
                key={e.token.address}
                className={`token-card card${e.status === "king" ? " is-king" : ""}`}
              >
                <div className="token-card-top">
                  <TokenAvatar
                    symbol={e.token.symbol}
                    address={e.token.address}
                    logoUrl={e.token.logoUrl}
                    size={44}
                  />
                  <StatusBadge status={e.status} />
                </div>
                <div>
                  <h3>{e.token.name}</h3>
                  <span className="muted mono">${e.token.symbol}</span>
                </div>
                <div className="token-card-stats">
                  <div>
                    <span className="stat-label">Market cap</span>
                    <span className="token-card-cap num">{formatUsd(e.token.marketCapUsd)}</span>
                  </div>
                  <div className="lb-right">
                    <span className="stat-label">Rank · 1H</span>
                    <span className="num">
                      #{e.rank}{" "}
                      <span className={change === null ? "muted" : change >= 0 ? "up" : "down"}>
                        {formatPct(change)}
                      </span>
                    </span>
                  </div>
                </div>
                <span className="token-card-foot muted">
                  Launched {formatRelative(e.token.createdAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
