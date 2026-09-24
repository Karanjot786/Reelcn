import { AbsoluteFill } from "remotion";
import { Arrow } from "../items/arrow";
import { Callout } from "../items/callout";
import { Confetti } from "../items/confetti";
import { useTheme, useViewport } from "../items/core";
import { Flash } from "../items/flash";
import { LightLeak } from "../items/light-leak";
import { ProgressBar } from "../items/progress-bar";
import { ReactionBurst } from "../items/reaction-burst";
import { SafeZoneGuide } from "../items/safe-zone-guide";
import { ScribbleCircle } from "../items/scribble-circle";
import { SparkleBurst } from "../items/sparkle-burst";
import { customizable } from "./customizable";
import type { Demo } from "./index";

/**
 * A small analytics-dashboard mock, drawn from plain divs, so `callout`, `arrow` and `scribble-circle` have real
 * targets to point at: a stat card, a bar chart and a badge, each at fixed percentages of the canvas.
 */
function DemoBackdrop() {
  const theme = useTheme();
  const { u, safe } = useViewport();
  const bars = [38, 62, 46, 80, 58];
  return (
    <AbsoluteFill style={{ fontFamily: theme.fonts.body }}>
      <div
        style={{
          position: "absolute",
          left: safe.x,
          top: safe.top,
          right: safe.x,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: theme.headingWeight,
            fontSize: u(34),
            color: theme.colors.foreground,
          }}
        >
          Orbit
        </div>
        <div style={{ display: "flex", gap: u(10) }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: u(9), height: u(9), borderRadius: "50%", background: theme.colors.muted }} />
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "10%",
          top: "34%",
          width: "38%",
          height: "26%",
          display: "flex",
          alignItems: "flex-end",
          gap: u(10),
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: u(6),
              background: i === 3 ? theme.colors.accent : theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: "58%",
          top: "56%",
          width: "32%",
          height: "18%",
          borderRadius: u(theme.radius),
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          padding: u(20),
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: u(18), color: theme.colors.muted }}>Growth</div>
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontWeight: theme.headingWeight,
            fontSize: u(48),
            color: theme.colors.foreground,
          }}
        >
          128%
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "10%",
          top: "64%",
          width: "13%",
          height: "13%",
          borderRadius: u(14),
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
        }}
      />
    </AbsoluteFill>
  );
}

export default [
  {
    id: "confetti-launch",
    duration: 100,
    ...customizable("Confetti", Confetti, { origin: { x: 74, y: 74 } }, (element) => (
      <>
        <DemoBackdrop />
        {element}
      </>
    )),
  },
  {
    id: "sparkle-burst-badge",
    duration: 90,
    ...customizable("SparkleBurst", SparkleBurst, { origin: { x: 16.5, y: 70.5 }, delay: 30 }, (element) => (
      <>
        <DemoBackdrop />
        {element}
      </>
    )),
  },
  {
    id: "light-leak-sweep",
    duration: 90,
    ...customizable("LightLeak", LightLeak, { side: "left" }, (element) => (
      <>
        <DemoBackdrop />
        {element}
      </>
    )),
  },
  {
    id: "flash-white",
    duration: 90,
    ...customizable("Flash", Flash, { delay: 40 }, (element) => (
      <>
        <DemoBackdrop />
        {element}
      </>
    )),
  },
  {
    id: "callout-card",
    duration: 100,
    ...customizable(
      "Callout",
      Callout,
      { target: { x: 58, y: 56, width: 32, height: 18 }, label: "Best week yet", delay: 15 },
      (element) => (
        <>
          <DemoBackdrop />
          {element}
        </>
      ),
    ),
  },
  {
    id: "arrow-chart",
    duration: 90,
    ...customizable(
      "Arrow",
      Arrow,
      { from: { x: 30, y: 68 }, to: { x: 42, y: 45 }, label: "Best week yet", delay: 20 },
      (element) => (
        <>
          <DemoBackdrop />
          {element}
        </>
      ),
    ),
  },
  {
    id: "scribble-circle-badge",
    duration: 90,
    ...customizable(
      "ScribbleCircle",
      ScribbleCircle,
      { target: { x: 10, y: 64, width: 13, height: 13 }, delay: 20 },
      (element) => (
        <>
          <DemoBackdrop />
          {element}
        </>
      ),
    ),
  },
  {
    id: "reaction-burst-hearts",
    duration: 110,
    ...customizable("ReactionBurst", ReactionBurst, {}, (element) => (
      <>
        <DemoBackdrop />
        {element}
      </>
    )),
  },
  {
    id: "progress-bar-chapters",
    duration: 120,
    ...customizable(
      "ProgressBar",
      ProgressBar,
      {
        chapters: [
          { at: 0, label: "Intro" },
          { at: 40, label: "Setup" },
          { at: 90, label: "Result" },
        ],
      },
      (element) => (
        <>
          <DemoBackdrop />
          {element}
        </>
      ),
    ),
  },
  {
    id: "safe-zone-guide-tiktok",
    duration: 80,
    ...customizable("SafeZoneGuide", SafeZoneGuide, { platform: "tiktok" }, (element) => (
      <>
        <DemoBackdrop />
        {element}
      </>
    )),
  },
] satisfies Demo[];
