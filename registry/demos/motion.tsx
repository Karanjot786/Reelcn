import { AbsoluteFill } from "remotion";
import { Animate, type AnimateEffect } from "../items/animate";
import { BentoGrid } from "../items/bento-grid";
import { Camera } from "../items/camera";
import { alpha, Center, useTheme, useViewport } from "../items/core";
import { Marquee } from "../items/marquee";
import { SplitScreen } from "../items/split-screen";
import { Stagger } from "../items/stagger";
import type { Demo } from "./index";

const effects: AnimateEffect[] = ["fade", "up", "down", "left", "right", "scale", "pop", "blur", "zoom"];

function Tile({ label }: { label: string }) {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <div
      style={{
        width: u(230),
        height: u(150),
        borderRadius: u(theme.radius),
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        display: "grid",
        placeItems: "center",
        fontSize: u(32),
        fontWeight: 600,
        color: theme.colors.foreground,
      }}
    >
      {label}
    </div>
  );
}

function AnimateGrid() {
  const { u } = useViewport();
  return (
    <Center>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: u(26), maxWidth: u(900) }}>
        {effects.map((effect, index) => (
          <Animate key={effect} effect={effect} delay={index * 3}>
            <Tile label={effect} />
          </Animate>
        ))}
      </div>
    </Center>
  );
}

/* ─────────────────────────────── stagger ─────────────────────────────── */

function StepCard({ index, label }: { index: number; label: string }) {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <div
      style={{
        width: u(200),
        padding: `${u(26)}px ${u(28)}px`,
        borderRadius: u(theme.radius),
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <div style={{ fontFamily: theme.fonts.mono, fontSize: u(24), color: theme.colors.accent }}>0{index}</div>
      <div
        style={{
          marginTop: u(18),
          fontFamily: theme.fonts.heading,
          fontWeight: theme.headingWeight,
          fontSize: u(38),
          color: theme.colors.foreground,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function StaggerSteps() {
  return (
    <Center>
      <Stagger>
        {["Write", "Preview", "Render", "Ship"].map((label, index) => (
          <StepCard key={label} index={index + 1} label={label} />
        ))}
      </Stagger>
    </Center>
  );
}

/* ─────────────────────────────── camera ─────────────────────────────── */

function Panel({ title, value, bars }: { title: string; value: string; bars: number[] }) {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <div
      style={{
        width: u(380),
        height: u(380),
        padding: u(32),
        borderRadius: u(theme.radius),
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontSize: u(24), color: theme.colors.muted }}>{title}</div>
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontWeight: theme.headingWeight,
          fontSize: u(64),
          color: theme.colors.foreground,
        }}
      >
        {value}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: u(12) }}>
        {bars.map((bar, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: `${bar}%`,
              borderRadius: u(6),
              background: index === bars.length - 1 ? theme.colors.accent : alpha(theme.colors.accent, 0.3),
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const { u } = useViewport();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: u(40) }}>
        <Panel title="Renders" value="12.4k" bars={[30, 45, 40, 60, 72, 90]} />
        <Panel title="Themes" value="6" bars={[50, 50, 70, 70, 85, 100]} />
        <Panel title="Items" value="108" bars={[20, 35, 55, 60, 80, 95]} />
        <Panel title="Formats" value="3" bars={[60, 40, 70, 50, 80, 65]} />
      </div>
    </AbsoluteFill>
  );
}

// Panel centers sit 210 design units from the middle in every format, so one keyframe list fits all three.
function CameraTour() {
  return (
    <Camera
      keyframes={[
        { frame: 0, zoom: 1 },
        { frame: 24, x: -210, y: -210, zoom: 2 },
        { frame: 36 },
        { frame: 62, x: 210, y: 210, zoom: 2.2, rotate: -4 },
        { frame: 74 },
        { frame: 100, x: 0, y: 0, zoom: 1, rotate: 0 },
      ]}
      shake={2}
    >
      <Dashboard />
    </Camera>
  );
}

function CameraShake() {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <Camera
      keyframes={[
        { frame: 0, zoom: 1.25 },
        { frame: 100, zoom: 1 },
      ]}
      motion="gentle"
      shake={14}
      shakeSpeed={2.5}
    >
      <Center>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              padding: `${u(8)}px ${u(20)}px`,
              borderRadius: u(theme.radius),
              background: theme.colors.accent,
              color: theme.colors.accentForeground,
              fontSize: u(30),
              fontWeight: 700,
              letterSpacing: "0.12em",
            }}
          >
            LIVE
          </div>
          <div
            style={{
              marginTop: u(24),
              fontFamily: theme.fonts.heading,
              fontWeight: theme.headingWeight,
              fontSize: u(120),
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: theme.colors.foreground,
            }}
          >
            Launch day
          </div>
        </div>
      </Center>
    </Camera>
  );
}

/* ───────────────────────────── split-screen ───────────────────────────── */

/** Pane content: reads the pane's own viewport, so it sizes itself to the pane, not the canvas. */
function PaneArt({ word, accent = false }: { word: string; accent?: boolean }) {
  const theme = useTheme();
  const { u, width, height } = useViewport();
  const ring = Math.min(width, height) * 0.62;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          width: ring,
          height: ring,
          borderRadius: "50%",
          border: `${u(3)}px solid ${accent ? theme.colors.accent : theme.colors.border}`,
          background: accent ? alpha(theme.colors.accent, 0.12) : "transparent",
        }}
      />
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontWeight: theme.headingWeight,
          fontSize: u(96),
          letterSpacing: "-0.03em",
          color: accent ? theme.colors.foreground : theme.colors.muted,
        }}
      >
        {word}
      </div>
    </AbsoluteFill>
  );
}

function SplitDuo() {
  return (
    <SplitScreen labels={["Before", "After"]}>
      <PaneArt word="Keyframes" />
      <PaneArt word="Components" accent />
    </SplitScreen>
  );
}

function SplitQuad() {
  return (
    <SplitScreen labels={["Wide", "Close", "Screen", "Guest"]}>
      <PaneArt word="A" />
      <PaneArt word="B" accent />
      <PaneArt word="C" accent />
      <PaneArt word="D" />
    </SplitScreen>
  );
}

/* ────────────────────────────── bento-grid ────────────────────────────── */

function BentoFeatures() {
  return (
    <Center>
      <BentoGrid
        tiles={[
          { title: "Six themes", body: "Swap the whole look with one prop.", span: 2, accent: true },
          { title: "Responsive", body: "16:9, 9:16 and 1:1." },
          { title: "Seeded", body: "Same frame, same pixels." },
          { title: "Copy-paste", body: "You own every line." },
          { title: "Agent-ready", body: "An llms.txt entry for every item.", span: 2 },
          { title: "MIT", body: "Free forever." },
        ]}
      />
    </Center>
  );
}

/* ──────────────────────────────── marquee ──────────────────────────────── */

function MarqueeBands() {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <AbsoluteFill style={{ justifyContent: "center", gap: u(56) }}>
      <Marquee items={["Remotion", "React", "TypeScript", "Themes", "Captions"]} size={72} />
      <Marquee
        items={["Ship videos", "Not keyframes"]}
        direction="right"
        size={56}
        fade={0}
        background={theme.colors.accent}
        color={theme.colors.accentForeground}
        accentColor={theme.colors.accentForeground}
        style={{ rotate: "-4deg", width: "120%", marginLeft: "-10%" }}
      />
      <Marquee
        items={["16:9", "9:16", "1:1", "30 fps", "MIT"]}
        font="mono"
        size={32}
        speed={90}
        color={theme.colors.muted}
      />
    </AbsoluteFill>
  );
}

export default [
  { id: "animate", duration: 75, component: AnimateGrid },
  { id: "stagger-steps", duration: 90, component: StaggerSteps },
  { id: "camera-tour", duration: 120, component: CameraTour },
  { id: "camera-shake", duration: 90, component: CameraShake },
  { id: "split-screen-duo", duration: 90, component: SplitDuo },
  { id: "split-screen-quad", duration: 90, component: SplitQuad },
  { id: "bento-grid-features", duration: 105, component: BentoFeatures },
  { id: "marquee-bands", duration: 120, component: MarqueeBands },
] satisfies Demo[];
