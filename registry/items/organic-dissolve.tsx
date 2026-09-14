/**
 * @title Organic Dissolve
 * @description A seeded grain pattern eats away the outgoing scene and grows the incoming one in, like film grain dissolving between two shots.
 * @category transitions
 * @duration 26
 * @use A softer, less mechanical alternative to a hard cut or a wipe
 * @use Documentary or lifestyle edits that want texture, not geometry
 * @tags dissolve, grain, organic, turbulence, seed
 * @example
 * <TransitionSeries>
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <SceneA />
 *   </TransitionSeries.Sequence>
 *   <TransitionSeries.Transition presentation={organicDissolve({ seed: "scene-1" })} timing={linearTiming({ durationInFrames: 26 })} />
 *   <TransitionSeries.Sequence durationInFrames={60}>
 *     <SceneB />
 *   </TransitionSeries.Sequence>
 * </TransitionSeries>
 */

import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { useId } from "react";
import { AbsoluteFill } from "remotion";
import { coverPhase, useViewport } from "./core";

export type OrganicDissolveProps = {
  /** Deterministic per instance: the same seed always dissolves in the same pattern. */
  seed?: string;
  /** Grain size in design units. Larger = coarser grain. */
  grain?: number;
};

/** A small, fixed string hash — deterministic, not `Math.random` — turned into `feTurbulence`'s numeric `seed`. */
function seedToNumber(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  return Math.abs(hash);
}

function OrganicDissolvePresentation({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<OrganicDissolveProps>) {
  const { u } = useViewport();
  const seed = passedProps.seed ?? "organic-dissolve";
  const grain = passedProps.grain ?? 40;
  const exiting = presentationDirection === "exiting";
  const { cover, reveal } = coverPhase(presentationProgress);
  // 1 = this layer shown exactly as its plain scene, 0 = fully dissolved away.
  const revealAmount = exiting ? 1 - cover : reveal;

  if (revealAmount >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  if (revealAmount <= 0) return <AbsoluteFill style={{ opacity: 0 }}>{children}</AbsoluteFill>;

  const baseFrequency = 1 / Math.max(u(grain), 1);
  const numericSeed = seedToNumber(seed);
  // Per-instance, not per-direction: see whip-pan's identical fix for why a static id collides.
  const filterId = `organic-dissolve-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const displaceStrength = u(24) * 4 * revealAmount * (1 - revealAmount);
  // The threshold sweeps through the turbulence's own alpha channel, so grains disappear/appear in the
  // same organic pattern the noise already drew instead of a uniform cross-fade.
  const cutoff = (revealAmount - 0.5) * 24;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg aria-hidden="true" width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={baseFrequency}
              numOctaves={2}
              seed={numericSeed}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={displaceStrength}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feComponentTransfer in="noise" result="mask">
              <feFuncA type="linear" slope={24} intercept={cutoff} />
            </feComponentTransfer>
            <feComposite in="displaced" in2="mask" operator="in" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{ filter: `url(#${filterId})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}

export function organicDissolve(props: OrganicDissolveProps = {}): TransitionPresentation<OrganicDissolveProps> {
  return { component: OrganicDissolvePresentation, props };
}
