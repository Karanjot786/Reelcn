// The one test file for the reelcn-motion skill. Renders are checked by use, not here.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
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
  // One sample per 1/8 s, as measureEnergy returns them.
  const frames = (energy: (t: number) => number) =>
    Array.from({ length: 121 }, (_, i) => ({ t: i / 8, e: energy(i / 8) }));
  const slides = check
    .checkMotion(
      frames((t) => (t % 3 < 0.5 ? 3 : 0)),
      parsed,
    )
    .join("\n");
  assert.match(slides, /of frames move, the target is 60%/);
  assert.match(slides, /still for 2\.\d+s/);
  const film = check.checkMotion(
    frames((t) => (t > 13.4 || t % 2 > 1.6 ? 0 : 2)),
    parsed,
  );
  assert.deepEqual(film, []);
});

const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

test("a slow push moves, heavy grain on a still plate is still", { skip: !hasFfmpeg && "ffmpeg missing" }, () => {
  const dir = mkdtempSync(path.join(tmpdir(), "reelcn-motion-"));
  const clip = (name: string, graph: string) => {
    const file = path.join(dir, name);
    const run = spawnSync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      graph,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      file,
    ]);
    assert.equal(run.status, 0, String(run.stderr));
    return file;
  };
  const push = clip(
    "push.mp4",
    "color=c=black:s=640x360:r=60:d=3[b];color=c=white:s=80x80:r=60:d=3[s];[b][s]overlay=x='100+t*20':y=140",
  );
  const grain = clip("grain.mp4", "color=c=0x202020:s=640x360:r=60:d=3,noise=alls=25");
  const moving = (file: string) => {
    const s = check.measureEnergy(file);
    return s.filter((x: { e: number }) => x.e >= tokens.targets.movingThreshold).length / s.length;
  };
  assert.ok(moving(push) > 0.9, `slow push reads ${moving(push)}`);
  assert.ok(moving(grain) < 0.1, `grain reads ${moving(grain)}`);
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
});

const mini = (sound: string) =>
  check.parsePlan(
    `tempo: 120\ncarrier: the dot\nmusic: generated\ntotal: 2\n\n| scene | start | length | shows | words | move | live | carrier | sound | join |\n|---|---|---|---|---|---|---|---|---|---|\n| a | 0 | 1 | x | none | types | counter rolls | dot | intro | morph |\n| b | 1 | 1 | x | none | types | counter rolls | dot | ${sound} | end |\n`,
  );

test("a single-frame flash fails, a hit without picture warns", () => {
  const at60 = (energy: (i: number) => number) => Array.from({ length: 120 }, (_, i) => ({ t: i / 60, e: energy(i) }));
  const flash = check.checkEvents(
    at60((i) => (i === 30 || i === 31 ? 6 : 0.1)),
    mini("hit"),
  );
  assert.match(flash.misses.join("\n"), /single-frame flash at 0\.50s/);
  assert.match(flash.warns.join("\n"), /b: the hit at 1s has no picture event/);
  const late = check.checkEvents(
    at60((i) => (i === 69 ? 9 : 0.1)),
    mini("hit"),
  );
  assert.match(late.warns.join("\n"), /b: the picture lands 0\.15s from its hit at 1s/);
  const ok = check.checkEvents(
    at60((i) => (i === 61 ? 9 : 0.1)),
    mini("hit"),
  );
  assert.deepEqual(ok, { misses: [], warns: [] });
});

test("stock copy warns once and fails twice; the owner's own copy is exempt", () => {
  const one = plan("launch-film").replace('"154 components."', '"Unlock 154 components."');
  const r1 = check.checkCopy(check.parsePlan(one), null);
  assert.deepEqual(r1.misses, []);
  assert.match(r1.warns.join("\n"), /library: "unlock" in "Unlock 154 components\." is stock copy/);
  const two = one.replace('"One command."', '"Seamless — one command."');
  const r2 = check.checkCopy(check.parsePlan(two), null);
  assert.equal(r2.warns.length, 0);
  assert.match(r2.misses.join("\n"), /"seamless" in/);
  assert.match(r2.misses.join("\n"), /an em dash in/);
  const own = check.checkCopy(check.parsePlan(two), "Tagline: Seamless — one command.\nUnlock 154 components.");
  assert.deepEqual(own, { misses: [], warns: [] });
});

test("numbers on screen must come from the material", () => {
  const p = check.parsePlan(plan("launch-film"));
  assert.match(
    check.checkCopy(p, "reelcn ships many components").misses.join("\n"),
    /library: "154" is not in material\.md/,
  );
  assert.deepEqual(check.checkCopy(p, "154 components").misses, []);
  const mocked = check.parsePlan(
    plan("launch-film").replace("| 28 real component renders |", "| mocked: 28 renders |"),
  );
  assert.deepEqual(check.checkCopy(mocked, "nothing").misses, []);
});

test("the four shipped plans have no stock copy", () => {
  for (const name of PLANS)
    assert.deepEqual(check.checkCopy(check.parsePlan(plan(name)), null), { misses: [], warns: [] }, name);
});

test("idle live motion and the same join three times are reported", () => {
  const text = plan("launch-film")
    .replace("the counter rolls from 0 to 154", "a soft glow pulses")
    .replace("| drop, beat | flood |", "| drop, beat | morph |");
  const misses = check.checkPlan(check.parsePlan(text)).join("\n");
  assert.match(misses, /library: live "a soft glow pulses" is idle motion/);
  assert.match(misses, /any of them: the third "morph" join in a row/);
});

test("aspect defaults to 16:9, accepts 9:16 and 1:1, rejects others", () => {
  assert.equal(check.parsePlan(plan("launch-film")).aspect, "16:9");
  const tall = check.parsePlan(plan("launch-film").replace("total: 15", "aspect: 9:16\ntotal: 15"));
  assert.equal(tall.aspect, "9:16");
  assert.deepEqual(check.checkPlan(tall), []);
  const bad = check.checkPlan(check.parsePlan(plan("launch-film").replace("total: 15", "aspect: 4:3\ntotal: 15")));
  assert.match(bad.join("\n"), /aspect "4:3" is not one of 16:9, 9:16, 1:1/);
  assert.equal(tokens.aspect["9:16"].safe.bottom, 0.2);
});

const side = await import(path.resolve(SKILL, "scripts/motion-sidecar.mjs"));

test("the sidecar asserts each scene's hero, the order, the carrier in frame and no long freeze", () => {
  const out = side.sidecar(check.parsePlan(plan("launch-film")), { command: "#typed", lockup: "#tag" }, "#carrier");
  assert.deepEqual(out, {
    duration: 15,
    assertions: [
      { kind: "appearsBy", selector: "#typed", bySec: 0.5 },
      { kind: "appearsBy", selector: "#tag", bySec: 13.5 },
      { kind: "before", a: "#typed", b: "#tag" },
      { kind: "staysInFrame", selector: "#carrier" },
      { kind: "keepsMoving", maxStaticSec: tokens.targets.sceneStill },
    ],
  });
});

test("every starter has a current sidecar and an end guard", () => {
  for (const dir of readdirSync(`${SKILL}/starters`).filter((d) => d.startsWith("hyperframes-"))) {
    const root = `${SKILL}/starters/${dir}`;
    const parsed = check.parsePlan(readFileSync(`${root}/plan.md`, "utf8"));
    const want = side.sidecar(parsed, ...side.splitScenes(JSON.parse(readFileSync(`${root}/scenes.json`, "utf8"))));
    assert.deepEqual(JSON.parse(readFileSync(`${root}/index.motion.json`, "utf8")), want, `${dir} sidecar is stale`);
    assert.ok(
      readFileSync(`${root}/index.html`, "utf8").includes(`tl.set({}, {}, ${parsed.total});`),
      `${dir} has no end guard`,
    );
  }
});

test("a gap ducks the half beat before the drop", () => {
  const text = plan("launch-film").replace("| drop, beat | flood |", "| drop, gap, beat | flood |");
  const cues = track.cuesFromPlan(check.parsePlan(text));
  assert.deepEqual(cues.gaps, [{ from: 3.75, to: 4 }]);
  const pcm = track.renderTrack(cues);
  const rms = (a: number, b: number) => {
    let s = 0;
    for (let i = Math.round(a * 44100); i < Math.round(b * 44100); i++) s += pcm[i] * pcm[i];
    return Math.sqrt(s / ((b - a) * 44100));
  };
  assert.ok(rms(3.78, 3.97) < rms(3.5, 3.72) * 0.25, "the gap is not quiet");
  const bad = check.checkPlan(check.parsePlan(plan("launch-film").replace("build, hit", "build, hit, gap")));
  assert.match(bad.join("\n"), /library: "gap" goes with "drop"/);
});

test("every move has a recipe with timing, pitfalls and checks; slop has three parts", () => {
  const moves = readFileSync(`${SKILL}/references/moves.md`, "utf8");
  const names = [
    "Typed command",
    "Cascade",
    "Selection hop",
    "Roll-up",
    "Reshape",
    "Restyle wipe",
    "Speed",
    "Focus pull",
    "Letter drop",
    "Fill sweep",
    "Collapse to logo",
    "Flood",
  ];
  for (const name of names) {
    const at = moves.indexOf(`## ${name}\n`);
    assert.ok(at !== -1, `${name} has no recipe`);
    const next = moves.indexOf("\n## ", at + 3);
    const body = moves.slice(at, next === -1 ? undefined : next);
    for (const line of ["Timing:", "Pitfalls:", "Check at:"]) assert.ok(body.includes(line), `${name} lacks ${line}`);
  }
  const slop = readFileSync(`${SKILL}/references/slop.md`, "utf8");
  for (const h of ["## Copy", "## Picture", "## Motion"]) assert.ok(slop.includes(h), h);
  assert.ok(!(moves + slop).includes("—"), "em dash in a reference");
});

test("SKILL.md routes résumé-showreel prompts and gates on a sample scene and a fresh review", () => {
  const skill = readFileSync(`${SKILL}/SKILL.md`, "utf8");
  assert.match(skill, /showreel for a résumé/i);
  assert.match(skill, /sample scene/i);
  assert.match(skill, /fresh review/i);
  assert.match(plan("showreel"), /Avoid for:.*résumé/i);
  assert.match(readFileSync(`${SKILL}/references/review.md`, "utf8"), /## Fresh review/);
});

const RENDERERS = ["hyperframes", "remotion", "editframe", "fframes"];

test("every renderer has a guide and a launch film starter with the shared plan", () => {
  const shared = readFileSync(`${SKILL}/starters/hyperframes-launch-film/plan.md`, "utf8");
  for (const name of RENDERERS) {
    const guide = `${SKILL}/renderers/${name}.md`;
    assert.ok(existsSync(guide), `${guide} is missing`);
    const text = readFileSync(guide, "utf8");
    for (const h of ["## Setup", "## Contract", "## Patterns", "## Traps", "## Check and render"])
      assert.ok(text.includes(h), `${name} guide lacks ${h}`);
    assert.ok(!text.includes("—"), `${name} guide has an em dash`);
    const starter = `${SKILL}/starters/${name}-launch-film`;
    assert.equal(readFileSync(`${starter}/plan.md`, "utf8"), shared, `${name} plan differs from the approved film's`);
    assert.match(
      readFileSync(`${starter}/README.md`, "utf8"),
      /motion-check\.mjs out\.mp4 plan\.md/,
      `${name} README lacks the check`,
    );
  }
});

test("starters pin exact renderer versions", () => {
  const pkg = (dir: string) => JSON.parse(readFileSync(`${SKILL}/starters/${dir}/package.json`, "utf8"));
  const remotion = pkg("remotion-launch-film");
  assert.equal(remotion.dependencies.remotion, "4.0.523");
  assert.equal(remotion.devDependencies["@remotion/cli"], "4.0.523");
  assert.equal(remotion.dependencies.gsap, "3.14.2");
  const editframe = pkg("editframe-launch-film");
  for (const [name, v] of Object.entries({ ...editframe.dependencies, ...editframe.devDependencies }))
    if (name.startsWith("@editframe/")) assert.equal(v, "0.59.47", name);
  assert.equal(editframe.dependencies.gsap, "3.14.2");
  assert.match(readFileSync(`${SKILL}/starters/fframes-launch-film/Cargo.toml`, "utf8"), /fframes = \{ version = "=\d/);
});

test("the Remotion guide shows how to drop the film into an existing project", () => {
  const guide = readFileSync(`${SKILL}/renderers/remotion.md`, "utf8");
  for (const word of ["LaunchFilm.tsx", "film.ts", "<Composition"]) assert.ok(guide.includes(word), word);
});
