// Demo ids and theme names, learned from the committed thumbnail filenames (scripts/thumbs.ts writes them),
// never from `@reelcn/registry/demos`: that module creates React context at import time, which a Server
// Component (this one, and anything that imports it) is not allowed to do.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function thumbsDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "thumbs");
}

function readDemoIds(dir: string): string[] {
  return JSON.parse(readFileSync(path.join(dir, "demos.json"), "utf8")) as string[];
}

function readThemeNames(dir: string): string[] {
  return readdirSync(dir)
    .filter((file) => file.startsWith("theme-") && file.endsWith(".jpg"))
    .map((file) => file.slice("theme-".length, -".jpg".length))
    .sort();
}

const DIR = thumbsDir();
export type ThumbFormat = "16x9" | "9x16" | "1x1";
const THUMB_FORMATS: ThumbFormat[] = ["9x16", "1x1"];

// `demos.json` now lists three files per demo when thumbs.ts rendered all three formats (`<id>`, `<id>-9x16`,
// `<id>-1x1`) instead of one. `demoIds` below stays the real, one-per-demo list every existing caller
// (demosFor/firstDemo, lib/tree.tsx, the docs pages) already expects; `formatsFor` is the new accessor for
// the format-suffixed files.
const rawIds = readDemoIds(DIR);
const rawIdSet = new Set(rawIds);

/** True when `id` is a 9:16/1:1 thumbnail file alongside an already-present `<base>` demo id, not a real demo. */
function isFormatVariant(id: string): boolean {
  return THUMB_FORMATS.some((format) => id.endsWith(`-${format}`) && rawIdSet.has(id.slice(0, -`-${format}`.length)));
}

/** Demo ids, in composition order (the order `scripts/thumbs.ts` rendered and wrote `demos.json`). */
export const demoIds: string[] = rawIds.filter((id) => !isFormatVariant(id));

/** Frames per demo id, from `durations.json` (scripts/thumbs.ts); empty until thumbs has written it. */
export const demoFrames: Record<string, number> = (() => {
  try {
    return JSON.parse(readFileSync(path.join(DIR, "durations.json"), "utf8")) as Record<string, number>;
  } catch {
    return {};
  }
})();

/** The 6 theme names, from the committed `theme-<name>.jpg` frames, alphabetical. */
export const themeNames: string[] = readThemeNames(DIR);

/**
 * Every demo id that belongs to a registry item: the id itself, or `<name>-<variant>`. Safe against
 * neighbors that share a word (`grid` / `bento-grid`, `counter` / `stat-counter`, `flash` / `light-flash`)
 * because the match requires `name` as a whole leading segment, not a substring.
 */
export function demosFor(name: string): string[] {
  const prefix = `${name}-`;
  return demoIds.filter((id) => id === name || id.startsWith(prefix));
}

export function firstDemo(name: string): string | undefined {
  return demosFor(name)[0];
}

/**
 * The thumbnail file for each format thumbs.ts actually rendered for one demo id: always 16:9 (the bare
 * `id`), plus 9:16/1:1 only when that composition exists (some demos ship in one format only).
 */
export function formatsFor(id: string): { format: ThumbFormat; file: string }[] {
  const formats: { format: ThumbFormat; file: string }[] = [{ format: "16x9", file: id }];
  for (const format of THUMB_FORMATS) {
    const file = `${id}-${format}`;
    if (rawIdSet.has(file)) formats.push({ format, file });
  }
  return formats;
}
