# Review

Run the check, then look at the contact sheet and the starter's film side by side.

```bash
node scripts/motion-check.mjs out.mp4 plan.md
```

## Reading the output

| Line | Meaning | Fix |
|---|---|---|
| `miss  32% of frames move, the target is 45%` | The film reads as slides | Give each scene's read a live motion: a push, a counter, a playhead, a hop |
| `miss  <scene>: still for 2.10s at 6.40s` | A frozen stretch in the named scene | Add live motion there, or shorten the hold |
| `miss  30 fps, render at 50 or more` | The render ran at a low frame rate | Render at 60 fps with the guide's command |
| `miss  loudness -21 LUFS` | The mix is quiet | Generate the track with `motion-track.mjs`, or raise the music |
| `miss  the plan has music, the file has no audio stream` | The render dropped the audio | Check the audio element and the guide's render flags |
| `miss  file is 14.20s, plan total is 15s` | Length differs | Set the composition length from the plan total |

`--moving` sets the energy under which a frame counts as still. Leave it at the default.

## Frame checks

| Rule | Pass | Fail |
|---|---|---|
| Real material | The product, its renders, its numbers | Grey boxes with text |
| One accent | The brand color, carried by the carrier | Several accent colors |
| Scale contrast | Small labels and full-frame words in one film | Every text the same size |
| Every element has a home | Tiles on a grid, words centered | A card floating at an angle |
| The carrier is visible at each join | You follow one element across scenes | Scenes appear from nothing |

## Motion checks

Step through each join at full speed and at quarter speed.

| Rule | Pass | Fail |
|---|---|---|
| Continuous | The old scene becomes the new one | Fade to empty, fade in the next |
| Meaning | Each move says what the word or thing is | The same slide-in everywhere |
| On the beat | Hops and stamps land with the drums | Events drift off the grid |
| Stillness is rare | A second of rest before the final hit | Two seconds of nothing mid-film |
