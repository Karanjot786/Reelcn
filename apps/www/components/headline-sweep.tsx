"use client";

import { useEffect, useRef } from "react";

/** An amber playhead scrubs across the headline once and reveals it. Without JS, or with reduced motion, the text is simply there. */
export function HeadlineSweep({ text }: { text: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const revealRef = useRef<HTMLSpanElement>(null);
  const sweepRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    const reveal = revealRef.current;
    const sweep = sweepRef.current;
    if (!heading || !reveal || !sweep || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now() + 150;
    const duration = 950;
    let raf = 0;
    reveal.style.setProperty("--p", "0%");
    sweep.style.opacity = "1";
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - (1 - p) ** 3;
      const lines = [...reveal.getClientRects()];
      const box = heading.getBoundingClientRect();
      const target = eased * lines.reduce((sum, line) => sum + line.width, 0);
      let before = 0;
      for (const [index, line] of lines.entries()) {
        if (before + line.width >= target || index === lines.length - 1) {
          sweep.style.left = `${line.left - box.left + Math.min(line.width, target - before)}px`;
          sweep.style.top = `${line.top - box.top - 6}px`;
          sweep.style.bottom = `${box.bottom - line.bottom - 6}px`;
          break;
        }
        before += line.width;
      }
      reveal.style.setProperty("--p", `${(eased * 100).toFixed(2)}%`);
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        sweep.style.transition = "opacity 300ms ease-out";
        sweep.style.opacity = "0";
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <h1 ref={headingRef} id="hero-title">
      <span ref={revealRef} className="reveal">
        {text}
      </span>
      <span ref={sweepRef} className="sweep" aria-hidden="true" />
    </h1>
  );
}
