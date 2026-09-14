import { strict as assert } from "node:assert";
import { test } from "node:test";

// Mirrors useViewport's PORTRAIT_RIGHT_INSET table without a React render.
const PORTRAIT_RIGHT_INSET: Record<string, number> = { generic: 0.07, tiktok: 0.16, reels: 0.15, shorts: 0.14 };

test("generic keeps today's 7% right inset", () => {
  assert.equal(PORTRAIT_RIGHT_INSET.generic, 0.07);
});

test("tiktok matches safe-zone-guide's 16% action-rail figure", () => {
  assert.equal(PORTRAIT_RIGHT_INSET.tiktok, 0.16);
});
