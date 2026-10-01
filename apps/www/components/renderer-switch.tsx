"use client";

import { useRef, useState } from "react";
import { type Film, RENDERER_NAMES } from "@/lib/motion";

/** One video, one plan, a source per renderer. Switching keeps the second you were at, and keeps playing if it was. */
export function RendererSwitch({ films }: { films: Film[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const resume = useRef<{ t: number; play: boolean } | null>(null);
  const [active, setActive] = useState(0);
  const film = films[active];

  const pick = (i: number) => {
    const el = video.current;
    if (el) resume.current = { t: el.currentTime, play: !el.paused };
    setActive(i);
  };

  return (
    <div className="mp-switch">
      {/* biome-ignore lint/a11y/useSemanticElements: a segmented control; fieldset brings a border and min-width */}
      <div className="toggle-group" role="group" aria-label="Renderer">
        {films.map((f, i) => (
          <button
            key={f.id}
            type="button"
            className="toggle"
            aria-pressed={i === active}
            onClick={() => pick(i)}
            translate="no"
          >
            {RENDERER_NAMES[f.renderer]}
          </button>
        ))}
      </div>
      <video
        ref={video}
        src={film.video}
        poster={film.poster}
        aria-label={`The launch film rendered with ${RENDERER_NAMES[film.renderer]}`}
        muted
        playsInline
        controls
        preload="metadata"
        onLoadedMetadata={(e) => {
          const r = resume.current;
          if (!r) return;
          e.currentTarget.currentTime = r.t;
          if (r.play) e.currentTarget.play().catch(() => {});
          resume.current = null;
        }}
      />
      <p className="mp-cap">
        <span translate="no">{RENDERER_NAMES[film.renderer]}</span>: the same plan, {film.seconds} seconds,{" "}
        {(film.bytes / 1e6).toFixed(1)} MB at 720p.
      </p>
    </div>
  );
}
