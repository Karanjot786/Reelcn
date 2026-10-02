# Change requests

The user asks in plain words. You change one row of the plan, then the code for this scene.

## Steps

1. Find the scene the request names. When it names none, ask which scene.
2. Change the row in `plan.md` with the table below.
3. When a scene gets longer, move every later `start` and the `total` onto the next beats. Or take the time from a named neighbor. Ask which, once.
4. Run `motion-check.mjs --plan plan.md`.
5. Change the code for this scene only. Regenerate the track when a start or a sound changed.
6. Render and run `motion-check.mjs out.mp4 plan.md`.

## Words to changes

| The user says | Change |
|---|---|
| "Hold X longer" | `length` of X plus one beat. Its `live` motion runs longer; the words stay put |
| "X goes by too fast" | Same as "hold X longer". If the words still overflow, cut words |
| "Tighten X", "X drags" | `length` minus one beat. Keep the words within 3.2 per second |
| "More energy", "punchier" | Tempo up to 124 or 128, more half-beat events, big words at full frame |
| "Calmer" | Tempo down to 100, fewer hops, longer arrivals with `smooth`, one scene fewer |
| "Make X pop" | X starts on a drop or a hit, stillness of half a beat before it |
| "Too much going on" | Remove one live motion per scene, keep the carrier |
| "No music" | `music: none`. Keep sound effects only if the user asks |
| "Swap X and Y" | Swap the rows, recompute starts, check both carrier hand-offs still connect |
| "Shorter" | Drop the scene with the weakest idea. Never compress every scene |
| "Different transition" | Change `join` on the named scene. Two cuts per film at most |
| "Different look", "make it glass", "make it editorial" | Change `look:` in the header to one from `references/looks.md`, then every scene's colors, type and curves. Timing stays |
| "Use my brand colors", a list of hex codes | Replace the palette tokens. Check contrast on every scene sheet |
| "Different font", "bigger number" | Change the type on the named element only. Remeasure its width so typed and counted text still fits |
| "Bouncier", "smoother" | Bouncier: `back.out` on arrivals. Smoother: `power3.out` and longer arrivals. Timing stays |
| "Move X", "make X smaller" | Change X's position or size only. Keep it inside the safe area |

## What never changes on a tweak

- Scenes the user did not name.
- The carrier, unless the user asks for a new one.
- The measured targets.
