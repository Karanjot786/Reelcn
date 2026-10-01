# fframes

Rust that returns one SVG per frame, encoded by ffmpeg. Use it when the user wants Rust or a native binary. MIT; the h264 output links GPL ffmpeg through the `libav-agree-gpl` feature.

## Setup

```bash
rustc --version || echo "install Rust from https://rustup.rs"
brew install pkg-config ffmpeg x264 x265 opus nasm ninja
cargo install --locked cargo-fframes@1.1.0
cp -R <skill>/starters/fframes-launch-film my-film && cd my-film && cargo build --release
```

The first build takes about 3 minutes on an Apple M1. After that the starter renders its 15 seconds in about 10 seconds on the GPU (Metal on macOS, Vulkan on Linux and Windows). With no GPU, create the project with `cargo fframes new <name> --backend cpu`: it builds in about 90 seconds and has no preview window. The spike rendered 3 seconds in 1.1 seconds on the CPU. Vendor skill: https://github.com/dmtrKovalenko/fframes/tree/main/skills/fframes-video.

## Contract

- One `Video` at 1920 by 1080, `FPS = 60`, `duration` of `Duration::Seconds(15.0)`.
- `render_frame` builds one SVG from the time `t`. Every moving value is `track(t, from, &segments)` from `src/motion.rs`.
- Sound through `AudioMap` with one `AudioTrack` for `audio/track.mp3`, which `main.rs` loads at run time.
- Fonts (TTF) and images live at the top level of `media/` and are compiled into the binary.

## Patterns

| HyperFrames | fframes |
|---|---|
| An element's CSS `left`, `top`, `width`, `height`, `border-radius`, `background` | An SVG `<rect>` (or `<g transform>` for groups) with the same numbers |
| `gsap.set(sel, { prop: v })` or the CSS value | the `from` argument of that property's `track` call |
| `tl.to(sel, { prop: v, duration: d, ease: e }, at)` | one `seg(at, d, v, <Ease>)` in that element's array for `prop`, in timeline order |
| `tl.fromTo(sel, { prop: a }, { prop: b, ... }, at)` | `Seg { at, dur, to: b, ease, from: Some(a) }` |
| `stagger: 0.05` | item `i`'s segments start at `at + 0.05 * i` |
| An `overflow: hidden` wrapper whose `width` tweens | a `clipPath` rect whose width is the tracked value |
| `filter: blur(Npx)` | `filter="url(#id)"` with a tracked `feGaussianBlur stdDeviation` |
| `opacity`, `x`, `y`, `scale` | the `opacity` attribute and a `translate(...) scale(...)` transform; scale about a point by translating `p * (1 - s)` |
| A counter set in `onUpdate` | `{track(t, 0.0, &COUNT).round().to_string()}` |
| `repeat: 1, yoyo: true` | two segments: to the value, then back to the start |
| No `ease` given | GSAP's default, `Ease::Out(1)` |
| `offsetWidth` of text | `frame.text_width(ctx, font, text)` with the same font |

| Plan idea | fframes |
|---|---|
| Carrier | One `<rect>` whose x, y, width, height and rx are tracked across the whole film |
| Typed text | A `clipPath` rect whose width steps with `Ease::Steps(letters)` |
| Counter | `track(t, 0.0, &COUNT).round()` as text |
| Cascade | Per-tile segments starting at `at + each * max(columns, count / columns) * distance / farthest distance`, as GSAP spreads a grid stagger |
| Flood | A circle centred on the carrier with a tracked radius |
| Restyle wipe | A `clipPath` rect growing from the left |
| Collapse into a line | A rect whose height tracks to about 1.5% of its start |

## Traps

| Trap | Fix |
|---|---|
| A `.woff2` file in `media/` stops the build: "File type is not supported" | Convert to TTF: `uvx --from fonttools --with brotli fonttools ttLib.woff2 decompress font.woff2` |
| Text falls back to another font: `inspect` reports "No match for ... font-family" | Use the family name the TTF declares, for example "IBM Plex Mono Medium" |
| Files in subfolders of `media/` are not embedded | Keep images at the top level; prefix names to keep them apart (`thumb-`, `still-`) |
| `pathLength="1"` is ignored, so a stroke draws whole | Set `stroke-dasharray` to the path's real length and scale the offset by it |
| Music in `media/` plays in mono | Load it at run time from `audio/` with `MediaDirectory` and a `CombinedMediaProvider`, in `main.rs` and in the frame tests |
| The film comes out about 1.6 dB louder than the track | `.gain_db(-1.6)` on the track, then check with `audio analyze` |
| A circle with `r = 0` or a zero-width rect is skipped with a warning | Grow from a hairline: `.max(0.01)` |
| A grid stagger timed at `each` per cell runs too fast | GSAP spreads `each * max(columns, count / columns)` across the farthest distance |
| Text that enters from off the frame fails the template's frame test | Allow that clipping only for the frames where it enters, in `tests/frames.rs` |

## Check and render

```bash
cargo run --release -- inspect
cargo run --release -- strip all -n 12
cargo run --release -- render -o out.mp4
node <skill>/scripts/motion-check.mjs out.mp4 plan.md
```

`inspect` is the layout audit: fix every error it reports. `strip` and `onion` show motion without a full render.
