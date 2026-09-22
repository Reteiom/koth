"use client";

import { useRewardStats } from "@/lib/data/hooks";
import { formatNumber, formatUsd } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/Icon";
import { DemoBadge, Skeleton } from "@/components/ui/States";

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "vault", title: "Platform fees", text: "Collected from trading activity into the vault." },
  { icon: "crown", title: "Winning token", text: "The King when the hour closes." },
  { icon: "refresh", title: "Buyback", text: "Fees buy the winner on the open market." },
  { icon: "flame", title: "Burn", text: "Bought tokens are burned. Supply shrinks." },
];

export function RewardFlow() {
  return (
    <div className="flow" aria-label="Reward flow: fees, winning token, buyback, burn">
      {STEPS.map((s, i) => (
        <div className="flow-step" key={s.title} style={{ ["--i" as string]: i }}>
          <div className={`flow-node${i === 3 ? " is-burn" : ""}`}>
            <Icon name={s.icon} />
          </div>
          <div className="flow-text">
            <span className="flow-index num">0{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flow-link" aria-hidden="true">
              <span />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function RewardStatsRow() {
  const stats = useRewardStats();
  const items = [
    { label: "Fees accrued this round", value: stats.data ? formatUsd(stats.data.pendingFeesUsd) : null },
    { label: "Total bought back", value: stats.data ? formatUsd(stats.data.totalBuybackUsd) : null },
    {
      label: "Rounds settled",
      value: stats.data ? formatNumber(stats.data.totalRoundsSettled) : null,
    },
  ];
  return (
    <div className="reward-stats">
      {items.map((it) => (
        <div key={it.label} className="reward-stat">
          <span className="stat-label">{it.label}</span>
          {stats.status === "loading" ? (
            <Skeleton width={90} height={26} />
          ) : stats.status === "error" && !stats.data ? (
            <span className="reward-stat-value muted">Unavailable</span>
          ) : (
            <span className="reward-stat-value num">{it.value}</span>
          )}
        </div>
      ))}
      <div className="reward-stats-badge">
        <DemoBadge />
      </div>
    </div>
  );
}
