"use client";

import Link from "next/link";
import { explorerTxUrl } from "@/lib/config";
import { useRoundHistory } from "@/lib/data/hooks";
import { formatDateTime, formatDuration, formatNumber, formatUsd } from "@/lib/format";
import type { RoundResult } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { TokenAvatar } from "@/components/ui/TokenAvatar";

export function HistoryTable({ limit }: { limit?: number }) {
  const history = useRoundHistory(limit);
  const rows = history.data ?? [];

  return (
    <div className="hist card" role="table" aria-label="Throne history">
      <div className="hist-row hist-head" role="row">
        <span role="columnheader">Round</span>
        <span role="columnheader">Winner</span>
        <span role="columnheader" className="lb-right">
          Market cap
        </span>
        <span role="columnheader" className="lb-right lb-hide-md">
          Time on top
        </span>
        <span role="columnheader" className="lb-right lb-hide-sm">
          Buyback
        </span>
        <span role="columnheader" className="lb-right lb-hide-sm">
          Burned
        </span>
      </div>

      {history.status === "loading" && (
        <div aria-busy="true">
          {Array.from({ length: limit ?? 8 }, (_, i) => (
            <div className="hist-row" key={i}>
              <Skeleton width={60} />
              <span className="lb-token">
                <Skeleton width={30} height={30} radius={10} />
                <Skeleton width={100} />
              </span>
              <Skeleton width={70} style={{ justifySelf: "end" }} />
              <Skeleton width={50} style={{ justifySelf: "end" }} />
              <Skeleton width={60} style={{ justifySelf: "end" }} />
              <Skeleton width={60} style={{ justifySelf: "end" }} />
            </div>
          ))}
        </div>
      )}

      {history.status === "error" && !history.data && (
        <ErrorState title="History unavailable" error={history.error} onRetry={history.refetch} />
      )}

      {history.data && rows.length === 0 && (
        <EmptyState icon="history" title="No rounds settled yet">
          The first winner appears here when the current round closes.
        </EmptyState>
      )}

      <div role="rowgroup">
        {rows.map((r) => (
          <HistoryRow key={r.roundId} r={r} />
        ))}
      </div>
    </div>
  );
}

function TxValue({ value, hash }: { value: string; hash: string | null }) {
  const url = hash ? explorerTxUrl(hash) : null;
  if (!url) return <>{value}</>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="tx-link">
      {value}
      <Icon name="external" />
    </a>
  );
}

function HistoryRow({ r }: { r: RoundResult }) {
  return (
    <div className="hist-row hist-item" role="row">
      <span role="cell" className="hist-round">
        <span className="num">#{r.roundId}</span>
        <span className="muted">{formatDateTime(r.endedAt)}</span>
      </span>
      <span role="cell">
        <Link href={`/tokens/${r.winner.address}`} className="lb-token hist-winner">
          <TokenAvatar
            symbol={r.winner.symbol}
            address={r.winner.address}
            logoUrl={r.winner.logoUrl}
            size={30}
          />
          <span className="lb-token-text">
            <span className="lb-name">{r.winner.name}</span>
            <span className="lb-sub mono">${r.winner.symbol}</span>
          </span>
        </Link>
      </span>
      <span role="cell" className="lb-right lb-cap num">
        {formatUsd(r.marketCapUsd)}
        <span className="lb-show-sm muted">Buyback {formatUsd(r.buybackUsd)}</span>
      </span>
      <span role="cell" className="lb-right lb-hide-md num">
        {formatDuration(r.timeOnTopMs)}
      </span>
      <span role="cell" className="lb-right lb-hide-sm num">
        <TxValue value={formatUsd(r.buybackUsd)} hash={r.buybackTxHash} />
      </span>
      <span role="cell" className="lb-right lb-hide-sm num hist-burn">
        {r.burnedTokens !== null && <Icon name="flame" />}
        <TxValue value={formatNumber(r.burnedTokens)} hash={r.burnTxHash} />
      </span>
    </div>
  );
}
