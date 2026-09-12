// Serves the built registry, scaffolds a fresh Remotion project, installs every item, typechecks and renders.
// Run: node scripts/e2e.ts
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = 3000;
const publicDir = path.resolve("apps/www/public");
const { items } = JSON.parse(readFileSync("registry.json", "utf8")) as { items: { name: string }[] };
if (items.length === 0) throw new Error("registry.json has no items — run pnpm registry:build first");

// ponytail: python3's http.server serves the registry; no hand-rolled static server.
const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", publicDir], { stdio: "ignore" });
const probeUrl = `http://localhost:${PORT}/r/${items[0].name}.json`;
for (let attempt = 0; ; attempt++) {
  try {
    if ((await fetch(probeUrl)).ok) break;
  } catch {
    // the server is still starting
  }
  if (attempt > 40) throw new Error(`registry server did not start on port ${PORT}`);
  await new Promise((resolve) => setTimeout(resolve, 250));
}
console.log(`serving ${publicDir} on http://localhost:${PORT}`);

const workDir = mkdtempSync(path.join(tmpdir(), "reelcn-e2e-"));
const project = path.join(workDir, "app");
const run = (command: string, args: string[], cwd: string) =>
  execFileSync(command, args, { cwd, stdio: "inherit", env: { ...process.env, CI: "1" } });

try {
  run("npx", ["--yes", "create-video@latest", "--yes", "--blank", "--no-tailwind", project], workDir);
  run(
    "npx",
    ["--yes", "shadcn@4.21.0", "add", "--yes", ...items.map((item) => `http://localhost:${PORT}/r/${item.name}.json`)],
    project,
  );

  // A composition that exercises every installed item, written the way a user would write it.
  writeFileSync(
    path.join(project, "src", "reelcn-probe.tsx"),
    `import { Composition, registerRoot, Sequence } from "remotion";
import { Animate } from "./reelcn/animate";
import { Center, Stage, ThemeProvider } from "./reelcn/core";
import { LowerThird } from "./reelcn/lower-third";
import { TextReveal } from "./reelcn/text-reveal";

const Probe = () => (
  <ThemeProvider theme="paper">
    <Stage>
      <Center>
        <TextReveal text="reelcn installs clean" accentWords={["clean"]} />
      </Center>
      <Sequence durationInFrames={45}>
        <LowerThird name="Ada Lovelace" title="Founder" variant="card" />
      </Sequence>
      <Animate effect="pop" delay={10}>
        <div style={{ width: 10, height: 10 }} />
      </Animate>
    </Stage>
  </ThemeProvider>
);

registerRoot(() => (
  <Composition id="probe" component={Probe} durationInFrames={60} fps={30} width={1080} height={1920} />
));
`,
  );

  run("npx", ["tsc", "--noEmit"], project);
  // ponytail: the --blank template sets Config.setRspack(true), and in Remotion 4.0.523 that bundle never emits
  // bundle.js here — the template's own composition fails the same way. Drop the flag once upstream renders again.
  run(
    "npx",
    ["remotion", "still", "src/reelcn-probe.tsx", "probe", "probe.png", "--frame=30", "--no-rspack", "--log=error"],
    project,
  );
  // Frame 30: the headline has entered and the lower third is still on screen, so the still shows every item.
  if (!existsSync(path.join(project, "probe.png"))) throw new Error("probe.png was not written");
  console.log(`e2e PASS — ${items.length} items installed, typechecked and rendered in ${project}`);
} finally {
  server.kill();
}
