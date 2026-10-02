# Remotion

React components rendered frame by frame in Chrome. Use it when the project already uses Remotion or the user asks for it. Remotion is free for individuals and companies of three or fewer; above that, see https://www.remotion.dev/license.

## Setup

Needs Node 22 or newer and ffmpeg. Remotion downloads its own Chrome on first render. The starter renders in about 30 seconds on an Apple silicon laptop.

```bash
node --version && ffmpeg -version | head -1
cp -R <skill>/starters/remotion-launch-film my-film && cd my-film && npm install
```

This copies a working project with the reelcn launch film inside, as a reference. Keep its setup and its clock (`src/LaunchFilm.tsx`); replace `src/film.ts` and `public/assets/` with a new film built from your plan. Never ship the launch film's scenes with new words and images.

For API details load the vendor's `remotion-best-practices` skill: https://github.com/remotion-dev/skills.

## Contract

- One composition: `<Composition id="LaunchFilm" component={LaunchFilm} durationInFrames={total * 60} fps={60} width={1920} height={1080} />`.
- The film's look and motion live in `src/film.ts`: `CSS`, `MARKUP`, and `build(root)`, which returns one paused GSAP timeline.
- `src/LaunchFilm.tsx` holds the render with `delayRender` until fonts load, builds the timeline once, and seeks it to `frame / fps` on every frame.
- Sound: `<Audio src={staticFile("assets/audio/track.mp3")} />`.

To use the film in an existing Remotion project: copy `src/film.ts`, `src/LaunchFilm.tsx` and `public/assets/`, add `gsap@3.14.2`, and register `<Composition id="LaunchFilm" component={LaunchFilm} durationInFrames={900} fps={60} width={1920} height={1080} />` in your root.

## Patterns

The film's code is the HyperFrames timeline, so the patterns table in `hyperframes.md` applies unchanged. For new scenes written as React components instead:

| Token | Remotion |
|---|---|
| Seconds | `Math.round(seconds * fps)` frames |
| `smooth`, `snappy`, `gentle`, `exit` | `Easing.bezier(...)` with the values in `tokens/tokens.ts` |
| Spring | `spring({ frame, fps, config: { damping: 15, stiffness: 170, mass: 0.9 } })` |
| One tween | `interpolate(frame, [start, end], [from, to], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" })` |

## Traps

| Trap | Fix |
|---|---|
| Measuring text before fonts load gives wrong widths | Build the timeline after `document.fonts.ready`, inside `delayRender` |
| Every frame renders as frame 0: the first capture happens before React re-renders with the timeline | Seek the new timeline to the current frame before `continueRender` |
| The film shows its unanimated markup: React re-applies `dangerouslySetInnerHTML` when its object changes, which wipes what GSAP built | Create the `{ __html }` object once at module level |
| Images the script creates with `assets/` paths return 404 | Point them at `staticFile("assets")` after `build`, and wait for `img.decode()` before `continueRender` |
| Two tweens set one property at the same time, and the result depends on the order frames are seeked: Remotion and HyperFrames differ for a few frames | Never overlap two tweens on one property. Hand off with the first ending where the second starts |

## Check and render

```bash
node <skill>/scripts/motion-track.mjs cues.json public/assets/audio/track.wav
npx remotion render LaunchFilm out.mp4
node <skill>/scripts/motion-check.mjs out.mp4 plan.md
```

Remotion has no layout audit like HyperFrames' `check`. Read the scene sheet and the join strips that `motion-check` writes for overlap, clipping and text off the frame.

4K: add `--scale 2` to `render`. For 2K, downscale that file as the 2K row in `renderers/hyperframes.md` shows.
