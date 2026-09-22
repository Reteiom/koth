"use client";

import { ROUND_DURATION_MS } from "@/lib/config";
import { formatClock } from "@/lib/format";
import { useNow } from "@/lib/hooks";

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
}: {
  endsAt: string | undefined;
  startsAt?: string;
  variant?: "inline" | "hero";
  label?: string;
}) {
  const clock = useRoundClock(endsAt, startsAt);
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
