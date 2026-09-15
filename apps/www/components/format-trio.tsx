"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import {
  FORMAT_SIZE,
  type Format,
  useDemo,
  useDemoScene,
  useNearViewport,
  usePrefersReducedMotion,
} from "./demo-player";

const FORMATS: Format[] = ["16x9", "9x16", "1x1"];

/** One demo in all three formats, kept in step, with one slider that scrubs all three. */
export function FormatTrio({ demoId, category }: { demoId: string; category: string }) {
  const box = useRef<HTMLDivElement>(null);
  // Three Players cost the landing page a two-second main-thread task at load; fetch and mount them only once the
  // section nears the viewport. An empty category loads nothing.
  const near = useNearViewport(box, "600px", true);
  const demo = useDemo(near ? category : "", demoId);
  const Scene = useDemoScene(demo);
  const reduced = usePrefersReducedMotion();
  const players = useRef<(PlayerRef | null)[]>([]);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!Scene) return;
    const live = () => players.current.filter((p): p is PlayerRef => p !== null);
    const observer = new IntersectionObserver(
      ([entry]) => {
        const all = live();
        if (entry?.isIntersecting && !reduced) {
          const f = all[0]?.getCurrentFrame() ?? 0;
          for (const p of all) {
            p.seekTo(f);
            p.play();
          }
        } else for (const p of all) p.pause();
      },
      { threshold: 0.2 },
    );
    if (box.current) observer.observe(box.current);
    // ponytail: resync by polling every 250 ms; three looping Players drift by a frame or two at most.
    const sync = window.setInterval(() => {
      const [lead, ...rest] = live();
      if (!lead?.isPlaying()) return;
      const f = lead.getCurrentFrame();
      setFrame(f);
      for (const p of rest) if (Math.abs(p.getCurrentFrame() - f) > 3) p.seekTo(f);
    }, 250);
    return () => {
      observer.disconnect();
      clearInterval(sync);
    };
  }, [Scene, reduced]);

  const seek = (f: number) => {
    setFrame(f);
    for (const p of players.current) {
      p?.pause();
      p?.seekTo(f);
    }
  };

  return (
    <>
      <div className="formats" ref={box}>
        {FORMATS.map((format, i) => {
          const { width, height } = FORMAT_SIZE[format];
          return (
            <figure className="fmt" key={format}>
              <div className="scr" style={{ aspectRatio: `${width} / ${height}` }}>
                {Scene && demo && (
                  <Player
                    ref={(p) => {
                      players.current[i] = p;
                    }}
                    component={Scene}
                    inputProps={{ theme: "midnight" }}
                    durationInFrames={demo.duration}
                    fps={30}
                    compositionWidth={width}
                    compositionHeight={height}
                    loop
                    acknowledgeRemotionLicense
                    style={{ width: "100%", height: "100%" }}
                  />
                )}
              </div>
              <figcaption>
                <b>{format.replace("x", ":")}</b>
                <span className="tab">
                  {width} × {height}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
      <label className="shared">
        <span>scrub all three</span>
        <input
          type="range"
          min={0}
          max={(demo?.duration ?? 1) - 1}
          value={frame}
          aria-label="Scrub all three formats"
          onChange={(event) => seek(Number(event.target.value))}
          onPointerUp={() => {
            if (!reduced) for (const p of players.current) p?.play();
          }}
        />
        <span className="tab">f{frame}</span>
      </label>
    </>
  );
}
