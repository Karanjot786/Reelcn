import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const MIGRATED = ["registry/items/toast.tsx", "registry/items/stat-counter.tsx", "registry/items/code-block.tsx"];

test("no hex color literals remain in the four files migrated to theme tokens", () => {
  for (const file of MIGRATED) {
    const source = readFileSync(file, "utf8");
    const hexLiterals = source.match(/#[0-9a-fA-F]{6}\b/g) ?? [];
    assert.deepEqual(hexLiterals, [], `${file} still has hex literals: ${hexLiterals.join(", ")}`);
  }
});

test("app-window's shadow no longer hardcodes #000000", () => {
  const source = readFileSync("registry/items/app-window.tsx", "utf8");
  assert.ok(!source.includes('"#000000"'), "app-window.tsx still hardcodes #000000");
});
