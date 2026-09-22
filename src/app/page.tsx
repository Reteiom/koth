import Link from "next/link";
import { HistoryTable } from "@/components/arena/HistoryTable";
import { LeaderboardTable } from "@/components/arena/LeaderboardTable";
import { LiveArena } from "@/components/arena/LiveArena";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LaunchBanner } from "@/components/sections/LaunchBanner";
import { ProtocolFee } from "@/components/sections/ProtocolFee";
import { RewardFlow, RewardStatsRow } from "@/components/sections/RewardFlow";
import { Icon } from "@/components/ui/Icon";

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="container arena-section" aria-label="Live King of the Hill">
        <LiveArena />
      </section>

      <section className="section container" id="leaderboard">
        <div className="section-head">
          <div>
            <span className="eyebrow">Leaderboard</span>
            <h2 className="h2">
              One metric. <span className="serif accent">Market cap.</span>
            </h2>
            <p className="lead">
              Every token in the arena, ranked live. The top spot is the throne — everyone else is
              chasing it.
            </p>
          </div>
          <Link href="/leaderboard" className="link">
            View full leaderboard <Icon name="arrowRight" />
          </Link>
        </div>
        <LeaderboardTable limit={8} />
      </section>

      <section className="section container" id="reward">
        <div className="section-head">
          <div>
            <span className="eyebrow">The reward</span>
            <h2 className="h2">
              Fees power the <span className="serif accent">throne.</span>
            </h2>
            <p className="lead">
              When a round closes, platform fees are used to buy back the winning token. Every
              token bought is burned — winning shrinks the winner&apos;s circulating supply.
            </p>
          </div>
        </div>
        <div className="reward card card-pad">
          <RewardFlow />
          <RewardStatsRow />
        </div>
        <div id="fees" className="fee-wrap">
          <ProtocolFee />
        </div>
      </section>

      <section className="section container" id="how-it-works">
        <div className="section-head">
          <div>
            <span className="eyebrow">How it works</span>
            <h2 className="h2">
              Launch. Compete. <span className="serif accent">Take the throne.</span>
            </h2>
          </div>
          <Link href="/how-it-works" className="link">
            Read the full rules <Icon name="arrowRight" />
          </Link>
        </div>
        <HowItWorks />
      </section>

      <section className="section container" id="history">
        <div className="section-head">
          <div>
            <span className="eyebrow">Throne history</span>
            <h2 className="h2">
              Past <span className="serif accent">kings.</span>
            </h2>
            <p className="lead">Every settled round, its winner, and what was bought back and burned.</p>
          </div>
          <Link href="/history" className="link">
            All rounds <Icon name="arrowRight" />
          </Link>
        </div>
        <HistoryTable limit={5} />
      </section>

      <section className="section container">
        <LaunchBanner />
      </section>
    </>
  );
}
