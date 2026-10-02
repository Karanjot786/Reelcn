// Checks and encodes the reelcn-motion films for /motion-design, and writes the manifest the page reads.
// Run: pnpm motion:films   (needs ffmpeg and cwebp; each film is rendered at 4K into out/hi/, or at 2K, then shown at 2K)
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const SKILL = "skills/reelcn-motion";
const OUT = "apps/www/public/motion";
const check = await import(path.resolve(SKILL, "scripts/motion-check.mjs"));

// The render of each starter. Every starter needs one; the page shows only checked films.
const SOURCES: Record<string, string> = {
  "hyperframes-launch-film": "out/hi/hyperframes-launch-film.mp4",
  "hyperframes-showreel": "out/karanjot-reel/karanjot-reel-2k.mp4",
  "hyperframes-title-sequence": "out/hi/hyperframes-title-sequence.mp4",
  "hyperframes-changelog-clip": "out/hi/hyperframes-changelog-clip.mp4",
  "remotion-launch-film": "out/hi/remotion-launch-film.mp4",
  // ponytail: editframe --scale above 1 upscales a 1080p frame, so this film stays at 1080p until it renders 4K natively.
  "editframe-launch-film": "out/editframe-launch-film.mp4",
  "fframes-launch-film": "out/hi/fframes-launch-film.mp4",
};

// Posters picked by eye where the longest hold is a weak frame: the title sequence opens on black,
// and the showreel's longest hold is a half-typed command, so it shows the full tagline.
const POSTER_AT: Record<string, string> = { "hyperframes-title-sequence": "3.60", "hyperframes-showreel": "12.80" };

// 2K at most, never upscaled: a 1080p source stays 1080p.
const SHOW = "scale=-2:'min(1440,ih)':flags=lanczos";

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
  // 2K from a 4K render keeps text sharp. ponytail: three quality steps; widen the list if one stays over 5 MB.
  for (const crf of [20, 23, 26]) {
    ffmpeg([
      "-i",
      src,
      "-vf",
      SHOW,
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
    if (statSync(video).size < 5e6) break;
  }
  // Poster: the middle of the longest hold, never frame 0.
  const runs: Run[] = check.stillRuns(check.measureEnergy(src), check.TOKENS.targets.movingThreshold);
  const hold = runs.reduce((a, r) => (r.seconds > a.seconds ? r : a), { start: plan.total * 0.7, seconds: 0 });
  const at = POSTER_AT[id] ?? (hold.start + hold.seconds / 2).toFixed(2);
  const png = path.join(OUT, `${id}.png`);
  ffmpeg(["-ss", at, "-i", src, "-frames:v", "1", "-vf", SHOW, png]);
  execFileSync("cwebp", ["-quiet", "-q", "85", png, "-o", path.join(OUT, `${id}.webp`)]);
  rmSync(png);
  const [renderer, ...rest] = id.split("-");
  return {
    id,
    renderer,
    plan: rest.join("-"),
    video: `/motion/${id}.mp4`,
    poster: `/motion/${id}.webp`,
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
