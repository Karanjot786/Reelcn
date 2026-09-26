import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./core.tsx", import.meta.url), "utf8");
const block = source.slice(
  source.indexOf("export const themes = {"),
  source.indexOf("} satisfies Record<string, Theme>;"),
);
// One entry per theme: the text from its `name: "x"` line up to the next theme's.
const themes = block
  .split(/\n {2}(?=\w+: \{\n {4}name: ")/)
  .slice(1)
  .map((body) => {
    const name = /name: "(\w+)"/.exec(body)?.[1] ?? "?";
    const color = (key: string) => {
      const match = new RegExp(`\\b${key}: "(#[0-9A-Fa-f]{6})"`).exec(body);
      assert.ok(match, `${name}: ${key} must be a 6-digit hex color`);
      return match[1];
    };
    return { name, body, color };
  });

function luminance(hex: string) {
  const channel = (i: number) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test("the theme set is daylight, midnight, mono, ledger, afterglow, chromewave", () => {
  assert.deepEqual(
    themes.map((t) => t.name),
    ["daylight", "midnight", "mono", "ledger", "afterglow", "chromewave"],
  );
});

test("every theme meets the contrast floor", () => {
  for (const t of themes) {
    const fg = t.color("foreground");
    assert.ok(ratio(fg, t.color("background")) >= 4.5, `${t.name}: foreground on background`);
    assert.ok(ratio(fg, t.color("surface")) >= 4.5, `${t.name}: foreground on surface`);
    assert.ok(ratio(t.color("accent"), t.color("background")) >= 3, `${t.name}: accent on background`);
    assert.ok(ratio(t.color("accentForeground"), t.color("accent")) >= 4.5, `${t.name}: accentForeground on accent`);
  }
});

test("motion is a plain preset, and font stacks end in a generic family", () => {
  for (const t of themes) assert.doesNotMatch(t.body, /\bstep:|jitter:/, `${t.name}: no step or jitter`);
  assert.match(source, /const sans = \(family: string\) => `\$\{family\}, ui-sans-serif, system-ui, sans-serif`;/);
  assert.match(source, /const serif = \(family: string\) => `\$\{family\}, ui-serif, Georgia, serif`;/);
});
