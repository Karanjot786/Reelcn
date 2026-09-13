"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

type Line = { text: string; ok?: boolean };

/** A terminal body that types its command and reveals its output once, on entering view. Fully shown at rest. */
export function TypeOnView({
  command,
  lines,
  render,
}: {
  command: string;
  lines: Line[];
  render?: { frames: number; output: string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(command.length);
  const [shown, setShown] = useState(lines.length);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers: number[] = [];
    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setTyped(0);
        setShown(0);
        setProgress(render ? 0 : 1);
        for (let i = 1; i <= command.length; i++) timers.push(window.setTimeout(() => setTyped(i), i * 28));
        const typedAt = command.length * 28;
        for (let k = 0; k < lines.length; k++)
          timers.push(window.setTimeout(() => setShown(k + 1), typedAt + 260 + k * 220));
        if (render) {
          timers.push(
            window.setTimeout(() => {
              const start = performance.now();
              const run = (now: number) => {
                const p = Math.min(1, (now - start) / 1800);
                setProgress(p);
                if (p < 1) raf = requestAnimationFrame(run);
              };
              raf = requestAnimationFrame(run);
            }, typedAt + 500),
          );
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      for (const timer of timers) clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [command, lines.length, render]);

  return (
    <div ref={ref} className="term-b">
      <div>
        <span className="hl">›</span> <span className="cmd">{command.slice(0, typed)}</span>
      </div>
      {lines.map((line, k) => (
        <div
          key={line.text}
          className={line.ok ? "ok" : undefined}
          style={{ opacity: k < shown ? 1 : 0, transition: "opacity 240ms ease-out" }}
        >
          {line.text}
        </div>
      ))}
      {render && (
        <div className="renderbar">
          <div className="row">
            <span>
              Rendering <span className="tab">{Math.round(progress * render.frames)}</span> / {render.frames} frames
            </span>
            <span className="ok" style={{ opacity: progress === 1 ? 1 : 0 }}>
              {render.output}
            </span>
          </div>
          <div className="bar">
            <i style={{ "--w": `${progress * 100}%` } as CSSProperties} />
          </div>
        </div>
      )}
    </div>
  );
}
