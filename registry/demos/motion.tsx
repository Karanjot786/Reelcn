import type { ReactNode } from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Animate, type AnimateEffect } from "../items/animate";
import { BentoGrid } from "../items/bento-grid";
import { Camera } from "../items/camera";
import { alpha, Center, useTheme, useViewport } from "../items/core";
import { LaptopFrame } from "../items/laptop-frame";
import { LayoutMorph } from "../items/layout-morph";
import { LogoSting } from "../items/logo-sting";
import { Marquee } from "../items/marquee";
import { Space } from "../items/space";
import { SplitScreen } from "../items/split-screen";
import { Stage } from "../items/stage";
import { Stagger } from "../items/stagger";
import { customizable } from "./customizable";
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

/** The animate demo's grid: the customizable first tile, then one tile per remaining effect. */
function AnimateGrid({ children }: { children: ReactNode }) {
  const { u } = useViewport();
  return (
    <Center>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: u(26), maxWidth: u(900) }}>
        {children}
        {effects.slice(1).map((effect, index) => (
          <Animate key={effect} effect={effect} delay={(index + 1) * 3}>
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

// Same beats as CameraTour, but the backdrop sits in a depth={0} layer (no parallax) while the
// dashboard sits in a depth={1} layer (full parallax) — the panels visibly slide/zoom past a static grid.
function CameraLayers() {
  const theme = useTheme();
  const { u } = useViewport();
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
      <Camera.Layer depth={0}>
        <AbsoluteFill
          style={{
            background: theme.colors.background,
            backgroundImage: `linear-gradient(${alpha(theme.colors.border, 0.6)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.colors.border, 0.6)} 1px, transparent 1px)`,
            backgroundSize: `${u(80)}px ${u(80)}px`,
          }}
        />
      </Camera.Layer>
      <Camera.Layer depth={1}>
        <Dashboard />
      </Camera.Layer>
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

/* ──────────────────────────────── marquee ──────────────────────────────── */

/** The marquee demo's other two bands, below the customizable first one. */
function MarqueeBands({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <AbsoluteFill style={{ justifyContent: "center", gap: u(56) }}>
      {children}
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

/* ──────────────────────────────── stage ─────────────────────────────── */

/** The stage demo's laptop screen. */
function StudioScreen() {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        background: theme.colors.background,
        fontFamily: theme.fonts.heading,
        fontWeight: theme.headingWeight,
        fontSize: u(40),
        color: theme.colors.foreground,
      }}
    >
      Studio
    </div>
  );
}

/* ──────────────────────────────── space ─────────────────────────────── */

function GalleryCard({ label }: { label: string }) {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <div
      style={{
        width: u(260),
        height: u(160),
        borderRadius: u(theme.radius),
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        display: "grid",
        placeItems: "center",
        fontFamily: theme.fonts.heading,
        fontWeight: theme.headingWeight,
        fontSize: u(28),
        color: theme.colors.foreground,
      }}
    >
      {label}
    </div>
  );
}

// World units are on the same order as shortSide/2 (Space's scale is shortSide/2/depth), so beats and
// child offsets sit in the hundreds, matching the cards' own design-unit sizing.

const LAYOUT_MORPH_ITEMS = [
  { src: staticFile("reelcn-demo/screenshots/fictional-analytics.webp") },
  { src: staticFile("reelcn-demo/screenshots/fictional-mobile-feed.webp") },
  { src: staticFile("reelcn-demo/screenshots/reelcn-docs.webp") },
];

export default [
  {
    id: "animate",
    duration: 75,
    ...customizable(
      "Animate",
      Animate,
      {
        effect: "fade",
        delay: 0,
        get children() {
          return <Tile label="fade" />;
        },
      },
      (el) => <AnimateGrid>{el}</AnimateGrid>,
      { children: '<Tile label="fade" />' },
    ),
  },
  {
    id: "stagger-steps",
    duration: 90,
    ...customizable(
      "Stagger",
      Stagger,
      {
        motion: { preset: "smooth", step: 3 },
        get children() {
          return ["Write", "Preview", "Render", "Ship"].map((label, index) => (
            <StepCard key={label} index={index + 1} label={label} />
          ));
        },
      },
      (el) => <Center>{el}</Center>,
      {
        children:
          '<StepCard index={1} label="Write" />\n<StepCard index={2} label="Preview" />\n<StepCard index={3} label="Render" />\n<StepCard index={4} label="Ship" />',
      },
    ),
  },
  {
    id: "camera-tour",
    duration: 120,
    ...customizable(
      "Camera",
      Camera,
      {
        keyframes: [
          { frame: 0, zoom: 1 },
          { frame: 24, x: -210, y: -210, zoom: 2 },
          { frame: 36 },
          { frame: 62, x: 210, y: 210, zoom: 2.2, rotate: -4 },
          { frame: 74 },
          { frame: 100, x: 0, y: 0, zoom: 1, rotate: 0 },
        ],
        shake: 2,
        get children() {
          return <Dashboard />;
        },
      },
      undefined,
      { children: "<Dashboard />" },
    ),
  },
  { id: "camera-shake", duration: 90, component: CameraShake },
  { id: "camera-layers", duration: 100, component: CameraLayers },
  {
    id: "split-screen-duo",
    duration: 90,
    ...customizable(
      "SplitScreen",
      SplitScreen,
      {
        labels: ["Before", "After"],
        get children() {
          return [<PaneArt key="a" word="Keyframes" />, <PaneArt key="b" word="Components" accent />];
        },
      },
      undefined,
      { children: '<PaneArt word="Keyframes" />\n<PaneArt word="Components" accent />' },
    ),
  },
  { id: "split-screen-quad", duration: 90, component: SplitQuad },
  {
    id: "bento-grid-features",
    duration: 105,
    ...customizable(
      "BentoGrid",
      BentoGrid,
      {
        tiles: [
          { title: "Six themes", body: "Swap the whole look with one prop.", span: 2, accent: true },
          { title: "Responsive", body: "16:9, 9:16 and 1:1." },
          { title: "Seeded", body: "Same frame, same pixels." },
          { title: "Copy-paste", body: "You own every line." },
          { title: "Agent-ready", body: "An llms.txt entry for every item.", span: 2 },
          { title: "MIT", body: "Free forever." },
        ],
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "marquee-bands",
    duration: 120,
    ...customizable(
      "Marquee",
      Marquee,
      { items: ["Remotion", "React", "TypeScript", "Themes", "Captions"], size: 72 },
      (el) => <MarqueeBands>{el}</MarqueeBands>,
    ),
  },
  {
    id: "stage-tour",
    duration: 120,
    ...customizable(
      "Stage",
      Stage,
      {
        keyframes: [
          { frame: 0, targetX: 0.5, targetY: 0.5, zoom: 1 },
          { frame: 60, targetX: 0.7, targetY: 0.3, zoom: 1.6 },
          { frame: 110, targetX: 0.5, targetY: 0.5, zoom: 1 },
        ],
        get children() {
          return [
            <Stage.Floor key="floor" shadow="soft" />,
            <Stage.KeyLight key="light" angle={35} />,
            <Center key="laptop">
              <LaptopFrame>
                <StudioScreen />
              </LaptopFrame>
            </Center>,
          ];
        },
      },
      undefined,
      {
        children:
          '<Stage.Floor shadow="soft" />\n<Stage.KeyLight angle={35} />\n<Center>\n  <LaptopFrame>\n    <StudioScreen />\n  </LaptopFrame>\n</Center>',
      },
    ),
  },
  {
    id: "space-gallery",
    duration: 100,
    ...customizable(
      "Space",
      Space,
      {
        beats: [
          { frame: 0, lookAt: [0, 0, 0], distance: 700 },
          { frame: 90, lookAt: [200, 0, -100], distance: 480 },
        ],
        get children() {
          return [
            // Wide and Close sit near the same x/y (small on-screen separation) but far apart in z, so Wide's
            // nearer card visibly occludes Close's farther one where they overlap.
            { x: -20, y: -10, z: 0, children: <GalleryCard label="Wide" /> },
            { x: 40, y: 20, z: -220, children: <GalleryCard label="Close" /> },
            { x: 260, y: -30, z: -320, children: <GalleryCard label="Screen" /> },
          ];
        },
      },
      undefined,
      {
        children:
          '{[\n  { x: -20, y: -10, z: 0, children: <GalleryCard label="Wide" /> },\n  { x: 40, y: 20, z: -220, children: <GalleryCard label="Close" /> },\n  { x: 260, y: -30, z: -320, children: <GalleryCard label="Screen" /> },\n]}',
      },
    ),
  },
  {
    id: "layout-morph",
    duration: 150,
    bare: true,
    ...customizable("LayoutMorph", LayoutMorph, {
      items: LAYOUT_MORPH_ITEMS,
      layouts: [
        { at: 0, layout: "grid" },
        { at: 1.5, layout: "mosaic" },
        { at: 3, layout: "strip" },
      ],
    }),
  },
  {
    id: "logo-sting",
    duration: 150,
    ...customizable(
      "LogoSting",
      LogoSting,
      {
        viewBox: "0 0 48 48",
        paths: ["M8 24 L24 8 L40 24 L24 40 Z", "M18 24 L24 18 L30 24 L24 30 Z"],
        size: 160,
        sfx: "chime",
      },
      (element) => <Center>{element}</Center>,
    ),
  },
] satisfies Demo[];
