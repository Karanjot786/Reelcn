# Podcast clip

Template: `podcast-teaser`
Items: audiogram, waveform, speaker-card, captions-karaoke, quote-card
Format: 9:16 teaser, 1:1 for a longer audiogram segment
Length: 15 to 45 s for a teaser; the segment length for an audiogram

Pick the template:
- `podcast-teaser`: one quote, a trimmed clip of the episode, vertical.
- `audiogram`: a full segment with word-by-word captions, square. Its length comes from the audio file.

```json
{
  "theme": "sunset",
  "audio": "/audio/episode-42.mp3",
  "clipStart": 734,
  "clipEnd": 762,
  "quote": "The best render farm is the one you never have to think about.",
  "show": "Frame by Frame",
  "cover": "/audio/cover.png"
}
```

Watch for: clips that start mid-sentence (move `clipStart` back to the breath before), quotes over 20 words.
