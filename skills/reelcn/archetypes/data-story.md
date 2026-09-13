# Data story

Template: `data-story`
Items: bar-chart, line-chart, donut, stat-counter, kpi-grid, grid
Format: 16:9
Length: 4 s per section plus the title

| # | Scene | Seconds | Purpose |
|---|---|---|---|
| 1 | title: the finding, not the topic | 2 to 3 | headline |
| 2 | stat: the single biggest number | 4 | anchor |
| 3 | bar / line / donut per comparison | 4 each | evidence |

Chart choice: bar to compare categories, line for change over time, donut for parts of a whole (max 5 parts), stat for one number.

```json
{
  "theme": "paper",
  "title": "How our users rendered in 2026",
  "sections": [
    { "kind": "stat", "data": [{ "label": "Videos rendered this year", "value": 1284000 }], "caption": "Up from 310,000 last year" },
    { "kind": "line", "data": [{ "label": "Jan", "value": 40 }, { "label": "May", "value": 85 }, { "label": "Sep", "value": 164 }], "caption": "Renders per day, in thousands" }
  ]
}
```

Watch for: captions that describe the chart type instead of the takeaway, more than 8 bars.
