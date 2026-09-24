import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createElement, type ReactElement } from "react";
import { customizable } from "./customizable.ts";

function Title(props: { text: string; size?: number }) {
  return createElement("h1", { style: { fontSize: props.size } }, props.text);
}

type Wrapped = ReactElement<{ children: ReactElement<Record<string, unknown>> }>;

test("customizable renders the demo props, and edits merged on top", () => {
  const demo = customizable("Title", Title, { text: "Hi", size: 10 }, (el) => createElement("main", null, el));
  const plain = demo.component() as Wrapped;
  assert.equal(plain.type, "main");
  assert.deepEqual(plain.props.children.props, { text: "Hi", size: 10 });
  const customize = demo.customize;
  assert.ok(customize);
  const edited = customize.render({ ...customize.props, size: 40 }) as Wrapped;
  assert.deepEqual(edited.props.children.props, { text: "Hi", size: 40 });
  assert.equal(customize.name, "Title");
});

test('every customizable("X", X, ...) names a component exported from registry/items', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const itemsDir = path.join(here, "../items");
  const items = readdirSync(itemsDir)
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => readFileSync(path.join(itemsDir, file), "utf8"))
    .join("\n");
  const demos = readdirSync(here)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => readFileSync(path.join(here, file), "utf8"))
    .join("\n");
  const calls = [...demos.matchAll(/customizable\(\s*"(\w+)",\s*(\w+)\s*,/g)];
  assert.ok(calls.length > 0, "no customizable() calls found");
  for (const [, name, component] of calls) {
    assert.equal(name, component, `customizable("${name}", ${component}): the name string must match the component`);
    assert.match(
      items,
      new RegExp(`export (function|const) ${name}\\b`),
      `${name} is not exported from registry/items`,
    );
  }
});
