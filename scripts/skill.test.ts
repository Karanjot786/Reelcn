import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { sceneSchema } from "../registry/items/story.ts";

const DIR = "skills/reelcn/archetypes";
const names = new Set(
  (JSON.parse(readFileSync("registry.json", "utf8")).items as { name: string }[]).map((i) => i.name),
);
const files = readdirSync(DIR).filter((file) => file.endsWith(".md"));

test("the skill ships 8 archetypes", () => {
  assert.equal(files.length, 8);
  assert.match(readFileSync("skills/reelcn/SKILL.md", "utf8"), /^---\nname: reelcn\ndescription: /);
});

for (const file of files) {
  const text = readFileSync(path.join(DIR, file), "utf8");

  test(`${file} names a real template and real items`, () => {
    const template = /^Template: `([a-z0-9-]+)`$/m.exec(text)?.[1];
    assert.ok(template && names.has(template), `${file}: Template line missing or unknown`);
    const items = /^Items: (.+)$/m.exec(text)?.[1].split(", ") ?? [];
    assert.ok(items.length >= 3, `${file}: list at least 3 items`);
    for (const item of items) assert.ok(names.has(item), `${file}: unknown item "${item}"`);
  });

  test(`${file} JSON blocks parse, and any story scenes are valid`, () => {
    const blocks = [...text.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => JSON.parse(m[1]));
    assert.ok(blocks.length > 0, `${file}: add a json block`);
    for (const block of blocks) {
      for (const [index, scene] of (block.scenes ?? []).entries()) {
        const result = sceneSchema.safeParse(scene);
        assert.ok(result.success, `${file}: scene ${index}: ${result.error?.message}`);
      }
    }
  });
}
