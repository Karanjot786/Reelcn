"use client";

import { useEffect, useRef, useState } from "react";
import { clock, type Film, sceneAt } from "@/lib/motion";

/** The film beside its scene plan. The playing scene's row lights up; a row seeks the film to its scene. */
export function PlanPlayer({ film, label }: { film: Film; label: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);

  // Autoplay, muted, only for viewers who allow motion and only while the film is on screen.
  useEffect(() => {
    const el = video.current;
    if (!el || !matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    const seen = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? el.play().catch(() => {}) : el.pause()),
      { threshold: 0.5 },
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  const seek = (start: number) => {
    const el = video.current;
    if (!el) return;
    el.currentTime = start;
    el.play().catch(() => {});
  };

  return (
    <div className="mp-player">
      <video
        ref={video}
        src={film.video}
        poster={film.poster}
        aria-label={label}
        muted
        loop
        playsInline
        controls
        preload="none"
        onTimeUpdate={(e) => setCurrent(sceneAt(film.scenes, e.currentTarget.currentTime))}
      />
      <ol className="mp-plan" aria-label="Scene plan">
        {film.scenes.map((scene, i) => (
          <li key={scene.name}>
            <button type="button" aria-current={i === current ? "true" : undefined} onClick={() => seek(scene.start)}>
              <span className="mp-t tab">{clock(scene.start)}</span>
              <span className="mp-name">{scene.name}</span>
              <span className="mp-words">{scene.words || "no words"}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
