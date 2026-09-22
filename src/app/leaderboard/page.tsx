import type { Metadata } from "next";
import { LeaderboardTable } from "@/components/arena/LeaderboardTable";
import { RoundStrip } from "@/components/arena/RoundStrip";
import { DemoBadge } from "@/components/ui/States";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Every token in the arena, ranked live by market cap.",
};

export default function LeaderboardPage() {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Leaderboard</span>
        <h1>
          Ranked by <span className="serif accent">market cap.</span>
        </h1>
        <p className="lead">
          The token at #1 is the King of the Hill. Hold it when the round closes to win the buyback
          and burn.
        </p>
      </header>
      <div className="page-toolbar">
        <RoundStrip />
        <DemoBadge />
      </div>
      <LeaderboardTable />
    </div>
  );
}
