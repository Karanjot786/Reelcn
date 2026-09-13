# Product launch

Template: `product-launch`
Items: text-reveal, feature-card, browser-window, stat-counter, gradient-mesh, spotlight
Format: 16:9 for the site and YouTube, 1:1 cut for feeds
Length: 25 to 45 s

| # | Scene | Seconds | Purpose |
|---|---|---|---|
| 1 | logo (only with `brand.logo`) | 2 | brand recognition |
| 2 | title: name + one-line promise | 3 to 4 | what it is |
| 3 | bullets: 3 features, each a verb phrase | 4 to 6 | why it matters |
| 4 | device (browser) per screenshot | 3 each | proof it exists |
| 5 | cta: action + URL | 3 | what to do next |

Template props:

```json
{
  "theme": "midnight",
  "brand": { "accent": "#6d7cff" },
  "name": "Relay",
  "tagline": "Release notes your users actually read",
  "features": [
    { "title": "Write once", "body": "Draft in Markdown and publish everywhere." },
    { "title": "Ship on merge", "body": "Every merged pull request becomes a line." },
    { "title": "See who read it", "body": "Opens and clicks for every release." }
  ],
  "screenshots": ["/shots/dashboard.png"],
  "cta": "Start free today",
  "url": "relay.example.com"
}
```

Same video as a storyboard, when you need a scene the template lacks (here a stat):

```json
{
  "theme": "midnight",
  "scenes": [
    { "type": "title", "kicker": "Introducing", "title": "Relay", "subtitle": "Release notes your users actually read", "background": "gradient-mesh" },
    { "type": "bullets", "items": [{ "text": "Write once" }, { "text": "Ship on merge" }, { "text": "See who read it" }] },
    { "type": "stat", "label": "Teams shipping with Relay", "value": 4200, "suffix": "+" },
    { "type": "device", "device": "browser", "src": "/shots/dashboard.png", "url": "relay.example.com" },
    { "type": "cta", "title": "Start free today", "button": "Get Relay", "url": "relay.example.com", "background": "spotlight" }
  ]
}
```

Watch for: taglines over 8 words (they shrink), more than 3 features on one card set (the template splits them into more scenes, which lengthens the video).
