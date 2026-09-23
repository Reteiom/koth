"use client";

import { useCurrentRound } from "@/lib/data/hooks";
import { Countdown, isWaitingForFirstRound } from "./Countdown";

/** Compact "Round #N · decision in 00:42:18" strip for page toolbars. */
export function RoundStrip() {
  const round = useCurrentRound();

  if (isWaitingForFirstRound(round)) {
    return (
      <div className="round-strip">
        <span className="pill-tag">Round 1</span>
        <span className="muted">Starts with the first launch</span>
      </div>
    );
  }

  return (
    <div className="round-strip">
      <span className="pill-tag">
        <span className="live-dot" />
        Round {round.data ? <span className="num">#{round.data.id}</span> : "—"}
      </span>
      <span className="muted">Next throne decision</span>
      <Countdown endsAt={round.data?.endsAt} />
    </div>
  );
}
