import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { propsTable } from "./props-table.ts";

type Item = { name: string; categories?: string[]; files: { path: string }[] };

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const IN_SCOPE = new Set([
  "text",
  "data",
  "overlays",
  "backgrounds",
  "social",
  "product",
  "motion",
  "audio",
  "transitions",
  "templates",
]);
const EXCLUDED = new Set(["use-beat"]);
const items = (JSON.parse(readFileSync(path.join(root, "registry.json"), "utf8")).items as Item[]).filter(
  (item) => IN_SCOPE.has(item.categories?.[0] ?? "") && !EXCLUDED.has(item.name),
);

test("139 visual items are in scope", () => {
  assert.equal(items.length, 139);
});

test("every in-scope item's props give the panel at least one control", () => {
  const empty = items
    .filter((item) => !propsTable(path.join(root, item.files[0].path)).some((row) => row.control))
    .map((item) => item.name);
  assert.deepEqual(empty, []);
});
