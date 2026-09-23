"use client";

import Link from "next/link";
import { feePct, PLATFORM_FEE_BPS, TRADING_FEE_BPS } from "@/lib/config";
import { useCurrentRound } from "@/lib/data/hooks";
import { Countdown, isWaitingForFirstRound } from "@/components/arena/Countdown";
import { Icon } from "@/components/ui/Icon";

const POINTS = [
  "Ranked by market cap",
  "1-hour rounds",
  "Winner bought back & burned",
  `${feePct(TRADING_FEE_BPS)}% trading fee · ${feePct(PLATFORM_FEE_BPS)}% to the vault`,
];

export function Hero() {
  const round = useCurrentRound();
  return (
    <section className="hero">
      <HillArt />
      <div className="container hero-inner">
        <a href="#arena" className="pill hero-pill">
          {isWaitingForFirstRound(round) ? (
            <>
              <span className="pill-tag">Round 1</span>
              Starts with the first launch
            </>
          ) : (
            <>
              <span className="pill-tag">
                <span className="live-dot" />
                Round {round.data ? <span className="num">#{round.data.id}</span> : "—"}
              </span>
              Throne decided in <Countdown endsAt={round.data?.endsAt} />
            </>
          )}
          <Icon name="arrowRight" className="hero-pill-arrow" />
        </a>

        <h1 className="hero-title">
          <span className="hero-kicker">Peak launchpad</span>
          Tokens fight for <br className="hero-br" />
          the <span className="serif accent">throne.</span>
        </h1>

        <p className="hero-sub">
          Launch a token and compete on market cap. Every hour the token on top takes the round —
          and platform fees buy it back and burn it.
        </p>

        <div className="hero-ctas">
          <Link href="/launch" className="btn btn-primary btn-lg">
            Launch a Token <Icon name="arrowRight" className="arrow" />
          </Link>
          <a href="#arena" className="btn btn-ghost btn-lg">
            <Icon name="crown" /> See the King
          </a>
        </div>

        <ul className="hero-points">
          {POINTS.map((p) => (
            <li key={p}>
              <Icon name="check" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Layered ridge lines with a lit summit — the "hill". */
function HillArt() {
  return (
    <svg
      className="hill-art"
      viewBox="0 0 1440 520"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="summit" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#d4f47c" stopOpacity="0.55" />
          <stop offset="1" stopColor="#d4f47c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ridge-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2a0e" stopOpacity="0.9" />
          <stop offset="1" stopColor="#050705" stopOpacity="1" />
        </linearGradient>
      </defs>
      <ellipse className="hill-summit" cx="720" cy="250" rx="260" ry="150" fill="url(#summit)" />
      <path
        d="M0 470 C 220 430 380 380 520 330 S 660 250 720 240 S 900 300 1000 340 S 1260 420 1440 440 V520 H0Z"
        fill="url(#ridge-fill)"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          className="hill-line"
          style={{ animationDelay: `${i * 0.6}s` }}
          d={`M0 ${480 + i * 10} C 220 ${440 + i * 12} 380 ${392 + i * 14} 520 ${344 + i * 16} S 660 ${266 + i * 18} 720 ${256 + i * 20} S 900 ${316 + i * 18} 1000 ${356 + i * 16} S 1260 ${432 + i * 12} 1440 ${452 + i * 10}`}
          fill="none"
          stroke="#d4f47c"
          strokeOpacity={0.28 - i * 0.05}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
