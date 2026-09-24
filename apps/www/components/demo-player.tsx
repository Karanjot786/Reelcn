"use client";

import type { Demo } from "@reelcn/registry/demos";
import { DemoFrame } from "@reelcn/registry/demos/view";
import type { ThemeName } from "@reelcn/registry/items/core";
import { Player } from "@remotion/player";
import { type RefObject, useEffect, useMemo, useState } from "react";

export type Format = "16x9" | "9x16" | "1x1";

// Matches apps/studio/src/Root.tsx's FORMATS — the same design-unit sizes every composition renders at.
export const FORMAT_SIZE: Record<Format, { width: number; height: number }> = {
  "16x9": { width: 1920, height: 1080 },
  "9x16": { width: 1080, height: 1920 },
  "1x1": { width: 1080, height: 1080 },
};

// Explicit per-category loaders: Turbopack needs a statically analyzable specifier for each dynamic
// import(), so a template literal (`./demos/${category}`) can't be used here.
const CATEGORY_LOADERS: Record<string, () => Promise<{ default: Demo[] }>> = {
  audio: () => import("@reelcn/registry/demos/audio"),
  backgrounds: () => import("@reelcn/registry/demos/backgrounds"),
  data: () => import("@reelcn/registry/demos/data"),
  motion: () => import("@reelcn/registry/demos/motion"),
  overlays: () => import("@reelcn/registry/demos/overlays"),
  product: () => import("@reelcn/registry/demos/product"),
  social: () => import("@reelcn/registry/demos/social"),
  templates: () => import("@reelcn/registry/demos/templates"),
  text: () => import("@reelcn/registry/demos/text"),
  transitions: () => import("@reelcn/registry/demos/transitions"),
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Synchronous check, safe during SSR (false there). */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION).matches;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION);
    const onChange = () => setReduced(prefersReducedMotion());
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Whether an element is within `margin` of the viewport. Players below the fold are the landing page's heaviest render,
 * so they mount only near the viewport; `once` keeps them mounted after the first time.
 */
export function useNearViewport(ref: RefObject<Element | null>, margin = "600px", once = false) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const hit = Boolean(entry?.isIntersecting);
        setNear(hit);
        if (hit && once) observer.disconnect();
      },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, margin, once]);
  return near;
}

/** Loads one demo from its category chunk, client-side. `null` until it arrives or when the id is unknown. */
export function useDemo(category: string, demoId: string): Demo | null {
  const [demo, setDemo] = useState<Demo | null>(null);
  useEffect(() => {
    let cancelled = false;
    setDemo(null);
    const load = CATEGORY_LOADERS[category];
    if (!load) return;
    load().then((mod) => {
      if (!cancelled) setDemo(mod.default.find((candidate) => candidate.id === demoId) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [category, demoId]);
  return demo;
}

/** A Player-ready component for a demo: the demo framed in the chosen theme. */
export function useDemoScene(demo: Demo | null) {
  return useMemo(() => {
    if (!demo) return null;
    return function DemoScene({ theme, overrides }: { theme: ThemeName; overrides?: Record<string, unknown> }) {
      return <DemoFrame demo={demo} theme={theme} overrides={overrides} />;
    };
  }, [demo]);
}

/**
 * A live Remotion preview of one demo. Renders a same-aspect-ratio placeholder until its category
 * chunk loads client-side, so the server-rendered HTML never has to include `@remotion/player`.
 */
export function DemoPlayer({
  demoId,
  category,
  format,
  theme,
  autoPlay = true,
  controls = true,
}: {
  demoId: string;
  category: string;
  format: Format;
  theme: string;
  autoPlay?: boolean;
  controls?: boolean;
}) {
  const demo = useDemo(category, demoId);
  const Scene = useDemoScene(demo);
  const reducedMotion = usePrefersReducedMotion();
  const { width, height } = FORMAT_SIZE[format];
  const aspectRatio = `${width} / ${height}`;

  if (!Scene || !demo) {
    return <div className="player-frame" style={{ aspectRatio }} aria-hidden="true" />;
  }

  return (
    <Player
      component={Scene}
      // ponytail: `theme` is typed as `string` at this boundary (callers read it from JSON/state); it's
      // cast to `ThemeName` here rather than re-validated against `themeNames`, since every caller in this
      // codebase sources it from `lib/demos.ts`'s `themeNames` or another `DemoPlayer`/`FormatSwitch` prop.
      inputProps={{ theme: theme as ThemeName }}
      durationInFrames={demo.duration}
      fps={30}
      compositionWidth={width}
      compositionHeight={height}
      loop
      controls={controls}
      autoPlay={autoPlay && !reducedMotion}
      // ponytail: click-to-play off everywhere — catalog tiles wrap this in a link, and every consumer
      // already has an explicit toggle or the built-in scrub bar, so a click handler here would only
      // compete with the anchor's own click.
      clickToPlay={false}
      // Remotion's default (true) calls the play button's `.focus()` on every `playing` change,
      // including the initial autoplay on mount — that steals keyboard focus from the skip link at
      // the top of the document. The scrub bar's own play/pause button is still fully operable.
      spaceKeyToPlayOrPause={false}
      acknowledgeRemotionLicense
      className="player-frame"
      style={{ width: "100%", aspectRatio }}
    />
  );
}
