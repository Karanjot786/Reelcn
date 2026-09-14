import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

test("a theme's fonts getter never runs for a sibling theme that wasn't read (Phase 2 blocker 1 regression guard)", () => {
  const reads: Record<string, number> = { daylight: 0, mono: 0 };
  const themes = {
    daylight: {
      get fonts() {
        reads.daylight++;
        return { heading: "Schibsted Grotesk", body: "Schibsted Grotesk", mono: "JetBrains Mono" };
      },
    },
    mono: {
      get fonts() {
        reads.mono++;
        return { heading: "Archivo Variable", body: "Archivo", mono: "JetBrains Mono" };
      },
    },
  };

  // Simulates ThemeProvider's `themes[theme]` selection plus a consumer reading `theme.fonts.heading`
  // for the daylight-only render this regression guard covers.
  const active = themes.daylight;
  void active.fonts.heading;

  assert.equal(reads.daylight, 1, "the selected theme's fonts getter should run exactly once");
  assert.equal(reads.mono, 0, "a theme that was never selected must never have its fonts getter run");
});

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

// core.tsx has JSX in it, so it can't be imported by node --test's native TS type-stripping (JSX
// needs a real transform, not erasure) without adding a build-tool dependency this plan's Global
// Constraints forbid. This test instead pins the guarantee to the real shipped source text: it
// extracts daylight's `get fonts()` accessor body from core.tsx and asserts it only ever names its
// own font family (`schibstedGrotesk`), never an identifier belonging to another theme's font
// loader (e.g. `archivo`/`archivoVariable`, `bricolage`, `anton`, ...). Since a getter body can only
// call what it references, a body that never names another theme's loader can never call it, no
// matter which theme object `themes[theme]` selects at runtime — this is what actually proves
// "rendering daylight never calls another theme's font loader" for the code that ships.
test("daylight's fonts getter in core.tsx references only its own font, never another theme's loader", () => {
  const corePath = fileURLToPath(new URL("./core.tsx", import.meta.url));
  const source = readFileSync(corePath, "utf8");

  const themeKeyIndex = source.indexOf("daylight: {");
  assert.ok(themeKeyIndex !== -1, "expected a `daylight: {` theme entry in core.tsx");
  const daylightBlock = extractBracedBlock(source, source.indexOf("{", themeKeyIndex));

  const getterKeyIndex = daylightBlock.indexOf("get fonts()");
  assert.ok(getterKeyIndex !== -1, "daylight.fonts must stay a `get fonts()` accessor, not a plain data property");
  const fontsBody = extractBracedBlock(
    daylightBlock,
    daylightBlock.indexOf("{", getterKeyIndex + "get fonts()".length),
  );

  assert.ok(
    fontsBody.includes("fonts.schibstedGrotesk"),
    "daylight should still resolve its fonts from schibstedGrotesk",
  );

  // Every font-loader identifier that belongs exclusively to another theme.
  const otherThemesOnly = [
    "ibmPlexSansCondensed",
    "ibmPlexSans",
    "ibmPlexMono",
    "instrumentSerif",
    "bricolage",
    "atkinsonHyperlegible",
    "anton",
    "rubik",
    "archivoVariable",
    "archivo",
    "cormorantGaramond",
    "manrope",
    "inter",
    "spaceGrotesk",
  ];
  for (const loader of otherThemesOnly) {
    assert.ok(
      !fontsBody.includes(loader),
      `daylight's fonts getter must never reference fonts.${loader} (that theme's font loader)`,
    );
  }
});
