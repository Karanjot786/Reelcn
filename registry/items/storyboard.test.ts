import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

/** Finds the `{` at `openBraceIndex` and returns the substring through its matching `}`. */
function extractBracedBlock(source: string, openBraceIndex: number): string {
  assert.equal(source[openBraceIndex], "{", "expected an opening brace at the given index");
  let depth = 0;
  for (let i = openBraceIndex; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(openBraceIndex, i + 1);
    }
  }
  throw new Error("unbalanced braces: no matching close brace found");
}

// storyboard.tsx has JSX in it, so it can't be imported by node --test's native TS type-stripping (JSX
// needs a real transform, not erasure) without adding a build-tool dependency — the same constraint
// core-theme-fonts.test.ts already documents for core.tsx. `isValidTabsState`, the review should-fix
// fix for uiSceneSchema's `tabs` step validation, is kept as its own pure, JSX-free function precisely
// so its *body* (plain JS — the TS-only bits are all in the signature) can be extracted from the real
// shipped source text and actually executed here, rather than hand-copied into this test where it
// could silently drift from the code that ships.
function loadIsValidTabsState(): (state: string, labelsLength: number) => boolean {
  const storyboardPath = fileURLToPath(new URL("./storyboard.tsx", import.meta.url));
  const source = readFileSync(storyboardPath, "utf8");

  const fnIndex = source.indexOf("function isValidTabsState(");
  assert.ok(fnIndex !== -1, "expected an isValidTabsState function in storyboard.tsx");
  const bodyStart = source.indexOf("{", fnIndex);
  const body = extractBracedBlock(source, bodyStart);

  // biome-ignore lint/security/noGlobalEval: executing the real shipped function body, not user input.
  return new Function("state", "labelsLength", body) as (state: string, labelsLength: number) => boolean;
}

test("isValidTabsState rejects a non-numeric state", () => {
  const isValidTabsState = loadIsValidTabsState();
  assert.equal(isValidTabsState("abc", 3), false);
});

test("isValidTabsState rejects an out-of-range index", () => {
  const isValidTabsState = loadIsValidTabsState();
  // A 3-tab component only has valid indices 0, 1, 2 — index 9 is out of range, and so is the boundary
  // value equal to labelsLength itself.
  assert.equal(isValidTabsState("9", 3), false);
  assert.equal(isValidTabsState("3", 3), false);
  assert.equal(isValidTabsState("-1", 3), false);
});

test("isValidTabsState accepts a valid in-range index", () => {
  const isValidTabsState = loadIsValidTabsState();
  assert.equal(isValidTabsState("0", 3), true);
  assert.equal(isValidTabsState("2", 3), true);
});
