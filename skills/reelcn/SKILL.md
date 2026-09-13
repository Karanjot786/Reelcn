---
name: reelcn
description: Plans, builds and renders videos in a Remotion project with reelcn components, templates and JSON storyboards. Use when the user wants a product demo, launch video, short, reel, YouTube intro or outro, podcast clip, captioned talking head, data video or coding tutorial made with Remotion, or mentions reelcn.
---

# reelcn

reelcn is a shadcn registry of Remotion components. Items install as source files into `src/reelcn/`.
- `catalog.md`, next to this file, lists every item with its length, use and avoid notes.
- Its first line gives the live `llms.txt` URL, which is always current.
- `<BASE>` below is the URL in that line, without `/llms.txt`.

## Workflow

1. **Name the video type.** Match the request to a file in `archetypes/`:

   | Request | Archetype |
   |---|---|
   | new product, major release | `product-launch.md` |
   | one feature, vertical short | `feature-short.md` |
   | release notes, "what's new" | `changelog.md` |
   | how-to for a developer tool | `tutorial.md` |
   | podcast episode or segment | `podcast-clip.md` |
   | recorded person talking, captions | `talking-head-short.md` |
   | results, metrics, research | `data-story.md` |
   | channel opener | `youtube-intro.md` |

   If nothing matches, use the storyboard (step 2b) and pick scenes from the catalog.

2. **Take the lightest path.**
   - **a. A template fits.** Run `npx shadcn@latest add <BASE>/r/<template>.json`. Register the `<Composition>` exactly as its `@example` shows, then set the props.
   - **b. No template fits.** Add `storyboard` and write a story JSON with the scene types in `catalog.md` under templates. Render it with `--props=story.json`.
   - **c. A scene neither can express.** Build it in JSX from catalog items and register it with `defineScene`, so the rest of the video stays JSON.

3. **Brand it.**
   - Set `theme` to one of the presets listed in `catalog.md`.
   - Put the brand color in `brand.accent`, the logo in `brand.logo`, and the heading font in `brand.font`.
   - Use one accent color. Never hard-code colors in props when a theme token exists.

4. **Pick the format.**
   - 16:9 (1920×1080) for YouTube and websites.
   - 9:16 (1080×1920) for Shorts, Reels and TikTok.
   - 1:1 (1080×1080) for feeds.

   The same props render every format, so only change the composition's `width` and `height`.

5. **Review before rendering.** Install `contact-sheet` and run `node scripts/reelcn-contact-sheet.ts <CompositionId> --frames 9`. Open the PNG and check:
   - text is inside the safe zones
   - nothing is clipped at 9:16
   - every scene reads at a glance
   - no frame is empty

   Fix, then render the sheet again.

6. **Check determinism.** Install `check-determinism` and run `node scripts/reelcn-check-determinism.ts`. It must print no findings.

7. **Render.** Run `npx remotion render <CompositionId> out/video.mp4`, adding `--props=story.json` for storyboards.

## Rules

**Formats and safe zones**
- Keep text inside `useViewport().safe`. In 9:16, the bottom 20% belongs to the platform UI.
- Size everything with `u()`. Never read `useVideoConfig().width` or `.height` inside components.

**Motion**
- One idea per scene.
- Let items exit on their own: they fade out at the end of their `Sequence`. Do not add manual exits.
- Hold a finished frame for at least 1 second before a transition.
- Use one or two transition styles per video, at 10 to 20 frames each.
- Let lengths come from content. Use `calculateMetadata` from the template or storyboard; never guess `durationInFrames`.

**Design**
- Sentence case. At most 12 words on screen per text scene in shorts.
- Numbers beat adjectives: "4,200 teams", not "thousands of happy teams".
- No gradient text, glow or extra shadows unless the item draws them itself.
- No emoji. Fonts differ between machines.

**Determinism**
- No `Math.random` (use `random(seed)` from `remotion`), `Date.now`, `new Date()` without an argument, or CSS animations and transitions.

**Captions and audio**
- Captions: run `node scripts/reelcn-transcribe.ts talk.mp4` after installing `transcribe`, and pass the JSON to `captions`.
- Sound effects are named (see `sfx` in the catalog). For offline renders, run `sfx-pull` first.
- Keep music at 0.2 to 0.3 volume under a voice.
