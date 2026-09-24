"use client";

import { sceneIndexAt } from "@reelcn/registry/demos/scene-marks";
import { type ThemeName, themes } from "@reelcn/registry/items/core";
import { type CallbackListener, Player, type PlayerRef } from "@remotion/player";
import Link from "next/link";
import { type CSSProperties, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { encodePayload } from "@/lib/custom-install";
import { buildQuery, decodeEdits, pruneEdits, sceneFile, startValues, toJsx } from "@/lib/customize";
import { themedUsage } from "@/lib/themed-usage";
import { type ControlRow, CustomizePanel } from "./customize-panel";
import { FORMAT_SIZE, type Format, useDemo, useDemoScene, usePrefersReducedMotion } from "./demo-player";
import { InstallThemeContext } from "./install-block";

const FORMATS = Object.keys(FORMAT_SIZE) as Format[];
type Tab = "preview" | "code" | "story";

function swatch(name: string) {
  return (themes as Record<string, (typeof themes)[ThemeName]>)[name]?.colors.background ?? "#000";
}

const pascal = (name: string) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

/**
 * The item page's live preview: badges, a Player with Preview and Code tabs, a scrubber with named scene marks and
 * format, theme and variant chips. Server-rendered sections (`children`) sit between the preview and the scene list,
 * in the mockup's order.
 */
export function ItemPreview({
  name,
  demoIds,
  category,
  themes: themeNames,
  thumbs,
  code,
  codeByTheme,
  controls,
  builtFrom,
  children,
}: {
  name: string;
  demoIds: string[];
  category: string;
  themes: string[];
  /** Static thumbnail files per demo id and format (`scripts/thumbs.ts`), keyed like `demoIds`. */
  thumbs?: Record<string, { format: Format; file: string }[]>;
  /** Usage code, rendered on the server; shown in the Code tab. */
  code?: ReactNode;
  /** The same usage per theme (wrapped in that theme), so the Code tab matches the theme picked in the preview. */
  codeByTheme?: Record<string, ReactNode>;
  /** Props the Customize panel can edit (`propsTable` rows with a control); shown when the demo opts in. */
  controls?: ControlRow[];
  /** Registry items this one builds on, shown under Scenes. */
  builtFrom?: ReactNode;
  children?: ReactNode;
}) {
  const [demoId, setDemoId] = useState(demoIds[0] ?? name);
  const [format, setFormat] = useState<Format>("16x9");
  const [theme, setTheme] = useState(themeNames.includes("daylight") ? "daylight" : (themeNames[0] ?? "daylight"));
  const [frame, setFrame] = useState(0);
  const [tab, setTab] = useState<Tab>("preview");
  const demo = useDemo(category, demoId);
  // Edits belong to one variant: stored with its id, so switching variant shows none; the chips also clear them.
  const [edited, setEdited] = useState<{ demo: string; values: Record<string, unknown> }>({ demo: "", values: {} });
  // A share link: `?demo=<variant>&theme=<name>&p.<prop>=<value>`. Read once; bad values are dropped.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, on the first client render
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("demo");
    const target = linked ? demoIds.find((id) => id === `${name}-${linked}` || id === linked) : undefined;
    if (target) setDemoId(target);
    const linkedTheme = params.get("theme");
    if (linkedTheme && themeNames.includes(linkedTheme)) setTheme(linkedTheme);
    if (controls) setEdited({ demo: target ?? demoId, values: decodeEdits(controls, params) });
  }, []);
  const customize = demo?.customize && controls && controls.length > 0 ? demo.customize : undefined;
  const start = customize && controls ? startValues(controls, customize.props) : {};
  // Pruned here, not on write, so a share link's no-op params (`p.effect=rise` on rise) count as no edits too.
  const overrides = edited.demo === demoId ? pruneEdits(start, edited.values) : {};
  const edit = (prop: string, value: unknown) =>
    setEdited({ demo: demoId, values: pruneEdits(start, { ...overrides, [prop]: value }) });
  const hasEdits = Object.keys(overrides).length > 0;
  const component = customize?.name ?? pascal(name);
  const customJsx = customize ? toJsx(component, { ...customize.props, ...overrides }) : "";
  const Scene = useDemoScene(demo);
  const reduced = usePrefersReducedMotion();
  const player = useRef<PlayerRef>(null);
  const variant = (id: string) => (id === name ? "default" : id.slice(name.length + 1));
  const query = buildQuery(typeof window === "undefined" ? "" : window.location.search, {
    demo: demoId === demoIds[0] ? undefined : variant(demoId),
    theme: theme === "daylight" ? undefined : theme,
    edits: overrides,
  });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query !== window.location.search) {
        // Keep Next's own history.state; replacing it with null breaks back and forward.
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${query}${window.location.hash}`,
        );
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  const shareUrl = () => `${window.location.origin}${window.location.pathname}${query}`;

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
  const thumb = thumbs?.[demoId]?.find((t) => t.format === format);
  const label = `${pascal(name)}, ${demoId === name ? "defaults" : variant(demoId)}`;
  const tabs = (
    [["preview", "Preview"], code ? ["code", "Code"] : null, demo?.story ? ["story", "Story JSON"] : null] as (
      | [Tab, string]
      | null
    )[]
  ).filter((entry): entry is [Tab, string] => entry !== null);

  return (
    <>
      <div>
        <div className="badges">
          <Link href="/docs/components">
            <b>@</b>
            {category}
          </Link>
          {demo && <a href="#preview">{demo.duration} frames</a>}
          <a href="#source">Source</a>
          <a href={`/docs/components/${name}.md`}>{name}.md</a>
        </div>
        <div className="preview" id="preview">
          <div className="pv-h">
            <span>{label}</span>
            {tabs.length > 1 && (
              <div className="pv-tabs" role="tablist" aria-label="View">
                {tabs.map(([t, text]) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                    {text}
                  </button>
                ))}
              </div>
            )}
          </div>
          {tab === "code" && (
            <div className="pv-body">
              {customize && hasEdits ? (
                // Once edited, the snippet is generated here from the live props (plain, not server-highlighted).
                <>
                  <p className="cz-note">With your settings</p>
                  <div className="code">
                    <pre>{themedUsage(customJsx, theme)}</pre>
                  </div>
                </>
              ) : (
                (codeByTheme?.[theme] ?? code)
              )}
            </div>
          )}
          {tab === "story" && demo?.story && (
            <div className="pv-body">
              <div className="code">
                <pre>{JSON.stringify(demo.story, null, 2)}</pre>
              </div>
            </div>
          )}
          <div className="pv-body" hidden={tab !== "preview"}>
            <div className="pv-stage" data-format={format} style={{ aspectRatio: `${width} / ${height}` }}>
              {Scene && demo && (
                <Player
                  ref={player}
                  component={Scene}
                  inputProps={{ theme: theme as ThemeName, overrides: customize ? overrides : undefined }}
                  durationInFrames={demo.duration}
                  fps={30}
                  compositionWidth={width}
                  compositionHeight={height}
                  loop
                  autoPlay={!reduced}
                  // Browsers block autoplay with sound until the first click; start muted, the controls unmute.
                  initiallyMuted
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
                {thumb && (
                  <img
                    key={thumb.file}
                    src={`/thumbs/${thumb.file}.jpg`}
                    alt={`${label} thumbnail, ${format.replace("x", ":")}`}
                    width={64}
                    height={Math.round((64 * FORMAT_SIZE[format].height) / FORMAT_SIZE[format].width)}
                    style={{ borderRadius: 4, objectFit: "cover" }}
                  />
                )}
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
                    <button
                      key={id}
                      type="button"
                      aria-pressed={demoId === id}
                      onClick={() => {
                        setDemoId(id);
                        setEdited({ demo: id, values: {} });
                      }}
                    >
                      {variant(id)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {customize && controls && (
        <CustomizePanel
          rows={controls}
          base={start}
          values={overrides}
          onChange={edit}
          onReset={() => setEdited({ demo: demoId, values: {} })}
          shareUrl={shareUrl}
          code={themedUsage(customJsx, theme)}
          file={sceneFile(name, component, customJsx, theme)}
          fileName={`${component}Scene.tsx`}
        />
      )}
      <InstallThemeContext
        value={{
          theme,
          custom:
            customize && hasEdits
              ? {
                  component,
                  payload: encodePayload({
                    props: { ...customize.props, ...overrides },
                    theme: theme === "daylight" ? undefined : theme,
                    component,
                  }),
                }
              : undefined,
        }}
      >
        {children}
      </InstallThemeContext>
      {marks.length > 0 ? (
        <section>
          <h2 id="scenes">Scenes</h2>
          <p>
            Click a scene to jump the preview. Lengths come from reading time; each fade overlaps its neighbours by 15
            frames.
          </p>
          <div className="scenes-list">
            {marks.map((mark, i) => (
              <button key={`${mark.name}-${mark.from}`} type="button" onClick={() => player.current?.seekTo(mark.from)}>
                <b>{mark.name}</b>
                <span className="tab">
                  f{mark.from} – f{Math.min(duration, (marks[i + 1]?.from ?? duration) + 15)}
                </span>
              </button>
            ))}
          </div>
          {builtFrom && (
            <>
              <h3 id="built-from">Built from</h3>
              {builtFrom}
            </>
          )}
        </section>
      ) : (
        builtFrom && (
          <section>
            <h2 id="built-from">Built from</h2>
            {builtFrom}
          </section>
        )
      )}
    </>
  );
}
