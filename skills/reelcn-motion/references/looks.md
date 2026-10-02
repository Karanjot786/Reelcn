# Looks

The brand comes first: colors, fonts and logo from `material.md`. With no brand, derive the look from the plan's `idea:` line: a chalkboard menu gets chalk on slate, a field guide gets paper and ink. The looks below are reference films, not defaults. Use one as is only when the user asks for it by name. One look per film. Write its name or a short description in the plan header as `look:` so a later change keeps it.

## Feel sets the curves

The plan's `feel:` line picks the motion, after IBM Carbon's productive and expressive motion. The film's curves follow its feel, never `power4` by default.

| Feel | Durations | Curves | Overshoot |
|---|---|---|---|
| Productive: exact, calm, technical, quiet | Short: arrivals 0.2 to 0.35s, hops under 0.15s | `power2.out`, `power3.out` | None |
| Expressive: bold, playful, loud, warm | Longer arrivals: 0.4 to 0.7s, with a held beat after | `back.out`, `power4.out` | Allowed, on the key element |

A mixed feel, like "warm, exact", takes productive curves for the UI and one expressive move for the signature.

Every look keeps the bar in `SKILL.md`: a carrier, live motion during each read, real material.

## Studio dark

The launch film's own look, made for a terminal and a component library. Not a fallback: use it when the idea is a developer tool, a CLI or code.

- Ground: near-black `#0a0b0d`, light text `#f2f3f5`, muted `#8a8f98`, one accent `#ffb224` for the carrier and the key word.
- Type: IBM Plex Sans 700 for headlines, Plex Sans Condensed 700 for full-frame words, Plex Mono 500 for commands and counters. Files: `starters/hyperframes-launch-film/assets/fonts/`.
- Motion: arrivals on `power4.out` in 0.3 to 0.5s, reframes on `power4.inOut`, small hops on `power4.out` in under 0.2s.

## Kinetic type

The words are the film. For a script, a hook, a short opinion. Pairs with `plans/kinetic-type.md`.

- Ground: black, white text, one accent for the single most important word on each screen.
- Type: one heavy condensed face in capitals, sized so the key word fills most of the safe width. Plex Sans Condensed 700 works.
- Motion: words land one at a time in 0.25 to 0.4s on `power4.out`. Vary the entrance between screens: from the side, stretched from flat to full height, letters split and rejoined. Each screen leaves fast, just before the next lands, on the beat.
- No cards, no boxes, no gradients.

## Editorial paper

A printed page, not a screen. For stories, essays, title sequences.

- Ground: warm paper `#f1ebe0` under a fine animated grain at about 10% opacity, ink `#17150f`, one deep red `#b8432a`.
- Type: Instrument Serif for headlines, large, mixing upright and italic words; small labels in Inter 400, uppercase and letter-spaced. Files: `starters/hyperframes-title-sequence/assets/fonts/`.
- Shapes: torn or cut paper blocks behind key words, turned 1 to 3 degrees, thin rules, small page numbers in the corners.
- Motion: unhurried. Staggers that are slightly uneven, slides and wipes on `power2.inOut`, no overshoot.
- Grain makes large files: see the Export section of `renderers/hyperframes.md`.

## Looks to avoid

Blue-to-purple gradients, frosted glass over a pastel blur, and sticker-covered neon are the stock looks of generated video. See `references/slop.md`.
