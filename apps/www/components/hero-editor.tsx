"use client";
// biome-ignore-all lint/performance/noImgElement: a static poster and clip stills with width/height; next/image adds nothing here

import { sceneIndexAt, sceneMarks } from "@reelcn/registry/demos/scene-marks";
import { type ThemeName, ThemeProvider, themes } from "@reelcn/registry/items/core";
import type { ProductLaunchProps } from "@reelcn/registry/items/product-launch";
import { storyFrames } from "@reelcn/registry/items/story";
import { type CallbackListener, Player, type PlayerRef } from "@remotion/player";
import {
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FORMAT_SIZE, type Format, useDemo, useDemoScene, usePrefersReducedMotion } from "./demo-player";
import { Glow } from "./glow";

type LaunchModule = typeof import("@reelcn/registry/items/product-launch");
type Draft = Pick<ProductLaunchProps, "name" | "tagline" | "features" | "cta">;

const THEMES = Object.keys(themes) as ThemeName[];
const FORMATS: { value: Format; label: string; icon: [number, number] }[] = [
  { value: "16x9", label: "16:9", icon: [14, 8] },
  { value: "9x16", label: "9:16", icon: [7, 12] },
  { value: "1x1", label: "1:1", icon: [10, 10] },
];
// Which catalog item draws each scene type (registry/items/story-scenes.tsx).
const DRAWN_BY: Record<string, string> = {
  title: "text-reveal",
  text: "text-reveal",
  bullets: "feature-card",
  "device-stage": "browser-window",
  device: "browser-window",
  cta: "animate",
};
// Catalog stills shown inside timeline clips, keyed by the item a clip names.
const THUMBS: Record<string, string> = {
  "text-reveal": "text-reveal-blur",
  "feature-card": "feature-card-rise",
  "browser-window": "browser-window-dashboard",
  animate: "animate",
  "gradient-mesh": "gradient-mesh",
  aurora: "aurora",
};
const TEMPLATES = ["product-launch", "feature-short", "changelog", "audiogram", "tutorial"];
const TRANSITION_FRAMES = 15;
// Scroll zoom, after remocn's hero: grow until this share of the stage's scroll, hold, then settle back from HOLD_END.
const GROW_END = 0.28;
const HOLD_END = 0.72;
const ZOOM_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
// Scroll scrub: each paint the playhead closes this share of the gap to the scroll's frame, at most this many frames,
// so a fast scroll reads as fast playback instead of a cut.
const SCRUB_EASE = 0.15;
const SCRUB_MAX_STEP = 6;
// ponytail: the first three mirror productLaunchDefaults, so the inspector renders before the template module loads.
const FEATURES: Draft["features"] = [
  { title: "Write once", body: "Draft in Markdown and publish everywhere." },
  { title: "Ship on merge", body: "Every merged pull request becomes a line." },
  { title: "See who read it", body: "Opens and clicks for every release." },
  { title: "Schedule drops", body: "Queue notes for launch morning." },
  { title: "Tag by team", body: "Every note lands with its owner." },
  { title: "Reply in place", body: "Readers answer right under the note." },
];
const START: Draft = {
  name: "Relay",
  tagline: "Release notes your users actually read",
  features: FEATURES.slice(0, 3),
  cta: "Start free today",
};
const TEXT_FIELDS: { key: "name" | "tagline" | "cta"; max: number }[] = [
  { key: "name", max: 24 },
  { key: "tagline", max: 60 },
  { key: "cta", max: 28 },
];

const pad = (n: number) => String(n).padStart(2, "0");
const timecode = (frame: number) =>
  `${pad(Math.floor(frame / 1800))}:${pad(Math.floor(frame / 30) % 60)}:${pad(frame % 30)}`;
const percent = (part: number, whole: number) => `${((part / whole) * 100).toFixed(3)}%`;
const pascal = (name: string) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
const sentence = (name: string) => name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ");

/**
 * The landing hero: a real template playing in an editor you can use. Pick a template, edit the product launch's
 * props and watch the video, its length and its timeline follow; scrub with the pointer or the keyboard.
 */
export function HeroEditor({ poster, install }: { poster: string; install: string }) {
  const [templateId, setTemplateId] = useState("product-launch");
  const demo = useDemo("templates", templateId);
  const Scene = useDemoScene(demo);
  const reduced = usePrefersReducedMotion();
  const player = useRef<PlayerRef>(null);
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const resumeRef = useRef(false);
  const mutedRef = useRef(true);
  // While the stage is pinned, scroll drives the playhead from `base`; `length` is the duration it was set for.
  const scrollAnchor = useRef<{ base: number; length: number } | null>(null);
  const durationRef = useRef(615);
  const [format, setFormat] = useState<Format>("16x9");
  const [theme, setTheme] = useState<ThemeName>("midnight");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [safe, setSafe] = useState(true);
  const [muted, setMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tip, setTip] = useState<{ item: string; left: number; top: number } | null>(null);
  const [draft, setDraft] = useState<Draft>(START);
  const [live, setLive] = useState<Draft>(START);
  const [launch, setLaunch] = useState<LaunchModule | null>(null);

  // On wide screens the stage is tall and the editor pins; scroll grows it to cover the screen, holds, then settles.
  useEffect(() => {
    const box = stage.current;
    const el = card.current;
    if (!box || !el) return;
    const wide = window.matchMedia(ZOOM_QUERY);
    let raf = 0;
    // Scroll sets `target`; `shown` eases toward it each paint, so the frames between are played, not skipped.
    // Both are unwrapped frame numbers; the Player gets them modulo the length.
    let chase = 0;
    let shown = 0;
    let target = 0;
    // Scroll progress at the previous update: re-anchoring there keeps the scroll that triggered it (null until then).
    let lastP: number | null = null;
    const follow = () => {
      chase = 0;
      const anchor = scrollAnchor.current;
      // Unpinned, or a manual seek took the playhead (length 0): stop chasing.
      if (!anchor?.length) return;
      const gap = target - shown;
      shown =
        Math.abs(gap) < 0.5 ? target : shown + Math.max(-SCRUB_MAX_STEP, Math.min(SCRUB_MAX_STEP, gap * SCRUB_EASE));
      const next = ((Math.round(shown) % anchor.length) + anchor.length) % anchor.length;
      if (next !== frameRef.current) {
        frameRef.current = next;
        setFrame(next);
        player.current?.seekTo(next);
      }
      if (shown !== target) chase = requestAnimationFrame(follow);
    };
    const update = () => {
      raf = 0;
      const range = box.offsetHeight - window.innerHeight;
      const raw = range > 0 ? -box.getBoundingClientRect().top / range : 0;
      const pinned = wide.matches && range > 0 && raw >= 0 && raw <= 1;
      const p = wide.matches ? Math.min(1, Math.max(0, raw)) : 0;
      const t = p < GROW_END ? p / GROW_END : p > HOLD_END ? (1 - p) / (1 - HOLD_END) : 1;
      const cover = Math.max(
        document.documentElement.clientWidth / el.offsetWidth,
        window.innerHeight / el.offsetHeight,
      );
      // At rest the pinned editor fits below the 60px nav with as much again spare; short screens start it smaller.
      const rest = wide.matches ? Math.min(1, (window.innerHeight - 120) / el.offsetHeight) : 1;
      el.style.scale = String(rest + (cover - rest) * t);
      el.style.setProperty("--zoom", String(t));

      // Pinned while it zooms in and holds, scroll is the playhead: down plays forward, up plays back, counted from the
      // frame it took over on so nothing jumps. Pressing play or a new duration re-anchors; once it starts zooming back
      // out (or leaves the stage) playback is handed back.
      const now = player.current;
      if (pinned && p <= HOLD_END) {
        const length = durationRef.current;
        if (!scrollAnchor.current || scrollAnchor.current.length !== length || now?.isPlaying()) {
          now?.pause();
          // Only scroll inside the scrubbed range counts: coming back up from the zoom-out starts at HOLD_END.
          scrollAnchor.current = { base: frameRef.current - Math.min(lastP ?? p, HOLD_END) * length, length };
          shown = frameRef.current;
        }
        target = scrollAnchor.current.base + p * length;
        if (!chase) chase = requestAnimationFrame(follow);
      } else if (scrollAnchor.current) {
        scrollAnchor.current = null;
        cancelAnimationFrame(chase);
        chase = 0;
        if (wide.matches) now?.play();
      }
      lastP = p;
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    wide.addEventListener("change", queue);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(chase);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      wide.removeEventListener("change", queue);
    };
  }, []);

  // Typing re-renders the video a beat after the last key, not on every one.
  useEffect(() => {
    const timer = setTimeout(() => setLive(draft), 250);
    return () => clearTimeout(timer);
  }, [draft]);

  // ponytail: the editable template loads on the first edit; until then the hero plays the ready-made demo.
  const edited = live !== START;
  useEffect(() => {
    if (edited && !launch) import("@reelcn/registry/items/product-launch").then((mod) => setLaunch(mod));
  }, [edited, launch]);

  // One stable component; edits arrive as inputProps, so the Player keeps its frame instead of remounting.
  const LaunchScene = useMemo(() => {
    if (!launch) return null;
    const { ProductLaunch, productLaunchDefaults } = launch;
    return function LaunchScene({ theme: sceneTheme, props }: { theme: ThemeName; props: Draft }) {
      return (
        <ThemeProvider theme={sceneTheme}>
          <ProductLaunch {...productLaunchDefaults} {...props} />
        </ThemeProvider>
      );
    };
  }, [launch]);

  const editing = templateId === "product-launch" && edited && launch !== null && LaunchScene !== null;
  const story = useMemo(
    () => (editing && launch ? launch.productLaunchStory({ ...launch.productLaunchDefaults, ...live }) : null),
    [editing, launch, live],
  );
  const component = (editing ? LaunchScene : Scene) as ComponentType<Record<string, unknown>> | null;
  const inputProps: Record<string, unknown> = editing ? { theme, props: live } : { theme };
  // The template's own scene types need their rules, or every length after one is NaN.
  const duration = story ? storyFrames(story, launch?.productLaunchScenes) : (demo?.duration ?? 615);
  const marks = story ? sceneMarks(story, launch?.productLaunchScenes) : (demo?.scenes ?? []);
  durationRef.current = duration;

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new component remounts the Player, so listeners re-attach and the frame carries over
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    if (frameRef.current > 0) p.seekTo(frameRef.current);
    if (!mutedRef.current) p.unmute();
    // A remount mid-scroll (template switch, first edit) autoplays; the pinned stage keeps the playhead.
    if (scrollAnchor.current) p.pause();
    const onFrame: CallbackListener<"frameupdate"> = (event) => {
      frameRef.current = event.detail.frame;
      setFrame(event.detail.frame);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    p.addEventListener("frameupdate", onFrame);
    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (scrollAnchor.current) return;
        if (entry?.isIntersecting && !reduced) p.play();
        else p.pause();
      },
      { threshold: 0.15 },
    );
    // The card, not the stage: the stage is several screens tall, so its visible share stays small.
    if (card.current) observer.observe(card.current);
    return () => {
      p.removeEventListener("frameupdate", onFrame);
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
      observer.disconnect();
    };
  }, [component, reduced]);

  const spans = marks.map((mark, i) => ({ ...mark, to: marks[i + 1]?.from ?? duration }));
  const current = sceneIndexAt(marks, frame);
  const { width, height } = FORMAT_SIZE[format];
  const colors = themes[theme].colors;
  const composition = pascal(templateId);
  const ticks = Array.from({ length: Math.floor((duration - 1) / 150) + 1 }, (_, i) => i * 5);

  const seekTo = (next: number) => {
    const clamped = Math.min(duration - 1, Math.max(0, next));
    frameRef.current = clamped;
    setFrame(clamped);
    player.current?.seekTo(clamped);
    // A manual seek while pinned: the next scroll carries on from here instead of snapping back.
    if (scrollAnchor.current) scrollAnchor.current.length = 0;
  };
  const togglePlay = () => (playing ? player.current?.pause() : player.current?.play());
  const frameAt = (clientX: number, surface: HTMLElement) => {
    const box = surface.getBoundingClientRect();
    return Math.round(((clientX - box.left) / box.width) * (duration - 1));
  };
  // Drag anywhere on the ruler or a lane to scrub; playback resumes on release if it was running.
  const scrub = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      resumeRef.current = playing;
      player.current?.pause();
      seekTo(frameAt(event.clientX, event.currentTarget));
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) seekTo(frameAt(event.clientX, event.currentTarget));
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      event.currentTarget.releasePointerCapture(event.pointerId);
      if (resumeRef.current) player.current?.play();
    },
  };
  const onSliderKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " ") {
      event.preventDefault();
      togglePlay();
      return;
    }
    const step = event.shiftKey ? 10 : 1;
    const next: Record<string, number> = {
      ArrowLeft: frame - step,
      ArrowRight: frame + step,
      Home: 0,
      End: duration - 1,
    };
    if (!(event.key in next)) return;
    event.preventDefault();
    player.current?.pause();
    seekTo(next[event.key]);
  };
  const switchTemplate = (id: string) => {
    frameRef.current = 0;
    setFrame(0);
    setTemplateId(id);
  };
  const toggleMute = () => {
    if (muted) player.current?.unmute();
    else player.current?.mute();
    mutedRef.current = !muted;
    setMuted(!muted);
  };
  const copyRender = () => {
    navigator.clipboard.writeText(`npx remotion render ${composition}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const showTip = (event: MouseEvent<HTMLElement>, item: string) => {
    const clip = event.currentTarget.getBoundingClientRect();
    const tl = event.currentTarget.closest<HTMLElement>(".tl");
    if (!tl) return;
    const box = tl.getBoundingClientRect();
    // The zoom scales the editor; the tip is placed in its unscaled pixels.
    const k = tl.offsetWidth / box.width;
    setTip({
      item,
      left: (clip.left - box.left) * k + Math.min(clip.width * k, 180) / 2,
      top: (clip.top - box.top) * k,
    });
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
      <div className="stage-pin">
        <div className="stage-card" ref={card}>
          <Glow colors={[colors.accent, colors.highlight]} />
          <section
            className="editor"
            aria-label={`The ${sentence(templateId).toLowerCase()} template playing in an editor`}
          >
            <div className="ed-bar">
              <span className="ed-tab">
                <i />
                Root.tsx
              </span>
              <span>src/reelcn/{templateId}.tsx</span>
              <span className="sp" />
              <span className="tab">
                {width}×{height}, 30 fps
              </span>
              <button className="render" type="button" onClick={copyRender} aria-live="polite">
                {copied ? "Copied" : "npx remotion render"}
              </button>
            </div>
            <div className="ed-top">
              <aside className="bin" aria-label="Templates">
                <div className="panel-h">
                  <span>Templates</span>
                  <span>14</span>
                </div>
                <ul>
                  {TEMPLATES.map((name) => (
                    <li key={name}>
                      <button type="button" aria-pressed={templateId === name} onClick={() => switchTemplate(name)}>
                        {sentence(name)}
                      </button>
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
                    <img src={poster} alt="" width={960} height={540} style={{ opacity: component ? 0 : 1 }} />
                    {component && (
                      <Player
                        ref={player}
                        className="frame-player"
                        component={component}
                        inputProps={inputProps}
                        durationInFrames={duration}
                        fps={30}
                        compositionWidth={width}
                        compositionHeight={height}
                        loop
                        autoPlay={!reduced}
                        // Browsers block autoplay with sound; the landing hero never plays audio unprompted.
                        initiallyMuted
                        controls={false}
                        clickToPlay={false}
                        spaceKeyToPlayOrPause={false}
                        acknowledgeRemotionLicense
                        // Remotion sizes the Player to the composition inline unless told otherwise; fill the frame instead.
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
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
                    onClick={togglePlay}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path d={playing ? "M3 2h2v8H3zM7 2h2v8H7z" : "M3 1.5l7 4.5-7 4.5z"} fill="#0A0B0D" />
                    </svg>
                  </button>
                  <span className="tc tab">{timecode(frame)}</span>
                  <span className="tab">/ {timecode(duration)}</span>
                  <span className="sp" />
                  <button className="toggle-safe" type="button" aria-pressed={!muted} onClick={toggleMute}>
                    <i />
                    sound
                  </button>
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
                  <span>&lt;{composition} /&gt;</span>
                  {draft !== START ? (
                    <button className="reset" type="button" onClick={() => setDraft(START)}>
                      reset
                    </button>
                  ) : (
                    <span>props</span>
                  )}
                </div>
                {templateId === "product-launch" ? (
                  <>
                    {TEXT_FIELDS.map(({ key, max }) => (
                      <label className="prop" key={key}>
                        <span>{key}</span>
                        <input
                          className="field"
                          value={draft[key]}
                          maxLength={max}
                          spellCheck={false}
                          onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                        />
                      </label>
                    ))}
                    <div className="prop">
                      <span>features</span>
                      <span className="stepper">
                        <button
                          type="button"
                          aria-label="Remove a feature"
                          disabled={draft.features.length <= 1}
                          onClick={() => setDraft({ ...draft, features: FEATURES.slice(0, draft.features.length - 1) })}
                        >
                          −
                        </button>
                        <span className="tab" aria-live="polite">
                          {draft.features.length}
                        </span>
                        <button
                          type="button"
                          aria-label="Add a feature"
                          disabled={draft.features.length >= FEATURES.length}
                          onClick={() => setDraft({ ...draft, features: FEATURES.slice(0, draft.features.length + 1) })}
                        >
                          +
                        </button>
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="prop-note">
                    Its props live on{" "}
                    <a href={`/docs/components/${templateId}`}>the {sentence(templateId).toLowerCase()} page</a>.
                  </p>
                )}
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
                      {marks.length ? current + 1 : 1} / {marks.length || 1}
                    </span>
                  </div>
                  <div className="scene-name">{marks[current]?.name ?? "single scene"}</div>
                  <div className="scene-meter">
                    <i
                      style={
                        {
                          "--w": spans[current]
                            ? percent(frame - spans[current].from, spans[current].to - spans[current].from)
                            : percent(frame, duration),
                        } as CSSProperties
                      }
                    />
                  </div>
                </div>
                <div className="cmdline">
                  <b>$</b> {install.replace("product-launch", templateId)}
                </div>
              </aside>
            </div>
            <div className="tl">
              <div
                className="ruler"
                role="slider"
                tabIndex={0}
                aria-label="Playhead"
                aria-valuemin={0}
                aria-valuemax={duration - 1}
                aria-valuenow={frame}
                aria-valuetext={timecode(frame)}
                onKeyDown={onSliderKey}
                {...scrub}
              >
                {ticks.map((s) => (
                  <span key={s} style={{ left: percent(Math.min(s * 30, duration), duration) }}>
                    00:{pad(s)}
                  </span>
                ))}
              </div>
              {tracks.map((track, t) => (
                <div className="track" key={track.label}>
                  <span className="track-label">
                    <i style={{ background: track.color }} />
                    {track.label}
                  </span>
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: a pointer scrub surface; the ruler slider is its keyboard control */}
                  <div className="lane" {...scrub}>
                    {track.clips.map((c, i) => (
                      // biome-ignore lint/a11y/noStaticElementInteractions: hover only shows a tooltip; the lane handles scrubbing
                      <span
                        key={`${c.text}-${c.from}`}
                        className={marks[current]?.from === c.from ? "clip on" : "clip"}
                        style={clipStyle(c.from, c.to, t * 4 + i, track.color)}
                        onMouseEnter={t > 0 ? (event) => showTip(event, c.text) : undefined}
                        onMouseLeave={() => setTip(null)}
                      >
                        {THUMBS[c.text] && <img className="thumb" src={`/thumbs/${THUMBS[c.text]}.jpg`} alt="" />}
                        {c.text}
                      </span>
                    ))}
                  </div>
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
              <div className="tip" aria-hidden="true" style={{ left: tip?.left, top: tip?.top, opacity: tip ? 1 : 0 }}>
                {tip?.item} <b>drag to scrub</b>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
