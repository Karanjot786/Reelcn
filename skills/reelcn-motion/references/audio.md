# Sound

Volumes, fades and tempos live in `tokens/tokens.json` under `audio`.

## Sound effects

The pack holds 30 sounds. Each has a base file and an `-alt` file.

| Action on screen | Sound |
|---|---|
| A push or slide cut | `whoosh`, `whoosh-soft`, `swoosh`, `swish`, `swipe` |
| A card or tile landing | `pop`, `pop-high`, `drop`, `bubble` |
| The biggest beat landing | `impact`, `thud`, `transition-hit` |
| Build-up before a big beat | `rise`, `riser-short` |
| Typed text | `keypress` per key, or `typing` for a run |
| A cursor click or a tap | `click`, `click-soft`, `tap`, `tick` |
| A finished flow, a version number, a reward | `success`, `ding`, `chime`, `bell`, `coin`, `sparkle` |
| A message arriving | `notification` |
| A photo or a capture | `camera-shutter` |
| A failure shown on purpose | `error`, `glitch` |

Rules:

- A sound lands only on a visible action. No sound fills silence.
- The `sound` column of the plan is the one list of sounds. Build one table in the code from it. Nothing plays outside the table.
- A sound starts on the first frame of its action, never at the end of it.
- When a sound repeats, alternate the base file and the `-alt` file, and step the volume down by a tenth each time.
- No sound outlives its action. Give long samples an explicit length.
- In a `sequence`, one sound per arrival works for up to four arrivals. Past four, sound the first and the last.
- Tone sets the count of `sound` cells: `calm` up to 3, `standard` up to 5, `loud` up to 9.
- Prefer sounds of real objects: `click`, `tap`, `camera-shutter`, `keypress`. Keep `glitch`, `coin` and `sparkle` for films asking for play.

## Music

| Bed | Tempo | One beat | Tone |
|---|---|---|---|
| `bed-calm` | 100 BPM | 0.6s | `calm` |
| `bed-standard` | 120 BPM | 0.5s | `standard` |
| `bed-loud` | 150 BPM | 0.4s | `loud` |

- Each bed is 48 beats long and starts on beat 0 at 0 seconds. Films longer than the bed need a user track.
- Music plays under everything at the music volume, 0.25. Sound effects play at 0.7.
- Fade music in over 0.4s. Fade it out over 1s under the final hold.
- A user track works the same way. Put its tempo and the offset of its first beat in the plan header.
- `music: none` is a valid plan. Silence is a choice. Write it down.

## Beat sync

```
time of beat n = offset + n × 60 / BPM
```

Every token file exports this as a function: `beatTime` in `.ts` and `.js`, `beat_time` in `.rs`.

- A big beat starts on a music beat, within 0.05s.
- A `sequence` lands one element per music beat.
- Small moves follow the plan, never the grid. Forcing every move onto a beat makes the film twitch.
- Reading time wins. Never shorten a hold to reach a beat. Move the start of the next beat to the following music beat.

## The mix

`motion-check.mjs` reads the final file. Integrated loudness sits between -24 and -12 LUFS. True peak stays under -1 dBFS.
