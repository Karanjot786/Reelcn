# Looks

The brand comes first: colors, fonts and logo from `material.md`. Use a look below only when the user has no brand, or asks for one by name. One look per film. Write its name in the plan header as `look:` so a later change keeps it.

Every look keeps the bar in `SKILL.md`: a carrier, live motion during each read, real material.

## Studio dark

The launch film's look. For products, libraries and developer tools.

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
