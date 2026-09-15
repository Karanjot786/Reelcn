import { AbsoluteFill, Img, staticFile } from "remotion";
import { AppWindow } from "../items/app-window";
import { BeforeAfter } from "../items/before-after";
import { BrowserWindow } from "../items/browser-window";
import { Button, buttonBoxSize, FONT_SIZE, useButtonAnchors } from "../items/button";
import { ChatThread } from "../items/chat-thread";
import { CodeBlock } from "../items/code-block";
import { CommandPalette } from "../items/command-palette";
import {
  type AnchorRect,
  alpha,
  anchorId,
  anchorToContentPercent,
  Center,
  type Place,
  requireAnchor,
  useTextMetrics,
  useTheme,
  useViewport,
} from "../items/core";
import { stepsDuration } from "../items/core-math";
import { Cursor } from "../items/cursor";
import { Dialog, useDialogAnchors } from "../items/dialog";
import { FeatureCard } from "../items/feature-card";
import { Input } from "../items/input";
import { LaptopFrame } from "../items/laptop-frame";
import { PhoneFrame } from "../items/phone-frame";
import { ScreenZoom } from "../items/screen-zoom";
import { Select } from "../items/select";
import { STORY_FPS } from "../items/story";
import { Storyboard, uiScene } from "../items/storyboard";
import { SvgDraw } from "../items/svg-draw";
import { Switch } from "../items/switch";
import { Tabs } from "../items/tabs";
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

function CodeBlockFollow() {
  return (
    <Center>
      <CodeBlock
        title="render.ts"
        language="ts"
        code={'const video = await render({\n  fps: 30,\n  codec: "h264",\n  width: 1920,\n  height: 1080,\n});'}
        typing={40}
        follow={{ zoom: 2.5 }}
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

function TerminalFollow() {
  return (
    <Center>
      <Terminal
        lines={[
          { type: "command", text: "npx shadcn@latest add ./r/terminal.json" },
          { type: "output", text: "Created 3 files" },
          { type: "command", text: "pnpm build" },
          { type: "output", text: "Build complete in 1.2s" },
        ]}
        follow={{ zoom: 2.5 }}
      />
    </Center>
  );
}

/* ────────────────────────────── browser-window ────────────────────────────── */

function BrowserWindowDemo() {
  return (
    <Center>
      <BrowserWindow url="reelcn.dev/pricing">
        <Img
          src={staticFile("reelcn-demo/screenshots/fictional-analytics.webp")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
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
        <Img
          src={staticFile("reelcn-demo/screenshots/fictional-mobile-feed.webp")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </PhoneFrame>
    </Center>
  );
}

/* ─────────────────────────────── laptop-frame ─────────────────────────────── */

function LaptopFrameDemo() {
  return (
    <Center>
      <LaptopFrame>
        <Img
          src={staticFile("reelcn-demo/screenshots/reelcn-docs.webp")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
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

/**
 * Task 1 Step 9b (ponytail-review blocker 1): an end-to-end proof that `anchorToContentPercent` converts
 * a kit anchor's canvas-% rect into a nested `ScreenZoom`'s own content-% correctly. The real "Pay $48.20"
 * button sits at its own ambient `place`, anchored the ordinary (unnested) way; a "recording" window
 * elsewhere on the same wider canvas shows a miniature replica of that same screen, placed via the exact
 * same `anchorToContentPercent` conversion `ScreenZoom` runs internally for its `target.contentBox` (the
 * window's own canvas-relative rect) — so the math is provable by construction: if the zoom frames the
 * replica, the two independent uses of the conversion agree.
 */
function ScreenZoomNestedTargetDemo() {
  const theme = useTheme();
  const buttonProps = { id: "pay-button", label: "Pay $48.20", place: { x: 24, y: 60 } };
  const anchors = useButtonAnchors(buttonProps);
  const anchor = requireAnchor(anchors, buttonProps.id, "ScreenZoomNestedTargetDemo");
  // The "recording" window's own canvas-relative rect — deliberately not the identity box, so this
  // exercises a real conversion, not the no-op default.
  const windowBox: AnchorRect = { x: 52, y: 12, width: 44, height: 70 };
  const replicaRect = anchorToContentPercent(anchor, windowBox);
  const replicaPlace: Place = { x: replicaRect.x + replicaRect.width / 2, y: replicaRect.y + replicaRect.height / 2 };
  return (
    <AbsoluteFill style={{ background: theme.colors.background }}>
      <Button {...buttonProps} />
      <div
        style={{
          position: "absolute",
          left: `${windowBox.x}%`,
          top: `${windowBox.y}%`,
          width: `${windowBox.width}%`,
          height: `${windowBox.height}%`,
          overflow: "hidden",
          borderRadius: 8,
          border: `1px solid ${theme.colors.border}`,
          background: theme.colors.surface,
        }}
      >
        <ScreenZoom
          focus={[
            { frame: 0, x: 0, y: 0, width: 100, height: 100 },
            { frame: 45, target: { anchors, id: buttonProps.id, contentBox: windowBox } },
          ]}
        >
          <Button {...buttonProps} place={replicaPlace} size={10} />
        </ScreenZoom>
      </div>
    </AbsoluteFill>
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

function CommandPaletteFollow() {
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
        follow={{ zoom: 2.5 }}
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

/* ──────────────────────────────── button ──────────────────────────────── */

function ButtonDemo() {
  return (
    <Center>
      <Button
        id="pay-button"
        label="Pay $48.20"
        steps={[
          { at: 0, state: "idle" },
          { at: 1, state: "press" },
          { at: 1.4, state: "loading" },
          { at: 2.4, state: "success" },
        ]}
      />
    </Center>
  );
}

function ButtonAnchorProofResolverDemo() {
  const buttonProps = { id: "pay-button", label: "Pay $48.20", place: { x: 50, y: 62 } };
  return (
    <Center>
      <Button {...buttonProps} />
      <Cursor
        waypoints={[]}
        target={{ anchors: useButtonAnchors(buttonProps), id: "pay-button", frame: 20, click: false }}
      />
    </Center>
  );
}

function ButtonAnchorProofLiteralDemo() {
  const buttonProps = { id: "pay-button", label: "Pay $48.20", place: { x: 50, y: 62 } };
  const { u, width, height } = useViewport();
  const theme = useTheme();
  // Independently re-derives the canvas-%-conversion arithmetic `useButtonAnchors` does internally — the
  // actual thing this proof exists to catch a mistake in, not just a re-call of the same function.
  const metrics = useTextMetrics(buttonProps.label, {
    fontFamily: theme.fonts.body,
    fontSize: u(FONT_SIZE),
    fontWeight: 600,
  });
  const box = buttonBoxSize(undefined, u, metrics.width);
  const wPct = (box.width / width) * 100;
  const hPct = (box.height / height) * 100;
  const literalRect = {
    x: buttonProps.place.x - wPct / 2,
    y: buttonProps.place.y - hPct / 2,
    width: wPct,
    height: hPct,
  };
  return (
    <Center>
      <Button {...buttonProps} />
      <Cursor
        waypoints={[]}
        target={{ anchors: { "pay-button": literalRect }, id: "pay-button", frame: 20, click: false }}
      />
    </Center>
  );
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

function SwitchDemo() {
  return (
    <Center>
      <Switch
        id="notifications"
        label="Push notifications"
        steps={[
          { at: 0, state: "off" },
          { at: 1, state: "on" },
        ]}
      />
    </Center>
  );
}

/* ──────────────────────────────── input ──────────────────────────────── */

function InputDemo() {
  return (
    <Center>
      <Input
        id="email"
        label="Work email"
        placeholder="you@company.com"
        steps={[
          { at: 0, state: "idle" },
          { at: 0.6, state: "active" },
          { at: 0.8, state: "typing", type: "ada@hexhaus.dev" },
        ]}
      />
    </Center>
  );
}

/* ──────────────────────────────── select ──────────────────────────────── */

function SelectDemo() {
  return (
    <Center>
      <Select
        id="plan"
        options={["Starter", "Growth", "Scale"]}
        steps={[
          { at: 0, state: "closed" },
          { at: 0.5, state: "open" },
          { at: 1.2, state: { highlight: 1 } },
          { at: 1.8, state: { highlight: 2 } },
        ]}
      />
    </Center>
  );
}

/* ──────────────────────────────── tabs ──────────────────────────────── */

function TabsDemo() {
  return (
    <Center>
      <Tabs
        id="view"
        labels={["Overview", "Usage", "Billing"]}
        steps={[
          { at: 0, state: { active: 0 } },
          { at: 1, state: { active: 2 } },
        ]}
      />
    </Center>
  );
}

/* ──────────────────────────────── dialog ──────────────────────────────── */

function DialogDemo() {
  const dialogProps = { id: "confirm", title: "Delete staging-db-7?", place: { x: 50, y: 50 } };
  const submitProps = { id: "submit", label: "Delete database", place: { x: 50, y: 60 } };
  return (
    <Dialog
      {...dialogProps}
      steps={[
        { at: 0, state: "closed" },
        { at: 0.5, state: "open" },
      ]}
    >
      <Button {...submitProps} variant="primary" />
    </Dialog>
  );
}

function DialogAnchorProofDemo() {
  const dialogProps = { id: "confirm", title: "Delete staging-db-7?", place: { x: 50, y: 50 } };
  const submitProps = { id: "submit", label: "Delete database", place: { x: 50, y: 60 } };
  // The nested button's anchor, prefixed with the dialog's own id via `anchorId` — the same string
  // `anchorId("confirm", "submit")` produces — merged into one map exactly as a `ui`-scene-style author
  // would by hand, then targeted by a cursor to prove the prefixed id resolves to the real rect.
  const anchors = {
    ...useDialogAnchors(dialogProps),
    [anchorId("confirm", "submit")]: useButtonAnchors(submitProps).submit,
  };
  return (
    <Dialog {...dialogProps} steps={[{ at: 0, state: "open" }]}>
      <Button {...submitProps} variant="primary" />
      <Cursor waypoints={[{ x: 10, y: 10, frame: 0 }]} target={{ anchors, id: "confirm.submit" }} />
    </Dialog>
  );
}

/* ──────────────────────────────── ui scene ──────────────────────────────── */

const UI_SCENE_SIGNUP_STEPS = [
  { at: 0.5, target: "email", type: "ada@hexhaus.dev" },
  { at: 2, target: "notifications", click: "notifications" },
  { at: 2.8, click: "submit" },
];

function UiSceneSignupDemo() {
  return (
    <Storyboard
      scenes={[uiScene]}
      story={{
        scenes: [
          {
            type: "ui",
            components: [
              { id: "email", component: "input", props: { label: "Work email", placeholder: "you@company.com" } },
              { id: "notifications", component: "switch", props: { label: "Email me about outages" } },
              { id: "submit", component: "button", props: { label: "Create account", variant: "primary" } },
            ],
            steps: UI_SCENE_SIGNUP_STEPS,
            // A literal story object (unlike JSON fed through calculateMetadata) skips schema
            // defaulting, so `cursor`'s zod default never applies here — set explicitly so the demo
            // actually shows the cursor path it exists to demonstrate.
            cursor: true,
          },
        ],
      }}
    />
  );
}

export default [
  { id: "code-block-typing", duration: 90, component: CodeBlockTyping },
  { id: "code-block-follow", duration: 90, component: CodeBlockFollow },
  { id: "code-block-diff", duration: 75, component: CodeBlockDiff },
  { id: "terminal-install", duration: 120, component: TerminalInstall },
  { id: "terminal-follow", duration: 120, component: TerminalFollow },
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
  { id: "command-palette-follow", duration: 100, component: CommandPaletteFollow },
  { id: "feature-card-rise", duration: 75, component: FeatureCardDemo },
  { id: "before-after-wipe", duration: 75, component: BeforeAfterDemo },
  { id: "svg-draw-check", duration: 75, component: SvgDrawDemo },
  {
    id: "button",
    duration: stepsDuration([{ at: 0 }, { at: 1 }, { at: 1.4 }, { at: 2.4 }], 30, STORY_FPS),
    component: ButtonDemo,
  },
  { id: "button-anchor-proof-resolver", duration: 25, component: ButtonAnchorProofResolverDemo },
  { id: "button-anchor-proof-literal", duration: 25, component: ButtonAnchorProofLiteralDemo },
  { id: "screen-zoom-nested-target", duration: 90, bare: true, component: ScreenZoomNestedTargetDemo },
  {
    id: "switch",
    duration: stepsDuration([{ at: 0 }, { at: 1 }], 30, STORY_FPS),
    component: SwitchDemo,
  },
  {
    id: "input",
    duration: stepsDuration([{ at: 0 }, { at: 0.6 }, { at: 0.8 }], 45, STORY_FPS),
    component: InputDemo,
  },
  {
    id: "select",
    duration: stepsDuration([{ at: 0 }, { at: 0.5 }, { at: 1.2 }, { at: 1.8 }], 30, STORY_FPS),
    component: SelectDemo,
  },
  {
    id: "tabs",
    duration: stepsDuration([{ at: 0 }, { at: 1 }], 30, STORY_FPS),
    component: TabsDemo,
  },
  {
    id: "dialog",
    duration: stepsDuration([{ at: 0 }, { at: 0.5 }], 45, STORY_FPS),
    component: DialogDemo,
  },
  { id: "dialog-anchor-proof", duration: 30, component: DialogAnchorProofDemo },
  {
    id: "ui-scene-signup",
    duration: stepsDuration(
      UI_SCENE_SIGNUP_STEPS.map((s) => ({ at: s.at })),
      30,
      STORY_FPS,
    ),
    bare: true,
    component: UiSceneSignupDemo,
  },
] satisfies Demo[];
