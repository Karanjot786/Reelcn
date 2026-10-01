# Material

A film shows the real product. Gather the material before writing the plan. Mocked UI is the last resort, and the plan says so.

## Where the product lives

| The user gives | Do |
|---|---|
| Nothing, and the current folder is the product | Read the codebase in place |
| A GitHub URL | `git clone --depth 1 <url> .reelcn-motion/source`, then read it. Never push, never open issues |
| A live URL | `npx --yes hyperframes@0.8.96 capture <url> -o .reelcn-motion/capture --skip-vision --max-screenshots 12` |
| Screenshots or a brand folder | Use them. Look at each one before planning |

Keep everything you gather under `.reelcn-motion/` in the user's project.

## What to read, in order

1. **README and docs.** The one-line pitch, features, install command, numbers (users, stars, speed claims). Quote them exactly.
2. **Brand.** Logo files (`public/`, `assets/`, `static/`, `*.svg`, favicon), colors from CSS variables, `tailwind.config.*` or theme files, fonts from CSS or the framework's font loader.
3. **The product surface.** Routes or pages (`app/`, `pages/`, `src/routes/`), the main components a user touches: the editor, the dashboard, the form, the result view. Note their copy and states.
4. **Real data.** Fixtures, seed files, examples, demo folders, changelogs, release notes.
5. **The flow worth showing.** Entry, key action, result. Three beats of someone using the product.

Write a short `material.md` in `.reelcn-motion/`: pitch, brand values, list of assets with paths, the flow, the numbers, and the exact copy to use.

## Getting UI on screen, best first

1. **Screenshots of the running product.** Start the app if it runs locally, or capture its live URL. Crop to the part the scene needs.
2. **Rebuilt from the codebase.** Copy the product's own markup, styles, tokens and copy into the film's HTML, so the scene shows the real layout with its own fonts and colors. For a React product on Remotion, import its components directly.
3. **Mocked in code.** Only when neither works. Say so in the plan's `shows` cell ("mocked: the changelog page, rebuilt from the README's description") and in your report.

Title cards, marketing banners and screenshots with baked-in text are backdrops, not product UI. Say so when you find them.

## Copy

- Use the product's own words: its tagline, feature names, button labels, numbers.
- Never rewrite a tagline or a product claim to fit the reading budget. Give the scene more time, split it, or ask the user which words to cut.
- Invented sample content (PR titles, user names, entries) is fine for mocked UI. List it in your report so the user swaps in real copy.
- Numbers on screen come from the material: stars, users, speed, versions, counts. The plan check traces each one. Invent none.
