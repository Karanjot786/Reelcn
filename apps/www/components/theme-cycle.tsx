"use client";
// biome-ignore-all lint/performance/noImgElement: static theme stills with width/height

import { useEffect, useRef, useState } from "react";
import { DemoPlayer, prefersReducedMotion, useNearViewport } from "./demo-player";

/** The ThemeProvider line cycling through every theme, a Player that follows it, and stills that stop the cycle. */
export function ThemeCycle({ themes }: { themes: string[] }) {
  const [index, setIndex] = useState(Math.max(0, themes.indexOf("sunset")));
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  // The Player autoplays, so it mounts only while the section is near the viewport and never renders off-screen.
  const near = useNearViewport(ref);

  useEffect(() => {
    if (!auto || prefersReducedMotion()) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearInterval(timer);
        if (entry?.isIntersecting) timer = window.setInterval(() => setIndex((i) => (i + 1) % themes.length), 2600);
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [auto, themes.length]);

  const theme = themes[index] ?? "midnight";
  return (
    <div ref={ref}>
      <div className="theme-code" aria-live="polite">
        <span className="tag">&lt;ThemeProvider</span> <span className="attr">theme=</span>"
        <span className="val">{theme}</span>"<span className="tag">&gt;</span>
      </div>
      <div className="theme-stage">
        {near ? (
          <DemoPlayer demoId="product-launch" category="templates" format="16x9" theme={theme} controls={false} />
        ) : (
          // Same box DemoPlayer renders while its demo loads, so nothing shifts when the Player mounts.
          <div className="player-frame" style={{ aspectRatio: "1920 / 1080" }} aria-hidden="true" />
        )}
      </div>
      <div className="theme-strip">
        {themes.map((name, i) => (
          <button
            key={name}
            type="button"
            aria-pressed={i === index}
            onClick={() => {
              setAuto(false);
              setIndex(i);
            }}
          >
            <img src={`/thumbs/theme-${name}.jpg`} alt="" width={480} height={270} loading="lazy" />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
