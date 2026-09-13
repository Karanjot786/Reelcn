import type { Caption } from "@remotion/captions";

/** Word timings for the caption demos, so they need no audio file and stay deterministic. */
const words: [string, number, number][] = [
  ["Most", 0, 300],
  ["videos", 300, 700],
  ["die", 700, 980],
  ["in", 980, 1120],
  ["the", 1120, 1260],
  ["first", 1260, 1620],
  ["three", 1620, 1980],
  ["seconds.", 1980, 2500],
  ["Give", 2700, 3000],
  ["people", 3000, 3400],
  ["one", 3400, 3640],
  ["reason", 3640, 4080],
  ["to", 4080, 4200],
  ["stay,", 4200, 4640],
  ["then", 4840, 5120],
  ["earn", 5120, 5460],
  ["the", 5460, 5600],
  ["next", 5600, 5940],
  ["one.", 5940, 6400],
];

export const captionFixture: Caption[] = words.map(([text, startMs, endMs]) => ({
  text: `${text} `,
  startMs,
  endMs,
  timestampMs: startMs,
  confidence: null,
}));
