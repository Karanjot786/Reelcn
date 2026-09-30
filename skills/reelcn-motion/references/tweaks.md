# Change requests

The user asks in plain words. You change one row of the plan, then the code for this one beat.

## Steps

1. Find the beat the request names. When it names none, ask which beat.
2. Change the row in `plan.md` with the table below.
3. When a beat gets longer, move every later `start` and the `total`. Or take the time from the hold of a named neighbor. Ask which, once.
4. Run `motion-check.mjs --plan plan.md`.
5. Change the code for this beat only.
6. Render and run `motion-check.mjs out.mp4 plan.md`.

## Words to parameters

| The user says | Change |
|---|---|
| "Hold X longer" | `hold` +0.5s on beat X, `length` +0.5s |
| "X goes by too fast" | Same as "hold X longer". If the hold already meets the reading formula, cut words from X too |
| "Tighten X", "X drags" | `hold` down to the reading formula for its words. `length` down by the same amount |
| "Snappier", "more punch" | `move` to `snappy` on the named beats. No change to holds |
| "Calmer", "softer" | `move` to `gentle`. `tone` to `calm` when the user means the whole film. Re-run the plan check: `calm` needs longer holds |
| "More energy" | `tone` to `loud`, music to `bed-loud`, big beats moved onto its grid. Holds stay at the reading formula |
| "Make X pop" | Mark X as a big beat with `**`. Put stillness before it. Give it the one `bouncy` move or an `impact` sound, never both |
| "Less bouncy" | `move` from `bouncy` to `smooth` |
| "Too many sounds", "quieter" | Remove `sound` cells from beats with no big action first. Keep the sound on the big beat |
| "No music" | `music: none`. Keep the sound effects |
| "Swap X and Y" | Swap the two rows. Recompute every `start`. Check each `push` still follows the film direction |
| "Shorter", "make it 10 seconds" | New `total`. Drop the beat with the weakest `why` before you shorten any hold under the reading formula |
| "Different transition" | Change `cut` on the named beat. Keep the film at two or three cut types, all listed in the header |
| "Faster overall" | Shorten entrances and cuts. Never shorten holds under the reading formula. Say so when the request needs fewer words |

## What never changes on a tweak

- Beats the user did not name.
- The reading formula. When a request breaks it, say which words to cut.
- The film direction, unless the user asks for it.
