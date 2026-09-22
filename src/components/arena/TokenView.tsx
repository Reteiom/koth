"use client";

import Link from "next/link";
import { tradeUrl } from "@/lib/config";
import { useCurrentRound, useToken, useTokenCompetition } from "@/lib/data/hooks";
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPct,
  formatPrice,
  formatUsd,
} from "@/lib/format";
import type { Address, Token, TokenCompetition } from "@/lib/types";
import { AnimatedValue } from "@/components/ui/AnimatedValue";
import { CopyAddress } from "@/components/ui/CopyAddress";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TokenAvatar } from "@/components/ui/TokenAvatar";
import { Countdown } from "./Countdown";
import { RankChart } from "./RankChart";

const usd = (v: number) => formatUsd(v);

export function TokenView({ address }: { address: Address }) {
  const token = useToken(address);
  const comp = useTokenCompetition(address);

  if (token.status === "loading") return <TokenSkeleton />;
  if (token.status === "error" && !token.data) {
    return (
      <div className="card token-state">
        <ErrorState title="Token data unavailable" error={token.error} onRetry={token.refetch} />
      </div>
    );
  }
  if (!token.data) {
    return (
      <div className="card token-state">
        <EmptyState
          icon="search"
          title="Token not found"
          action={
            <Link href="/tokens" className="btn btn-ghost btn-sm">
              Browse tokens
            </Link>
          }
        >
          This address is not a token in the arena.
        </EmptyState>
      </div>
    );
  }

  return <TokenDetail token={token.data} comp={comp.data} compError={comp.status === "error" && !comp.data} />;
}

function TokenDetail({
  token,
  comp,
  compError,
}: {
  token: Token;
  comp: TokenCompetition | undefined;
  compError: boolean;
}) {
  const entry = comp?.entry ?? null;
  const trade = tradeUrl(token.address);
  const change = token.change1hPct;

  const links = [
    token.links.website && { href: token.links.website, label: "Website" },
    token.links.x && { href: token.links.x, label: "X" },
    token.links.telegram && { href: token.links.telegram, label: "Telegram" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div className="token-page">
      <header className="token-head">
        <TokenAvatar symbol={token.symbol} address={token.address} logoUrl={token.logoUrl} size={72} />
        <div className="token-head-text">
          <div className="token-head-row">
            <h1>{token.name}</h1>
            {entry && <StatusBadge status={entry.status} />}
          </div>
          <div className="token-head-row">
            <span className="mono muted">${token.symbol}</span>
            <CopyAddress address={token.address} label="contract address" />
          </div>
        </div>
        <div className="token-head-actions">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              {l.label} <Icon name="arrowUpRight" />
            </a>
          ))}
          {trade && (
            <a href={trade} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
              Trade <Icon name="arrowUpRight" />
            </a>
          )}
        </div>
      </header>

      <div className="stat-grid">
        <Stat label="Market cap" highlight>
          <AnimatedValue value={token.marketCapUsd} format={usd} />
        </Stat>
        <Stat label="Price">
          <span className="num">{formatPrice(token.priceUsd)}</span>
        </Stat>
        <Stat label="Volume 24h">
          <span className="num">{formatUsd(token.volume24hUsd)}</span>
        </Stat>
        <Stat label="1H change">
          <span className={`num ${change === null ? "" : change >= 0 ? "up" : "down"}`}>{formatPct(change)}</span>
        </Stat>
        <Stat label="Rank">
          {comp ? <span className="num">{entry ? `#${entry.rank}` : "—"}</span> : <Skeleton width={40} height={24} />}
        </Stat>
      </div>

      <div className="token-grid-2">
        <ThronePanel comp={comp} compError={compError} />

        <section className="card card-pad">
          <div className="panel-head">
            <h2>Position history</h2>
            <span className="muted">Rank at each round close</span>
          </div>
          {comp ? (
            <RankChart points={comp.history} />
          ) : compError ? (
            <p className="chart-empty">Position history is unavailable.</p>
          ) : (
            <Skeleton height={200} radius={12} />
          )}
        </section>
      </div>

      <div className="token-grid-2">
        <section className="card card-pad">
          <div className="panel-head">
            <h2>Buyback &amp; burn</h2>
            <Icon name="flame" className="panel-icon" />
          </div>
          {!comp ? (
            compError ? (
              <p className="chart-empty">Reward data is unavailable.</p>
            ) : (
              <Skeleton height={80} radius={12} />
            )
          ) : comp.roundsWon ? (
            <dl className="mini-stats">
              <div>
                <dt>Rounds won</dt>
                <dd className="num">{formatNumber(comp.roundsWon)}</dd>
              </div>
              <div>
                <dt>Bought back</dt>
                <dd className="num">{formatUsd(comp.totalBuybackUsd)}</dd>
              </div>
              <div>
                <dt>Burned</dt>
                <dd className="num">{formatNumber(comp.totalBurnedTokens)}</dd>
              </div>
            </dl>
          ) : (
            <p className="chart-empty">
              No buybacks yet. Winning a round triggers a buyback and burn of this token.
            </p>
          )}
        </section>

        <section className="card card-pad">
          <div className="panel-head">
            <h2>About</h2>
          </div>
          <p className="token-desc">{token.description || "No description provided."}</p>
          <dl className="mini-stats">
            <div>
              <dt>Launched</dt>
              <dd>{formatDateTime(token.createdAt)}</dd>
            </div>
            {token.creator && (
              <div className="wide">
                <dt>Creator</dt>
                <dd>
                  <CopyAddress address={token.creator} label="creator address" />
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </div>
  );
}

function ThronePanel({ comp, compError }: { comp: TokenCompetition | undefined; compError: boolean }) {
  const round = useCurrentRound();
  const entry = comp?.entry ?? null;
  const isKing = entry?.status === "king";

  return (
    <section className={`card card-pad throne-panel${isKing ? " is-king" : ""}`}>
      <div className="panel-head">
        <h2>{isKing ? "At the Peak" : "The throne"}</h2>
        {isKing && <Icon name="crown" className="panel-icon" />}
      </div>

      {!comp && !compError && <Skeleton height={60} radius={12} />}
      {compError && <p className="chart-empty">Competition data is unavailable.</p>}
      {comp && !entry && <p className="chart-empty">This token is not ranked in the current round.</p>}
      {comp && entry && (
        <p className="throne-status">
          {isKing ? (
            <>This token holds the throne. Keep it until the round closes to win.</>
          ) : (
            <>
              Rank <strong className="num">#{entry.rank}</strong> ·{" "}
              <strong className="num">{formatUsd(comp.gapToKingUsd)}</strong> of market cap to the throne.
            </>
          )}
        </p>
      )}

      <Countdown variant="hero" endsAt={round.data?.endsAt} startsAt={round.data?.startsAt} />

      {comp && (
        <dl className="mini-stats">
          <div>
            <dt>On top this round</dt>
            <dd className="num">{entry?.timeOnTopMs ? formatDuration(entry.timeOnTopMs) : "—"}</dd>
          </div>
          <div>
            <dt>Time on throne</dt>
            <dd className="num">{comp.totalTimeOnThroneMs ? formatDuration(comp.totalTimeOnThroneMs) : "—"}</dd>
          </div>
          <div>
            <dt>Rounds won</dt>
            <dd className="num">{formatNumber(comp.roundsWon)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

function Stat({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`stat card${highlight ? " is-highlight" : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{children}</span>
    </div>
  );
}

function TokenSkeleton() {
  return (
    <div className="token-page" aria-busy="true" aria-label="Loading token">
      <header className="token-head">
        <Skeleton width={72} height={72} radius={22} />
        <div className="token-head-text">
          <Skeleton width={220} height={34} />
          <Skeleton width={260} height={20} />
        </div>
      </header>
      <div className="stat-grid">
        {Array.from({ length: 5 }, (_, i) => (
          <div className="stat card" key={i}>
            <Skeleton width={70} height={12} />
            <Skeleton width={100} height={26} />
          </div>
        ))}
      </div>
      <div className="token-grid-2">
        <Skeleton height={280} radius={22} />
        <Skeleton height={280} radius={22} />
      </div>
    </div>
  );
}
