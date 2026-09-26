import assert from "node:assert/strict";
import test from "node:test";
import { resolveThemeName, themeAliases } from "./core-math.ts";

test("removed themes resolve to their replacements; other names pass through", () => {
  assert.deepEqual(themeAliases, { neon: "chromewave", paper: "ledger", sunset: "midnight" });
  assert.equal(resolveThemeName("neon"), "chromewave");
  assert.equal(resolveThemeName("paper"), "ledger");
  assert.equal(resolveThemeName("sunset"), "midnight");
  assert.equal(resolveThemeName("daylight"), "daylight");
  // A prototype key is a name, not an alias.
  assert.equal(resolveThemeName("constructor"), "constructor");
});
