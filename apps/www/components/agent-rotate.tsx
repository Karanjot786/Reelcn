"use client";

import { type CSSProperties, type Ref, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AGENT_MARKS } from "./agent-marks";

/** How long each agent holds before the next one rolls in. */
const HOLD = 2600;

/** One agent: its mark, then its name split into letters so they can arrive one after another. */
function Layer({ n, state, ref }: { n: number; state: "first" | "in" | "out"; ref?: Ref<HTMLSpanElement> }) {
  const { name, mark } = AGENT_MARKS[n];
  return (
    <span ref={ref} className={`ar-layer ar-${state}`}>
      <span className="ar-mark">{mark(`${state}-${n}`)}</span>
      <span className="ar-name">
        {[...name].map((c, k) => (
          <span key={`${c}${k}`} style={{ "--k": k } as CSSProperties}>
            {c === " " ? " " : c}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * The agent in the hero headline: a pill that cycles through the agents the skill works with.
 * Decorative: the headline carries "your agent" for screen readers, so this is hidden from them.
 */
export function AgentRotate() {
  const [{ i, prev }, setTurn] = useState<{ i: number; prev: number | null }>({ i: 0, prev: null });
  const [width, setWidth] = useState<number>();
  const current = useRef<HTMLSpanElement>(null);

  // Advance on a timer; pause while the tab is hidden so it never jumps several agents at once.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => clearInterval(timer);
    const start = () => {
      stop();
      timer = setInterval(() => setTurn((t) => ({ i: (t.i + 1) % AGENT_MARKS.length, prev: t.i })), HOLD);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // The pill takes the width of the incoming agent, so the line glides instead of jumping.
  // A ResizeObserver keeps it right when the font loads or the viewport changes the type size.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure each time a new agent mounts
  useLayoutEffect(() => {
    const el = current.current;
    if (!el) return;
    const measure = () => setWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [i]);

  return (
    <span className="ar" aria-hidden="true" style={width ? { width } : undefined}>
      {prev !== null && <Layer key={`out-${prev}-${i}`} n={prev} state="out" />}
      <Layer key={`in-${i}`} n={i} state={prev === null ? "first" : "in"} ref={current} />
    </span>
  );
}
