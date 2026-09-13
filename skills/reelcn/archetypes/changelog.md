# Changelog

Template: `changelog`
Items: text-reveal, feature-card, grid, stagger
Format: 16:9
Length: 15 to 30 s

| # | Scene | Seconds | Purpose |
|---|---|---|---|
| 1 | title: "Version X", date | 2 to 3 | context |
| 2 | bullets: up to 3 changes with New / Improved / Fixed badges, repeated per 3 | 3 to 5 each | the changes |
| 3 | cta: "Available today" + changelog URL | 2 | where to read more |

```json
{
  "theme": "daylight",
  "version": "2.4",
  "date": "September 2026",
  "items": [
    { "type": "new", "text": "Scheduled releases" },
    { "type": "improved", "text": "The editor opens twice as fast" },
    { "type": "fixed", "text": "Links in footnotes open correctly" }
  ],
  "url": "relay.example.com/changelog"
}
```

Watch for: listing more than 9 changes (split into two videos), items written as ticket titles instead of user outcomes.
