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

## Check and render

```bash
npx --yes hyperframes@0.8.96 check
node scripts/motion-track.mjs plan.md assets/audio/track.wav
npx --yes hyperframes@0.8.96 render --fps 60 --quality looks --output out.mp4
node <skill>/scripts/motion-check.mjs out.mp4 plan.md
```

`check` must print `Check passed` before rendering. Copy `motion-track.mjs` and `motion-check.mjs` from the skill's `scripts/` folder, or run them from there.
