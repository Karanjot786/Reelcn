import assert from "node:assert/strict";
import test from "node:test";
import { sceneIndexAt, sceneMarks } from "../registry/demos/scene-marks.ts";

const ten = "Ten words take a viewer about four seconds to read";

test("scene marks start where the previous scene's fade begins", () => {
  // 150 + 90 + 120 frames with two 15-frame fades: starts at 0, 135 and 210.
  const marks = sceneMarks({
    scenes: [
      { type: "text", text: ten, background: "grid" },
      { type: "image", src: "a.png" },
      { type: "stat", label: "Users", value: 10 },
    ],
  });
  assert.deepEqual(marks, [
    { name: "text", from: 0, background: "grid" },
    { name: "image", from: 135 },
    { name: "stat", from: 210 },
  ]);
});

test("sceneIndexAt picks the last scene that has started", () => {
  const marks = [
    { name: "a", from: 0 },
    { name: "b", from: 135 },
    { name: "c", from: 210 },
  ];
  assert.equal(sceneIndexAt(marks, 0), 0);
  assert.equal(sceneIndexAt(marks, 134), 0);
  assert.equal(sceneIndexAt(marks, 135), 1);
  assert.equal(sceneIndexAt(marks, 999), 2);
  assert.equal(sceneIndexAt([], 50), 0);
});
