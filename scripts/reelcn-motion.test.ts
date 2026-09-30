// The one test file for the reelcn-motion skill. Renders are checked by use, not here.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { renderCss, renderJs, renderRs, renderTs } from "./build-motion-tokens.ts";

const SKILL = "skills/reelcn-motion";
const tokens = JSON.parse(readFileSync(`${SKILL}/tokens/tokens.json`, "utf8"));
// Computed paths keep the .mjs imports untyped, so the skill scripts stay plain JavaScript for users.
const checkPath = path.resolve(SKILL, "scripts/motion-check.mjs");
const trackPath = path.resolve(SKILL, "scripts/motion-track.mjs");
const check = await import(checkPath);
const track = await import(trackPath);
const plan = (name: string) => readFileSync(`${SKILL}/plans/${name}.md`, "utf8");
const PLANS = ["launch-film", "showreel", "title-sequence", "changelog-clip"];

test("tokens match the presets in core.tsx", () => {
  const core = readFileSync("registry/items/core.tsx", "utf8");
  for (const name of ["smooth", "snappy", "gentle"]) {
    assert.ok(
      core.includes(`${name}: Easing.bezier(${tokens.ease[name].join(", ")})`),
      `${name} differs from core.tsx`,
    );
  }
  assert.ok(
    core.includes(`exitEasing = Easing.bezier(${tokens.ease.exit.join(", ")})`),
    "exit curve differs from core.tsx",
  );
  const { damping, stiffness, mass } = tokens.spring;
  assert.ok(
    core.includes(`config: { damping: ${damping}, stiffness: ${stiffness}, mass: ${mass} }`),
    "spring differs from core.tsx",
  );
  assert.ok(core.includes(`Math.round(fps * ${tokens.duration.enter})`), "enter length differs from core.tsx");
  assert.ok(core.includes(`Math.round(fps * ${tokens.duration.exit})`), "exit length differs from core.tsx");
});

test("generated token files are current", () => {
  for (const [file, render] of [
    ["tokens.ts", renderTs],
    ["tokens.js", renderJs],
    ["tokens.css", renderCss],
    ["tokens.rs", renderRs],
  ] as const) {
    assert.equal(
      readFileSync(`${SKILL}/tokens/${file}`, "utf8"),
      render(tokens),
      `${file} is stale. Run pnpm motion:tokens`,
    );
  }
});

test("the sound list matches the sfx pack on disk", () => {
  const sounds = readdirSync("sfx")
    .filter((f) => f.endsWith(".mp3") && !f.endsWith("-alt.mp3"))
    .map((f) => f.slice(0, -4));
  assert.deepEqual([...tokens.audio.sfx].sort(), sounds.sort());
});

test("the four shipped plans pass the plan check", () => {
  for (const name of PLANS) assert.deepEqual(check.checkPlan(check.parsePlan(plan(name))), [], name);
});

test("a generic move, too many words, an off-beat start and a made-up sound are all reported", () => {
  const broken = plan("launch-film")
    .replace("the command types at human speed, then the line is pulled back into the caret", "fades in")
    .replace('"154 components."', '"one two three four five six seven eight nine ten eleven twelve thirteen fourteen"')
    .replace("| any of them | 4 | 2.5 |", "| any of them | 4 | 2.2 |")
    .replace("| three screens | 6.5 | 2.5 |", "| three screens | 6.2 | 2.8 |")
    .replace("build, hit", "build, boom");
  const misses = check.checkPlan(check.parsePlan(broken)).join("\n");
  assert.match(misses, /command: move "fades in" says nothing about meaning/);
  assert.match(misses, /library: 14 words in 2s, the budget is 6/);
  assert.match(misses, /three screens: starts 0\.20s off the beat grid/);
  assert.match(misses, /library: sound "boom" is not one of/);
});

test("more than two cuts and more than one still read are reported", () => {
  let text = plan("launch-film");
  for (const join of ["| morph |", "| flood |", "| wipe |"]) text = text.replace(join, "| cut |");
  text = text
    .replace("the counter rolls from 0 to 154", "none")
    .replace("the theme value swaps and the playhead keeps running", "none");
  const misses = check.checkPlan(check.parsePlan(text)).join("\n");
  assert.match(misses, /3 cuts, at most 2/);
  assert.match(misses, /2 scenes with nothing moving during the read, at most one/);
});

test("a pipe inside a cell is an error with a fix, and a missing header is reported line by line", () => {
  assert.throws(
    () => check.parsePlan(plan("launch-film").replace('"154 components."', '"154 | components."')),
    /has 11 cells, the header has 10/,
  );
  const table = plan("launch-film")
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .join("\n");
  const misses = check.checkPlan(check.parsePlan(table)).join("\n");
  for (const word of ["total must be", "name the carrier", "tempo must be"]) assert.ok(misses.includes(word), word);
});

test("the motion check fails a slideshow and passes a moving film", () => {
  const parsed = check.parsePlan(plan("launch-film"));
  const frames = (energy: (t: number) => number) =>
    Array.from({ length: 900 }, (_, i) => ({ t: i / 60, e: energy(i / 60) }));
  // Slideshow: half a second of motion every three seconds, frozen otherwise.
  const slides = check
    .checkMotion(
      frames((t) => (t % 3 < 0.5 ? 3 : 0)),
      parsed,
    )
    .join("\n");
  assert.match(slides, /of frames move, the target is 45%/);
  assert.match(slides, /still for 2\.\d+s/);
  // Film: rests of 0.4s every 2s, a 1.5s rest at the end.
  const film = check.checkMotion(
    frames((t) => (t > 13.4 || t % 2 > 1.6 ? 0 : 2)),
    parsed,
  );
  assert.deepEqual(film, []);
});

test("motion energy in scientific notation reads as near zero, not as motion", () => {
  const out =
    "frame:12 pts:12 pts_time:0.4\nlavfi.signalstats.YAVG=6.94e-05\nframe:13 pts:13 pts_time:0.433333\nlavfi.signalstats.YAVG=1.5\n";
  assert.deepEqual(check.parseEnergy(out), [
    { t: 0.4, e: 6.94e-5 },
    { t: 0.433333, e: 1.5 },
  ]);
});

test("a plan's sound column becomes a cue sheet on the plan's clock", () => {
  const cues = track.cuesFromPlan(check.parsePlan(plan("launch-film")));
  assert.equal(cues.bpm, 120);
  assert.equal(cues.duration, 15);
  assert.deepEqual(cues.build, { from: 2, to: 4 });
  assert.deepEqual(cues.beat, { from: 4, to: 11 });
  assert.equal(cues.final, 13);
  assert.deepEqual(cues.hits, [2, 4, 11]);
  assert.deepEqual(cues.whooshes, [2, 9]);
});

test("the track generator is deterministic and stays inside full scale", () => {
  const cues = { bpm: 120, duration: 2, beat: { from: 0, to: 2 }, hits: [1] };
  const a = track.renderTrack(cues);
  const b = track.renderTrack(cues);
  assert.equal(a.length, 88200);
  assert.deepEqual(a.slice(0, 2000), b.slice(0, 2000));
  assert.ok(Math.max(...a.map(Math.abs)) <= 0.9);
});

test("SKILL.md is short, named, and links only to files in the skill", () => {
  const skill = readFileSync(`${SKILL}/SKILL.md`, "utf8");
  assert.match(skill, /^---\nname: reelcn-motion\ndescription: /);
  assert.ok(skill.split("\n").length <= 120, "SKILL.md is over 120 lines");
  for (const [, file] of skill.matchAll(/`((?:references|scripts|tokens|plans)\/[\w./-]+)`/g)) {
    assert.ok(existsSync(path.join(SKILL, file)), `SKILL.md names ${file}, which is missing`);
  }
  assert.ok(existsSync(`${SKILL}/renderers/hyperframes.md`), "the HyperFrames guide is missing");
});
