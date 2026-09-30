# Pacing

Pace comes from fast moves and tight cuts. It never comes from taking text away before the viewer has read it.

## The reading formula

```
hold = larger of (hold floor) and (words / reading rate), times the tone scale
```

Values live in `tokens/tokens.json`: reading rate 3 words per second, hold floor 1 second, tone scale 1.3 for `calm` and 1 for `standard` and `loud`.

| Words on screen | `standard` hold | `calm` hold |
|---|---|---|
| 1 to 3 | 1.0s | 1.3s |
| 4 | 1.33s | 1.73s |
| 6 | 2.0s | 2.6s |
| 9 | 3.0s | 3.9s |

Count every word in double quotes in the `on screen` cell.

## What fills a beat

```
length ≥ enter + sequence + hold + exit
```

- `enter` is 0.6s.
- `sequence` is the gap between arrivals times the count of gaps. With music the gap is one music beat. With no music it is the stagger gap, 0.08s.
- `exit` is 0.35s. A `hard` cut, a `carry` cut and `end` have no exit.

## Two failures to design out

**Too many words for the beat.** A 3 second beat holds about 5 words. When a beat needs more, cut words or split the beat. Never speed it up.

**Text arriving faster than it reads.** At 150 BPM a beat lasts 0.4s. Three text cards landing on three beats arrive in 0.8s, and the viewer reads none of them until the hold. So the hold counts words across all the cards. For long lines, land one card every second beat.

## Rhythm

- The exit is shorter than the entrance. 0.35s against 0.6s.
- Put stillness before the biggest beat. A half second of rest makes the next move land.
- A wordmark or a name holds at least 1 second.
- The last beat holds longest. The viewer acts on it.
- Default one notch slower. Watch once at full speed. If you missed a word, the hold is short.
