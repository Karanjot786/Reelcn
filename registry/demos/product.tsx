import { AbsoluteFill } from "remotion";
import { AppWindow } from "../items/app-window";
import { BeforeAfter } from "../items/before-after";
import { BrowserWindow } from "../items/browser-window";
import { ChatThread } from "../items/chat-thread";
import { CodeBlock } from "../items/code-block";
import { CommandPalette } from "../items/command-palette";
import { alpha, Center, useTheme, useViewport } from "../items/core";
import { Cursor } from "../items/cursor";
import { FeatureCard } from "../items/feature-card";
import { LaptopFrame } from "../items/laptop-frame";
import { PhoneFrame } from "../items/phone-frame";
import { ScreenZoom } from "../items/screen-zoom";
import { SvgDraw } from "../items/svg-draw";
import { Terminal } from "../items/terminal";
import { Toast } from "../items/toast";
import type { Demo } from "./index";

/* ─────────────────────────── shared fake UI screens ─────────────────────────── */
/* Believable product chrome drawn from themed divs — no real app or brand is depicted. */

function StatTile({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <div
      style={{
        flex: 1,
        padding: u(18),
        borderRadius: u(theme.radius * 0.6),
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <div style={{ fontSize: u(15), color: theme.colors.muted }}>{label}</div>
      <div
        style={{
          marginTop: u(4),
          fontFamily: theme.fonts.heading,
          fontWeight: theme.headingWeight,
          fontSize: u(30),
          color: theme.colors.foreground,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/** A generic analytics screen: three stat tiles over a bar chart. Reused as the "content" behind every device frame. */
function FakeDashboard() {
  const theme = useTheme();
  const { u } = useViewport();
  const bars = [40, 65, 50, 80, 60, 95, 72];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: theme.colors.background,
        padding: u(24),
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", gap: u(14) }}>
        <StatTile label="Renders" value="12.4k" />
        <StatTile label="Items" value="108" />
        <StatTile label="Uptime" value="99.98%" />
      </div>
      <div
        style={{
          marginTop: u(18),
          height: u(150),
          padding: u(18),
          borderRadius: u(theme.radius * 0.6),
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          display: "flex",
          alignItems: "flex-end",
          gap: u(10),
        }}
      >
        {bars.map((bar, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: `${bar}%`,
              borderRadius: u(4),
              background: index === bars.length - 2 ? theme.colors.accent : alpha(theme.colors.accent, 0.35),
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** A generic feed screen: a stack of notification-style rows. Used inside `phone-frame`. */
function FakeFeed() {
  const theme = useTheme();
  const { u } = useViewport();
  const rows = ["Deploy succeeded", "New comment on #142", "Invite accepted", "Weekly summary ready"];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: theme.colors.background,
        padding: u(20),
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: u(12),
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontWeight: theme.headingWeight,
          fontSize: u(22),
          color: theme.colors.foreground,
        }}
      >
        Activity
      </div>
      {rows.map((row) => (
        <div
          key={row}
          style={{
            padding: u(14),
            borderRadius: u(theme.radius * 0.6),
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            fontSize: u(16),
            color: theme.colors.foreground,
          }}
        >
          {row}
        </div>
      ))}
    </div>
  );
}

/** A lighter "old" screen for before/after comparisons: plain rows, no cards or color. */
function FakePlainList() {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <AbsoluteFill style={{ background: theme.colors.background, padding: u(48), boxSizing: "border-box" }}>
      {["Renders", "Items", "Uptime"].map((row) => (
        <div
          key={row}
          style={{
            padding: `${u(14)}px 0`,
            borderBottom: `1px solid ${theme.colors.border}`,
            fontSize: u(24),
            color: theme.colors.muted,
          }}
        >
          {row}
        </div>
      ))}
    </AbsoluteFill>
  );
}

/* ────────────────────────────── code-block ────────────────────────────── */

function CodeBlockTyping() {
  return (
    <Center>
      <CodeBlock
        title="render.ts"
        language="ts"
        code={'const video = await render({\n  fps: 30,\n  codec: "h264",\n});'}
        typing={40}
        highlightLines={[3]}
      />
    </Center>
  );
}

function CodeBlockDiff() {
  return (
    <Center>
      <CodeBlock
        title="theme.ts"
        language="ts"
        code={'export const theme = {\n  accent: "#6d7cff",\n  radius: 20,\n};'}
        diff={{ add: [2], remove: [] }}
        highlightAt={16}
      />
    </Center>
  );
}

/* ─────────────────────────────── terminal ─────────────────────────────── */

function TerminalInstall() {
  return (
    <Center>
      <Terminal
        lines={[
          { type: "command", text: "npx shadcn@latest add ./r/terminal.json" },
          { type: "output", text: "Created 3 files" },
          { type: "command", text: "pnpm build" },
          { type: "output", text: "Build complete in 1.2s" },
        ]}
      />
    </Center>
  );
}

/* ────────────────────────────── browser-window ────────────────────────────── */

function BrowserWindowDemo() {
  return (
    <Center>
      <BrowserWindow url="reelcn.dev/pricing">
        <FakeDashboard />
      </BrowserWindow>
    </Center>
  );
}

function BrowserWindowPosterDemo() {
  return (
    <Center>
      <BrowserWindow url="reelcn.dev/pricing" poster>
        <FakeDashboard />
      </BrowserWindow>
    </Center>
  );
}

/* ──────────────────────────────── phone-frame ──────────────────────────────── */

function PhoneFrameDemo() {
  return (
    <Center>
      <PhoneFrame>
        <FakeFeed />
      </PhoneFrame>
    </Center>
  );
}

/* ─────────────────────────────── laptop-frame ─────────────────────────────── */

function LaptopFrameDemo() {
  return (
    <Center>
      <LaptopFrame>
        <FakeDashboard />
      </LaptopFrame>
    </Center>
  );
}

/* ──────────────────────────────── app-window ──────────────────────────────── */

function AppWindowDemo() {
  return (
    <Center>
      <AppWindow title="Overview">
        <FakeDashboard />
      </AppWindow>
    </Center>
  );
}

function AppWindowPosterDemo() {
  return (
    <Center>
      <AppWindow title="Overview" poster>
        <FakeDashboard />
      </AppWindow>
    </Center>
  );
}

/* ────────────────────────────────── cursor ────────────────────────────────── */

function CursorDemo() {
  const theme = useTheme();
  return (
    <AbsoluteFill style={{ background: theme.colors.background }}>
      <Center>
        <BrowserWindow url="app.dev" exit={false}>
          <FakeDashboard />
        </BrowserWindow>
      </Center>
      <Cursor
        waypoints={[
          { x: 22, y: 28, frame: 0 },
          { x: 58, y: 45, frame: 30, click: true },
          { x: 58, y: 68, frame: 55, click: true },
        ]}
      />
    </AbsoluteFill>
  );
}

/* ─────────────────────────────── screen-zoom ─────────────────────────────── */

function ScreenZoomDemo() {
  return (
    <Center>
      <BrowserWindow url="app.dev" exit={false}>
        <ScreenZoom
          focus={[
            { frame: 0, x: 0, y: 0, width: 100, height: 100 },
            { frame: 45, x: 36, y: 6, width: 58, height: 32 },
            { frame: 90, x: 0, y: 0, width: 100, height: 100 },
          ]}
        >
          <FakeDashboard />
        </ScreenZoom>
      </BrowserWindow>
    </Center>
  );
}

/* ───────────────────────────────── toast ───────────────────────────────── */

function ToastSuccess() {
  const { isPortrait } = useViewport();
  return (
    <AbsoluteFill>
      <FakeDashboard />
      <Toast
        variant="success"
        title="Deployed"
        description="Live in 12 regions"
        edge={isPortrait ? "top" : "bottom-right"}
      />
    </AbsoluteFill>
  );
}

function ToastError() {
  const { isPortrait } = useViewport();
  return (
    <AbsoluteFill>
      <FakeDashboard />
      <Toast
        variant="error"
        title="Build failed"
        description="Type error in render.ts"
        edge={isPortrait ? "top" : "top-right"}
      />
    </AbsoluteFill>
  );
}

function ToastSettle() {
  return (
    <Center>
      <Toast variant="info" title="Synced" description="Every device is up to date" motion="settle" />
    </Center>
  );
}

/* ─────────────────────────────── chat-thread ─────────────────────────────── */

function ChatThreadDemo() {
  // PhoneFrame's screen shrinks a lot in landscape/square formats (the frame height
  // is capped by canvas height, not width) — mirror its sizing so the thread never
  // overflows the phone's screen edges. Keep in sync with phone-frame.tsx defaults.
  const { width, height, safe, isPortrait } = useViewport();
  const aspect = 9 / 19.5;
  const maxH = (height - safe.top - safe.bottom) * (isPortrait ? 0.86 : 0.82);
  const maxW = width - safe.x * 2;
  const frameH = Math.min(maxH, maxW / aspect);
  const frameW = frameH * aspect;
  const screenW = frameW - 28;
  const screenH = frameH - 52;
  return (
    <Center>
      <PhoneFrame>
        <ChatThread
          width={screenW}
          height={screenH}
          messages={[
            { from: "me", text: "Can it render 9:16?", at: 0 },
            { from: "them", text: "Yes — same component, three formats.", at: 34 },
            { from: "me", text: "Nice, shipping it today", at: 66 },
          ]}
        />
      </PhoneFrame>
    </Center>
  );
}

/* ─────────────────────────── command-palette ─────────────────────────── */

function CommandPaletteDemo() {
  return (
    <Center>
      <CommandPalette
        items={[
          { label: "New project" },
          { label: "New template" },
          { label: "Open settings", hint: "⌘," },
          { label: "Invite teammate" },
        ]}
        query="new t"
        select="New template"
        selectAt={90}
      />
    </Center>
  );
}

/* ─────────────────────────────── feature-card ─────────────────────────────── */

// A function, not a constant: JSX evaluated at module load runs before React is available.
const boltIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 3 4 14h6l-1 7 9-11h-6z" />
  </svg>
);

function FeatureCardDemo() {
  return (
    <Center>
      <FeatureCard
        icon={boltIcon()}
        title="Zero config"
        body="Install with shadcn, no path aliases to set up."
        badge="New"
      />
    </Center>
  );
}

/* ─────────────────────────────── before-after ─────────────────────────────── */

function BeforeAfterDemo() {
  return <BeforeAfter labels={["Before", "After"]} before={<FakePlainList />} after={<FakeDashboard />} />;
}

/* ──────────────────────────────── svg-draw ──────────────────────────────── */

function SvgDrawDemo() {
  return (
    <Center>
      <SvgDraw
        viewBox="0 0 24 24"
        paths={["M20 6 9 17l-5-5", "M4 12h1", "M19 12h1"]}
        size={220}
        strokeWidth={2}
        fill="none"
      />
    </Center>
  );
}

export default [
  { id: "code-block-typing", duration: 90, component: CodeBlockTyping },
  { id: "code-block-diff", duration: 75, component: CodeBlockDiff },
  { id: "terminal-install", duration: 120, component: TerminalInstall },
  { id: "browser-window-dashboard", duration: 75, component: BrowserWindowDemo },
  { id: "browser-window-poster", duration: 75, component: BrowserWindowPosterDemo },
  { id: "phone-frame-feed", duration: 75, component: PhoneFrameDemo },
  { id: "laptop-frame-dashboard", duration: 75, component: LaptopFrameDemo },
  { id: "app-window-overview", duration: 75, component: AppWindowDemo },
  { id: "app-window-poster", duration: 75, component: AppWindowPosterDemo },
  { id: "cursor-click-path", duration: 90, bare: true, component: CursorDemo },
  { id: "screen-zoom-detail", duration: 100, component: ScreenZoomDemo },
  { id: "toast-success", duration: 90, bare: true, component: ToastSuccess },
  { id: "toast-error", duration: 90, bare: true, component: ToastError },
  { id: "toast-settle", duration: 90, bare: true, component: ToastSettle },
  { id: "chat-thread-reply", duration: 110, component: ChatThreadDemo },
  { id: "command-palette-filter", duration: 100, component: CommandPaletteDemo },
  { id: "feature-card-rise", duration: 75, component: FeatureCardDemo },
  { id: "before-after-wipe", duration: 75, component: BeforeAfterDemo },
  { id: "svg-draw-check", duration: 75, component: SvgDrawDemo },
] satisfies Demo[];
