# Talking head short

Template: `talking-head-short`
Items: captions-bold-pop, hook-title, transcribe, captions
Format: 9:16
Length: the video's length; aim for 20 to 60 s

1. Transcribe: `node scripts/reelcn-transcribe.ts take-3.mp4 --out public/captions/take-3.json`.
2. Pass the video and captions; the hook shows for the first 3 s.
3. Emphasize 2 to 4 words that carry the point.

```json
{
  "theme": "mono",
  "video": "/clips/take-3.mp4",
  "captions": [],
  "hook": "Most videos lose you in three seconds",
  "emphasize": ["three", "seconds"]
}
```

(`captions` holds the transcribe tool's output; it is empty here only to keep the example short.)

Watch for: hooks longer than the first sentence spoken, captions covering the speaker's face (use a caption `position` of `top` for low framing).
