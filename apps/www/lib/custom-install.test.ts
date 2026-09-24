import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import { customFile, customRegistryItem, decodePayload, encodePayload, validatePayload } from "./custom-install.ts";

const ROWS = [
  { name: "text", control: "text" },
  { name: "size", control: "slider" },
  { name: "effect", control: "select", options: ["rise", "blur"] },
  { name: "data" },
];
const THEMES = ["daylight", "mono"];
const OK = {
  props: { text: "Héllo", size: 150, data: [{ label: "Q1", value: 1 }] },
  theme: "mono",
  component: "TextReveal",
};

test("payload round trips through base64url", () => {
  const encoded = encodePayload(OK);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodePayload(encoded), OK);
});

test("decodePayload rejects bad base64, bad JSON, bad shape and oversize", () => {
  assert.equal(decodePayload("%%%"), null);
  assert.equal(decodePayload(Buffer.from("{not json").toString("base64url")), null);
  assert.equal(decodePayload(Buffer.from('"just a string"').toString("base64url")), null);
  assert.equal(decodePayload(encodePayload({ ...OK, props: { text: "x".repeat(9000) } })), null);
});

test("validatePayload keeps known props, drops bad values, rejects bad theme and component", () => {
  const out = validatePayload(
    { props: { text: '"/><script>', size: "big", effect: "nope", foo: 1, data: [1] }, component: "TextReveal" },
    ROWS,
    THEMES,
  );
  assert.deepEqual(out, { props: { text: '"/><script>', data: [1] }, component: "TextReveal", theme: undefined });
  assert.equal(validatePayload({ ...OK, component: "x; alert(1)" }, ROWS, THEMES), null);
  assert.equal(validatePayload({ ...OK, theme: "evil" }, ROWS, THEMES), null);
});

test("customFile writes every value as a JSON expression, so hostile strings stay valid TSX", () => {
  const file = customFile(
    "text-reveal",
    "TextReveal",
    { text: 'a"b}c<d\ne', size: 150, poster: true },
    "https://x.dev/p?a=1\n//",
  );
  assert.ok(file.includes('text={"a\\"b}c<d\\ne"}'));
  assert.ok(file.includes(" poster "));
  assert.ok(file.includes("export function TextRevealCustom("));
  const { diagnostics } = ts.transpileModule(file, {
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve },
    fileName: "x.tsx",
  });
  assert.deepEqual(diagnostics, []);
  assert.equal(file.split("\n").filter((line) => line.startsWith("//")).length, 1);
});

test("customRegistryItem depends on the item, themed when a theme is picked", () => {
  const base = { item: "text-reveal", component: "TextReveal", props: {}, shareUrl: "u", siteUrl: "https://s.dev" };
  const plain = JSON.parse(customRegistryItem(base));
  assert.equal(plain.name, "text-reveal-custom");
  assert.deepEqual(plain.registryDependencies, ["https://s.dev/r/text-reveal.json"]);
  assert.equal(plain.files[0].target, "~/src/reelcn/text-reveal-custom.tsx");
  assert.deepEqual(JSON.parse(customRegistryItem({ ...base, theme: "mono" })).registryDependencies, [
    "https://s.dev/r/mono/text-reveal.json",
  ]);
});
