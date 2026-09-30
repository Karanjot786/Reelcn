#!/usr/bin/env node
// reelcn-motion check.
// Plan mode:  node motion-check.mjs --plan plan.md
// Video mode: node motion-check.mjs out.mp4 plan.md [--still 0.15] [--settled 1] [--margin 3] [--sheet sheet.png]
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const TOKENS = JSON.parse(readFileSync(path.join(HERE, "../tokens/tokens.json"), "utf8"));

const CUTS = ["hard", "push left", "push right", "push up", "push down", "zoom in", "zoom out", "dissolve", "end"];
const NO_EXIT = ["hard", "end"];
const EPS = 0.011;

/** Seconds at which beat `n` of a track lands. */
export function beatTime(n, bpm, offset = 0) {
  return offset + (n * 60) / bpm;
}

/** Seconds a viewer needs to read `words` words, scaled by tone. */
export function readingHold(words, tone = "standard") {
  const { wordsPerSecond, holdFloor } = TOKENS.reading;
  const scale = TOKENS.tone[tone]?.holdScale ?? 1;
  return Math.max(holdFloor, words / wordsPerSecond) * scale;
}

function cells(line) {
  // ponytail: a "|" inside quoted on-screen text breaks the row. Escape-aware split when a plan needs one.
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function parsePlan(text) {
  const header = {};
  for (const m of text.matchAll(/^(tone|direction|transitions|music|total):[ \t]*(.+)$/gm)) header[m[1]] = m[2].trim();
  const rows = text.split("\n").filter((line) => line.trim().startsWith("|"));
  if (rows.length < 3) throw new Error("plan has no beat table");
  const cols = cells(rows[0]);
  const beats = rows.slice(2).map((row) => {
    const parts = cells(row);
    if (parts.length !== cols.length) {
      throw new Error(
        `row "${parts[0]}" has ${parts.length} cells, the header has ${cols.length}. Remove any "|" inside a cell.`,
      );
    }
    const raw = Object.fromEntries(parts.map((cell, i) => [cols[i], cell]));
    const big = /^\*\*(.+)\*\*$/.exec(raw.beat ?? "");
    const hold = /^([\d.]+)s? (still|drift)$/.exec(raw.hold ?? "");
    const sequence = !raw.sequence || raw.sequence === "none" ? [] : raw.sequence.split(",").map((s) => s.trim());
    const words = [...(raw["on screen"] ?? "").matchAll(/"([^"]*)"/g)]
      .flatMap((m) => m[1].split(/\s+/))
      .filter(Boolean).length;
    return {
      name: big ? big[1] : raw.beat,
      big: Boolean(big),
      start: Number(raw.start),
      length: Number(raw.length),
      words,
      why: raw.why ?? "",
      move: raw.move ?? "",
      sequence,
      hold: hold ? Number(hold[1]) : Number.NaN,
      holdKind: hold ? hold[2] : "",
      sound: !raw.sound || raw.sound === "none" ? null : raw.sound.split(" ")[0],
      cut: raw.cut ?? "",
    };
  });
  const music = (header.music ?? "none").split(/\s+/);
  const bpm = TOKENS.audio.beds[music[0]] ?? Number(music[1]);
  return {
    tone: header.tone,
    direction: header.direction,
    transitions: (header.transitions ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    music: music[0] === "none" ? null : { track: music[0], bpm, offset: Number(music[2] ?? 0) },
    total: Number(header.total),
    beats,
  };
}

/** Seconds between the move landing and the hold starting: the span a sequence takes to arrive. */
export function sequenceSpan(beat, plan) {
  const gaps = Math.max(beat.sequence.length - 1, 0);
  return gaps * (plan.music ? 60 / plan.music.bpm : TOKENS.stagger.gap);
}

/** Every rule a plan breaks, as one sentence each. Empty means the plan passes. */
export function checkPlan(plan) {
  const misses = [];
  const miss = (beat, text) => misses.push(`${beat ? `${beat.name}: ` : ""}${text}`);
  const tone = TOKENS.tone[plan.tone];
  if (!tone) miss(null, `tone must be one of ${Object.keys(TOKENS.tone).join(", ")}`);
  if (["left", "right", "up", "down"].indexOf(plan.direction) === -1)
    miss(null, "direction must be left, right, up or down");
  if (plan.transitions.length === 0 || plan.transitions.length > 3)
    miss(null, "list one to three cut types in transitions");
  if (plan.music && !(plan.music.bpm > 0))
    miss(null, "music needs a bundled bed name, or a file with its tempo in BPM");
  if (!(plan.total > 0)) miss(null, "total must be a number of seconds");

  let clock = 0;
  let dissolves = 0;
  let sounds = 0;
  for (const [index, beat] of plan.beats.entries()) {
    const last = index === plan.beats.length - 1;
    if (Math.abs(beat.start - clock) > EPS) miss(beat, `starts at ${beat.start}s, the beat before ends at ${clock}s`);
    clock = beat.start + beat.length;
    if (!beat.why) miss(beat, "say why this beat exists");
    if (!(beat.move in TOKENS.ease) && beat.move !== "bouncy") miss(beat, `move "${beat.move}" is not a motion token`);
    if (Number.isNaN(beat.hold)) {
      miss(beat, 'hold must read like "1.5 still" or "1.5 drift"');
    } else {
      const need = readingHold(beat.words, plan.tone);
      if (beat.hold + EPS < need)
        miss(beat, `hold ${beat.hold}s is under the ${need.toFixed(2)}s needed to read ${beat.words} words`);
      const span = sequenceSpan(beat, plan);
      const exit = NO_EXIT.indexOf(beat.cut) === -1 && !beat.cut.startsWith("carry ") ? TOKENS.duration.exit : 0;
      const used = TOKENS.duration.enter + span + beat.hold + exit;
      if (used > beat.length + EPS)
        miss(beat, `enter, sequence, hold and exit take ${used.toFixed(2)}s, the beat is ${beat.length}s`);
      if (!plan.music && span > TOKENS.stagger.maxTotal + EPS)
        miss(beat, `sequence takes ${span.toFixed(2)}s, the cap is ${TOKENS.stagger.maxTotal}s`);
    }
    const cut = beat.cut.startsWith("carry ") ? "carry" : beat.cut;
    if (cut !== "carry" && CUTS.indexOf(cut) === -1) miss(beat, `cut "${beat.cut}" is not in the vocabulary`);
    if (last !== (cut === "end")) miss(beat, last ? 'the last beat must cut "end"' : 'only the last beat cuts "end"');
    const listed = plan.transitions.some((t) => (t.startsWith("carry") ? cut === "carry" : t === cut));
    if (cut !== "end" && !listed) miss(beat, `cut "${beat.cut}" is not in the transitions header`);
    if (cut.startsWith("push ") && cut !== `push ${plan.direction}`)
      miss(beat, `${cut} goes against the film direction, ${plan.direction}`);
    if (cut === "dissolve") dissolves += 1;
    if (beat.sound) {
      sounds += 1;
      if (TOKENS.audio.sfx.indexOf(beat.sound) === -1) miss(beat, `sound "${beat.sound}" is not in the pack`);
    }
    if (beat.big && plan.music) {
      const gap = 60 / plan.music.bpm;
      const n = Math.round((beat.start - plan.music.offset) / gap);
      const off = Math.abs(beatTime(n, plan.music.bpm, plan.music.offset) - beat.start);
      if (off > TOKENS.audio.beatTolerance) miss(beat, `big beat starts ${off.toFixed(2)}s off the music beat`);
    }
  }
  if (Math.abs(clock - plan.total) > EPS) miss(null, `beats end at ${clock}s, total says ${plan.total}s`);
  if (dissolves > 1) miss(null, `${dissolves} dissolves, at most one per film`);
  if (tone && sounds > tone.maxSounds)
    miss(null, `${sounds} sounds, a ${plan.tone} film carries at most ${tone.maxSounds}`);
  return misses;
}

/** Longest run of samples under `threshold` between `from` and `to`, as { seconds, mid }. */
export function longestQuiet(samples, from, to, threshold) {
  let best = { seconds: 0, mid: (from + to) / 2 };
  let runStart = null;
  let prev = null;
  const close = (end) => {
    if (runStart !== null && end - runStart > best.seconds)
      best = { seconds: end - runStart, mid: (runStart + end) / 2 };
    runStart = null;
  };
  for (const s of samples) {
    if (s.t < from || s.t > to) continue;
    if (s.e < threshold) {
      if (runStart === null) runStart = prev ?? s.t;
    } else close(prev ?? s.t);
    prev = s.t;
  }
  close(prev ?? to);
  return best;
}

/** Compare measured holds with the plan. Returns { misses, mids } where mids[i] is the settled time of beat i. */
export function checkHolds(samples, plan, { still, settled }) {
  const frame = samples.length > 1 ? (samples[samples.length - 1].t - samples[0].t) / (samples.length - 1) : 1 / 30;
  const misses = [];
  const mids = [];
  for (const beat of plan.beats) {
    const threshold = beat.holdKind === "drift" ? settled : still;
    const quiet = longestQuiet(samples, beat.start, beat.start + beat.length, threshold);
    mids.push(quiet.mid);
    // Two frames of slack: a hold's first and last frame sit on a moving neighbour.
    if (quiet.seconds + 2 * frame < beat.hold) {
      const hint = beat.holdKind === "still" ? '. If the background moves on purpose, plan the hold as "drift"' : "";
      misses.push(
        `${beat.name}: measured ${beat.holdKind} hold ${quiet.seconds.toFixed(2)}s, plan says ${beat.hold}s${hint}`,
      );
    }
  }
  return { misses, mids };
}

function ffmpeg(args) {
  const run = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
  if (run.error?.code === "ENOENT") throw new Error("ffmpeg not found. Install it, for example: brew install ffmpeg");
  if (run.status !== 0) throw new Error(`ffmpeg failed:\n${run.stderr.split("\n").slice(-6).join("\n")}`);
  return run;
}

/** Motion energy per frame: mean luma difference from the frame before, at 160px wide. */
export function measureEnergy(video) {
  const graph = "scale=160:-2,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-";
  return parseEnergy(ffmpeg(["-i", video, "-vf", graph, "-an", "-f", "null", "-"]).stdout);
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

/** Loudness of the audio stream: integrated LUFS, true peak dBFS, and momentary LUFS per 100ms. Null with no audio. */
export function measureAudio(video) {
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", video],
    { encoding: "utf8" },
  );
  if (!probe.stdout.trim()) return null;
  const err = ffmpeg(["-i", video, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr;
  const momentary = [...err.matchAll(/t:\s*([\d.]+)\s+TARGET:\S+ LUFS\s+M:\s*(-?[\d.]+)/g)].map((m) => ({
    t: Number(m[1]),
    m: Number(m[2]),
  }));
  const summary = err.slice(err.lastIndexOf("Summary:"));
  return {
    integrated: Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]),
    peak: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]),
    momentary,
  };
}

export function checkAudio(audio, plan, margin) {
  const misses = [];
  const warnings = [];
  const wantsSound = plan.music || plan.beats.some((beat) => beat.sound);
  if (!wantsSound) return { misses, warnings };
  if (!audio) return { misses: ["the plan has sound, the file has no audio stream"], warnings };
  const { loudnessMin, loudnessMax, truePeakMax } = TOKENS.audio;
  if (audio.integrated < loudnessMin || audio.integrated > loudnessMax)
    misses.push(`loudness ${audio.integrated} LUFS, target ${loudnessMin} to ${loudnessMax}`);
  if (audio.peak > truePeakMax) misses.push(`true peak ${audio.peak} dBFS, limit ${truePeakMax}`);
  const levels = audio.momentary.map((s) => s.m).sort((a, b) => a - b);
  const median = levels[Math.floor(levels.length / 2)] ?? -70;
  for (const beat of plan.beats) {
    if (!beat.sound) continue;
    const to = beat.start + TOKENS.duration.enter + sequenceSpan(beat, plan) + 0.4;
    const loudest = Math.max(-70, ...audio.momentary.filter((s) => s.t >= beat.start && s.t <= to).map((s) => s.m));
    if (loudest < median + margin)
      warnings.push(`${beat.name}: no clear "${beat.sound}" in the first ${(to - beat.start).toFixed(1)}s`);
  }
  return { misses, warnings };
}

/** One frame per beat, taken at each settled time, tiled left to right. */
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

function duration(video) {
  const run = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], {
    encoding: "utf8",
  });
  return Number(run.stdout.trim());
}

function main(argv) {
  const flag = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? fallback : argv[i + 1];
  };
  const planOnly = argv.indexOf("--plan") !== -1;
  const files = argv.filter(
    (arg, i) => !arg.startsWith("--") && !(argv[i - 1] ?? "").match(/^--(still|settled|margin|sheet)$/),
  );
  const planPath = planOnly ? flag("plan") : files[1];
  if (!planPath || (!planOnly && !files[0])) {
    console.error(
      "usage: motion-check.mjs --plan plan.md\n       motion-check.mjs out.mp4 plan.md [--still 0.15] [--settled 1] [--margin 3] [--sheet sheet.png]",
    );
    return 2;
  }
  const plan = parsePlan(readFileSync(planPath, "utf8"));
  const misses = checkPlan(plan);
  const warnings = [];
  if (!planOnly && misses.length === 0) {
    const video = files[0];
    const seconds = duration(video);
    if (Math.abs(seconds - plan.total) > 0.1)
      misses.push(`file is ${seconds.toFixed(2)}s, plan total is ${plan.total}s`);
    const holds = checkHolds(measureEnergy(video), plan, {
      still: Number(flag("still", 0.15)),
      settled: Number(flag("settled", 1)),
    });
    misses.push(...holds.misses);
    const audio = checkAudio(measureAudio(video), plan, Number(flag("margin", 3)));
    misses.push(...audio.misses);
    warnings.push(...audio.warnings);
    const sheet = flag("sheet", video.replace(/\.[^.]+$/, "-sheet.png"));
    contactSheet(video, holds.mids, sheet);
    console.log(`contact sheet: ${sheet}`);
  }
  for (const warning of warnings) console.log(`warn  ${warning}`);
  for (const text of misses) console.log(`miss  ${text}`);
  console.log(misses.length === 0 ? `ok    ${plan.beats.length} beats pass` : `${misses.length} miss(es)`);
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
