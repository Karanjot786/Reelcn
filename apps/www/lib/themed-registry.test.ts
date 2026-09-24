import assert from "node:assert/strict";
import test from "node:test";
import { themedRegistryItem } from "./themed-registry.ts";

const SITE = "https://www.reelcn.dev";

test("reelcn dependencies move to the theme folder; others stay", () => {
  const item = { name: "camera", registryDependencies: [`${SITE}/r/core.json`, "https://example.com/r/x.json"] };
  const out = JSON.parse(themedRegistryItem(JSON.stringify(item), "mono", SITE));
  assert.deepEqual(out.registryDependencies, [`${SITE}/r/mono/core.json`, "https://example.com/r/x.json"]);
});

test("core's two daylight defaults become the theme", () => {
  const content =
    'const ThemeContext = createContext<Theme>(themes.daylight);\nexport function ThemeProvider({\n  theme = "daylight",\n';
  const item = { name: "core", files: [{ path: "registry/items/core.tsx", content }] };
  const out = JSON.parse(themedRegistryItem(JSON.stringify(item), "mono", SITE));
  assert.equal(
    out.files[0].content,
    'const ThemeContext = createContext<Theme>(themes.mono);\nexport function ThemeProvider({\n  theme = "mono",\n',
  );
});

test("a core that lost one of its defaults fails loudly", () => {
  const item = { name: "core", files: [{ path: "core.tsx", content: "createContext<Theme>(themes.daylight)" }] };
  assert.throws(() => themedRegistryItem(JSON.stringify(item), "mono", SITE), /no longer contains/);
});
