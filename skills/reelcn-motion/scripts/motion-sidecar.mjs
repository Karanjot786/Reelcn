#!/usr/bin/env node
// Writes a HyperFrames motion sidecar from a plan, so `hyperframes check` verifies the plan under seek.
// Usage: node motion-sidecar.mjs plan.md scenes.json > index.motion.json
// scenes.json: { "<scene name>": "<selector visible 0.5s into the scene>", "carrier": "<selector>" }
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parsePlan, TOKENS } from "./motion-check.mjs";

/** Splits the carrier selector off the scene map. */
export function splitScenes(map) {
  const { carrier, ...scenes } = map;
  return [scenes, carrier];
}

export function sidecar(plan, scenes, carrier) {
  const heroes = plan.scenes
    .filter((s) => scenes[s.name])
    .map((s) => ({ selector: scenes[s.name], bySec: s.start + 0.5 }));
  const assertions = heroes.map((h) => ({ kind: "appearsBy", selector: h.selector, bySec: h.bySec }));
  for (let i = 1; i < heroes.length; i++)
    assertions.push({ kind: "before", a: heroes[i - 1].selector, b: heroes[i].selector });
  if (carrier) assertions.push({ kind: "staysInFrame", selector: carrier });
  assertions.push({ kind: "keepsMoving", maxStaticSec: TOKENS.targets.sceneStill });
  return { duration: plan.total, assertions };
}

if (import.meta.main ?? process.argv[1] === fileURLToPath(import.meta.url)) {
  const [planPath, scenesPath] = process.argv.slice(2);
  if (!planPath || !scenesPath) {
    console.error("usage: motion-sidecar.mjs plan.md scenes.json > index.motion.json");
    process.exit(2);
  }
  const plan = parsePlan(readFileSync(planPath, "utf8"));
  console.log(JSON.stringify(sidecar(plan, ...splitScenes(JSON.parse(readFileSync(scenesPath, "utf8")))), null, 2));
}
