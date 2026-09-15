import assert from "node:assert/strict";
import test from "node:test";
import { jsonLd } from "./json-ld.ts";

test("jsonLd escapes < so a value can't close the script tag, and still parses back", () => {
  const data = { name: "</script><script>alert(1)</script>" };
  const body = jsonLd(data);
  assert.ok(!body.includes("<"), body);
  assert.deepEqual(JSON.parse(body), data);
});
