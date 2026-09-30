// The one test file for the reelcn-motion skill. Renders are checked by use, not here.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { renderCss, renderJs, renderRs, renderTs } from "./build-motion-tokens.ts";

const SKILL = "skills/reelcn-motion";
const tokens = JSON.parse(readFileSync(`${SKILL}/tokens/tokens.json`, "utf8"));
// A computed path keeps the .mjs import untyped, so the skill script stays plain JavaScript for users.
const checkPath = path.resolve(SKILL, "scripts/motion-check.mjs");
const check = await import(checkPath);
const plan = (name: string) => readFileSync(`${SKILL}/plans/${name}.md`, "utf8");

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

test("the sound list and the music beds match the files on disk", () => {
  const sounds = readdirSync("sfx")
    .filter((f) => f.endsWith(".mp3") && !f.endsWith("-alt.mp3"))
    .map((f) => f.slice(0, -4));
  assert.deepEqual([...tokens.audio.sfx].sort(), sounds.sort());
  const beds = readdirSync("music")
    .filter((f) => f.endsWith(".mp3"))
    .map((f) => f.slice(0, -4));
  assert.deepEqual(Object.keys(tokens.audio.beds).sort(), beds.sort());
});

test("the four shipped plans pass the plan check", () => {
  for (const name of ["showreel", "title-sequence", "launch-film", "changelog-clip"]) {
    assert.deepEqual(check.checkPlan(check.parsePlan(plan(name))), [], name);
  }
});

test("a short hold, an unknown sound and a push against the film direction are all reported", () => {
  const broken = plan("showreel")
    .replace("1.5 still | impact", "0.5 still | boom")
    .replace("| hard |", "| push right |");
  const misses = check.checkPlan(check.parsePlan(broken)).join("\n");
  assert.match(misses, /name: hold 0\.5s is under the 1\.33s needed to read 4 words/);
  assert.match(misses, /name: sound "boom" is not in the pack/);
  assert.match(misses, /card three: push right goes against the film direction, left/);
});

test("a pipe inside a cell is an error with a fix, not a silent misread", () => {
  const broken = plan("showreel").replace('"Maya Chen" "Product designer"', '"Maya | Chen"');
  assert.throws(() => check.parsePlan(broken), /has 11 cells, the header has 10/);
});

test("a plan with no header reports each missing line", () => {
  const table = plan("showreel")
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .join("\n");
  const misses = check.checkPlan(check.parsePlan(table)).join("\n");
  for (const word of ["tone must be", "direction must be", "transitions", "total must be"])
    assert.ok(misses.includes(word), word);
});

test("a user track with an offset moves the beat grid", () => {
  assert.equal(check.beatTime(4, 120, 0.2), 2.2);
  const shifted = plan("showreel").replace("music: bed-standard", "music: track.mp3 120 0.2");
  assert.match(check.checkPlan(check.parsePlan(shifted)).join("\n"), /name: big beat starts 0\.20s off the music beat/);
});

test("the reading formula scales with tone", () => {
  assert.equal(check.readingHold(2, "standard"), 1);
  assert.equal(check.readingHold(6, "standard"), 2);
  assert.equal(Number(check.readingHold(6, "calm").toFixed(2)), 2.6);
});

test("measured holds are compared with the plan, and drift holds allow slow motion", () => {
  const parsed = check.parsePlan(
    "tone: standard\ndirection: left\ntransitions: hard\nmusic: none\ntotal: 6\n\n| beat | start | length | on screen | why | move | sequence | hold | sound | cut |\n|---|---|---|---|---|---|---|---|---|---|\n| first | 0 | 3 | box | test | smooth | none | 1.5 still | none | hard |\n| second | 3 | 3 | box | test | smooth | none | 1.5 drift | none | end |\n",
  );
  // 30 fps. Each beat: 1s of fast motion, then 2s at the given energy.
  const samples = (rest: number) =>
    Array.from({ length: 180 }, (_, i) => ({ t: i / 30, e: (i / 30) % 3 < 1 ? 3 : rest }));
  assert.deepEqual(check.checkHolds(samples(0), parsed, { still: 0.15, settled: 1 }).misses, []);
  const drifting = check.checkHolds(samples(0.5), parsed, { still: 0.15, settled: 1 }).misses;
  assert.equal(drifting.length, 1);
  assert.match(drifting[0], /first: measured still hold 0\.00s, plan says 1\.5s/);
});
