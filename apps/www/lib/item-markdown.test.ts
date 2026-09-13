import assert from "node:assert/strict";
import { test } from "node:test";
import { linkifyBackticks, propsMarkdownTable } from "./item-markdown.ts";

test("linkifyBackticks links a backticked name resolveHref knows", () => {
  const segments = linkifyBackticks("Headlines — use `text-reveal`", (name) =>
    name === "text-reveal" ? `/docs/components/${name}` : undefined,
  );
  assert.deepEqual(segments, [
    { text: "Headlines — use " },
    { text: "text-reveal", href: "/docs/components/text-reveal", code: true },
  ]);
});

test("linkifyBackticks keeps an unresolved name as code with no link", () => {
  const segments = linkifyBackticks("See `unknown-thing` for details", () => undefined);
  assert.deepEqual(segments, [
    { text: "See " },
    { text: "unknown-thing", href: undefined, code: true },
    { text: " for details" },
  ]);
});

test("linkifyBackticks returns the whole string when there's nothing to link", () => {
  assert.deepEqual(
    linkifyBackticks("No backticks here", () => "/x"),
    [{ text: "No backticks here" }],
  );
});

test("linkifyBackticks handles more than one backticked name", () => {
  const segments = linkifyBackticks("`a` and `b`", (name) => `/${name}`);
  assert.deepEqual(segments, [
    { text: "a", href: "/a", code: true },
    { text: " and " },
    { text: "b", href: "/b", code: true },
  ]);
});

test("propsMarkdownTable renders a header and one row per prop, marking optional props and escaping union pipes", () => {
  const table = propsMarkdownTable([
    { name: "name", type: "string", required: true, description: "Speaker name." },
    {
      name: "variant",
      type: '"bar" | "card" | "minimal"',
      required: false,
      default: '"bar"',
      description: "Visual style.",
    },
  ]);
  assert.equal(
    table,
    [
      "| Name | Type | Default | Description |",
      "| --- | --- | --- | --- |",
      "| name | `string` | — | Speaker name. |",
      '| variant? | `"bar" \\| "card" \\| "minimal"` | `"bar"` | Visual style. |',
    ].join("\n"),
  );
});

test("propsMarkdownTable returns an empty string for no rows", () => {
  assert.equal(propsMarkdownTable([]), "");
});
