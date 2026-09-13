"use client";

import { sceneIndexAt } from "@reelcn/registry/demos/scene-marks";
import { type ThemeName, themes } from "@reelcn/registry/items/core";
import { type CallbackListener, Player, type PlayerRef } from "@remotion/player";
import { type CSSProperties, type MouseEvent, useEffect, useRef, useState } from "react";
import { FORMAT_SIZE, type Format, useDemo, useDemoScene, usePrefersReducedMotion } from "./demo-player";

const FORMATS = Object.keys(FORMAT_SIZE) as Format[];

function swatch(name: string) {
  return (themes as Record<string, (typeof themes)[ThemeName]>)[name]?.colors.background ?? "#000";
}

/** The item page's live preview: a Player, a scrubber with named scene marks, and format, theme and variant chips. */
export function ItemPreview({
  name,
  demoIds,
  category,
  themes: themeNames,
}: {
  name: string;
  demoIds: string[];
  category: string;
  themes: string[];
}) {
  const [demoId, setDemoId] = useState(demoIds[0] ?? name);
  const [format, setFormat] = useState<Format>("16x9");
  const [theme, setTheme] = useState(themeNames.includes("midnight") ? "midnight" : (themeNames[0] ?? "midnight"));
  const [frame, setFrame] = useState(0);
  const demo = useDemo(category, demoId);
  const Scene = useDemoScene(demo);
  const reduced = usePrefersReducedMotion();
  const player = useRef<PlayerRef>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Scene and format remount the Player, so the listener re-attaches
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onFrame: CallbackListener<"frameupdate"> = (event) => setFrame(event.detail.frame);
    p.addEventListener("frameupdate", onFrame);
    return () => p.removeEventListener("frameupdate", onFrame);
  }, [Scene, format]);

  const { width, height } = FORMAT_SIZE[format];
  const duration = demo?.duration ?? 1;
  const marks = demo?.scenes ?? [];
  const current = sceneIndexAt(marks, frame);
  const seek = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    player.current?.seekTo(Math.round(((event.clientX - box.left) / box.width) * (duration - 1)));
  };
  const variant = (id: string) => (id === name ? "default" : id.slice(name.length + 1));

  return (
    <div className="preview">
      <div className="pv-h">
        <span>{demoId}</span>
        <span className="tab">
          f{frame} / {duration}
        </span>
      </div>
      <div className="pv-body">
        <div className="pv-stage" data-format={format} style={{ aspectRatio: `${width} / ${height}` }}>
          {Scene && demo && (
            <Player
              ref={player}
              component={Scene}
              inputProps={{ theme: theme as ThemeName }}
              durationInFrames={demo.duration}
              fps={30}
              compositionWidth={width}
              compositionHeight={height}
              loop
              autoPlay={!reduced}
              controls
              clickToPlay={false}
              spaceKeyToPlayOrPause={false}
              acknowledgeRemotionLicense
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </div>
        <button
          className="pv-scrub"
          type="button"
          aria-label="Seek"
          onClick={seek}
          style={{ "--t": frame / Math.max(1, duration - 1) } as CSSProperties}
        >
          {marks.map((mark, i) => (
            <span
              key={`${mark.name}-${mark.from}`}
              className={i === current ? "mk on" : "mk"}
              style={{ "--l": `${(mark.from / duration) * 100}%` } as CSSProperties}
            >
              {mark.name}
            </span>
          ))}
          <span className="rail" />
          <span className="fill" />
          <span className="knob" />
        </button>
        <div className="pv-ctrl">
          {/* biome-ignore lint/a11y/useSemanticElements: a chip row; fieldset brings a border and min-width */}
          <div className="chips" role="group" aria-label="Format">
            {FORMATS.map((f) => (
              <button key={f} type="button" aria-pressed={format === f} onClick={() => setFormat(f)}>
                {f.replace("x", ":")}
              </button>
            ))}
          </div>
          {/* biome-ignore lint/a11y/useSemanticElements: a chip row; fieldset brings a border and min-width */}
          <div className="chips" role="group" aria-label="Theme">
            {themeNames.map((t) => (
              <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>
                <i style={{ background: swatch(t) }} />
                {t}
              </button>
            ))}
          </div>
          {demoIds.length > 1 && (
            // biome-ignore lint/a11y/useSemanticElements: a chip row; fieldset brings a border and min-width
            <div className="chips" role="group" aria-label="Variant">
              {demoIds.map((id) => (
                <button key={id} type="button" aria-pressed={demoId === id} onClick={() => setDemoId(id)}>
                  {variant(id)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
