"use client";
// biome-ignore-all lint/performance/noImgElement: a static poster with width/height; next/image adds nothing here

import { sceneIndexAt } from "@reelcn/registry/demos/scene-marks";
import { type ThemeName, themes } from "@reelcn/registry/items/core";
import { type CallbackListener, Player, type PlayerRef } from "@remotion/player";
import { type CSSProperties, type MouseEvent, useEffect, useRef, useState } from "react";
import { FORMAT_SIZE, type Format, useDemo, useDemoScene, usePrefersReducedMotion } from "./demo-player";
import { Glow } from "./glow";

const THEMES = Object.keys(themes) as ThemeName[];
const FORMATS: { value: Format; label: string; icon: [number, number] }[] = [
  { value: "16x9", label: "16:9", icon: [14, 8] },
  { value: "9x16", label: "9:16", icon: [7, 12] },
  { value: "1x1", label: "1:1", icon: [10, 10] },
];
// Which catalog item draws each scene type (registry/items/story-scenes.tsx).
const DRAWN_BY: Record<string, string> = {
  title: "text-reveal",
  bullets: "feature-card",
  device: "browser-window",
  cta: "animate",
};
// ponytail: mirrors productLaunchDefaults; importing that module would pull the templates chunk into the first load.
const PROPS: [string, string][] = [
  ["name", "Relay"],
  ["tagline", "Release notes your users actually read"],
  ["features", "3 items"],
  ["cta", "Start free today"],
];
const TEMPLATES = ["product-launch", "feature-short", "changelog", "audiogram", "tutorial"];
const TRANSITION_FRAMES = 15;

const pad = (n: number) => String(n).padStart(2, "0");
const timecode = (frame: number) =>
  `${pad(Math.floor(frame / 1800))}:${pad(Math.floor(frame / 30) % 60)}:${pad(frame % 30)}`;
const percent = (part: number, whole: number) => `${((part / whole) * 100).toFixed(3)}%`;

/** The landing hero: the real product-launch template playing in an editor whose timeline follows it. */
export function HeroEditor({ poster }: { poster: string }) {
  const demo = useDemo("templates", "product-launch");
  const Scene = useDemoScene(demo);
  const reduced = usePrefersReducedMotion();
  const player = useRef<PlayerRef>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<Format>("16x9");
  const [theme, setTheme] = useState<ThemeName>("midnight");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [safe, setSafe] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Scene re-runs this once the Player mounts and player.current exists
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onFrame: CallbackListener<"frameupdate"> = (event) => setFrame(event.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    p.addEventListener("frameupdate", onFrame);
    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !reduced) p.play();
        else p.pause();
      },
      { threshold: 0.15 },
    );
    if (stage.current) observer.observe(stage.current);
    return () => {
      p.removeEventListener("frameupdate", onFrame);
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
      observer.disconnect();
    };
  }, [Scene, reduced]);

  const duration = demo?.duration ?? 615;
  const marks = demo?.scenes ?? [];
  const spans = marks.map((mark, i) => ({ ...mark, to: marks[i + 1]?.from ?? duration }));
  const current = sceneIndexAt(marks, frame);
  const { width, height } = FORMAT_SIZE[format];
  const colors = themes[theme].colors;
  const seek = (event: MouseEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    player.current?.seekTo(Math.round(((event.clientX - box.left) / box.width) * (duration - 1)));
  };
  const clipStyle = (from: number, to: number, index: number, color: string) =>
    ({
      "--l": percent(from, duration),
      "--w": percent(to - from, duration),
      "--i": index,
      "--c": color,
    }) as CSSProperties;
  const tracks = [
    { label: "scene", color: "#FFB224", clips: spans.map((s) => ({ ...s, text: s.name })) },
    { label: "component", color: "#7C9CFF", clips: spans.map((s) => ({ ...s, text: DRAWN_BY[s.name] ?? s.name })) },
    {
      label: "background",
      color: "#9FD5A8",
      clips: spans.flatMap((s) => (s.background ? [{ ...s, text: s.background }] : [])),
    },
  ];

  return (
    <div className="stage" ref={stage}>
      <Glow colors={[colors.accent, colors.highlight]} />
      <section className="editor" aria-label="The product launch template playing in an editor">
        <div className="ed-bar">
          <span className="ed-tab">
            <i />
            Root.tsx
          </span>
          <span>src/reelcn/product-launch.tsx</span>
          <span className="sp" />
          <span className="tab">
            {width}×{height}, 30 fps
          </span>
          <span className="render">npx remotion render</span>
        </div>
        <div className="ed-top">
          <aside className="bin" aria-label="Templates">
            <div className="panel-h">
              <span>Templates</span>
              <span>14</span>
            </div>
            <ul>
              {TEMPLATES.map((name, i) => (
                <li key={name}>
                  <a href={`/docs/components/${name}`} aria-current={i === 0 ? "true" : undefined}>
                    {name.charAt(0).toUpperCase() + name.slice(1).replace("-", " ")}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
          <div className="viewer">
            <div className="monitor">
              <div
                className={format === "9x16" ? "frame portrait" : "frame"}
                style={{ "--ar": `${width} / ${height}` } as CSSProperties}
              >
                <img src={poster} alt="" width={960} height={540} style={{ opacity: Scene ? 0 : 1 }} />
                {Scene && demo && (
                  <Player
                    ref={player}
                    className="frame-player"
                    component={Scene}
                    inputProps={{ theme }}
                    durationInFrames={demo.duration}
                    fps={30}
                    compositionWidth={width}
                    compositionHeight={height}
                    loop
                    autoPlay={!reduced}
                    controls={false}
                    clickToPlay={false}
                    spaceKeyToPlayOrPause={false}
                    acknowledgeRemotionLicense
                  />
                )}
                <div className="safe" data-off={safe ? undefined : ""} />
                <span className="frame-label tab">f{frame}</span>
              </div>
            </div>
            <div className="vbar">
              <button
                className="playbtn"
                type="button"
                aria-label={playing ? "Pause" : "Play"}
                onClick={() => (playing ? player.current?.pause() : player.current?.play())}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d={playing ? "M3 2h2v8H3zM7 2h2v8H7z" : "M3 1.5l7 4.5-7 4.5z"} fill="#0A0B0D" />
                </svg>
              </button>
              <span className="tc tab">{timecode(frame)}</span>
              <span className="tab">/ {timecode(duration)}</span>
              <span className="sp" />
              <button className="toggle-safe" type="button" aria-pressed={safe} onClick={() => setSafe(!safe)}>
                <i />
                safe zones
              </button>
              {/* biome-ignore lint/a11y/useSemanticElements: a segmented control; fieldset brings a border and min-width */}
              <div className="seg" role="group" aria-label="Format">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={format === f.value}
                    onClick={() => setFormat(f.value)}
                  >
                    <i style={{ width: f.icon[0], height: f.icon[1] }} />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <aside className="insp" aria-label="Props">
            <div className="panel-h">
              <span>&lt;ProductLaunch /&gt;</span>
              <span>props</span>
            </div>
            {PROPS.map(([name, value]) => (
              <div className="prop" key={name}>
                <span>{name}</span>
                <span className="field">{value}</span>
              </div>
            ))}
            <div className="prop">
              <span>theme</span>
              {/* biome-ignore lint/a11y/useSemanticElements: an inline swatch row; fieldset brings a border and min-width */}
              <span className="swatches" role="group" aria-label="Theme">
                {THEMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    aria-label={`${name} theme`}
                    aria-pressed={theme === name}
                    style={{ background: themes[name].colors.background }}
                    onClick={() => setTheme(name)}
                  />
                ))}
              </span>
            </div>
            <div className="scene-now">
              <div className="panel-h">
                <span>Current scene</span>
                <span className="tab">
                  {current + 1} / {marks.length || 1}
                </span>
              </div>
              <div className="scene-name">{marks[current]?.name ?? "title"}</div>
              <div className="scene-meter">
                <i
                  style={
                    {
                      "--w": spans[current]
                        ? percent(frame - spans[current].from, spans[current].to - spans[current].from)
                        : "0%",
                    } as CSSProperties
                  }
                />
              </div>
            </div>
          </aside>
        </div>
        <div className="tl">
          <button className="ruler" type="button" aria-label="Seek" onClick={seek}>
            {[0, 5, 10, 15, 20].map((s) => (
              <span key={s} style={{ left: percent(Math.min(s * 30, duration), duration) }}>
                00:{pad(s)}
              </span>
            ))}
          </button>
          {tracks.map((track, t) => (
            <div className="track" key={track.label}>
              <span className="track-label">
                <i style={{ background: track.color }} />
                {track.label}
              </span>
              <button className="lane" type="button" aria-label={`Seek on the ${track.label} track`} onClick={seek}>
                {track.clips.map((c, i) => (
                  <span
                    key={`${c.text}-${c.from}`}
                    className={marks[current]?.from === c.from ? "clip on" : "clip"}
                    style={clipStyle(c.from, c.to, t * 4 + i, track.color)}
                  >
                    {c.text}
                  </span>
                ))}
              </button>
            </div>
          ))}
          <div className="track">
            <span className="track-label">
              <i style={{ background: "#C792EA" }} />
              transition
            </span>
            <div className="lane">
              {marks.slice(1).map((m, i) => (
                <span
                  key={m.from}
                  className="clip fade"
                  style={clipStyle(m.from, m.from + TRANSITION_FRAMES, 12 + i, "#C792EA")}
                />
              ))}
            </div>
          </div>
          <div className="ph" aria-hidden="true" style={{ "--t": frame / duration } as CSSProperties} />
        </div>
      </section>
    </div>
  );
}
