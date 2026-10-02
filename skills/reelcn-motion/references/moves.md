# Moves

One recipe per move in `choreography.md`. Copy the `Check at` lines of every move you use into your review notes and verify each on the frames after the render. Change a recipe's skin (colors, fonts, radius) to fit the brand. Keep its core (timing, curve, proportions).

## Typed command

Timing: 12 to 31 characters per second, `ease: "steps(N)"` with N letters. The launch film types 37 letters in 1.2s. The caret walks with each letter and blinks only while the line waits.
Pitfalls: per-letter opacity tweens flicker under seek; reveal by width. A command that is not the product's real command is a fake terminal: take it from material.md.
Check at: halfway through the typing, the caret sits right after the last letter shown. The last frame shows the whole command on one line.

## Cascade

Timing: stagger 0.03 to 0.05s, nearest first, the whole group landed within 0.5s. Each tile 0.34s on `power3.out`. Hold the full board 0.5s before it changes.
Pitfalls: an even stagger from a corner reads mechanical; start from a seed point. Starting at `scale: 0` looks cheap; start at 0.55 or more with opacity.
Check at: one frame mid-cascade shows a clear wavefront from the source point.

## Selection hop

Timing: one hop per half beat (0.25s at 120 BPM), each hop 0.12 to 0.2s on `power4.out`.
Pitfalls: hops off the beat feel loose; place hop k at `start + k * 30 / tempo`.
Check at: on each half beat the box frames one item exactly, edges aligned.

## Roll-up

Timing: the count runs the whole read on `power2.out` and stops 0.2s before the join. Its bar or chart grows on the same curve.
Pitfalls: proportional digits shift the line; use `tabular-nums`. A number not in material.md fails the plan check.
Check at: at half the roll the number is past half its final value and the bar matches it.

## Reshape

Timing: the frame changes format on a beat in 0.32 to 0.5s on `power4.inOut`; content refits on the same curve.
Pitfalls: content that refits after the frame lands reads as two gestures. Run them together.
Check at: mid-reshape, the content sits inside the frame on every edge.

## Restyle wipe

Timing: 0.34 to 0.5s per theme, one per beat, `clipPath` from `inset(0 100% 0 0)` to `inset(0 0% 0 0)`.
Pitfalls: mismatched units in the two `inset()` values do not tween. Two themes whose midpoint goes grey read as a fade.
Check at: mid-wipe, the edge is one clean vertical line.

## Speed

Timing: arrive in 0.15 to 0.25s with blur up to 20px at the fastest frame and back to 0 at rest; stop hard.
Pitfalls: blur left on after the stop reads as out of focus. Never bounce the exit.
Check at: the rest frame is sharp.

## Focus pull

Timing: 0.5 to 0.8s from an 8 to 16px blur to 0 on `power3.out`, with a scale from 1.04 to 1.
Pitfalls: the read starting while the word is still soft.
Check at: the read's first frame is fully sharp.

## Letter drop

Timing: letters about 0.03s apart (0.028s in the launch film), each falling from well above with a 10px blur, 0.24s on `power4.out`.
Pitfalls: letters still moving while read. The word settles; then live motion carries the read.
Check at: all letters at rest by the word's first beat.

## Fill sweep

Timing: the fill runs 0.4 to 0.8s on `ease: "none"` with a scan line at its edge and a frame counter beside it.
Pitfalls: a scan line that outruns the fill. Drive both from one tween.
Check at: mid-sweep, the scan line sits exactly on the fill's edge.

## Collapse to logo

Timing: the last word squashes to a line (`scaleY` near 0.015) in 0.2s, the line travels to the logo stroke in 0.28s, the logo draws in 0.5s. The wordmark holds at least 1s.
Pitfalls: a pause between the line arriving and the logo drawing reads as two moves. Start the draw on the frame the line lands.
Check at: one frame shows the line already part of the logo's outline.

## Flood

Timing: a circle from the carrier scales to cover the frame in 0.45 to 0.7s on `power3.inOut`; the new background lands on a beat.
Pitfalls: a flood that starts away from the carrier breaks the shot. Old-scene content left on the new color.
Check at: the flood's centre is the carrier; the frame after it shows no old-scene element.

## Checklist tick

Timing: one line per beat. The tick draws as a stroke in 0.2 to 0.3s on `power3.out`, then the line's text brightens from about half opacity to full.
Pitfalls: ticking every line at once reads as a slide. A tick with no sound under it feels weak; give it the `ticks` cue.
Check at: between two ticks, the done lines are bright and the next line is still dim.

## Punch-in

Timing: the whole frame scales 1.12 to 1.18 in 0.15 to 0.2s on `power3.out`, centred on the key line, then holds while a slow push continues. Use it once or twice a film, on the line the viewer must remember.
Pitfalls: a punch-in on every scene stops meaning anything. Text near the edge leaves the safe area after the zoom.
Check at: after the zoom, the key line still sits inside the safe area and is fully sharp.

## Reframe

Timing: the full-frame layer shrinks to a rounded card in 0.4 to 0.5s on `power4.inOut` while the next element lands beside it on the same curve.
Pitfalls: a card that shrinks and then waits before the new element arrives reads as two moves. The card's corner radius must grow with the shrink, not snap.
Check at: mid-reframe, the card's content stays in proportion and the new element is already moving.

## Screenshot zoom

Timing: hold the full screenshot for about 0.5s so the viewer sees where they are, then push and pan to the part that matters in 0.5 to 0.7s on `power3.inOut`. A callout box draws around it and a short line of text lands beside it. The next zoom starts from the current position, never from the full view again.
Pitfalls: redrawing the screenshot instead of using it. Zooming so far that the pixels blur: keep the crop at the screenshot's own resolution or above. A callout with no words says nothing.
Check at: at the end of each push, the number, chart or button fills the frame's middle third and is sharp.

