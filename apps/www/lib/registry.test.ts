import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { demoIds, demosFor } from "./demos.ts";
import { categories, categoryOrder, installUrl, isLib, items } from "./registry.ts";

const wwwDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryDir = path.join(wwwDir, "public/r");
const thumbsDir = path.join(wwwDir, "public/thumbs");

test("every item has a built public/r/<name>.json", () => {
  for (const item of items) {
    assert.ok(existsSync(path.join(registryDir, `${item.name}.json`)), `missing public/r/${item.name}.json`);
  }
});

test("categories partition every item, one Category per categoryOrder entry", () => {
  assert.deepEqual(
    categories.map((category) => category.id),
    [...categoryOrder],
  );
  assert.equal(
    categories.reduce((total, category) => total + category.items.length, 0),
    items.length,
  );
  for (const item of items) {
    assert.ok(
      (categoryOrder as readonly string[]).includes(item.categories[0]),
      `${item.name}: category "${item.categories[0]}" is not in categoryOrder`,
    );
  }
});

test("installUrl points at a /r/<name>.json under SITE_URL", () => {
  for (const item of items) assert.ok(installUrl(item.name).endsWith(`/r/${item.name}.json`));
});

test("every non-lib item has at least one demo, and every demo has a thumbnail", () => {
  for (const item of items) {
    if (isLib(item)) continue;
    assert.ok(demosFor(item.name).length > 0, `${item.name}: no demo in demos.json`);
  }
  for (const id of demoIds) {
    assert.ok(existsSync(path.join(thumbsDir, `${id}.jpg`)), `missing thumbnail for demo "${id}"`);
  }
});

test("no demo id collides with a fixed thumbnail name", () => {
  for (const id of demoIds) assert.ok(!/^(hero-|fmt-|theme-)/.test(id), `demo id "${id}" looks like a fixed frame`);
});
