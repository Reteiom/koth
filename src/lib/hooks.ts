"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Current time, ticking every `intervalMs`. Null until mounted (avoids hydration mismatch). */
export function useNow(intervalMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the clock after mount
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Smoothly tweens a number when it changes. Returns the value to display.
 * The first value is shown immediately.
 */
export function useTween(target: number | null, durationMs = 700): number | null {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const valueRef = useRef(target);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (target === null || valueRef.current === null) {
      from.current = target;
      setValue(target);
      return;
    }
    from.current = valueRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from.current! + (target - from.current!) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

/**
 * FLIP animation for reordered children. Children must carry `data-flip-key`.
 * Call with a value that changes whenever the order may have changed.
 */
export function useFlip(container: RefObject<HTMLElement | null>, trigger: unknown) {
  const positions = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-flip-key]"));
    const next = new Map<string, number>();
    for (const el of items) {
      const key = el.dataset.flipKey!;
      const top = el.getBoundingClientRect().top;
      next.set(key, top);
      const prev = positions.current.get(key);
      if (prev === undefined) continue;
      const delta = prev - top;
      if (Math.abs(delta) < 1) continue;
      el.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
        { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      if (delta > 0) {
        el.animate(
          [
            { backgroundColor: "rgba(212, 244, 124, 0.10)" },
            { backgroundColor: "rgba(212, 244, 124, 0)" },
          ],
          { duration: 1400, easing: "ease-out" },
        );
      }
    }
    positions.current = next;
  }, [container, trigger]);
}
