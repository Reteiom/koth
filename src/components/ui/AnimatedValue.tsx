"use client";

import { useTween } from "@/lib/hooks";
import { DASH } from "@/lib/format";

/** Number that tweens between updates. Null renders a dash, never 0. */
export function AnimatedValue({
  value,
  format,
  className,
}: {
  value: number | null;
  format: (v: number) => string;
  className?: string;
}) {
  const shown = useTween(value);
  return <span className={`num ${className ?? ""}`}>{shown === null ? DASH : format(shown)}</span>;
}
