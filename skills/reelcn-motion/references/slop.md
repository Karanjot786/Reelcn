# Slop

Tells of generated video. The plan check catches the copy tells in code. Check the rest by eye on the scene sheet and the join strips. One tell is a note; several are a rebuild. The copy lists draw on Anti-Slop (see `NOTICE.md`).

## Copy

- Stock phrases, buzzwords and calls to action: the `SLOP` list in `scripts/motion-check.mjs`. One warns, two fail.
- Numbers with no source. Every number on screen traces to material.md, or the scene says `mocked:`.
- Patterns the check leaves alone, because short film copy uses them on purpose. Flag them only when they stack up in one film:
  - "Not just X. It's Y."
  - Three parallel fragments in every scene.
  - "From X to Y" with no real range.
  - Aphorisms: "X is the language of Y".
- The owner's copy wins. If a tell is in their tagline, name it and ask; write their answer in plan.md.

## Picture

| Tell | Instead |
|---|---|
| Blue to purple, purple to pink or cyan gradients; purple on black | The brand's own colors from material.md |
| Glowing orbs and blobs behind the content | The product |
| Sparkle, star, robot or lightning icons standing for "AI" | What the product does, shown |
| Skeleton bars or grey boxes as the product | A screenshot, or a rebuild from the codebase |
| A font chosen for no reason | The brand's fonts |
| Emoji | The product's own icons |
| Background grids and dot grids filling space | One accent and real material |
| Everything centered at one size | A small label next to a word that fills the frame |
| Swap the logo and the film still works | Change it until it could only be this product |

## Motion

| Tell | Instead |
|---|---|
| The same fade-up on every element | A move that shows the element's meaning (`moves.md`) |
| Pulses, floats and glows looping with no trigger | Live motion that changes information |
| A glowing dot that marks nothing | The carrier always becomes something |
| One hero technique used twice | One signature move per film |
| The whole frame pumping on every beat | At most three full-frame hits per film |
| Handheld shake on a product film | A slow push |
| One curve and one speed for everything | `smooth` arrivals, `exit` departures, `snappy` small moves |
