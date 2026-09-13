import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { captionsSeconds, makeStorySchema, type Story, sceneSeconds, storyFrames } from "../registry/items/story.ts";

const names = { themes: ["midnight", "paper"], transitions: ["fade", "glitch"], backgrounds: ["grid"], sfx: ["pop"] };
const schema = makeStorySchema(names);
const ten = "Ten words take a viewer about four seconds to read";

test("text-bearing scenes read at 2.5 words a second plus one, never under two seconds", () => {
  assert.equal(sceneSeconds({ type: "text", text: ten }), 5);
  assert.equal(sceneSeconds({ type: "title", title: "Hi" }), 2);
  assert.equal(
    sceneSeconds({ type: "quote", quote: "Seven words from a very happy customer", name: "Maya Chen", role: "CTO" }),
    5,
  );
});

test("media, charts and stats have fixed lengths; video trims win", () => {
  assert.equal(sceneSeconds({ type: "image", src: "a.png" }), 3);
  assert.equal(sceneSeconds({ type: "video", src: "a.mp4" }), 5);
  assert.equal(sceneSeconds({ type: "video", src: "a.mp4", trimStart: 2, trimEnd: 9 }), 7);
  assert.equal(sceneSeconds({ type: "device", device: "phone" }), 3);
  assert.equal(sceneSeconds({ type: "device", device: "phone", src: "demo.mp4" }), 5);
  assert.equal(sceneSeconds({ type: "chart", kind: "bar", data: [{ label: "a", value: 1 }] }), 4);
  assert.equal(sceneSeconds({ type: "stat", label: "Users", value: 10 }), 4);
});

test("code and terminal scenes last their typing time plus 1.5 s", () => {
  assert.equal(sceneSeconds({ type: "code", code: "x".repeat(80) }), 3.5);
  // 12 command characters at 32 cps, 0.7 s around the command, 0.1 s for the output line, then 1.5 s.
  assert.equal(
    sceneSeconds({
      type: "terminal",
      lines: [
        { type: "command", text: "npm i reelcn" },
        { type: "output", text: "added 1 package" },
      ],
    }),
    12 / 32 + 0.7 + 0.1 + 1.5,
  );
});

test("an explicit duration wins, and a split lasts as long as its longer side", () => {
  assert.equal(sceneSeconds({ type: "image", src: "a.png", duration: 1.5 }), 1.5);
  assert.equal(
    sceneSeconds({ type: "split", left: { type: "image", src: "a.png" }, right: { type: "text", text: ten } }),
    5,
  );
});

test("story length is the scenes minus each transition's overlap", () => {
  const scenes: Story["scenes"] = [
    { type: "text", text: ten },
    { type: "image", src: "a.png" },
    { type: "stat", label: "Users", value: 10 },
  ];
  assert.equal(storyFrames({ scenes }), 150 + 90 + 120 - 15 - 15);
  assert.equal(storyFrames({ scenes: [{ ...scenes[0], transition: "none" }, scenes[1], scenes[2]] }), 360 - 15);
  assert.equal(storyFrames({ defaults: { transitionFrames: 0 }, scenes }), 360);
  assert.equal(storyFrames({ fps: 60, scenes }), 720 - 15 - 15);
  // A transition never outlasts half the shorter neighbor: two 2 s scenes allow 30 frames, not 40.
  const short: Story["scenes"] = [
    { type: "title", title: "A" },
    { type: "title", title: "B" },
  ];
  assert.equal(storyFrames({ defaults: { transitionFrames: 40 }, scenes: short }), 120 - 30);
});

test("captions set a length from their last word", () => {
  assert.equal(captionsSeconds([{ endMs: 1000 }, { endMs: 6400 }], 8), 6.9);
  assert.equal(captionsSeconds([], 8), 8);
});

const valid = {
  theme: "paper",
  scenes: [
    { type: "title", title: "Hello", background: "grid", sfx: "pop" },
    { type: "split", left: { type: "image", src: "a.png" }, right: { type: "text", text: "Hi" } },
  ],
};

function issuePaths(story: unknown) {
  const result = schema.safeParse(story);
  assert.equal(result.success, false);
  return result.error?.issues.map((issue) => issue.path.join("."));
}

test("the story schema accepts a valid story", () => {
  assert.equal(schema.safeParse(valid).success, true);
});

test("story schema errors point at the scene and field", () => {
  assert.deepEqual(issuePaths({ ...valid, theme: "sepia" }), ["theme"]);
  assert.deepEqual(issuePaths({ scenes: [{ type: "title" }] }), ["scenes.0.title"]);
  assert.deepEqual(
    issuePaths({
      scenes: [
        { type: "title", title: "A" },
        { type: "hero", title: "B" },
      ],
    }),
    ["scenes.1.type"],
  );
  assert.deepEqual(issuePaths({ scenes: [{ type: "title", title: "A", transition: "whip" }] }), [
    "scenes.0.transition",
  ]);
  assert.deepEqual(
    issuePaths({
      scenes: [
        {
          type: "split",
          left: { type: "image", src: "a.png", background: "lava" },
          right: { type: "text", text: "Hi" },
        },
      ],
    }),
    ["scenes.0.left.background"],
  );
  assert.deepEqual(issuePaths({ scenes: [] }), ["scenes"]);
});

test("custom scene types are validated with their own schema and timed by their own rule", () => {
  const rule = { type: "map", schema: z.object({ city: z.string() }), duration: () => 3 };
  const withCustom = makeStorySchema(names, [rule]);
  assert.equal(withCustom.safeParse({ scenes: [{ type: "map", city: "Oslo" }] }).success, true);
  const bad = withCustom.safeParse({ scenes: [{ type: "map" }] });
  assert.deepEqual(
    bad.error?.issues.map((issue) => issue.path.join(".")),
    ["scenes.0.city"],
  );
  assert.equal(storyFrames({ scenes: [{ type: "map", city: "Oslo" }] }, [rule]), 90);
});
