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
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import type React from "react";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { brandSweep } from "./brand-sweep";
import { Captions } from "./captions";
import { cardPush } from "./card-push";
import { circleBurst } from "./circle-burst";
import { createTheme, Stage, type Theme, type ThemeName, ThemeProvider, themeNames, useTheme } from "./core";
import { glitch } from "./glitch";
import { lightFlash } from "./light-flash";
import { rackFocus } from "./rack-focus";
import { type SceneItem, Scenes } from "./scenes";
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
  const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(new URL(src, window.location.href)) });
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
