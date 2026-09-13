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

/** Demo ids, in composition order (the order `scripts/thumbs.ts` rendered and wrote `demos.json`). */
export const demoIds: string[] = readDemoIds(DIR);

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
