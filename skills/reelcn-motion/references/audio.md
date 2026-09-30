# Sound

## Generated track

```bash
node scripts/motion-track.mjs plan.md assets/audio/track.wav
```

It reads the plan's `tempo`, `total` and `sound` column and writes a WAV, plus an MP3 when ffmpeg is present. Every sound lands on the plan's clock. The track is CC0: drums, bass and plucks in A minor, synthesized from code.

| Cue | What it adds, at this scene |
|---|---|
| `intro` | A soft pad from 0 to the scene's end |
| `typing` | One key tick per letter across the first two thirds of the scene |
| `ticks` | A quick run of eight hats at the scene's start |
| `build` | A riser and an accelerating clap roll over the scene |
| `beat` | Kick, clap, hats, bass and plucks for the scene. Scenes with `beat` join into one groove |
| `drop` | A hit at the scene's start, and the groove from here |
| `hit` | An impact and a clap at the scene's start |
| `whoosh` | A whoosh into the join at the scene's end |
| `blip` | A rising pluck on each beat of the scene |
| `riser` | A short riser into the next scene |
| `scan` | A rising tone for a progress sweep |
| `final` | The last impact, a chord and a ring-out to the end |

For finer control, write a cue sheet in JSON with the same fields and pass it instead of the plan. `starters/hyperframes-launch-film/cues.json` is a worked example.

## A track of the user's own

Write `music: track.mp3 124 0.08` in the plan header: file, tempo, offset of the first beat. Scene starts then sit on its beats. Keep sound effects sparse under a full track.

## Rules

- Sound lands on picture events: a hop, a stamp, a letter, a join. Never to fill silence.
- The drop and the final hit are the two loudest moments.
- The film ends on a ring-out, not a cut to silence.
- Loudness of the final file: -16 to -11 LUFS, true peak under -0.5 dBFS. `motion-check.mjs` measures both.
