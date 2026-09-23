"use client";

import { ROUND_DURATION_MS } from "@/lib/config";
import { formatClock } from "@/lib/format";
import { useNow } from "@/lib/hooks";

/** True once the round endpoint has answered that no round exists yet. */
export function isWaitingForFirstRound(round: { status: string; data: unknown }) {
  return round.status === "success" && round.data === null;
}

/** Remaining time and progress for a round ending at `endsAt` (ISO). */
export function useRoundClock(endsAt: string | undefined, startsAt?: string) {
  const now = useNow(1000);
  if (!endsAt || now === null) return null;
  const end = Date.parse(endsAt);
  const start = startsAt ? Date.parse(startsAt) : end - ROUND_DURATION_MS;
  const remaining = Math.max(0, end - now);
  const progress = Math.min(1, Math.max(0, (now - start) / (end - start)));
  return { remaining, progress, ended: remaining === 0 };
}

/**
 * Round countdown. Pass timestamps from the API; the component only renders.
 * `variant="hero"` is the large display used next to the King.
 */
export function Countdown({
  endsAt,
  startsAt,
  variant = "inline",
  label = "Next throne decision",
  waiting = false,
}: {
  endsAt: string | undefined;
  startsAt?: string;
  variant?: "inline" | "hero";
  label?: string;
  /** No round yet: the clock starts with the first token launched here. */
  waiting?: boolean;
}) {
  const clock = useRoundClock(endsAt, startsAt);

  if (waiting) {
    if (variant === "inline") {
      return <span className="countdown-inline is-waiting">starts with the first launch</span>;
    }
    return (
      <div className="countdown is-waiting">
        <div className="countdown-label">Round clock</div>
        <div className="countdown-waiting">Starts with the first launch</div>
        <p className="countdown-note">
          Round 1 begins the moment the first token is launched here.
        </p>
      </div>
    );
  }

  const text = clock ? (clock.ended ? "Settling…" : formatClock(clock.remaining)) : "--:--:--";
  const urgent = clock !== null && !clock.ended && clock.remaining < 5 * 60_000;

  if (variant === "inline") {
    return (
      <span className={`countdown-inline num${urgent ? " is-urgent" : ""}`} aria-label={label}>
        {text}
      </span>
    );
  }

  return (
    <div className={`countdown${urgent ? " is-urgent" : ""}`}>
      <div className="countdown-label">
        <span className="live-dot" />
        {label}
      </div>
      <div className="countdown-value num" role="timer" aria-live="off">
        {text}
      </div>
      <div
        className="countdown-bar"
        role="progressbar"
        aria-label="Round progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clock ? Math.round(clock.progress * 100) : undefined}
      >
        <span style={{ transform: `scaleX(${clock?.progress ?? 0})` }} />
      </div>
    </div>
  );
}
