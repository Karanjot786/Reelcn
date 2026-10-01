// Typed access to the reelcn-motion films. motion-films.json is written by scripts/motion-films.ts from the skill's files.
import manifest from "./motion-films.json" with { type: "json" };

export type Scene = { name: string; start: number; length: number; words: string };
export type Film = {
  id: string;
  renderer: string;
  plan: string;
  video: string;
  poster: string;
  seconds: number;
  bytes: number;
  scenes: Scene[];
};

export const films: Film[] = manifest.films;
export const renderers: string[] = manifest.renderers;
export const counts = {
  starters: films.length,
  renderers: renderers.length,
  references: manifest.references,
  plans: manifest.plans,
};

export const RENDERER_NAMES: Record<string, string> = {
  hyperframes: "HyperFrames",
  remotion: "Remotion",
  editframe: "Editframe",
  fframes: "fframes",
};

export function filmOf(renderer: string, plan: string): Film {
  const film = films.find((f) => f.renderer === renderer && f.plan === plan);
  if (!film) throw new Error(`no ${renderer} ${plan} film`);
  return film;
}

/** Index of the scene playing at `t` seconds. The last scene holds to the end. */
export function sceneAt(scenes: Scene[], t: number): number {
  let index = 0;
  for (let i = 0; i < scenes.length; i++) if (t >= scenes[i].start) index = i;
  return index;
}

/** Seconds as m:ss, with a tenth only when there is one: 6.5 is 0:06.5, 13 is 0:13. */
export function clock(seconds: number): string {
  const s = seconds % 60;
  const whole = Number.isInteger(s);
  return `${Math.floor(seconds / 60)}:${(whole ? String(s) : s.toFixed(1)).padStart(whole ? 2 : 4, "0")}`;
}
