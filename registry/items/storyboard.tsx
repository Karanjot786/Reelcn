/**
 * @title Storyboard
 * @category templates
 * @description Turns a JSON story (theme, brand, audio and a list of scenes) into a finished video whose length comes from its content.
 * @duration data-driven
 * @use Whole videos written as data, by hand or by an agent
 * @use Rendering one story at 16:9, 9:16 and 1:1
 * @avoid Scenes you lay out by hand in JSX — use `scenes`
 * @tags storyboard, json, template, agent, calculateMetadata
 * @example
 * // src/Root.tsx — then: npx remotion render Storyboard out.mp4 --props=story.json
 * <Composition
 *   id="Storyboard"
 *   component={StoryVideo}
 *   schema={storySchema}
 *   calculateMetadata={storyMetadata}
 *   defaultProps={{ scenes: [{ type: "title", title: "Hello from a story" }] }}
 *   width={1920}
 *   height={1080}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
/// <reference lib="dom" />
import { Audio } from "@remotion/media";
import { linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ALL_FORMATS, Input as MediabunnyInput, UrlSource } from "mediabunny";
import type React from "react";
import type { CalculateMetadataFunction } from "remotion";
import { useVideoConfig } from "remotion";
import { z } from "zod";
import { brandSweep } from "./brand-sweep";
import { FONT_SIZE as BUTTON_FONT_SIZE, Button, buttonBoxSize } from "./button";
import { Captions } from "./captions";
import { cardPush } from "./card-push";
import { circleBurst } from "./circle-burst";
import {
  type AnchorRect,
  createTheme,
  measurePx,
  Stage,
  stackLayout,
  stepsDuration,
  type Theme,
  type ThemeName,
  ThemeProvider,
  themeNames,
  useTextMetrics,
  useTheme,
  useViewport,
} from "./core";
import { Cursor, type CursorWaypoint } from "./cursor";
import { Dialog, dialogBoxSize } from "./dialog";
import { glitch } from "./glitch";
import { Input, inputBoxSize } from "./input";
import { lightFlash } from "./light-flash";
import { organicDissolve } from "./organic-dissolve";
import { rackFocus } from "./rack-focus";
import { type SceneItem, Scenes } from "./scenes";
import { FONT_SIZE as SELECT_FONT_SIZE, Select, selectBoxSize } from "./select";
import { SFX_NAMES, Sfx, type SfxName } from "./sfx";
import { shutter } from "./shutter";
import { sliceSlide } from "./slice-slide";
import { splitDoors } from "./split-doors";
import {
  brandSchema,
  DEFAULT_TRANSITION,
  makeStorySchema,
  type Scene,
  STORY_FPS,
  type Story,
  type StoryJson,
  storyFrames,
  storyTimeline,
} from "./story";
import { BACKGROUNDS, Backdrop, SceneView } from "./story-scenes";
import { stripeWipe } from "./stripe-wipe";
import { Switch, switchBoxSize } from "./switch";
import { FONT_SIZE as TABS_FONT_SIZE, FONT_WEIGHT as TABS_FONT_WEIGHT, Tabs, tabsBoxSize } from "./tabs";
import { tileReveal } from "./tile-reveal";
import { whipPan } from "./whip-pan";
import { zoomThrough } from "./zoom-through";

type Presentation = NonNullable<SceneItem["transition"]>;

/** Every transition a story can name: `fade` comes with @remotion/transitions, the rest are reelcn items. */
export const TRANSITIONS: Record<string, () => Presentation> = {
  fade: () => fade(),
  "brand-sweep": () => brandSweep(),
  "card-push": () => cardPush(),
  "circle-burst": () => circleBurst(),
  glitch: () => glitch(),
  "light-flash": () => lightFlash(),
  "organic-dissolve": () => organicDissolve(),
  "rack-focus": () => rackFocus(),
  shutter: () => shutter(),
  "slice-slide": () => sliceSlide(),
  "split-doors": () => splitDoors(),
  "stripe-wipe": () => stripeWipe(),
  "tile-reveal": () => tileReveal(),
  "whip-pan": () => whipPan(),
  "zoom-through": () => zoomThrough(),
};

/** Played at the start of every scene after the first when a story turns sound effects on and the scene names none. */
const DEFAULT_SFX: SfxName = "whoosh-soft";

/** Validates story JSON. Errors name the scene and field: `scenes.2.title`. */
export const storySchema = makeStorySchema({
  themes: themeNames,
  transitions: Object.keys(TRANSITIONS),
  backgrounds: Object.keys(BACKGROUNDS),
  sfx: SFX_NAMES,
});

export type SceneDefinition<T extends z.ZodObject = z.ZodObject> = {
  /** The name stories use as `type`. */
  type: string;
  /** The scene's own fields; `type`, `duration`, `transition`, `sfx` and `background` are added for you. */
  schema: T;
  component: React.ComponentType<z.infer<T>>;
  /** Seconds the scene runs when it sets no `duration`. */
  duration: (scene: z.infer<T>) => number;
};

/** A custom scene type for `<Storyboard scenes={[…]}>`. */
export function defineScene<T extends z.ZodObject>(definition: SceneDefinition<T>): SceneDefinition<T> {
  return definition;
}

/** A theme preset with a brand's accent and heading font laid over it. */
export function brandTheme(base: ThemeName | Theme, brand: Story["brand"] = {}): Theme {
  return createTheme(base, {
    colors: brand.accent ? { accent: brand.accent } : {},
    fonts: brand.font ? { heading: brand.font } : {},
  });
}

export type StoryboardProps = {
  story: Story;
  /** Custom scene types made with `defineScene`. */
  // biome-ignore lint/suspicious/noExplicitAny: each definition carries its own fields type.
  scenes?: SceneDefinition<any>[];
  style?: React.CSSProperties;
  className?: string;
};

/** A logo scene with no image of its own shows the brand logo. */
function withBrandLogo(scene: Scene, story: Story): Scene {
  return scene.type === "logo" && !scene.src && story.brand?.logo ? { ...scene, src: story.brand.logo } : scene;
}

function StoryAudio({ audio }: { audio: Story["audio"] }) {
  if (!audio) return null;
  return (
    <>
      {audio.music ? <Audio src={audio.music} volume={audio.musicVolume ?? 0.25} loop /> : null}
      {audio.voiceover ? <Audio src={audio.voiceover} /> : null}
      {Array.isArray(audio.captions) ? <Captions captions={audio.captions} /> : null}
    </>
  );
}

export function Storyboard({ story, scenes: custom = [], style, className }: StoryboardProps) {
  const outer = useTheme();
  const { frames, overlaps } = storyTimeline(story, custom);
  // Keyed by resolved sfx name, not scene index: two scenes that both end up playing "click" alternate
  // its two build variants (rule S2) even when other, differently-named sounds play in between.
  const sfxOccurrences = new Map<string, number>();
  const items: SceneItem[] = story.scenes.map((scene, index) => {
    const definition = custom.find((d) => d.type === scene.type);
    const Custom = definition?.component;
    const sfx =
      scene.sfx === false ? undefined : (scene.sfx ?? (story.defaults?.sfx && index > 0 ? DEFAULT_SFX : undefined));
    const sfxOccurrence = sfx ? (sfxOccurrences.get(sfx) ?? 0) : 0;
    if (sfx) sfxOccurrences.set(sfx, sfxOccurrence + 1);
    const overlap = overlaps[index] ?? 0;
    const name = scene.transition ?? story.defaults?.transition ?? DEFAULT_TRANSITION;
    return {
      node: (
        <Stage>
          {Custom ? (
            <>
              <Backdrop name={scene.background} />
              <Custom {...scene} />
            </>
          ) : (
            <SceneView scene={withBrandLogo(scene as Scene, story)} />
          )}
          {sfx ? <Sfx name={sfx as SfxName} occurrence={sfxOccurrence} /> : null}
        </Stage>
      ),
      duration: frames[index],
      transition: overlap > 0 ? (TRANSITIONS[name] ?? TRANSITIONS.fade)() : undefined,
      timing: overlap > 0 ? linearTiming({ durationInFrames: overlap }) : undefined,
    };
  });
  return (
    <ThemeProvider theme={brandTheme((story.theme as ThemeName | undefined) ?? outer, story.brand)}>
      <Scenes items={items} style={style} className={className} />
      <StoryAudio audio={story.audio} />
    </ThemeProvider>
  );
}

/** `<Storyboard>` taking the story itself as props: `component={StoryVideo}` with `--props=story.json`. */
export function StoryVideo(story: StoryJson) {
  return <Storyboard story={story as Story} />;
}

/** `calculateMetadata` for a Storyboard composition: checks the story, loads `audio.captions` from a URL, sums the scenes. */
export const storyMetadata: CalculateMetadataFunction<StoryJson> = async ({ props }) => {
  const result = storySchema.safeParse(props);
  if (!result.success) throw new Error(`Invalid story:\n${z.prettifyError(result.error)}`);
  const story = props as Story;
  const captions = story.audio?.captions;
  const resolved: Story =
    typeof captions === "string"
      ? { ...story, audio: { ...story.audio, captions: await (await fetch(captions)).json() } }
      : story;
  return { durationInFrames: storyFrames(resolved), fps: resolved.fps ?? STORY_FPS, props: resolved };
};

/** Fields every template shares (spec §9). Templates extend it: `templateSchema.extend({ … })`. */
export const templateSchema = z.object({
  /** Theme preset. Inherits the surrounding `ThemeProvider` when omitted. */
  theme: z.enum(themeNames as [ThemeName, ...ThemeName[]]).optional(),
  brand: brandSchema.optional(),
  /** Plays a soft whoosh as each scene starts. */
  sfx: z.boolean().optional(),
  /** Background music file, looped under everything at 25% volume. */
  music: z.string().optional(),
});
export type TemplateFields = z.infer<typeof templateSchema>;

/** A template's scenes as a story carrying its theme, brand, sound effects and music. */
export function templateStory(fields: TemplateFields, scenes: Scene[], transition = DEFAULT_TRANSITION): Story {
  return {
    theme: fields.theme,
    brand: fields.brand,
    audio: fields.music ? { music: fields.music } : undefined,
    defaults: { transition, sfx: fields.sfx },
    scenes,
  };
}

/** `calculateMetadata` for a template built on a story: the template runs as long as its story. */
export function templateMetadata<P extends Record<string, unknown>>(
  toStory: (props: P) => Story,
): CalculateMetadataFunction<P> {
  return ({ props }) => ({ durationInFrames: storyFrames(toStory(props)) });
}

/** Theme, brand and music around a template that lays out its own media instead of scenes. */
export function TemplateFrame({ fields, children }: { fields: TemplateFields; children: React.ReactNode }) {
  const outer = useTheme();
  return (
    <ThemeProvider theme={brandTheme(fields.theme ?? outer, fields.brand)}>
      <Stage>{children}</Stage>
      {fields.music ? <Audio src={fields.music} volume={0.25} loop /> : null}
    </ThemeProvider>
  );
}

/** Length of an audio or video file in seconds, read from its container by mediabunny. */
export async function mediaSeconds(src: string): Promise<number> {
  // staticFile() paths are relative; mediabunny needs an absolute URL. calculateMetadata always runs in a browser.
  const input = new MediabunnyInput({
    formats: ALL_FORMATS,
    source: new UrlSource(new URL(src, window.location.href)),
  });
  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
}

/** Splits a list into runs of at most `size`, so no bullets scene overflows. */
export function chunk<T>(list: T[], size: number): T[][] {
  const runs: T[][] = [];
  for (let i = 0; i < list.length; i += size) runs.push(list.slice(i, i + size));
  return runs;
}

const uiComponentSchema = z.object({
  id: z.string(),
  component: z.enum(["button", "input", "switch", "select", "tabs", "dialog"]),
  props: z.record(z.string(), z.unknown()).optional(),
});
type UiComponentConfig = z.infer<typeof uiComponentSchema>;

const uiStepSchema = z.object({
  at: z.number(),
  target: z.string().optional(),
  click: z.string().optional(),
  type: z.string().optional(),
  state: z.string().optional(),
});
type UiStep = z.infer<typeof uiStepSchema>;

export const uiSceneSchema = z
  .object({
    components: z.array(uiComponentSchema).min(1),
    steps: z.array(uiStepSchema),
    cursor: z.boolean().default(true),
  })
  // Spec §4 Formats: an unknown target/click id fails schema validation with a scene-path error
  // (`scenes.2.steps.1.click`), not at render time (ponytail-review should-fix 3).
  .superRefine((scene, ctx) => {
    const ids = new Set(scene.components.map((c) => c.id));
    scene.steps.forEach((step, i) => {
      for (const field of ["target", "click"] as const) {
        const id = step[field];
        if (id !== undefined && !ids.has(id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["steps", i, field],
            message: `unknown component id "${id}"; expected one of ${Array.from(ids).join(", ")}`,
          });
        }
      }
    });
  });

/** A scene-level step's target component's own `Step<unknown>[]` entry: `click` becomes `"press"` for a
 * button and `"active"` for an input (the spec's own two named mappings); an explicit `state` always wins;
 * any other kind with a bare `click` and no `state` is skipped (nothing to infer without one). */
function stepStateFor(kind: UiComponentConfig["component"], step: UiStep): unknown {
  if (step.state !== undefined) return step.state;
  if (step.click) {
    if (kind === "button") return "press";
    if (kind === "input") return "active";
    if (kind === "switch") return "on";
    if (kind === "select" || kind === "dialog") return "open";
  }
  return undefined;
}

/** Each kind's own resting state before any scene step touches it — matches the `initial` every kit's
 * own `useKeyframeState(steps, initial, …)` call already falls back to. */
const KIND_IDLE_STATE: Partial<Record<UiComponentConfig["component"], string>> = {
  button: "idle",
  input: "idle",
  switch: "off",
  select: "closed",
  dialog: "closed",
};

function stepsForComponent(id: string, kind: UiComponentConfig["component"], steps: UiStep[], fps: number) {
  const result: { at: number; state?: unknown; type?: string; click?: boolean }[] = [];
  for (const step of steps) {
    if (step.target !== id && step.click !== id) continue;
    const state = stepStateFor(kind, step);
    if (state === undefined && step.type === undefined) continue;
    result.push({ at: step.at, state, type: step.type, click: Boolean(step.click) });
  }
  // useKeyframeState's fold treats a single state-bearing entry as the component's state for its whole
  // timeline (no earlier "from" to tween out of), so a lone click step would render its target state from
  // frame 0 instead of only from its own step onward. Prepend the kind's own idle default one frame
  // earlier, so the real state only takes hold once its own step's frame actually arrives.
  const idleState = KIND_IDLE_STATE[kind];
  const firstState = result.findIndex((s) => s.state !== undefined);
  if (idleState !== undefined && firstState >= 0 && result[firstState].at > 0) {
    result.splice(firstState, 0, { at: Math.max(0, result[firstState].at - 1 / fps), state: idleState });
  }
  return result;
}

const HOLD_FRAMES = 30;

function UiSceneRenderer({ components, steps, cursor }: z.infer<typeof uiSceneSchema>) {
  const theme = useTheme();
  const { u, width, height, orientation, safe } = useViewport();
  const { fps } = useVideoConfig();
  const safePct = { x: (safe.x / width) * 100, top: (safe.top / height) * 100, bottom: (safe.bottom / height) * 100 };
  const places = stackLayout(components.length, orientation, safePct);

  // One scene-wide font-ready gate (Deviation 4a) — never a per-component `use<Name>Anchors` hook call,
  // which would be a Rules-of-Hooks violation over a variable-length, author-chosen `components` array.
  const buttonLabels = components
    .filter((c) => c.component === "button")
    .map((c) => String((c.props as { label?: string })?.label ?? ""));
  const selectLongest = components
    .filter((c) => c.component === "select")
    .map((c) =>
      ((c.props as { options?: string[] })?.options ?? []).reduce((a, b) => (b.length > a.length ? b : a), ""),
    );
  const tabsJoins = components
    .filter((c) => c.component === "tabs")
    .map((c) => ((c.props as { labels?: string[] })?.labels ?? []).join(""));
  const gateText = buttonLabels.concat(selectLongest, tabsJoins).join("|");
  const gate = useTextMetrics(gateText, { fontFamily: theme.fonts.body, fontSize: u(20), fontWeight: 600 });
  const bodyFont = (size: number, weight: number) => `${weight} ${u(size)}px ${theme.fonts.body}`;

  const anchors: Record<string, AnchorRect> = {};
  const rendered = components.map((config, i) => {
    const place = places[i];
    const compSteps = stepsForComponent(config.id, config.component, steps, fps);
    const shared = { id: config.id, place, steps: compSteps, ...(config.props ?? {}) };

    // Each kind's own exported pure box-size function (ponytail-review blocker 2) — never a formula
    // re-derived here, so a component's own `size`/`options`/`labels` prop can't diverge between what
    // renders and what the cursor targets. Text measurement itself still happens here, once per
    // component, in this same fixed `.map()` order (`measurePx` is pure, safe in a loop; the one hook,
    // `gate`, was already called unconditionally above).
    let box: { width: number; height: number };
    if (config.component === "button") {
      const label = String((config.props as { label?: string })?.label ?? "");
      const size = (config.props as { size?: number })?.size;
      const measuredWidth = gate.ready ? measurePx(label, bodyFont(size ?? BUTTON_FONT_SIZE, 600)) : 0;
      box = buttonBoxSize(size, u, measuredWidth);
    } else if (config.component === "select") {
      const options = (config.props as { options?: string[] })?.options ?? [];
      const longest = options.reduce((a, b) => (b.length > a.length ? b : a), "");
      const measuredWidth = gate.ready ? measurePx(longest, bodyFont(SELECT_FONT_SIZE, 500)) : 0;
      box = selectBoxSize(u, measuredWidth);
    } else if (config.component === "tabs") {
      const labels = (config.props as { labels?: string[] })?.labels ?? [];
      const measuredWidths = labels.map((l) =>
        gate.ready ? measurePx(l, bodyFont(TABS_FONT_SIZE, TABS_FONT_WEIGHT)) : 0,
      );
      const tabsBox = tabsBoxSize(u, measuredWidths);
      box = { width: tabsBox.total, height: tabsBox.height };
    } else if (config.component === "input") {
      box = inputBoxSize(u);
    } else if (config.component === "switch") {
      box = switchBoxSize(u);
    } else {
      box = dialogBoxSize(u, width, safe.x);
    }
    const { width: wPx, height: hPx } = box;
    const wPct = (wPx / width) * 100;
    const hPct = (hPx / height) * 100;
    anchors[config.id] = { x: place.x - wPct / 2, y: place.y - hPct / 2, width: wPct, height: hPct };

    switch (config.component) {
      case "button":
        return <Button key={config.id} {...(shared as React.ComponentProps<typeof Button>)} />;
      case "input":
        return <Input key={config.id} {...(shared as React.ComponentProps<typeof Input>)} />;
      case "switch":
        return <Switch key={config.id} {...(shared as React.ComponentProps<typeof Switch>)} />;
      case "select":
        return <Select key={config.id} {...(shared as React.ComponentProps<typeof Select>)} />;
      case "tabs":
        return <Tabs key={config.id} {...(shared as React.ComponentProps<typeof Tabs>)} />;
      case "dialog":
        return <Dialog key={config.id} {...(shared as React.ComponentProps<typeof Dialog>)} />;
      default:
        return null;
    }
  });

  // Cursor waypoints: one per scene step naming a `target`/`click`, arriving 0.4s before the step's `at`.
  const cursorSteps = steps.filter((s) => s.target || s.click);
  const arrivals: CursorWaypoint[] = cursorSteps.map((s) => {
    const id = (s.click ?? s.target) as string;
    const rect = anchors[id];
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      frame: Math.max(0, Math.round((s.at - 0.4) * fps)),
      click: Boolean(s.click),
    };
  });
  // Between two arrivals, `Cursor`'s single eased spline covers the whole gap — and the theme's
  // (front-loaded) easing reaches the next anchor well inside the first third of that gap, so a long
  // gap (typing has time to run) leaves the cursor parked on the *next* control long before this one's
  // own step fires. A same-position hold keyframe, timed a short beat before the next arrival is due,
  // pins the cursor on the current control for the rest of the gap and confines the actual travel to
  // that final beat — so it lands on each control at the time that control acts, per every gap length.
  const CURSOR_TRAVEL_FRAMES = Math.round(fps * 0.4);
  const waypoints: CursorWaypoint[] = [];
  arrivals.forEach((point, i) => {
    waypoints.push(point);
    const next = arrivals[i + 1];
    if (next && next.frame - point.frame > CURSOR_TRAVEL_FRAMES) {
      waypoints.push({ x: point.x, y: point.y, frame: next.frame - CURSOR_TRAVEL_FRAMES, click: false });
    }
  });

  return (
    <>
      {rendered}
      {cursor && waypoints.length > 0 ? <Cursor waypoints={waypoints} /> : null}
    </>
  );
}

export const uiScene = defineScene({
  type: "ui",
  schema: uiSceneSchema,
  component: UiSceneRenderer,
  duration: (scene) =>
    stepsDuration(
      scene.steps.map((s: UiStep) => ({ at: s.at })),
      HOLD_FRAMES,
      STORY_FPS,
    ) / STORY_FPS,
});
