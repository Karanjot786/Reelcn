#!/usr/bin/env node
// reelcn-motion check.
// Plan mode:  node motion-check.mjs --plan plan.md
// Video mode: node motion-check.mjs out.mp4 plan.md [--moving 0.3] [--sheet sheet.png]
// Targets come from three reference films and one approved film (tokens.json `targets`).
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const TOKENS = JSON.parse(readFileSync(path.join(HERE, "../tokens/tokens.json"), "utf8"));
const T = TOKENS.targets;
export const JOINS = ["morph", "match", "whip", "zoom-through", "wipe", "flood", "cut", "end"];
export const SOUNDS = [
  "intro",
  "typing",
  "ticks",
  "build",
  "beat",
  "drop",
  "hit",
  "whoosh",
  "blip",
  "riser",
  "scan",
  "final",
  "none",
];
// Moves that describe no meaning. A move names what the element does and why, not only that it appears.
const GENERIC =
  /^(fade|fades|fade in|fade up|fades in|slide|slides|slide in|slides in|slide up|pop|pops in|appear|appears|scale in|zoom in)\.?$/i;
const EPS = 0.011;

/** Seconds at which beat `n` of a track lands. */
export function beatTime(n, bpm, offset = 0) {
  return offset + (n * 60) / bpm;
}

function cells(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function parsePlan(text) {
  const header = {};
  for (const m of text.matchAll(/^(tempo|carrier|music|total):[ \t]*(.+)$/gm)) header[m[1]] = m[2].trim();
  const rows = text.split("\n").filter((line) => line.trim().startsWith("|"));
  if (rows.length < 3) throw new Error("plan has no scene table");
  const cols = cells(rows[0]);
  const scenes = rows.slice(2).map((row) => {
    const parts = cells(row);
    if (parts.length !== cols.length) {
      throw new Error(
        `row "${parts[0]}" has ${parts.length} cells, the header has ${cols.length}. Remove any "|" inside a cell.`,
      );
    }
    const raw = Object.fromEntries(parts.map((cell, i) => [cols[i], cell]));
    const words = [...(raw.words ?? "").matchAll(/"([^"]*)"/g)]
      .flatMap((m) => m[1].split(/\s+/))
      .filter(Boolean).length;
    return {
      name: raw.scene ?? "",
      start: Number(raw.start),
      length: Number(raw.length),
      shows: raw.shows ?? "",
      words,
      move: raw.move ?? "",
      live: raw.live ?? "",
      carrier: raw.carrier ?? "",
      sound: (raw.sound ?? "none")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      join: raw.join ?? "",
    };
  });
  const music = (header.music ?? "generated").split(/\s+/);
  const tempo = Number(header.tempo ?? music[1]);
  return {
    tempo,
    carrier: header.carrier ?? "",
    music: music[0] === "none" ? null : { source: music[0], offset: Number(music[2] ?? 0) },
    total: Number(header.total),
    scenes,
  };
}

/** Every rule a plan breaks, one sentence each. Empty means the plan passes. */
export function checkPlan(plan) {
  const misses = [];
  const miss = (scene, text) => misses.push(`${scene ? `${scene.name}: ` : ""}${text}`);
  if (!(plan.total > 0)) miss(null, "total must be a number of seconds");
  if (!plan.carrier) miss(null, "name the carrier: the element that survives every scene change");
  if (plan.music && !(plan.tempo > 0)) miss(null, "tempo must be a number of beats per minute");
  const minScenes = Math.ceil(plan.total / T.secondsPerScene);
  if (plan.scenes.length < minScenes)
    miss(null, `${plan.scenes.length} scenes, a ${plan.total}s film needs at least ${minScenes}`);
  let clock = 0;
  let cuts = 0;
  let still = 0;
  for (const [i, scene] of plan.scenes.entries()) {
    const last = i === plan.scenes.length - 1;
    if (Math.abs(scene.start - clock) > EPS)
      miss(scene, `starts at ${scene.start}s, the scene before ends at ${clock}s`);
    clock = scene.start + scene.length;
    if (scene.length < T.sceneMin - EPS || scene.length > T.sceneMax + EPS)
      miss(scene, `${scene.length}s long, keep scenes between ${T.sceneMin}s and ${T.sceneMax}s`);
    if (!scene.shows) miss(scene, "say what real material the scene shows");
    if (!scene.move || GENERIC.test(scene.move))
      miss(scene, `move "${scene.move}" says nothing about meaning. Describe how the element moves and why`);
    if (!scene.live) miss(scene, "say what keeps moving while the words are read, or write none");
    if (/^none$/i.test(scene.live)) still += 1;
    if (!scene.carrier) miss(scene, "say how the carrier enters or leaves this scene");
    const budget = T.wordsPerSecond * scene.length;
    if (scene.words > budget + EPS)
      miss(scene, `${scene.words} words in ${scene.length}s, the budget is ${Math.floor(budget)}`);
    if (JOINS.indexOf(scene.join) === -1) miss(scene, `join "${scene.join}" is not one of ${JOINS.join(", ")}`);
    if (last !== (scene.join === "end"))
      miss(scene, last ? 'the last scene must join "end"' : 'only the last scene joins "end"');
    if (scene.join === "cut") cuts += 1;
    for (const s of scene.sound)
      if (SOUNDS.indexOf(s) === -1) miss(scene, `sound "${s}" is not one of ${SOUNDS.join(", ")}`);
    if (plan.music && plan.tempo > 0) {
      const gap = 60 / plan.tempo;
      const n = Math.round((scene.start - plan.music.offset) / gap);
      const off = Math.abs(beatTime(n, plan.tempo, plan.music.offset) - scene.start);
      if (off > T.beatTolerance) miss(scene, `starts ${off.toFixed(2)}s off the beat grid`);
    }
  }
  if (Math.abs(clock - plan.total) > EPS) miss(null, `scenes end at ${clock}s, total says ${plan.total}s`);
  if (cuts > T.maxCuts) miss(null, `${cuts} cuts, at most ${T.maxCuts}. Join scenes through the carrier instead`);
  if (still > 1) miss(null, `${still} scenes with nothing moving during the read, at most one`);
  return misses;
}

/** Samples from ffmpeg's metadata print. ffmpeg writes tiny values in scientific notation, like 6.94e-05. */
export function parseEnergy(out) {
  const samples = [];
  let t = null;
  for (const line of out.split("\n")) {
    const time = /pts_time:([\d.]+)/.exec(line);
    if (time) t = Number(time[1]);
    const value = /YAVG=([\d.]+(?:e[-+]?\d+)?)/i.exec(line);
    if (value && t !== null) samples.push({ t, e: Number(value[1]) });
  }
  return samples;
}

/** Still runs, as { start, seconds }. A frame is still when its energy is under `moving`. */
export function stillRuns(samples, moving) {
  const runs = [];
  let start = null;
  let prev = null;
  for (const s of samples) {
    if (s.e < moving) {
      if (start === null) start = prev ?? s.t;
    } else if (start !== null) {
      runs.push({ start, seconds: s.t - start });
      start = null;
    }
    prev = s.t;
  }
  if (start !== null && prev !== null) runs.push({ start, seconds: prev - start });
  return runs;
}

/** Motion targets: share of moving frames, longest still, longest still before the final seconds. */
export function checkMotion(samples, plan, moving = T.movingThreshold) {
  const misses = [];
  if (samples.length === 0) return ["no video frames measured"];
  const share = samples.filter((s) => s.e >= moving).length / samples.length;
  const runs = stillRuns(samples, moving);
  const longest = runs.reduce((a, r) => (r.seconds > a.seconds ? r : a), { start: 0, seconds: 0 });
  const endZone = plan.total - T.finalZone;
  const body = runs
    .filter((r) => r.start < endZone)
    .reduce((a, r) => (r.seconds > a.seconds ? r : a), { start: 0, seconds: 0 });
  const where = (r) => plan.scenes.find((s) => r.start >= s.start - EPS && r.start < s.start + s.length)?.name ?? "?";
  if (share < T.motionShare)
    misses.push(
      `${Math.round(share * 100)}% of frames move, the target is ${Math.round(T.motionShare * 100)}%. Give every read something live`,
    );
  const limit = longest.start < endZone ? T.sceneStill : T.longestStill;
  if (longest.seconds > limit)
    misses.push(
      `${where(longest)}: still for ${longest.seconds.toFixed(2)}s at ${longest.start.toFixed(2)}s, the limit is ${limit}s`,
    );
  if (body.seconds > T.sceneStill && body.start !== longest.start)
    misses.push(
      `${where(body)}: still for ${body.seconds.toFixed(2)}s at ${body.start.toFixed(2)}s, the limit before the final ${T.finalZone}s is ${T.sceneStill}s`,
    );
  return misses;
}

/** Times of one-frame flashes: two big changes in a row (on, then off) with calm frames either side. */
export function findFlashes(samples, level = T.flashLevel) {
  const at = [];
  for (let i = 1; i < samples.length - 2; i++) {
    const [a, b, c, d] = [samples[i - 1].e, samples[i].e, samples[i + 1].e, samples[i + 2].e];
    if (b > level && c > level && a < level / 4 && d < level / 4) at.push(samples[i].t);
  }
  return at;
}

const HITS = ["hit", "drop", "final"];

/** Flashes fail. A planned hit with no picture peak near it, or a peak off its beat, warns. */
export function checkEvents(samples, plan) {
  const misses = findFlashes(samples).map(
    (t) => `single-frame flash at ${t.toFixed(2)}s. A tween starts or ends one frame early`,
  );
  const warns = [];
  const sorted = samples.map((s) => s.e).sort((a, b) => a - b);
  const median = sorted[sorted.length >> 1] ?? 0;
  for (const scene of plan.scenes) {
    if (!scene.sound.some((s) => HITS.includes(s))) continue;
    const near = samples.filter((s) => Math.abs(s.t - scene.start) <= T.hitWindow);
    if (near.length === 0) continue;
    const peak = near.reduce((a, b) => (b.e > a.e ? b : a));
    const off = peak.t - scene.start;
    if (peak.e < T.hitMin * median)
      warns.push(
        `${scene.name}: the hit at ${scene.start}s has no picture event. Land a stamp, a cut or a reshape on it`,
      );
    else if (Math.abs(off) > T.hitTolerance)
      warns.push(`${scene.name}: the picture lands ${off.toFixed(2)}s from its hit at ${scene.start}s`);
  }
  return { misses, warns };
}

/** Ten frames around each join, one row per join: a freeze, a stop between two moves or a flash shows here. */
export function joinStrips(video, times, output) {
  const dir = mkdtempSync(path.join(tmpdir(), "motion-joins-"));
  times.forEach((t, j) => {
    ffmpeg([
      "-y",
      "-ss",
      Math.max(0, t - 5 / 60).toFixed(3),
      "-i",
      video,
      "-frames:v",
      "10",
      "-vf",
      "scale=192:-2",
      "-start_number",
      String(j * 10),
      path.join(dir, "%03d.png"),
    ]);
  });
  ffmpeg(["-y", "-i", path.join(dir, "%03d.png"), "-vf", `tile=10x${times.length}`, "-frames:v", "1", output]);
}

function ffmpeg(args) {
  const run = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
  if (run.error?.code === "ENOENT") throw new Error("ffmpeg not found. Install it, for example: brew install ffmpeg");
  if (run.status !== 0) throw new Error(`ffmpeg failed:\n${run.stderr.split("\n").slice(-6).join("\n")}`);
  return run;
}

/** Motion energy, one sample per 1/8 s: mean luma change across 125 ms at 160px wide, after a 1px blur.
 * The span catches slow pushes that look still frame to frame. The blur keeps grain from reading as motion. */
export const MOTION_GRAPH = `fps=${T.energyFps},scale=160:-2,gblur=sigma=1,tblend=all_mode=difference`;
/** Energy per frame at the film's own rate, for events: hits and single-frame flashes. */
export const EVENT_GRAPH = "scale=160:-2,tblend=all_mode=difference";

export function measureEnergy(video, graph = MOTION_GRAPH) {
  const vf = `${graph},signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-`;
  return parseEnergy(ffmpeg(["-i", video, "-vf", vf, "-an", "-f", "null", "-"]).stdout);
}

function probe(video, entries, stream) {
  const args = [
    "-v",
    "error",
    ...(stream ? ["-select_streams", stream] : []),
    "-show_entries",
    entries,
    "-of",
    "csv=p=0",
    video,
  ];
  return spawnSync("ffprobe", args, { encoding: "utf8" }).stdout.trim();
}

/** Loudness of the audio stream: integrated LUFS and true peak. Null with no audio. */
export function measureAudio(video) {
  if (!probe(video, "stream=index", "a")) return null;
  const err = ffmpeg(["-i", video, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr;
  const summary = err.slice(err.lastIndexOf("Summary:"));
  return {
    integrated: Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]),
    peak: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]),
  };
}

export function checkAudio(audio, plan) {
  if (!plan.music) return [];
  if (!audio) return ["the plan has music, the file has no audio stream"];
  const misses = [];
  if (audio.integrated < T.loudnessMin || audio.integrated > T.loudnessMax)
    misses.push(`loudness ${audio.integrated} LUFS, the target is ${T.loudnessMin} to ${T.loudnessMax}`);
  if (audio.peak > T.truePeakMax) misses.push(`true peak ${audio.peak} dBFS, the limit is ${T.truePeakMax}`);
  return misses;
}

/** One frame per scene, tiled left to right. */
export function contactSheet(video, times, output) {
  const dir = mkdtempSync(path.join(tmpdir(), "motion-check-"));
  times.forEach((t, i) => {
    ffmpeg([
      "-y",
      "-ss",
      t.toFixed(3),
      "-i",
      video,
      "-frames:v",
      "1",
      "-vf",
      "scale=480:-2",
      path.join(dir, `${String(i).padStart(3, "0")}.png`),
    ]);
  });
  ffmpeg(["-y", "-i", path.join(dir, "%03d.png"), "-vf", `tile=${times.length}x1`, "-frames:v", "1", output]);
}

function main(argv) {
  const flag = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? fallback : argv[i + 1];
  };
  const planOnly = argv.indexOf("--plan") !== -1;
  const files = argv.filter((arg, i) => !arg.startsWith("--") && !(argv[i - 1] ?? "").match(/^--(moving|sheet|plan)$/));
  const planPath = planOnly ? flag("plan") : files[1];
  if (!planPath || (!planOnly && !files[0])) {
    console.error(
      "usage: motion-check.mjs --plan plan.md\n       motion-check.mjs out.mp4 plan.md [--moving 0.3] [--sheet sheet.png]",
    );
    return 2;
  }
  const plan = parsePlan(readFileSync(planPath, "utf8"));
  const misses = checkPlan(plan);
  const warns = [];
  if (!planOnly && misses.length === 0) {
    const video = files[0];
    const seconds = Number(probe(video, "format=duration"));
    if (Math.abs(seconds - plan.total) > 0.1)
      misses.push(`file is ${seconds.toFixed(2)}s, plan total is ${plan.total}s`);
    const [num, den] = probe(video, "stream=r_frame_rate", "v").split("/").map(Number);
    const fps = num / (den || 1);
    if (fps < T.fpsMin) misses.push(`${fps} fps, render at ${T.fpsMin} or more`);
    misses.push(...checkMotion(measureEnergy(video), plan, Number(flag("moving", T.movingThreshold))));
    const events = checkEvents(measureEnergy(video, EVENT_GRAPH), plan);
    misses.push(...events.misses);
    warns.push(...events.warns);
    misses.push(...checkAudio(measureAudio(video), plan));
    const sheet = flag("sheet", video.replace(/\.[^.]+$/, "-sheet.png"));
    contactSheet(
      video,
      plan.scenes.map((s) => s.start + s.length * 0.7),
      sheet,
    );
    console.log(`contact sheet: ${sheet}`);
    // Ten frames at each join, one row per join: stacked scenes, a freeze or a flash shows here.
    const joins = plan.scenes.slice(1).map((s) => s.start);
    if (joins.length > 0) {
      const joinSheet = sheet.replace(/\.png$/, "-joins.png");
      joinStrips(video, joins, joinSheet);
      console.log(`join strips: ${joinSheet}`);
    }
  }
  for (const text of warns) console.log(`warn  ${text}`);
  for (const text of misses) console.log(`miss  ${text}`);
  console.log(misses.length === 0 ? `ok    ${plan.scenes.length} scenes pass` : `${misses.length} miss(es)`);
  return misses.length === 0 ? 0 : 1;
}

if (import.meta.main ?? process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(`error ${err.message}`);
    process.exit(2);
  }
}
