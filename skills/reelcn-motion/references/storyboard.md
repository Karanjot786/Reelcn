# Storyboard

A plan is a markdown file: five header lines, then one table. The user reads it, you build from it, and `motion-check.mjs` checks the video against it.

## Header

```
tone: standard
direction: left
transitions: push left, hard
music: bed-standard
total: 15
```

| Line | Values |
|---|---|
| `tone` | `calm`, `standard` or `loud` |
| `direction` | `left`, `right`, `up` or `down`. One travel direction for the whole film |
| `transitions` | One to three cut types. The film uses no others |
| `music` | `bed-calm`, `bed-standard` or `bed-loud`; or a file, its BPM and its offset in seconds, like `track.mp3 96 0.2`; or `none` |
| `total` | Length in seconds |

## Table

| Column | Write |
|---|---|
| `beat` | A short name. Wrap it in `**` for a big beat, the one or two moments the film exists for |
| `start` | Seconds from the start |
| `length` | Seconds |
| `on screen` | The exact words in double quotes, then the elements. Never write `\|` in a cell |
| `why` | One sentence: the job this beat does for the viewer |
| `move` | The entrance: `smooth`, `snappy`, `gentle`, `linear` or `bouncy` |
| `sequence` | Elements arriving one by one, in order, split by commas. Or `none` |
| `hold` | Seconds of rest after the move lands, then `still` or `drift` |
| `sound` | A sound name, then `on`, then the visible action. Or `none` |
| `cut` | `hard`, `push <direction>`, `zoom in`, `zoom out`, `dissolve`, `carry <element>`, or `end` on the last beat |

## Rules

- One idea per beat. If `why` needs "and", split the beat.
- Beats run back to back. Each `start` equals the `start` plus `length` of the beat before.
- Write the real words. Numbers beat adjectives: "4,200 teams", not "thousands of teams".
- Show the real thing at least once: the product screen, the project image, the logo.
- A big beat starts on a music beat. Two big beats per film at most.
- Tone sets the count of beats. `calm`: 3 to 4. `standard`: 4 to 5. `loud`: 5 to 8.

## Approval

Show the full plan, header and table. Ask: "Approve this plan, or tell me what to change." Write no scene code before the answer.
