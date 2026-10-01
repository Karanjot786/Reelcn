import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { clock, counts, filmOf, films, RENDERER_NAMES, RENDERER_ORDER, renderers, sceneAt } from "./motion.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const skill = path.join(root, "skills/reelcn-motion");
const pub = path.join(root, "apps/www/public");

test("the manifest matches the skill on disk", () => {
  const starters = readdirSync(path.join(skill, "starters")).sort();
  assert.deepEqual(films.map((f) => f.id).sort(), starters, "one film per starter");
  const guides = readdirSync(path.join(skill, "renderers"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
  assert.deepEqual([...renderers].sort(), guides);
  assert.equal(counts.starters, starters.length);
  assert.equal(counts.references, readdirSync(path.join(skill, "references")).length);
  assert.equal(counts.plans, readdirSync(path.join(skill, "plans")).length);
  for (const film of films) {
    const plan = readFileSync(path.join(skill, "starters", film.id, "plan.md"), "utf8");
    assert.equal(film.seconds, Number(/^total:\s*(\S+)/m.exec(plan)?.[1]), `${film.id} length`);
    for (const file of [film.video, film.poster]) assert.ok(existsSync(path.join(pub, file)), `${file} is missing`);
    assert.equal(statSync(path.join(pub, film.video)).size, film.bytes, `${film.id} bytes`);
    assert.ok(film.bytes < 2.5e6, `${film.id} is ${film.bytes} bytes, keep films under 2.5 MB`);
  }
});

test("every renderer has the launch film", () => {
  for (const r of renderers) assert.equal(filmOf(r, "launch-film").renderer, r);
  assert.throws(() => filmOf("hyperframes", "no-such-plan"), /no hyperframes no-such-plan film/);
});

test("sceneAt picks the scene playing at a time, clock prints m:ss", () => {
  const scenes = [
    { name: "a", start: 0, length: 2, words: "" },
    { name: "b", start: 2, length: 2.5, words: "" },
    { name: "c", start: 4.5, length: 2, words: "" },
  ];
  assert.equal(sceneAt(scenes, 0), 0);
  assert.equal(sceneAt(scenes, 1.99), 0);
  assert.equal(sceneAt(scenes, 2), 1);
  assert.equal(sceneAt(scenes, 9), 2);
  assert.equal(clock(0), "0:00");
  assert.equal(clock(6.5), "0:06.5");
  assert.equal(clock(13), "0:13");
});

test("every manifest renderer has a name and a place in the page order", () => {
  for (const r of renderers) {
    assert.ok(RENDERER_NAMES[r], `${r} has no RENDERER_NAMES entry`);
    assert.ok(RENDERER_ORDER.includes(r), `${r} is missing from RENDERER_ORDER`);
  }
  assert.equal(RENDERER_ORDER.length, renderers.length);
});
