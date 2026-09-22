import type { Metadata } from "next";
import { HistoryTable } from "@/components/arena/HistoryTable";
import { RewardStatsRow } from "@/components/sections/RewardFlow";

export const metadata: Metadata = {
  title: "Throne History",
  description: "Every settled round, its winner, and what was bought back and burned.",
};

export default function HistoryPage() {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Throne history</span>
        <h1>
          Every round. <span className="serif accent">Every king.</span>
        </h1>
        <p className="lead">
          Settled rounds with the winning token, its market cap at the close, and the buyback and
          burn that followed.
        </p>
      </header>
      <div className="card card-pad history-stats">
        <RewardStatsRow />
      </div>
      <HistoryTable />
    </div>
  );
}
