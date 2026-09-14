import { linearTiming, type TransitionPresentation, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill } from "remotion";
import { brandSweep } from "../items/brand-sweep";
import { cardPush } from "../items/card-push";
import { circleBurst } from "../items/circle-burst";
import { useTheme, useViewport } from "../items/core";
import { glitch } from "../items/glitch";
import { lightFlash } from "../items/light-flash";
import { getScenesDuration, type SceneItem, Scenes } from "../items/scenes";
import { shutter } from "../items/shutter";
import { sliceSlide } from "../items/slice-slide";
import { splitDoors } from "../items/split-doors";
import { stripeWipe } from "../items/stripe-wipe";
import { tileReveal } from "../items/tile-reveal";
import { whipPan } from "../items/whip-pan";
import { zoomThrough } from "../items/zoom-through";
import type { Demo } from "./index";

const DURATION = 75;
/** Slower than most items recommend, so contact sheets catch three frames mid-transition. */
const TRANSITION = 30;
// Scene A holds until the transition is centred on frame 37, the middle frame the smoke check renders.
const HOLD_A = Math.floor((DURATION + TRANSITION) / 2);
const HOLD_B = DURATION + TRANSITION - HOLD_A;

/** Placeholder scene: a full-bleed panel with a large label and one accent shape. */
function DemoScene({ label, tone }: { label: string; tone: 0 | 1 | 2 }) {
  const theme = useTheme();
  const { u, isPortrait } = useViewport();
  const { background, surface, accent, accentForeground, foreground, highlight } = theme.colors;
  return (
    <AbsoluteFill
      style={{
        background: [background, surface, accent][tone],
        alignItems: "center",
        justifyContent: "center",
        flexDirection: isPortrait ? "column" : "row",
        gap: u(64),
      }}
    >
      <div
        style={{
          width: u(200),
          height: u(200),
          background: [accent, highlight, accentForeground][tone],
          borderRadius: tone === 0 ? "50%" : u(theme.radius),
          rotate: tone === 2 ? "45deg" : undefined,
        }}
      />
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontWeight: theme.headingWeight,
          fontSize: u(160),
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: tone === 2 ? accentForeground : foreground,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
}

function Pair<P extends Record<string, unknown>>({ presentation }: { presentation: TransitionPresentation<P> }) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={HOLD_A}>
        <DemoScene label="Scene A" tone={0} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={presentation}
        timing={linearTiming({ durationInFrames: TRANSITION })}
      />
      <TransitionSeries.Sequence durationInFrames={HOLD_B}>
        <DemoScene label="Scene B" tone={1} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

// A quarter into the transition (which spans HOLD_A - TRANSITION .. HOLD_A), not its midpoint: the
// midpoint of a `cover`-style transition is a solid fill, which makes for a blank catalog thumbnail.
const THUMB_FRAME = HOLD_A - TRANSITION + Math.round(TRANSITION / 4);

function pair<P extends Record<string, unknown>>(id: string, presentation: TransitionPresentation<P>): Demo {
  return {
    id,
    duration: DURATION,
    bare: true,
    thumbFrame: THUMB_FRAME,
    component: () => <Pair presentation={presentation} />,
  };
}

// One reelcn transition and one built into @remotion/transitions: 40 + 45 + 40 - 20 - 15 = 90 frames.
// A factory, not a constant: JSX evaluated at module load runs before React is available, and the duration
// below is computed at module load. getScenesDuration reads only durations and timings, so it gets empty nodes.
const sceneItems = (scene: (label: string, tone: 0 | 1 | 2) => SceneItem["node"]): SceneItem[] => [
  {
    node: scene("Scene A", 0),
    duration: 40,
    transition: cardPush(),
    timing: linearTiming({ durationInFrames: 20 }),
  },
  {
    node: scene("Scene B", 1),
    duration: 45,
    transition: fade(),
    timing: linearTiming({ durationInFrames: 15 }),
  },
  { node: scene("Scene C", 2), duration: 40 },
];

export default [
  pair("split-doors-default", splitDoors()),
  pair("split-doors-vertical", splitDoors({ direction: "vertical" })),
  pair("slice-slide-default", sliceSlide()),
  pair("card-push-default", cardPush()),
  pair("card-push-left", cardPush({ direction: "left" })),
  pair("glitch-default", glitch()),
  pair("light-flash-default", lightFlash()),
  pair("brand-sweep-default", brandSweep()),
  pair("brand-sweep-left", brandSweep({ direction: "left" })),
  pair("stripe-wipe-default", stripeWipe()),
  pair("circle-burst-default", circleBurst()),
  pair("circle-burst-corner", circleBurst({ origin: { x: 85, y: 80 } })),
  pair("shutter-default", shutter()),
  pair("shutter-vertical", shutter({ direction: "vertical" })),
  pair("tile-reveal-default", tileReveal()),
  pair("tile-reveal-random", tileReveal({ pattern: "random" })),
  pair("whip-pan-x", whipPan({ axis: "x" })),
  pair("whip-pan-y", whipPan({ axis: "y" })),
  pair("zoom-through-in", zoomThrough()),
  pair("zoom-through-out", zoomThrough({ direction: "out" })),
  {
    id: "scenes-default",
    duration: getScenesDuration(
      sceneItems(() => null),
      30,
    ),
    bare: true,
    component: () => <Scenes items={sceneItems((label, tone) => <DemoScene label={label} tone={tone} />)} />,
  },
] satisfies Demo[];
