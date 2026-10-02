# Storyboard

A plan is a markdown file: header lines, then one table with one row per scene. The user reads it, you build from it, and both scripts read it.

## Header

```
idea: the bakery's chalkboard menu becomes the stage, one dish chalked in per scene
refuses: a slideshow of food photos, a price list and a call to action
signature: the chalk stroke under the last dish wipes clean and redraws as the bakery's logo on the final hit
feel: warm, playful
tempo: 120
carrier: the chalk stroke, which underlines each dish, rings the price and becomes the logo's outline
music: generated
total: 15
```

| Line | Write |
|---|---|
| `idea` | One visual metaphor for this film, taken from a named thing in the material: "his site's command palette becomes the stage" |
| `refuses` | The category default this film avoids: "a slideshow of logo, feature cards, CTA" |
| `signature` | One move invented for this film. It lands once, at the drop or the final hit. Never a move name from `moves.md` |
| `feel` | Two or three adjectives, like "calm, exact" or "loud, playful". The curves follow it, as `looks.md` says |
| `look` | A look name from `looks.md`, or the brand's own. Optional |
| `tempo` | Beats per minute. 120 suits most launch films. 100 suits a calm title sequence |
| `carrier` | The one element surviving every scene change, and what it becomes along the way. It comes from the subject's own shape |
| `music` | `generated` for a track from `motion-track.mjs`, a file with its tempo and offset like `track.mp3 124 0.08`, or `none` |
| `total` | Length in seconds |
| `aspect` | `16:9` (default), `9:16` or `1:1`. Optional |
| `quality` | Export size: `1080p` (default), `2K` or `4K`. The 1080p render stays the master `motion-check` judges. Optional |

The carrier comes from the subject's own shape: its logo stroke, its cursor, its track, its page edge. Never a starter's caret, box or playhead unless the material has one.

Live motion changes information: a count, a playhead, a cursor, a hop. A glow, a pulse or grain alone is idle and fails the check.

## Table

| Column | Write |
|---|---|
| `scene` | A short name |
| `start` | Seconds from the start. Every start sits on a beat |
| `length` | Seconds, between 0.8 and 3.5 |
| `shows` | The real material on screen: which screenshot, which render, which number, which logo |
| `words` | The exact words in double quotes, or `none` |
| `move` | How the main element moves and why. "Types at human speed", not "fades in" |
| `live` | What keeps moving while the words are read. `none` is allowed once, on a short scene |
| `carrier` | What the carrier is in this scene, and how it arrives or leaves |
| `sound` | Cues from: `intro`, `typing`, `ticks`, `build`, `beat`, `drop`, `gap`, `hit`, `whoosh`, `blip`, `riser`, `scan`, `final`, `none` |
| `join` | How this scene becomes the next: `morph`, `match`, `whip`, `zoom-through`, `wipe`, `flood`, `cut`, or `end` on the last scene |

Never write `|` inside a cell.

## Shape of a film

- A hook in the first 2 seconds: the product at work, the command, the name. Never a logo sting or a "welcome".
- A build of 1.5 to 2 seconds, then a drop near a quarter of the way in, where the music and the busiest picture start together.
- The middle shows the product doing its job, one idea per scene.
- The final hit lands about 2 seconds before the end. The lockup holds with light motion to the last frame.
- At least one scene every 2.5 seconds: 6 scenes in a 15 second film.

## Approval

Show the full plan, header and table, with the idea line first. Ask: "Approve this plan, or tell me what to change." Write no scene code before the answer.
