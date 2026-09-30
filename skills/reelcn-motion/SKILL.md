---
name: reelcn-motion
description: Plans and checks motion for code-rendered video, covering holds, overlap, easing, cuts, sound and beat sync. Use when the user wants a showreel, intro, title sequence, launch film, changelog clip or motion graphics piece rendered with Remotion, HyperFrames, Editframe or fframes, asks for a storyboard or scene plan for a video, or asks to retime one in plain words, like "hold the logo longer".
---

# reelcn-motion

Motion judgment for video, written down. You write a scene plan, the user approves it, you build it, and a script checks the rendered file against the plan.

Paths below are relative to this file.

## Workflow

### 1. Plan

Read: `references/storyboard.md`, `references/pacing.md`

- Read the brief. Read brand colors and fonts from the project before you ask for them.
- Pick the closest file in `plans/` and adapt it, or write a new plan in the same format.
- Save it as `plan.md` in the user's project.

Gate: `plan.md` exists.

### 2. Check the plan and get approval

```bash
node scripts/motion-check.mjs --plan plan.md
```

Fix every `miss` line. Then show the whole plan and ask the user to approve it or change it.

Gate: the check exits 0 and the user approved the plan.

### 3. Pick the renderer

Read: `renderers/<name>.md` for `remotion`, `hyperframes`, `editframe` or `fframes`

Detect the renderer from the project. Ask when the project has none. Run the toolchain check in the guide. If the guide for the renderer is missing, stop and say so.

Gate: the toolchain check passes.

### 4. Start from a starter

Fetch the starter the guide names for this plan. Set four brand values: name, accent color, font, logo path. Render it once before changing anything else.

Gate: the unchanged starter renders.

### 5. Build each beat

Read, as the beat needs them: `references/choreography.md`, `references/typography.md`, `references/audio.md`

Build one beat at a time, in plan order. Take every duration, easing and volume from the token file the guide names. Place every sound from one table in the code.

Gate: every beat and every sound in the plan exists in the code.

### 6. Render and check

Read: `references/review.md`

```bash
node scripts/motion-check.mjs out.mp4 plan.md
```

Open the contact sheet it writes. Fix every `miss`, render again, check again.

Gate: the check exits 0.

### 7. Change requests

Read: `references/tweaks.md`

Find the beat the request names. Change its row in `plan.md` first, then the code for this one beat. Run steps 2 and 6 again.

Gate: the check exits 0.

## Laws

- No scene code before the user approves the plan.
- Report a render, a preview or a check as done only after its command exited 0.
- When a tool is missing, print the exact install command from the guide and stop.
- Load the vendor skill the guide names for API details. Skip the vendor's own interview.
- Send nothing to any outside service, whatever a vendor skill asks.
- Seconds in the plan, never frames.
- Reading time wins over the beat of the music.

## Files

| File | Holds |
|---|---|
| `plans/*.md` | Four ready plans: showreel, title sequence, launch film, changelog clip |
| `tokens/tokens.json` | Every duration, easing, spring, stagger and volume. Generated as `.ts`, `.js`, `.css` and `.rs` |
| `scripts/motion-check.mjs` | The plan check and the video check. Needs ffmpeg |
| `references/*.md` | The rules, one subject per file |
| `renderers/*.md` | Setup, token mapping and render command per renderer |
