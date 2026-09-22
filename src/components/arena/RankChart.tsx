"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateTime, formatUsd } from "@/lib/format";
import type { PositionPoint } from "@/lib/types";

const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

/**
 * Rank at the close of each round (rank 1 at the top). Single series, so no
 * legend; hover shows a crosshair + tooltip; a visually hidden table mirrors it.
 * Drawn at the container's pixel width so labels never scale down.
 */
export function RankChart({ points }: { points: PositionPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [W, setW] = useState(640);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ranked = points.filter((p) => p.rank !== null);
  if (ranked.length < 2) {
    return <p className="chart-empty">Position history appears after this token completes a few rounds.</p>;
  }

  const maxRank = Math.max(5, ...ranked.map((p) => p.rank!));
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (rank: number) => PAD.top + ((rank - 1) / (maxRank - 1)) * ih;

  // Step line: rank holds for the round, then jumps.
  let d = "";
  points.forEach((p, i) => {
    if (p.rank === null) return;
    const px = x(i);
    const py = y(p.rank);
    d += d ? ` H${px} V${py}` : `M${px} ${py}`;
  });

  const ticks = Array.from(new Set([1, Math.ceil(maxRank / 2), maxRank]));
  const hp = hover !== null ? points[hover] : null;

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * iw;
    const i = Math.round((rel / iw) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  }

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Rank at the close of each round">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={PAD.left - 10} y={y(t)} className="chart-axis" textAnchor="end" dominantBaseline="middle">
              #{t}
            </text>
          </g>
        ))}
        {/* The throne band: rank #1. */}
        <rect x={PAD.left} y={y(1) - 7} width={iw} height={14} rx={7} className="chart-throne" />
        <path d={d} className="chart-line" />
        {points.map((p, i) =>
          p.rank === 1 ? <circle key={i} cx={x(i)} cy={y(1)} r={3} className="chart-win" /> : null,
        )}
        <text x={PAD.left} y={H - 6} className="chart-axis">
          {formatDateTime(points[0].at)}
        </text>
        <text x={W - PAD.right} y={H - 6} className="chart-axis" textAnchor="end">
          {formatDateTime(points[points.length - 1].at)}
        </text>

        {hp && hover !== null && hp.rank !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + ih} className="chart-cross" />
            <circle cx={x(hover)} cy={y(hp.rank)} r={5} className="chart-dot" />
          </g>
        )}
        <rect
          x={PAD.left}
          y={0}
          width={iw}
          height={H}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {hp && hover !== null && (
        <div
          className="chart-tip"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            transform: `translateX(${hover > points.length / 2 ? "-105%" : "5%"})`,
          }}
        >
          <strong className="num">{hp.rank ? `#${hp.rank}` : "Not ranked"}</strong>
          <span>Round #{hp.roundId}</span>
          <span className="num">{formatUsd(hp.marketCapUsd)}</span>
        </div>
      )}

      <table className="sr-only">
        <caption>Rank at the close of each round</caption>
        <thead>
          <tr>
            <th>Round</th>
            <th>Rank</th>
            <th>Market cap</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.roundId}>
              <td>{p.roundId}</td>
              <td>{p.rank ?? "—"}</td>
              <td>{formatUsd(p.marketCapUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
