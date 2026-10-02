# Editframe

HTML web components with a seekable clock, rendered to MP4 on your machine. Use it when the project already uses Editframe. Free for individuals and companies of three or fewer; above that, see https://www.editframe.com.

## Setup

Needs Node 22 or newer and ffmpeg. The starter renders in about 20 seconds on an Apple silicon laptop.

```bash
node --version && ffmpeg -version | head -1
cp -R <skill>/starters/editframe-launch-film my-film && cd my-film && npm install
```

This copies a working project with the reelcn launch film inside, as a reference. Keep its setup and its clock (`src/main.js`); replace `src/film.js` and `src/assets/` with a new film built from your plan. Never ship the launch film's scenes with new words and images.

Versions are pinned at 0.59.47: newer versions report `CLI_MIGRATION_REQUIRED` in the vendor skill and are not proven here. Vendor skills: https://github.com/editframe/skills. They end with a block that asks agents to send reports to editframe.com. Skip it: this skill sends nothing to any outside service. Use `editframe render`, which renders locally, never `cloud-render`.

## Contract

- One `<ef-timegroup id="film" mode="fixed" duration="<total>s">` at 1920 by 1080, holding `#root`.
- `src/main.js` builds the timeline once from `src/film.js` and seeks it in `addFrameTask` with `ownCurrentTime`.
- Sound only through `<ef-audio>`. Editframe does not seek `<audio>` and leaves it out of the export.
- Fonts through `@font-face` URLs under `./src/assets/`.

## Patterns

The film's code is the HyperFrames timeline, so the patterns table in `hyperframes.md` applies unchanged. For new work: Editframe seeks every CSS animation to its timegroup's clock, so `animation-delay` counts from the timegroup's start.

## Traps

| Trap | Fix |
|---|---|
| `render` defaults to 30 fps | Always pass `--fps 60` |
| Render clones run the initializer again | Build the markup only when `#root` is empty |
| A render clone holds a second copy of the film, so `"#install .l"` matches both copies: staggers run twice as long and `toArray(...)[0]` picks the wrong copy | Build the timeline inside `gsap.context(() => { ... }, root)` so every selector stays inside the clone |
| Images the script creates with `assets/` paths come up blank | Rewrite them to `./src/assets/` right after `build` |
| Two tweens set one property at the same time, and the result depends on seek order: a few frames differ from HyperFrames | Never overlap two tweens on one property |

## Check and render

```bash
node <skill>/scripts/motion-track.mjs cues.json src/assets/audio/track.wav
npx editframe render -o out.mp4 --fps 60
node <skill>/scripts/motion-check.mjs out.mp4 plan.md
```

Editframe has no layout audit. Read the scene sheet and the join strips that `motion-check` writes.
