import assert from "node:assert/strict";
import test from "node:test";
import { themedUsage } from "./themed-usage.ts";

test("daylight leaves the snippet untouched", () => {
  assert.equal(themedUsage("<Center />", "daylight"), "<Center />");
});

test("a plain snippet is wrapped and indented in a ThemeProvider", () => {
  assert.equal(
    themedUsage("<Center>\n  <X />\n</Center>", "midnight"),
    '<ThemeProvider theme="midnight">\n  <Center>\n    <X />\n  </Center>\n</ThemeProvider>',
  );
});

test("an inline defaultProps object gets the theme last", () => {
  assert.equal(
    themedUsage("<Composition\n  defaultProps={{ ...aDefaults, audio }}\n/>", "paper"),
    '<Composition\n  defaultProps={{ ...aDefaults, audio, theme: "paper" }}\n/>',
  );
});

test("a Composition gets the theme through its default props", () => {
  assert.equal(
    themedUsage('<Composition\n  id="A"\n  defaultProps={aDefaults}\n/>', "neon"),
    '<Composition\n  id="A"\n  defaultProps={{ ...aDefaults, theme: "neon" }}\n/>',
  );
});
