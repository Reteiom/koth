import type { Metadata } from "next";
import Link from "next/link";
import { ProtocolFee } from "@/components/sections/ProtocolFee";
import { RewardFlow } from "@/components/sections/RewardFlow";
import { Icon } from "@/components/ui/Icon";
import { NETWORK_NAME, PROTOCOL_FEE_BPS } from "@/lib/config";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Tokens compete on market cap in one-hour rounds. The winner is bought back with platform fees and burned.",
};

const CYCLE: { title: string; text: string }[] = [
  {
    title: "Launch",
    text: `A creator launches a token through the platform on ${NETWORK_NAME}.`,
  },
  {
    title: "Compete",
    text: "The token enters the King of the Hill arena alongside every other token on the platform.",
  },
  {
    title: "Climb",
    text: "Tokens are ranked by market cap. The higher a token's market cap relative to the rest, the higher it sits on the leaderboard.",
  },
  {
    title: "Hold the throne",
    text: "Each round lasts one hour. The token that holds King of the Hill under the round rules is the round's winner.",
  },
  {
    title: "Reward",
    text: "When the round closes, platform fees are put to work for the winner.",
  },
  {
    title: "Buyback",
    text: "Fees are used to buy back the winning token from the market.",
  },
  {
    title: "Burn",
    text: "The bought-back tokens are burned, permanently reducing the winner's circulating supply.",
  },
];

const FAQ = [
  {
    q: "What decides the King of the Hill?",
    a: "Market cap. It is the only metric the arena ranks by. The token with the highest market cap is at #1.",
  },
  {
    q: "How long is a round?",
    a: "One hour. A new round starts as soon as the previous one closes, so there is always a fight for the throne.",
  },
  {
    q: "What does the winner get?",
    a: "A buyback: platform fees are used to buy the winning token, and those tokens are burned. The winner's circulating supply goes down.",
  },
  {
    q: `What is the ${PROTOCOL_FEE_BPS / 100}% protocol fee?`,
    a: "It is the platform fee that funds the economy. Fees are collected in a public vault — its address is shown on this page — and power the round reward.",
  },
  {
    q: "Who runs the buyback and burn?",
    a: "Settlement is performed by the protocol's automation after each round. Every settled round is listed in Throne History.",
  },
  {
    q: "Which network is this on?",
    a: `${NETWORK_NAME}.`,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">How it works</span>
        <h1>
          Trading fuels the <span className="serif accent">throne.</span>
        </h1>
        <p className="lead">
          Competition creates attention. Attention creates volume. Volume fuels the throne — and
          the throne rewards the winner with a buyback and burn.
        </p>
      </header>

      <ol className="cycle">
        {CYCLE.map((s, i) => (
          <li key={s.title} className="cycle-step card">
            <span className="cycle-index num">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="section" id="reward">
        <div className="section-head">
          <div>
            <span className="eyebrow">The reward loop</span>
            <h2 className="h2">
              Fees <span className="muted">→</span> buyback <span className="muted">→</span>{" "}
              <span className="serif accent">burn.</span>
            </h2>
          </div>
        </div>
        <div className="reward card card-pad">
          <RewardFlow />
        </div>
      </section>

      <section className="section" id="fees">
        <div className="section-head">
          <div>
            <span className="eyebrow">Fees</span>
            <h2 className="h2">
              Simple, <span className="serif accent">public.</span>
            </h2>
          </div>
        </div>
        <ProtocolFee />
      </section>

      <section className="section" id="faq">
        <div className="section-head">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2 className="h2">Questions</h2>
          </div>
        </div>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q} className="faq-item card">
              <summary>
                {f.q}
                <Icon name="arrowRight" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section cta-row">
        <Link href="/launch" className="btn btn-primary btn-lg">
          Launch a Token <Icon name="arrowRight" className="arrow" />
        </Link>
        <Link href="/leaderboard" className="btn btn-ghost btn-lg">
          See the leaderboard
        </Link>
      </section>
    </div>
  );
}
