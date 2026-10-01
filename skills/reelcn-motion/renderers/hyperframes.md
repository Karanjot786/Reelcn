# HyperFrames

HTML, CSS and a paused GSAP timeline, rendered frame by frame in Chrome. Apache-2.0. The proven path for this skill: the starter film was built here.

## Setup

Needs Node 22 or newer, ffmpeg and Chrome.

```bash
node --version && ffmpeg -version | head -1
npx --yes hyperframes@0.8.96 doctor
```

Start from the starter, a full film to adapt. It ships inside this skill:

```bash
cp -R <skill>/starters/hyperframes-launch-film my-film
cd my-film
```

`<skill>` is the folder holding this skill's `SKILL.md`.

For API details load the vendor's `hyperframes-core` and `hyperframes-cli` skills. Treat this as an edit to an existing project so their entry skill skips its interview. Their motion skills (`motion-doctrine`, `cut-the-curve`) are internal; install them with `INSTALL_INTERNAL_SKILLS=1 npx skills add heygen-com/hyperframes` if the user wants them.

## Contract

- One root: `<div id="root" data-composition-id="main" data-width="1920" data-height="1080" data-duration="15">`. The duration equals the plan's `total`.
- One timeline: `gsap.timeline({ paused: true })`, built inside `document.fonts.ready.then(...)`, registered last as `window.__timelines["main"] = tl`.
- Audio: `<audio id="track" src="assets/audio/track.mp3" data-start="0" data-duration="15" data-track-index="10" data-volume="1">`. The `id` is required or the render is silent.
- Fonts: `@font-face` pointing at local files in `assets/fonts/`.

## Patterns in the starter

| Plan idea | Code |
|---|---|
| Carrier | One absolutely placed element tweened across the whole timeline: position, size, radius, fill |
| Typed text | A wrapper with `overflow: hidden` whose `width` tweens with `ease: "steps(N)"`, N letters |
| Counter | `tl.to(obj, { n: 154, onUpdate: () => el.textContent = Math.round(obj.n) })` |
| Cascade | `stagger: { each: 0.046, from: index, grid: [rows, cols] }` |
| Hop on half beats | One `tl.to(carrier, { x, y })` per hop at `start + k * 0.25` |
| Flood inversion | A circle behind the scene scaled from 0 to 28 |
| Restyle wipe | `clipPath: "inset(0 100% 0 0)"` to `"inset(0 0% 0 0)"` |
| Masked line rise | Each line in an `overflow: hidden` row, the inner span tweened with `yPercent` |
| Collapse into a line | `scaleY` to 0.015, then an amber bar tweens to the logo stroke's box |

## Token mapping

| Token | HyperFrames |
|---|---|
| Duration in seconds | GSAP `duration`, and the position parameter for start times |
| Curve | `ease: "power3.out"` for `smooth` arrivals, `"power3.in"` for exits, `"power4.inOut"` for morphs, or `CustomEase` with the token's cubic-bezier |
| Stagger | `stagger: 0.03` to `0.05` |

## Lint rules the starter already follows

- Never set `transform` in CSS on an element GSAP scales or moves. Set the start state with `gsap.set` or `tl.fromTo`.
- Tween `x`, `y` and `scale`, never `left` or `top`.
- Mark masked reveals with `data-layout-allow-overflow`, `data-layout-allow-overlap` and `data-layout-allow-occlusion`.
- Outline text needs a faint fill color, never `transparent`.

## Traps

| Trap | Fix |
|---|---|
| `fromTo` start states apply when the timeline is built, so elements show at frame 0 | `gsap.timeline({ paused: true, defaults: { immediateRender: false } })` |
| A timeline shorter than `data-duration` ends early and the last frames go black | End with `tl.set({}, {}, TOTAL)` |
| `tl.call`, class swaps and values written by several tweens stick when seeking backward | Drive them from one function of time: `tl.fromTo(drv, { t: 0 }, { t: END, duration: END, ease: "none", onUpdate: () => frame(drv.t) }, 0)` |
| Steep eases ending between frames alias | End tweens on multiples of 1/60 s |
| `Math.random`, `Date.now`, CSS `@keyframes` and CSS transitions do not follow the seek | A seeded random, timeline tweens only |
| Two SVGs share a `<defs>` id: the second paints nothing once the first is hidden | Prefix every id with its scene name |
| A `<video>` paints black with several render workers | Render with `--workers 1` when the film has video |
| The rendered audio measures quieter than the track | Remux: `ffmpeg -i out.mp4 -i assets/audio/track.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k out-final.mp4` |
| A box measured after a transform applied | Read `getBoundingClientRect` once before the first tween, and divide out any parent scale |
| `repeat: -1` inside the main timeline | Give every loop a finite `repeat` that ends by the plan total |

## Check and render

```bash
node <skill>/scripts/motion-sidecar.mjs plan.md scenes.json > index.motion.json
npx --yes hyperframes@0.8.96 check --at-transitions --frame-check --snapshots --strict
node <skill>/scripts/motion-track.mjs plan.md assets/audio/track.wav
npx --yes hyperframes@0.8.96 render --fps 60 --quality looks --output out.mp4
node <skill>/scripts/motion-check.mjs out.mp4 plan.md
```

`scenes.json` maps each scene name to the element that must be visible half a second into it, plus `"carrier"`. With the sidecar, `check` verifies the plan under seek: each scene's element appears on time and in order, the carrier stays in frame, nothing freezes past 1.4 seconds. It also catches text overflowing its box, held overlaps, occlusion and low contrast.

`check` must print `Check passed`. Open the crop in `snapshots/` for every finding before fixing it. For a 9:16 film add `--caption-zone "x0=0;y0=.8;x1=1;y1=1;severity=error"`.
