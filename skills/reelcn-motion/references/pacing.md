# Pacing

## Density

- A scene lasts 0.8 to 3.5 seconds. Most last 2 to 2.5.
- A 15 second film carries 6 to 10 scenes.
- One idea per scene. The `words` cell says it in 6 words or fewer.

## Reading while moving

Viewers read while something else moves. The words hold still; the scene does not.

- Budget: 3.2 words per second of scene. A 2 second scene holds 6 words.
- Every scene names its `live` motion: a counter rolling, a playhead running, a selection hopping, a cursor arriving, a slow push on the frame.
- Full stillness lasts 1.4 seconds at most before the final 2 seconds, and 1.7 seconds at the end.

## The beat

```
time of beat n = offset + n × 60 / tempo
```

- Every scene starts on a beat. At 120 BPM a beat is 0.5 seconds.
- Small events land on half beats: hops, stamps, letters.
- The drop, the biggest words and the final hit land on beats the plan names.

## Measured targets

`motion-check.mjs` measures the rendered file. Its targets come from three studio films and one approved film:

| Target | Value |
|---|---|
| Frames in motion | 45% or more |
| Longest stillness before the final 2 seconds | 1.4 seconds |
| Longest stillness anywhere | 1.7 seconds |
| Frame rate | 50 fps or more |
| Loudness | -16 to -11 LUFS |
| True peak | -0.5 dBFS or lower |
