// Serves the built registry, scaffolds a fresh Remotion project, installs every item, typechecks and renders.
// Run: node scripts/e2e.ts
import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = 3000;
const localBase = `http://localhost:${PORT}`;
const { homepage, items } = JSON.parse(readFileSync("registry.json", "utf8")) as {
  homepage: string;
  items: { name: string; categories: string[] }[];
};
if (items.length === 0) throw new Error("registry.json has no items — run pnpm registry:build first");

// e2e must stay offline (spec §7): the committed public/r/*.json files bake in registry.homepage, which is
// reelcn.dev once the domain switches. Serve a copy with every occurrence of that URL rewritten to localhost,
// so shadcn's registryDependencies resolve here instead of over the network.
const publicDir = mkdtempSync(path.join(tmpdir(), "reelcn-e2e-public-"));
cpSync(path.resolve("apps/www/public"), publicDir, { recursive: true });
const registryDir = path.join(publicDir, "r");
for (const file of readdirSync(registryDir)) {
  const filePath = path.join(registryDir, file);
  writeFileSync(filePath, readFileSync(filePath, "utf8").split(homepage).join(localBase));
}

// ponytail: python3's http.server serves the registry; no hand-rolled static server.
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", publicDir], {
  stdio: "ignore",
});
const probeUrl = `${localBase}/r/${items[0].name}.json`;
for (let attempt = 0; ; attempt++) {
  try {
    if ((await fetch(probeUrl)).ok) break;
  } catch {
    // the server is still starting
  }
  if (attempt > 40) throw new Error(`registry server did not start on port ${PORT}`);
  await new Promise((resolve) => setTimeout(resolve, 250));
}
console.log(`serving ${publicDir} (rewritten from ${homepage}) on ${localBase}`);

const workDir = mkdtempSync(path.join(tmpdir(), "reelcn-e2e-"));
const project = path.join(workDir, "app");
const run = (command: string, args: string[], cwd: string) =>
  execFileSync(command, args, { cwd, stdio: "inherit", env: { ...process.env, CI: "1" } });

try {
  run("npx", ["--yes", "create-video@latest", "--yes", "--blank", "--no-tailwind", project], workDir);
  run(
    "npx",
    ["--yes", "shadcn@4.21.0", "add", "--yes", ...items.map((item) => `${localBase}/r/${item.name}.json`)],
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

  // One composition per template, exactly as each template's @example registers it, so the typecheck below covers
  // them and the loop after it renders one still of each. Export names follow the item name: product-launch →
  // ProductLaunch, productLaunchSchema, productLaunchDefaults, productLaunchMetadata.
  const pascal = (name: string) => name.replace(/(^|-)([a-z])/g, (_, _dash, letter: string) => letter.toUpperCase());
  const camel = (name: string) => pascal(name).replace(/^./, (letter) => letter.toLowerCase());
  const templates = items
    .filter((item) => item.categories[0] === "templates" && item.name !== "storyboard")
    .map((item) => item.name);
  const size = "width={1080} height={1080} fps={30} durationInFrames={1}";
  writeFileSync(
    path.join(project, "src", "reelcn-templates.tsx"),
    `import { Composition, registerRoot } from "remotion";
import { StoryVideo, storyMetadata, storySchema } from "./reelcn/storyboard";
${templates
  .map(
    (name) =>
      `import { ${pascal(name)}, ${camel(name)}Defaults, ${camel(name)}Metadata, ${camel(name)}Schema } from "./reelcn/${name}";`,
  )
  .join("\n")}

registerRoot(() => (
  <>
    <Composition id="Storyboard" component={StoryVideo} schema={storySchema} calculateMetadata={storyMetadata} defaultProps={{ scenes: [{ type: "title", title: "Nightly check" }, { type: "stat", label: "Items installed", value: ${items.length} }] }} ${size} />
${templates
  .map(
    (name) =>
      `    <Composition id="${pascal(name)}" component={${pascal(name)}} schema={${camel(name)}Schema} defaultProps={${camel(name)}Defaults} calculateMetadata={${camel(name)}Metadata} ${size} />`,
  )
  .join("\n")}
  </>
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
  // ponytail: one `remotion still` per template re-bundles each time (~15 bundles). Fine nightly; switch to
  // @remotion/renderer with one bundle if this job grows past its timeout.
  mkdirSync(path.join(project, "stills"), { recursive: true });
  for (const id of ["Storyboard", ...templates.map(pascal)]) {
    run(
      "npx",
      [
        "remotion",
        "still",
        "src/reelcn-templates.tsx",
        id,
        `stills/${id}.png`,
        "--frame=20",
        "--no-rspack",
        "--log=error",
      ],
      project,
    );
    if (!existsSync(path.join(project, "stills", `${id}.png`))) throw new Error(`stills/${id}.png was not written`);
  }
  console.log(
    `e2e PASS — ${items.length} items installed and typechecked, probe + ${templates.length + 1} template stills rendered in ${project}`,
  );
} finally {
  server.kill();
}
