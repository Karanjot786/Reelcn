# Choreography

## One continuous shot

Scenes built alone feel like slides. Build the film as one shot.

1. Pick a carrier: a caret, a dot, an underline, a frame border, a playhead. Small, in the accent color.
2. The carrier is on screen at every scene change. It moves into the next scene and becomes part of it: the caret opens into a selection box, the box grows into a frame, the frame's border becomes a timeline bar, a word collapses into a line, the line becomes the logo's stroke.
3. Hard cuts are rare: at most two per film, each on a beat.
4. Never crossfade. Two scenes at half opacity read as a grey double exposure. The old scene leaves by moving, shrinking, collapsing or being covered; the new one arrives the same way.
5. Clear the stage at each join. Every element of the old scene has left, or has become the carrier, before the new scene's words land. A counter or label from the old scene never sits on top of the new one.

## Joins

| Join | How | Use for |
|---|---|---|
| `morph` | The carrier changes shape into the next scene's main element | The default |
| `match` | An element in the old scene sits where an element of the new scene appears, same size and place | Swapping content inside one frame |
| `whip` | A fast move with blur, the new scene arrives from the same direction | A jump in subject |
| `zoom-through` | Push into an element until it fills the frame and becomes the new background | Entering a product or a detail |
| `wipe` | The new state sweeps across the old one | A restyle, a before and after |
| `flood` | A shape grows from the carrier until it covers the frame in a new background color | An inversion from dark to light or back |
| `cut` | A hard change on a beat | Big words, the final hit |

Invert the background once in the middle of a longer film, dark to light or light to dark. It resets the eye.

## Motion by meaning

Describe each move with the verb of its meaning. The generic fade and slide is the mark of generated video.

| Meaning | Move |
|---|---|
| A command, code, a search | Types at human speed with a caret. 12 to 30 characters per second |
| Many of something | Cascades outward from one point, nearest first |
| Choosing | A selection box hops from item to item on each half beat |
| A number | Rolls up digit by digit while its bar or chart grows |
| Formats, sizes | The frame reshapes itself on a beat, content refits inside |
| A restyle, a theme | The new style wipes across the old one |
| Speed | Arrives with speed lines or motion blur, stops hard |
| Polish, focus | Sharpens out of blur |
| Install, files landing | Letters drop in one by one, each settling |
| Rendering, progress | A fill sweeps across with a scan line and a frame counter |
| An ending | Collapses into a line or a point, which becomes the logo |
| A list, steps, a done state | Each line gets a tick on its beat |
| The line to remember | The frame punches in on it and holds |
| A screen of the product | The screenshot pushes in to the part that matters, with a callout |
| Footage or a full screen giving way | It shrinks to a card as the next thing arrives |

## Timing

- Every duration and curve comes from the token file: `smooth` for arrivals, `exit` for departures, `snappy` for small fast moves.
- Big moves take 0.3 to 0.5 seconds. Small moves 0.12 to 0.2.
- Stagger each element of a group by 0.03 to 0.05 seconds. The whole group lands inside half a second.
- Overlap: the next move starts before the last one stops.
- Picture events land on beats and half beats: hops, stamps, reshapes, wipes.
- `bouncy`: one element per film at most.

Motion blur on fast moves: animate `filter: blur()` up during the fastest part and back to zero at rest.

- One gesture, not two: a reframe that ends and then a wipe that starts reads as a stutter. Merge them on one curve, or start the second before the first ends.
- A group finishes before its join: the last element's start plus its stagger plus its duration lands before the next scene starts.
- Spotlight: one element at full strength at a time. Others drop to about half opacity while it reads.
- Recipes with numbers and checks: `references/moves.md`. Tells to avoid: `references/slop.md`.
