// Checks and encodes the reelcn-motion films for /motion-design, and writes the manifest the page reads.
// Run: pnpm motion:films   (needs ffmpeg; each film is rendered into out/ by its starter's README command)
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const SKILL = "skills/reelcn-motion";
const OUT = "apps/www/public/motion";
const check = await import(path.resolve(SKILL, "scripts/motion-check.mjs"));

// The render of each starter. Every starter needs one; the page shows only checked films.
const SOURCES: Record<string, string> = {
  "hyperframes-launch-film": "out/reelcn-launch-film.mp4",
  "hyperframes-showreel": "out/film-showreel.mp4",
  "hyperframes-title-sequence": "out/film-title-sequence.mp4",
  "hyperframes-changelog-clip": "out/film-changelog-clip.mp4",
  "remotion-launch-film": "out/remotion-launch-film.mp4",
  "editframe-launch-film": "out/editframe-launch-film.mp4",
  "fframes-launch-film": "out/fframes-launch-film.mp4",
};

type Run = { start: number; seconds: number };
const ffmpeg = (args: string[]) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
const starters = readdirSync(path.join(SKILL, "starters")).sort();
const missing = starters.filter((id) => !SOURCES[id]);
if (missing.length > 0) throw new Error(`no render listed for ${missing.join(", ")}: add it to SOURCES`);
mkdirSync(OUT, { recursive: true });

const films = starters.map((id) => {
  const src = SOURCES[id];
  const planPath = path.join(SKILL, "starters", id, "plan.md");
  // The page shows only films that pass the skill's own check; a miss stops the script.
  execFileSync("node", [path.join(SKILL, "scripts/motion-check.mjs"), src, planPath], { stdio: "inherit" });
  const plan = check.parsePlan(readFileSync(planPath, "utf8"));
  const video = path.join(OUT, `${id}.mp4`);
  // ponytail: two quality steps cover every film so far; widen the list if one stays over 2.5 MB.
  for (const crf of [26, 30]) {
    ffmpeg([
      "-i",
      src,
      "-vf",
      "scale=-2:720",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      String(crf),
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      video,
    ]);
    if (statSync(video).size < 2.5e6) break;
  }
  // Poster: the middle of the longest hold, never frame 0.
  const runs: Run[] = check.stillRuns(check.measureEnergy(src), check.TOKENS.targets.movingThreshold);
  const hold = runs.reduce((a, r) => (r.seconds > a.seconds ? r : a), { start: plan.total * 0.7, seconds: 0 });
  // ponytail: hyperframes-title-sequence holds on black for its first 1.8s, so its poster is the title at 3.6s.
  const at = id === "hyperframes-title-sequence" ? "3.60" : (hold.start + hold.seconds / 2).toFixed(2);
  ffmpeg(["-ss", at, "-i", src, "-frames:v", "1", "-vf", "scale=-2:720", "-q:v", "3", path.join(OUT, `${id}.jpg`)]);
  const [renderer, ...rest] = id.split("-");
  return {
    id,
    renderer,
    plan: rest.join("-"),
    video: `/motion/${id}.mp4`,
    poster: `/motion/${id}.jpg`,
    seconds: plan.total,
    bytes: statSync(video).size,
    scenes: plan.scenes.map((s: { name: string; start: number; length: number; quotes: string[] }) => ({
      name: s.name,
      start: s.start,
      length: s.length,
      words: s.quotes.join(" "),
    })),
  };
});

const count = (dir: string) => readdirSync(path.join(SKILL, dir)).length;
const manifest = {
  renderers: readdirSync(path.join(SKILL, "renderers"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort(),
  references: count("references"),
  plans: count("plans"),
  films,
};
writeFileSync("apps/www/lib/motion-films.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`wrote ${films.length} films to ${OUT} and apps/www/lib/motion-films.json`);
