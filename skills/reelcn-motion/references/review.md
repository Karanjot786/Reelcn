# Review

Run the check, then look at the contact sheet and the starter's film side by side.

```bash
node scripts/motion-check.mjs out.mp4 plan.md
```

## Reading the output

| Line | Meaning | Fix |
|---|---|---|
| `miss  42% of frames move, the target is 60%` | The film reads as slides | Give each scene's read a live motion: a push, a counter, a playhead, a hop |
| `miss  <scene>: still for 2.10s at 6.40s` | A frozen stretch in the named scene | Add live motion there, or shorten the hold |
| `miss  30 fps, render at 50 or more` | The render ran at a low frame rate | Render at 60 fps with the guide's command |
| `miss  loudness -21 LUFS` | The mix is quiet | Generate the track with `motion-track.mjs`, or raise the music |
| `miss  the plan has music, the file has no audio stream` | The render dropped the audio | Check the audio element and the guide's render flags |
| `miss  file is 14.20s, plan total is 15s` | Length differs | Set the composition length from the plan total |
| `miss  single-frame flash at 4.02s` | Something shows for one frame | Find the tween that starts or ends there: usually a `fromTo` start state or an `opacity` set one frame early |
| `warn  <scene>: the hit at 4s has no picture event` | The sound lands on nothing | Put a stamp, reshape or cut on that beat, or drop the cue |
| `warn  <scene>: the picture lands 0.15s from its hit` | Sound and picture drift | Move the tween so its fastest frame sits on the beat |

The check compares frames 125 ms apart after a slight blur. A slow push counts as motion. Grain does not.

`--moving` sets the energy under which a frame counts as still. Leave it at the default.

## Join strips

The check writes one row of ten frames around each join, 1/60 s apart. Read each row left to right:

| Pass | Fail |
|---|---|
| One scene becoming the next through the carrier | Two scenes stacked at half opacity, grey and muddy |
| The old scene's elements gone or moving out | An old label or number sitting on the new scene |
| One continuous move across the ten frames | A move that stops dead, then a second move starts |
| Every frame differs a little from the next | Five identical frames, then a jump |

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

## Fresh review

You built the film, so you are the wrong judge of it. After the check passes:

1. Copy into a new folder only: `plan.md`, the scene sheet, the join strips, and the same sheets from the previous version if there is one. No code.
2. Start a new subagent with no history. Give it the folder, this file's frame and motion checks, and `references/slop.md`. Ask: "Which version is better on each check, and what is the biggest fault in the newer one?" Ask it to quote three pieces of on-screen text it read; if two are not in `plan.md`, discard the review and run it again.
3. Run it twice with the two versions in swapped order. Keep the new version only if it wins both times.
4. Fix the biggest fault. After three rounds, show the user the best version and its open faults.

A reviewer prefers busy frames. The plan check, the material rule and `slop.md` guard against busy fakes; never drop them to win a review.
