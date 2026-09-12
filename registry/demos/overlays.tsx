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
    component: () => (
      <>
        <DemoBackdrop />
        <Confetti origin={{ x: 74, y: 74 }} />
      </>
    ),
  },
  {
    id: "sparkle-burst-badge",
    duration: 90,
    component: () => (
      <>
        <DemoBackdrop />
        <SparkleBurst origin={{ x: 16.5, y: 70.5 }} delay={30} />
      </>
    ),
  },
  {
    id: "light-leak-sweep",
    duration: 90,
    component: () => (
      <>
        <DemoBackdrop />
        <LightLeak side="left" />
      </>
    ),
  },
  {
    id: "flash-white",
    duration: 90,
    component: () => (
      <>
        <DemoBackdrop />
        <Flash delay={40} />
      </>
    ),
  },
  {
    id: "callout-card",
    duration: 100,
    component: () => (
      <>
        <DemoBackdrop />
        <Callout target={{ x: 58, y: 56, width: 32, height: 18 }} label="Best week yet" delay={15} />
      </>
    ),
  },
  {
    id: "arrow-chart",
    duration: 90,
    component: () => (
      <>
        <DemoBackdrop />
        <Arrow from={{ x: 30, y: 68 }} to={{ x: 42, y: 45 }} label="Best week yet" delay={20} />
      </>
    ),
  },
  {
    id: "scribble-circle-badge",
    duration: 90,
    component: () => (
      <>
        <DemoBackdrop />
        <ScribbleCircle target={{ x: 10, y: 64, width: 13, height: 13 }} delay={20} />
      </>
    ),
  },
  {
    id: "reaction-burst-hearts",
    duration: 110,
    component: () => (
      <>
        <DemoBackdrop />
        <ReactionBurst />
      </>
    ),
  },
  {
    id: "progress-bar-chapters",
    duration: 120,
    component: () => (
      <>
        <DemoBackdrop />
        <ProgressBar
          chapters={[
            { at: 0, label: "Intro" },
            { at: 40, label: "Setup" },
            { at: 90, label: "Result" },
          ]}
        />
      </>
    ),
  },
  {
    id: "safe-zone-guide-tiktok",
    duration: 80,
    component: () => (
      <>
        <DemoBackdrop />
        <SafeZoneGuide platform="tiktok" />
      </>
    ),
  },
] satisfies Demo[];
