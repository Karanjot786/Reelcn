# Tutorial

Template: `tutorial`
Items: code-block, terminal, screen-zoom, chapter-title, text-reveal
Format: 16:9
Length: set by typing time; aim under 90 s

| # | Scene | Seconds | Purpose |
|---|---|---|---|
| 1 | title: the outcome, "Add X to Y" | 2 to 3 | promise |
| 2 | one step per scene: terminal, code or screenshot | typing time + 1.5 | the how |

Terminal steps: lines starting with `$ ` are commands; everything else is output.

```json
{
  "theme": "midnight",
  "title": "Add a storyboard to your project",
  "steps": [
    { "kind": "terminal", "content": "$ npx shadcn add @reelcn/storyboard\nCreated src/reelcn/storyboard.tsx" },
    { "kind": "code", "language": "tsx", "content": "<Composition id=\"Storyboard\" component={StoryVideo} />" },
    { "kind": "screen", "content": "/shots/studio.png", "zoom": true }
  ]
}
```

Watch for: code longer than 12 lines per step (split it), long lines (the code block shrinks its font to fit the longest line).
