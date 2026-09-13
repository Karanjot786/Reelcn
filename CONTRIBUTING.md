# Contributing to reelcn

Every reelcn item is one file. The build derives the registry entry, the docs page and the llms files from that file's header, so most contributions touch two files: the item and its demo.

## Setup

Node 26 and pnpm 9.

```bash
pnpm install
pnpm studio   # every demo in every format
pnpm site     # the docs site on localhost:3000
```

## Add an item

1. Create `registry/items/<name>.tsx`. Copy the header from an item in the same category: `@title`, `@category`, `@description`, `@duration`, `@use`, `@example`.
2. Follow the component contract (spec §7 in `docs/superpowers/specs/2026-09-12-reelcn-design.md`):
   - Sizes in `u()`.
   - Colors from `useTheme()`.
   - Canvas size from `useViewport()`.
   - No `Math.random`, `Date.now` or CSS animation.
   - ES2015 built-ins only.
3. Add a demo to `registry/demos/<category>.tsx`. Its id starts with the item name, and its first, middle and last frames must differ.
4. Run `pnpm registry:build` and commit the generated files with your item.
5. Render its contact sheets with `pnpm stills sheets <name>` and look at them in `out/sheets/`.

## Before you open a pull request

```bash
pnpm format && pnpm typecheck && pnpm typecheck:user && pnpm lint && pnpm test && pnpm registry:build && pnpm check:drift && pnpm stills smoke <name>
```

## Rules

- Open an issue before adding an npm dependency. Spec §4.2 lists the allowed ones.
- No code copied from other component libraries. Ideas may overlap; code must be original.
- No emoji and no brand lookalikes in items or demos.
- Sound effects must be CC0 and listed in `sfx/LICENSES.md`.

By contributing, you agree to the [Code of Conduct](CODE_OF_CONDUCT.md) and license your work under [MIT](LICENSE).
