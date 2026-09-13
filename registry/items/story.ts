/**
 * @title Story
 * @category lib
 * @description The storyboard's JSON schema and scene-length rules, as pure functions shared by `storyboard` and every template.
 * @tags storyboard, schema, duration, zod
 * @example
 * import { storyFrames } from "./story";
 * // 5 s of text + 3 s of image, minus a 15-frame fade: 225 frames at 30 fps.
 * storyFrames({
 *   scenes: [
 *     { type: "text", text: "Ten words take a viewer about four seconds to read" },
 *     { type: "image", src: "/shot.png" },
 *   ],
 * });
 */
import { z } from "zod";
import type { CodeLanguage } from "./code-tokens";

/** Languages the code scene can color. */
export const LANGUAGES = ["ts", "js", "tsx", "py", "bash", "json"] as const satisfies readonly CodeLanguage[];

/** Frames per second when a story sets none. Every template uses it. */
export const STORY_FPS = 30;
/** Frames each transition overlaps its two scenes by, unless the story sets `defaults.transitionFrames`. */
export const TRANSITION_FRAMES = 15;
/** Transition used between scenes that name none. */
export const DEFAULT_TRANSITION = "fade";
/** Characters per second the `code` scene types at. */
export const CODE_CPS = 40;

const common = {
  /** Seconds. Wins over the scene's natural length. */
  duration: z.number().positive().optional(),
  /** Transition into the next scene, or "none" for a hard cut. */
  transition: z.string().optional(),
  /** Sound effect at the start of the scene, or false for silence. */
  sfx: z.union([z.string(), z.literal(false)]).optional(),
  /** A background item name, drawn behind the scene. */
  background: z.string().optional(),
};
const src = z.string().min(1);
const datum = z.object({ label: z.string(), value: z.number() });

const titleScene = z.object({
  type: z.literal("title"),
  ...common,
  title: z.string(),
  subtitle: z.string().optional(),
  kicker: z.string().optional(),
});
const textScene = z.object({
  type: z.literal("text"),
  ...common,
  text: z.string(),
  accent: z.array(z.string()).optional(),
});
const bulletsScene = z.object({
  type: z.literal("bullets"),
  ...common,
  title: z.string().optional(),
  items: z.array(z.object({ text: z.string(), detail: z.string().optional(), badge: z.string().optional() })).min(1),
});
const imageScene = z.object({
  type: z.literal("image"),
  ...common,
  src,
  caption: z.string().optional(),
  zoom: z.boolean().optional(),
});
const videoScene = z.object({
  type: z.literal("video"),
  ...common,
  src,
  /** Seconds into the file where the scene starts. */
  trimStart: z.number().min(0).optional(),
  /** Seconds into the file where the scene ends. */
  trimEnd: z.number().positive().optional(),
  muted: z.boolean().optional(),
});
const deviceScene = z.object({
  type: z.literal("device"),
  ...common,
  device: z.enum(["phone", "laptop", "browser"]),
  /** Screenshot or screen recording. A themed placeholder screen is drawn when omitted. */
  src: src.optional(),
  /** Address shown by the `browser` device. */
  url: z.string().optional(),
});
const codeScene = z.object({
  type: z.literal("code"),
  ...common,
  code: z.string(),
  language: z.enum(LANGUAGES).optional(),
  title: z.string().optional(),
  highlight: z.array(z.number().int().positive()).optional(),
});
const terminalScene = z.object({
  type: z.literal("terminal"),
  ...common,
  lines: z.array(z.object({ type: z.enum(["command", "output"]), text: z.string() })).min(1),
  title: z.string().optional(),
});
const chartScene = z.object({
  type: z.literal("chart"),
  ...common,
  kind: z.enum(["bar", "line", "donut"]),
  title: z.string().optional(),
  data: z.array(datum).min(1),
});
const statScene = z.object({
  type: z.literal("stat"),
  ...common,
  label: z.string(),
  value: z.number(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  delta: z.number().optional(),
  caption: z.string().optional(),
});
const quoteScene = z.object({
  type: z.literal("quote"),
  ...common,
  quote: z.string(),
  name: z.string(),
  role: z.string().optional(),
  avatar: src.optional(),
});
const postScene = z.object({
  type: z.literal("post"),
  ...common,
  name: z.string(),
  handle: z.string().optional(),
  text: z.string(),
  avatar: src.optional(),
  metrics: z
    .object({ likes: z.number().optional(), comments: z.number().optional(), shares: z.number().optional() })
    .optional(),
});
const ctaScene = z.object({
  type: z.literal("cta"),
  ...common,
  title: z.string(),
  button: z.string().optional(),
  url: z.string().optional(),
});
const logoScene = z.object({ type: z.literal("logo"), ...common, text: z.string(), src: src.optional() });
const leafScenes = [
  titleScene,
  textScene,
  bulletsScene,
  imageScene,
  videoScene,
  deviceScene,
  codeScene,
  terminalScene,
  chartScene,
  statScene,
  quoteScene,
  postScene,
  ctaScene,
  logoScene,
] as const;
const leafSceneSchema = z.discriminatedUnion("type", leafScenes);
const splitScene = z.object({
  type: z.literal("split"),
  ...common,
  left: leafSceneSchema,
  right: leafSceneSchema,
  labels: z.array(z.string()).max(2).optional(),
});

const sceneSchemas = [...leafScenes, splitScene] as const;

/** One built-in scene. */
export const sceneSchema = z.discriminatedUnion("type", sceneSchemas);

/** Each scene's schema by its `type`, so a story is checked one scene at a time. */
const SCENE_SCHEMAS: Record<string, z.ZodObject> = {};
for (const schema of sceneSchemas) SCENE_SCHEMAS[schema.shape.type.value] = schema;

/** A word-level caption, as `@remotion/captions` and `reelcn-transcribe` write it. */
export const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
});

export const brandSchema = z.object({
  /** Replaces the theme accent. */
  accent: z.string().optional(),
  /** Logo image; logo scenes show it. */
  logo: z.string().optional(),
  /** Heading font family. Load it yourself (see the theming guide). */
  font: z.string().optional(),
});

/** The story's own fields. Scenes are checked one at a time by `makeStorySchema`, so errors name the scene. */
export const storyShape = z.object({
  theme: z.string().optional(),
  brand: brandSchema.optional(),
  fps: z.number().int().positive().optional(),
  audio: z
    .object({
      music: z.string().optional(),
      musicVolume: z.number().min(0).max(1).optional(),
      voiceover: z.string().optional(),
      /** Captions, or the URL of a JSON file holding them. */
      captions: z.union([z.string(), z.array(captionSchema)]).optional(),
    })
    .optional(),
  defaults: z
    .object({
      transition: z.string().optional(),
      transitionFrames: z.number().int().min(0).optional(),
      sfx: z.boolean().optional(),
    })
    .optional(),
  scenes: z.array(z.looseObject({ type: z.string() })).min(1),
});

export type Scene = z.infer<typeof sceneSchema>;
export type SceneType = Scene["type"];
export type SceneOf<T extends SceneType> = Extract<Scene, { type: T }>;
/** A scene of a type registered with `defineScene`. */
export type CustomScene = {
  type: string;
  duration?: number;
  transition?: string;
  sfx?: string | false;
  background?: string;
  [field: string]: unknown;
};
/** A story as JSON: what `storySchema` parses and `--props=story.json` passes. */
export type StoryJson = z.infer<typeof storyShape>;
export type Story = Omit<StoryJson, "scenes"> & { scenes: (Scene | CustomScene)[] };

/** The names a story may use. `storyboard` passes the real lists; tests pass their own. */
export type StoryNames = {
  themes: readonly string[];
  transitions: readonly string[];
  backgrounds: readonly string[];
  sfx: readonly string[];
};

/** What the rules need to know about a custom scene type. `defineScene` definitions fit this shape. */
export type CustomSceneRule = {
  type: string;
  /** The scene's own fields; `type` and the shared fields are added. */
  schema: z.ZodObject;
  /** Seconds, when the scene sets no `duration`. */
  // biome-ignore lint/suspicious/noExplicitAny: each custom scene has its own fields.
  duration: (scene: any) => number;
};

/** The story schema for a set of names: unknown names and malformed scenes fail with a path like `scenes.2.title`. */
export function makeStorySchema(names: StoryNames, custom: CustomSceneRule[] = []) {
  return storyShape.superRefine((story, ctx) => {
    const check = (value: unknown, list: readonly string[], what: string, path: PropertyKey[]) => {
      if (typeof value === "string" && list.indexOf(value) < 0) {
        ctx.addIssue({
          code: "custom",
          path,
          message: `unknown ${what} "${value}"; expected one of ${list.join(", ")}`,
        });
      }
    };
    const checkNames = (scene: Record<string, unknown>, path: PropertyKey[]) => {
      check(scene.transition, names.transitions.concat("none"), "transition", path.concat("transition"));
      check(scene.sfx, names.sfx, "sound effect", path.concat("sfx"));
      check(scene.background, names.backgrounds, "background", path.concat("background"));
    };
    check(story.theme, names.themes, "theme", ["theme"]);
    check(story.defaults?.transition, names.transitions, "transition", ["defaults", "transition"]);
    story.scenes.forEach((scene, index) => {
      const path: PropertyKey[] = ["scenes", index];
      let rule: CustomSceneRule | undefined;
      for (const candidate of custom) if (candidate.type === scene.type) rule = candidate;
      const schema = rule
        ? rule.schema.extend({ type: z.literal(rule.type), ...common })
        : Object.hasOwn(SCENE_SCHEMAS, scene.type)
          ? SCENE_SCHEMAS[scene.type]
          : undefined;
      if (!schema) {
        const known = Object.keys(SCENE_SCHEMAS).concat(custom.map((r) => r.type));
        ctx.addIssue({
          code: "custom",
          path: path.concat("type"),
          message: `unknown scene type "${scene.type}"; expected one of ${known.join(", ")}`,
        });
        return;
      }
      const result = schema.safeParse(scene);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({ code: "custom", path: path.concat(issue.path), message: issue.message });
        }
        return;
      }
      checkNames(scene, path);
      if (scene.type === "split") {
        checkNames(scene.left as Record<string, unknown>, path.concat("left"));
        checkNames(scene.right as Record<string, unknown>, path.concat("right"));
      }
    });
  });
}

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Seconds to read some text: 2.5 words a second plus one, never under 2 (spec §10.3). */
export const readingSeconds = (...texts: (string | undefined)[]) => Math.max(2, words(texts.join(" ")) / 2.5 + 1);

/**
 * Seconds the `terminal` item takes to type these lines with its defaults: 32 characters a second,
 * 0.4 s before and 0.3 s after each command, 3 frames (0.1 s) per output line.
 */
export const typingSeconds = (lines: { type: string; text: string }[]) =>
  lines.reduce((total, line) => total + (line.type === "command" ? line.text.length / 32 + 0.7 : 0.1), 0);

export const isVideo = (src?: string) => /\.(mp4|webm|mov|m4v)([?#]|$)/i.test(src ?? "");

/** Seconds a caption track covers, plus half a second of air; `fallback` when it is empty. */
export const captionsSeconds = (captions: { endMs: number }[], fallback: number) =>
  captions.length > 0 ? captions[captions.length - 1].endMs / 1000 + 0.5 : fallback;

/** A scene's length in seconds (spec §10.3). */
export function sceneSeconds(scene: Scene | CustomScene, custom: CustomSceneRule[] = []): number {
  if (scene.duration) return scene.duration;
  for (const rule of custom) if (rule.type === scene.type) return rule.duration(scene);
  const s = scene as Scene;
  switch (s.type) {
    case "title":
      return readingSeconds(s.title, s.subtitle, s.kicker);
    case "text":
      return readingSeconds(s.text);
    case "bullets":
      return readingSeconds(s.title, ...s.items.map((item) => `${item.text} ${item.detail ?? ""}`));
    case "quote":
      return readingSeconds(s.quote, s.name, s.role);
    case "post":
      return readingSeconds(s.name, s.text);
    case "cta":
      return readingSeconds(s.title, s.button, s.url);
    case "logo":
      return readingSeconds(s.text);
    case "image":
      return 3;
    case "video":
      return s.trimEnd !== undefined ? s.trimEnd - (s.trimStart ?? 0) : 5;
    case "device":
      return isVideo(s.src) ? 5 : 3;
    case "chart":
    case "stat":
      return 4;
    case "code":
      return s.code.length / CODE_CPS + 1.5;
    case "terminal":
      return typingSeconds(s.lines) + 1.5;
    case "split":
      return Math.max(sceneSeconds(s.left, custom), sceneSeconds(s.right, custom));
  }
}

/** Frames each scene plays, and the frames each transition overlaps the scene after it (0 for a hard cut). */
export function storyTimeline(story: Story, custom: CustomSceneRule[] = []) {
  const fps = story.fps ?? STORY_FPS;
  const frames = story.scenes.map((scene) => Math.round(sceneSeconds(scene, custom) * fps));
  const overlaps = frames.slice(0, -1).map((length, index) => {
    const name = story.scenes[index].transition ?? story.defaults?.transition ?? DEFAULT_TRANSITION;
    const wanted = name === "none" ? 0 : (story.defaults?.transitionFrames ?? TRANSITION_FRAMES);
    // A transition may not outlast either neighbor; half the shorter one keeps every story valid.
    return Math.min(wanted, Math.floor(Math.min(length, frames[index + 1]) / 2));
  });
  return { frames, overlaps };
}

const sum = (list: number[]) => list.reduce((total, n) => total + n, 0);

/** Total frames of a story: every scene, minus the frames its transitions overlap. */
export function storyFrames(story: Story, custom: CustomSceneRule[] = []): number {
  const { frames, overlaps } = storyTimeline(story, custom);
  return sum(frames) - sum(overlaps);
}
