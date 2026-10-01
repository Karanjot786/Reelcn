#!/usr/bin/env node
// Synthesizes a film's music and sound effects from a cue sheet: drums, bass, plucks, risers, hits, UI ticks.
// Usage: node motion-track.mjs plan.md out.wav   or   node motion-track.mjs cues.json out.wav
// Writes out.mp3 too when ffmpeg is on PATH.
// Every sound lands at a time the cue sheet names, so picture and sound share one clock. Released as CC0.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { parsePlan } from "./motion-check.mjs";

const SR = 44100;

/** Seeded PRNG so a cue sheet always renders the same track. */
function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function biquad(x, type, f0, q = 0.707) {
  const w = (2 * Math.PI * Math.min(f0, SR * 0.45)) / SR;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  const b = type === "hp" ? [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2] : [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  const y = new Float64Array(x.length);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b[0] * x[i] + b[1] * x1 + b[2] * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = v;
    y[i] = v;
  }
  return y;
}

export function renderTrack(cues) {
  const duration = cues.duration;
  const N = Math.round(SR * duration);
  const mix = new Float64Array(N);
  const rnd = prng(cues.seed ?? 7);
  const beat = 60 / cues.bpm;
  const len = (s) => Math.round(s * SR);
  const add = (sig, t, gain = 1) => {
    const i0 = Math.round(t * SR);
    for (let i = 0; i < sig.length && i0 + i < N; i++) if (i0 + i >= 0) mix[i0 + i] += sig[i] * gain;
  };
  const noise = (n) => Float64Array.from({ length: n }, () => rnd() * 2 - 1);
  const band = (n, lo, hi) => {
    let y = noise(n);
    for (let k = 0; k < 2; k++) y = biquad(biquad(y, "hp", lo), "lp", hi);
    let peak = 1e-9;
    for (const v of y) peak = Math.max(peak, Math.abs(v));
    return y.map((v) => v / peak);
  };
  const shape = (n, fn) => Float64Array.from({ length: n }, (_, i) => fn(i / SR, i));
  const sweep = (n, freq) => {
    let phase = 0;
    return Float64Array.from({ length: n }, (_, i) => {
      phase += (2 * Math.PI * freq(i / SR)) / SR;
      return Math.sin(phase);
    });
  };

  const kick = () => {
    const n = len(0.42);
    const body = sweep(n, (t) => 46 + 120 * Math.exp(-t * 38));
    const click = band(n, 1500, 6000);
    return shape(n, (t, i) => body[i] * Math.exp(-t * 7.5) + click[i] * Math.exp(-t * 260) * 0.35);
  };
  const clap = () => {
    const n = len(0.28);
    const nz = band(n, 900, 4200);
    return shape(n, (t, i) => {
      let e = 0;
      for (const d of [0, 0.011, 0.023]) if (t >= d) e += Math.exp(-(t - d) * 90);
      return nz[i] * (e * 0.5 + Math.exp(-t * 16) * 0.5);
    });
  };
  const hat = (decay = 0.02) => {
    const n = len(0.09);
    const nz = band(n, 7000, 16000);
    return shape(n, (t, i) => nz[i] * Math.exp(-t / decay));
  };
  const tick = () => {
    const n = len(0.03);
    const nz = band(n, 2500, 9000);
    return shape(n, (t, i) => nz[i] * Math.exp(-t / 0.004));
  };
  const bass = (f, d = 0.22) =>
    shape(
      len(d),
      (t) =>
        Math.tanh(
          (Math.sin(2 * Math.PI * f * t) + Math.sin(4 * Math.PI * f * t) / 2 + Math.sin(6 * Math.PI * f * t) / 3) *
            0.96,
        ) *
        Math.min(1, t * 200) *
        Math.exp(-t * 9),
    );
  const pluck = (f, d = 0.35) =>
    shape(
      len(d),
      (t) =>
        (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(4 * Math.PI * f * t) + 0.2 * Math.sin(6 * Math.PI * f * t)) *
        Math.exp(-t * 11) *
        Math.min(1, t * 400),
    );
  const whoosh = (d, lo = 300, hi = 6000) => {
    const n = len(d);
    const nz = band(n, lo, hi);
    return shape(n, (t, i) => nz[i] * Math.sin(Math.PI * (i / n)) ** 2);
  };
  const riser = (d) => {
    const n = len(d);
    const lo = band(n, 400, 3000),
      hi = band(n, 2500, 12000);
    const tone = sweep(n, (t) => 180 + 1100 * (t / d) ** 2);
    return shape(n, (t, i) => {
      const p = i / n;
      return (lo[i] * (1 - p) * 0.8 + hi[i] * p * 0.8 + tone[i] * 0.25) * p ** 2.2;
    });
  };
  const impact = (amp = 1, tail = 1.4) => {
    const n = len(tail);
    const sub = sweep(n, (t) => 38 + 60 * Math.exp(-t * 14));
    const crash = band(n, 600, 9000);
    return shape(n, (t, i) => (sub[i] * Math.exp(-t * 3.2) + crash[i] * Math.exp(-t * 5.5) * 0.55) * amp);
  };
  const pad = (freqs, d) =>
    shape(
      len(d),
      (t) =>
        (freqs.reduce((s, f) => s + Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t + 0.5), 0) /
          freqs.length) *
        Math.min(1, t * 30) *
        Math.exp(-t * 1.6),
    );
  const scan = (d) => {
    const n = len(d);
    const s = sweep(n, (t) => 300 + 1500 * (t / d));
    return shape(n, (t, i) => s[i] * 0.5 * Math.min(1, t * 40) * Math.min(1, (d - t) * 40));
  };

  // A minor. Root notes for the bass, an arpeggio for the plucks.
  const A1 = 55,
    C2 = 65.41,
    G1 = 49,
    E1 = 41.2;
  const LINE = [A1, A1, A1, C2, A1, A1, G1, A1];
  const ARP = [220, 329.63, 261.63, 329.63, 440, 329.63, 261.63, 392];
  const BLIPS = [440, 523.25, 659.25, 880];
  const inBeat = (t) => cues.beat && t >= cues.beat.from - 1e-6 && t < cues.beat.to - 1e-6;

  if (cues.intro) add(pad([110, 164.8], cues.intro.until + 0.2), 0, 0.1);
  for (const run of cues.typing ?? [])
    for (let i = 0; i < run.count; i++)
      add(tick(), run.from + (i * (run.to - run.from)) / run.count, 0.3 + 0.16 * rnd());
  for (const run of cues.ticks ?? [])
    for (let i = 0; i < run.count; i++)
      add(run.kind === "hat" ? hat(0.012) : tick(), run.from + i * run.step, run.gain ?? 0.25);
  if (cues.build) {
    const { from, to } = cues.build;
    add(riser(to - from), from, 0.55);
    let k = 0;
    for (let t = from + beat / 2; t < to - 0.04; t += beat / 4, k++) add(hat(0.012), t, 0.06 + 0.012 * k);
    const roll = [to - 2 * beat, to - 1.5 * beat, to - beat, to - 0.75 * beat, to - 0.5 * beat, to - 0.25 * beat];
    roll.forEach((t, i) => {
      add(clap(), t, 0.25 + i * 0.066);
    });
  }
  if (cues.beat) {
    const { from, to } = cues.beat;
    for (let b = 0; from + b * beat < to - 1e-6; b++) {
      const t = from + b * beat;
      add(kick(), t, 0.7);
      add(hat(), t + beat / 2, 0.5);
      add(hat(0.012), t + beat / 4, 0.24);
      add(hat(0.012), t + (3 * beat) / 4, 0.24);
      add(hat(0.008), t, 0.14);
      if (b % 2 === 1) add(clap(), t, 0.75);
    }
    for (let k = 0; from + (k * beat) / 2 < to - 1e-6; k++) {
      const t = from + (k * beat) / 2;
      if (k % 2 === 1 || k % 8 === 0) add(bass(LINE[k % 8] * 2), t, 0.34);
      add(pluck(ARP[k % 8]), t, 0.3);
      add(pluck(ARP[k % 8] * 2, 0.2), t + beat / 4, 0.1);
    }
    add(impact(0.55, 1.2), from);
  }
  for (const t of cues.whooshes ?? []) add(whoosh(0.3, 500, 8000), t - 0.06, 0.35);
  (cues.blips ?? []).forEach((t, i) => {
    add(pluck(BLIPS[i % 4], 0.5), t, 0.3);
    add(whoosh(0.25, 1500, 9000), t - 0.05, 0.2);
  });
  for (const t of cues.hits ?? []) {
    if (cues.beat && Math.abs(t - cues.beat.from) < 1e-6) continue;
    add(impact(0.6, 0.7), t);
    add(clap(), t, 0.8);
    if (!inBeat(t)) add(kick(), t, 0.8);
  }
  for (const r of cues.risers ?? []) add(riser(r.to - r.from), r.from, r.gain ?? 0.45);
  for (const s of cues.scans ?? []) add(scan(s.to - s.from), s.from, 0.16);
  if (cues.final != null) {
    const t = cues.final;
    add(impact(0.8, 1.8), t);
    add(kick(), t, 0.8);
    add(clap(), t, 0.6);
    add(pad([220, 261.63, 329.63, 493.88], 2), t, 0.55);
    add(pad([110], 2), t, 0.22);
    add(pluck(880, 0.8), t + beat, 0.12);
    add(pluck(659.25, 0.8), t + 1.8 * beat, 0.1);
  }

  // Gaps: the half beat before a drop falls to about -16 dB, so the drop lands harder.
  const ramp = len(0.01);
  for (const g of cues.gaps ?? []) {
    const a = len(g.from);
    const b = len(g.to);
    for (let i = a; i < b && i < N; i++) mix[i] *= 1 - 0.84 * (Math.min(i - a, b - i, ramp) / ramp);
  }

  const fade = len(0.35);
  let peak = 1e-9;
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    out[i] = Math.tanh(mix[i] * 1.25) * (i > N - fade ? (N - i) / fade : 1);
    peak = Math.max(peak, Math.abs(out[i]));
  }
  return out.map((v) => (v / peak) * 0.89);
}

/** A cue sheet from a plan's sound column, so picture and sound share the plan's clock. */
export function cuesFromPlan(plan) {
  const cues = {
    bpm: plan.tempo || 120,
    duration: plan.total,
    typing: [],
    ticks: [],
    whooshes: [],
    blips: [],
    hits: [],
    risers: [],
    scans: [],
    gaps: [],
  };
  const beatScenes = [];
  for (const s of plan.scenes) {
    const end = s.start + s.length;
    for (const sound of s.sound) {
      if (sound === "intro") cues.intro = { until: end };
      if (sound === "typing")
        cues.typing.push({ from: s.start + 0.1, to: s.start + s.length * 0.65, count: Math.round(s.length * 20) });
      if (sound === "ticks") cues.ticks.push({ kind: "hat", from: s.start, count: 8, step: 0.05, gain: 0.2 });
      if (sound === "build") cues.build = { from: s.start, to: end };
      if (sound === "beat" || sound === "drop") beatScenes.push(s);
      if (sound === "drop" || sound === "hit") cues.hits.push(s.start);
      if (sound === "whoosh") cues.whooshes.push(end);
      if (sound === "blip") for (let t = s.start; t < end - 1e-6; t += 60 / cues.bpm) cues.blips.push(t);
      if (sound === "riser") cues.risers.push({ from: Math.max(s.start, end - 0.5), to: end, gain: 0.4 });
      if (sound === "scan") cues.scans.push({ from: s.start, to: s.start + Math.min(0.45, s.length) });
      if (sound === "final") cues.final = s.start;
      if (sound === "gap") cues.gaps.push({ from: s.start - 30 / cues.bpm, to: s.start });
    }
  }
  if (beatScenes.length > 0) {
    cues.beat = {
      from: Math.min(...beatScenes.map((s) => s.start)),
      to: Math.max(...beatScenes.map((s) => s.start + s.length)),
    };
  }
  return cues;
}

export function wav(samples) {
  const data = Buffer.alloc(samples.length * 4);
  samples.forEach((v, i) => {
    const s = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
    data.writeInt16LE(s, i * 4);
    data.writeInt16LE(s, i * 4 + 2);
  });
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write("WAVE", 8);
  head.write("fmt ", 12);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(2, 22);
  head.writeUInt32LE(SR, 24);
  head.writeUInt32LE(SR * 4, 28);
  head.writeUInt16LE(4, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

function main([cuesPath, outPath]) {
  if (!cuesPath || !outPath) {
    console.error("usage: motion-track.mjs plan.md|cues.json out.wav");
    return 2;
  }
  const text = readFileSync(cuesPath, "utf8");
  const cues = cuesPath.endsWith(".md") ? cuesFromPlan(parsePlan(text)) : JSON.parse(text);
  writeFileSync(outPath, wav(renderTrack(cues)));
  console.log(`wrote ${outPath} (${cues.duration}s at ${cues.bpm} BPM)`);
  const mp3 = outPath.replace(/\.wav$/, ".mp3");
  const run = spawnSync("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    outPath,
    "-c:a",
    "libmp3lame",
    "-b:a",
    "192k",
    mp3,
  ]);
  if (run.status === 0) console.log(`wrote ${mp3}`);
  return 0;
}

if (import.meta.main ?? process.argv[1]?.endsWith("motion-track.mjs")) process.exit(main(process.argv.slice(2)));
