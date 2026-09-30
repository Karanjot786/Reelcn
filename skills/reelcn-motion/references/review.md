# Review

Run the check, then look at the contact sheet. The check measures time. Your eyes judge the frames.

```bash
node scripts/motion-check.mjs out.mp4 plan.md
```

## Reading the output

| Line | Meaning | Fix |
|---|---|---|
| `miss  <beat>: measured still hold 0.80s, plan says 1.5s` | The picture kept moving during the hold | Shorten the entrance or the sequence, or lengthen the beat. If a background moves on purpose, plan the hold as `drift` |
| `miss  file is 14.20s, plan total is 15s` | The render length differs from the plan | Set the composition length from the plan total |
| `miss  the plan has sound, the file has no audio stream` | The render dropped the audio | Check the audio elements and the render flags in the renderer guide |
| `miss  loudness -28 LUFS, target -24 to -12` | The mix is too quiet or too loud | Check volumes against the tokens |
| `warn  <beat>: no clear "pop" in the first 1.0s` | The sound is missing or buried | Check the sound table and its start time |

Flags: `--still` and `--settled` set the motion thresholds for `still` and `drift` holds. `--margin` sets how far a sound must rise above the bed. `--sheet` sets the contact sheet path. Raise `--still` a little when an encoder adds noise to flat color. Never raise it to hide real motion.

## Frame checks

Look at the contact sheet. One frame per beat, taken from the hold.

| Rule | Pass | Fail |
|---|---|---|
| Every frame reads in one glance | One headline, one supporting line | Three sizes of text and a badge |
| Text sits inside the safe area | 5% clear on every edge | A word touching the edge |
| Every element has a home | Cards sit on a grid | A card floating at an angle for good |
| No empty frame | Each hold shows the full scene | A hold frame caught mid-entrance |
| The real thing shows at least once | The product screen, the project image | Only text and shapes in a product film |
| One accent color | The brand color, used for one job | Purple glow, gradient text |

## Motion checks

Step through the video at each cut.

| Rule | Pass | Fail |
|---|---|---|
| One move per element | "The card slides in" | The card fades, slides, scales and blurs |
| Direction holds across a cut | Old scene leaves left, new scene travels left | New scene enters from the left, against the old one |
| Exits are shorter than entrances | 0.35s out, 0.6s in | A slow fade out before every cut |
| Stagger speeds up | Gaps shrink through the sequence | Every gap equal, like a slide deck |
| Stillness before the big beat | Half a second of rest, then the move | The big beat lands mid-motion of something else |
| At most one `bouncy` move | The logo lands with one overshoot | Every card bounces |
| Whole-frame effects are rare | One flash on the big beat | Shake on every cut |

## When a render looks wrong

1. Run the plan check alone: `--plan plan.md`. A plan with a miss produces a video with a miss.
2. Read the first `miss` line only. Fix it. Render again. Later misses often follow from the first.
3. If the check passes and the film still feels off, the cause is in the frame checks or the motion checks above. Name the rule it breaks before you change anything.
