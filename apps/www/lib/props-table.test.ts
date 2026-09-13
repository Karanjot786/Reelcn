import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { propsTable } from "./props-table.ts";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const ITEM_PATH = path.join(repoRoot, "registry/items/lower-third.tsx");
const TOOL_PATH = path.join(repoRoot, "registry/tools/sfx-pull.ts");

test("propsTable reads name, type, required, default and JSDoc from LowerThirdProps", () => {
  const rows = propsTable(ITEM_PATH);
  const byName = new Map(rows.map((row) => [row.name, row]));

  const name = byName.get("name");
  assert.equal(name?.type, "string");
  assert.equal(name?.required, true);

  const variant = byName.get("variant");
  assert.equal(variant?.type, '"bar" | "card" | "minimal"');
  assert.equal(variant?.default, '"bar"');
  assert.equal(variant?.required, false);

  const align = byName.get("align");
  assert.match(align?.description ?? "", /portrait/);

  // `delay` is declared on `MotionProps`, not on `LowerThirdProps` itself — the checker still surfaces it
  // because `LowerThirdProps = MotionProps & { ... }` is an intersection.
  const delay = byName.get("delay");
  assert.match(delay?.description ?? "", /Frames to wait/);
});

test("propsTable returns an empty array for a tools file, which has no <Name>Props alias", () => {
  assert.deepEqual(propsTable(TOOL_PATH), []);
});
