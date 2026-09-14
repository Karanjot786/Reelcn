/**
 * @title Story Scenes
 * @category lib
 * @description Draws each of the storyboard's 15 scene types from catalog items; `storyboard` renders stories with it.
 * @tags storyboard, scenes
 * @example
 * <SceneView scene={{ type: "stat", label: "Weekly users", value: 48200, delta: 12 }} />
 */
import { Video } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, Img, interpolate, useVideoConfig } from "remotion";
import { Animate } from "./animate";
import { Aurora } from "./aurora";
import { BarChart } from "./bar-chart";
import { Beams } from "./beams";
import { Bokeh } from "./bokeh";
import { BrandSolid } from "./brand-solid";
import { BrowserWindow } from "./browser-window";
import { CodeBlock } from "./code-block";
import { alpha, Center, CLAMP, useMotion, useTheme, useViewport } from "./core";
import { Donut } from "./donut";
import { Dots } from "./dots";
import { FeatureCard } from "./feature-card";
import { GradientMesh } from "./gradient-mesh";
import { Grain } from "./grain";
import { Grid } from "./grid";
import { LaptopFrame } from "./laptop-frame";
import { LineChart } from "./line-chart";
import { LowerThird } from "./lower-third";
import { PhoneFrame } from "./phone-frame";
import { PostCard } from "./post-card";
import { QuoteCard } from "./quote-card";
import { SplitScreen } from "./split-screen";
import { Spotlight } from "./spotlight";
import { Stagger } from "./stagger";
import { Starfield } from "./starfield";
import { StatCounter } from "./stat-counter";
import { CODE_CPS, isVideo, type Scene, type SceneOf } from "./story";
import { Terminal } from "./terminal";
import { TextReveal } from "./text-reveal";

/** Every background a scene can name, keyed by its registry item name. */
export const BACKGROUNDS: Record<string, React.ComponentType> = {
  aurora: Aurora,
  beams: Beams,
  bokeh: Bokeh,
  "brand-solid": BrandSolid,
  dots: Dots,
  "gradient-mesh": GradientMesh,
  grain: Grain,
  grid: Grid,
  spotlight: Spotlight,
  starfield: Starfield,
};

/** A named background, full-bleed behind a scene. */
export function Backdrop({ name }: { name?: string }) {
  const Background = name ? BACKGROUNDS[name] : undefined;
  return Background ? <Background /> : null;
}

/** Headline size in design units: smaller as the line gets longer. */
const headline = (text: string, size: number) =>
  text.length > 60 ? size * 0.55 : text.length > 28 ? size * 0.75 : size;

const cover: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };

const avatarImage = (src?: string) => (src ? <Img src={src} style={cover} /> : undefined);

/** Stand-in for a missing screenshot: a few themed interface bars, so templates render with no assets. */
function ScreenPlaceholder() {
  const theme = useTheme();
  const { u } = useViewport();
  const bar = (width: string, height: number, color: string, radius = 6) => (
    <div style={{ width, height: u(height), borderRadius: u(radius), background: color }} />
  );
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        background: theme.colors.surface,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* A denser top chrome bar (window controls + a tab) reads as "an app", not a mock. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: u(8),
          padding: `${u(10)}px ${u(16)}px`,
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        <div
          style={{ width: u(9), height: u(9), borderRadius: "50%", background: alpha(theme.colors.foreground, 0.25) }}
        />
        <div
          style={{ width: u(9), height: u(9), borderRadius: "50%", background: alpha(theme.colors.foreground, 0.25) }}
        />
        <div
          style={{ width: u(9), height: u(9), borderRadius: "50%", background: alpha(theme.colors.foreground, 0.25) }}
        />
        <div
          style={{
            marginLeft: u(12),
            width: "30%",
            height: u(16),
            borderRadius: u(4),
            background: alpha(theme.colors.foreground, 0.12),
          }}
        />
      </div>
      <div style={{ flex: 1, display: "flex", padding: u(24), gap: u(20) }}>
        <div style={{ width: "22%", display: "flex", flexDirection: "column", gap: u(12) }}>
          {bar("100%", 14, alpha(theme.colors.foreground, 0.3))}
          {bar("80%", 14, alpha(theme.colors.foreground, 0.16))}
          {bar("85%", 14, alpha(theme.colors.foreground, 0.16))}
          {bar("60%", 14, alpha(theme.colors.foreground, 0.16))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: u(16) }}>
          {bar("45%", 24, alpha(theme.colors.foreground, 0.45), 4)}
          {bar("100%", 140, alpha(theme.colors.accent, 0.3), u(theme.radius > 0 ? Math.min(theme.radius, 16) : 6))}
          {bar("90%", 16, alpha(theme.colors.foreground, 0.18))}
          {bar("75%", 16, alpha(theme.colors.foreground, 0.18))}
        </div>
      </div>
    </div>
  );
}

/** An image or a muted video filling its box, or the placeholder screen when there is no source. */
function Media({ src }: { src?: string }) {
  if (!src) return <ScreenPlaceholder />;
  return isVideo(src) ? (
    <Video src={src} muted objectFit="cover" style={{ width: "100%", height: "100%" }} />
  ) : (
    <Img src={src} style={cover} />
  );
}

function TitleScene({ title, subtitle, kicker }: SceneOf<"title">) {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <Center style={{ gap: u(28) }}>
      {kicker ? (
        <TextReveal text={kicker} size={34} font="body" weight={600} color={theme.colors.accent} effect="fade" />
      ) : null}
      <TextReveal text={title} size={headline(title, 132)} />
      {subtitle ? (
        <TextReveal
          text={subtitle}
          size={44}
          font="body"
          weight={400}
          color={theme.colors.muted}
          effect="blur"
          delay={8}
        />
      ) : null}
    </Center>
  );
}

function TextScene({ text, accent }: SceneOf<"text">) {
  return (
    <Center>
      <TextReveal text={text} size={headline(text, 110)} accentWords={accent} />
    </Center>
  );
}

function BulletsScene({ title, items }: SceneOf<"bullets">) {
  const { u } = useViewport();
  return (
    <Center style={{ gap: u(48) }}>
      {title ? <TextReveal text={title} size={72} /> : null}
      <Stagger gap={24} wrap delay={title ? 10 : 0}>
        {items.map((item, index) => (
          <FeatureCard key={index} title={item.text} body={item.detail} badge={item.badge} />
        ))}
      </Stagger>
    </Center>
  );
}

function ImageScene({ src, caption, zoom = true }: SceneOf<"image">) {
  const m = useMotion({ exit: false });
  const scale = zoom ? interpolate(m.frame, [0, m.durationInFrames], [1, 1.08], CLAMP) : 1;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ scale: String(scale) }}>
        <Media src={src} />
      </AbsoluteFill>
      {caption ? <LowerThird name={caption} variant="card" /> : null}
    </AbsoluteFill>
  );
}

function VideoScene({ src, trimStart = 0, trimEnd, muted }: SceneOf<"video">) {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Video
        src={src}
        muted={muted}
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
        trimBefore={trimStart > 0 ? Math.round(trimStart * fps) : undefined}
        trimAfter={trimEnd === undefined ? undefined : Math.round(trimEnd * fps)}
      />
    </AbsoluteFill>
  );
}

function DeviceScene({ device, src, url }: SceneOf<"device">) {
  const screen = <Media src={src} />;
  return (
    <Center>
      {device === "phone" ? (
        <PhoneFrame>{screen}</PhoneFrame>
      ) : device === "laptop" ? (
        <LaptopFrame>{screen}</LaptopFrame>
      ) : (
        <BrowserWindow url={url}>{screen}</BrowserWindow>
      )}
    </Center>
  );
}

function CodeScene({ code, language, title, highlight }: SceneOf<"code">) {
  return (
    <Center>
      <CodeBlock code={code} language={language} title={title} typing={CODE_CPS} highlightLines={highlight} />
    </Center>
  );
}

function TerminalScene({ lines, title }: SceneOf<"terminal">) {
  return (
    <Center>
      <Terminal lines={lines} title={title} />
    </Center>
  );
}

function ChartScene({ kind, title, data }: SceneOf<"chart">) {
  const { u } = useViewport();
  return (
    <Center style={{ gap: u(36) }}>
      {title ? <TextReveal text={title} size={56} /> : null}
      {kind === "bar" ? (
        <BarChart data={data} delay={6} />
      ) : kind === "line" ? (
        <LineChart
          series={[{ label: title ?? "Value", points: data.map((d) => d.value) }]}
          labels={data.map((d) => d.label)}
          delay={6}
        />
      ) : (
        <Donut data={data} delay={6} />
      )}
    </Center>
  );
}

function StatScene({ label, value, prefix, suffix, delta, caption }: SceneOf<"stat">) {
  return (
    <Center>
      <StatCounter
        label={label}
        to={value}
        prefix={prefix}
        suffix={suffix}
        delta={delta}
        caption={caption}
        size={160}
      />
    </Center>
  );
}

function QuoteScene({ quote, name, role, avatar }: SceneOf<"quote">) {
  return (
    <Center>
      <QuoteCard
        quote={quote}
        name={name}
        role={role}
        avatar={avatarImage(avatar)}
        size={quote.length > 140 ? 36 : 46}
      />
    </Center>
  );
}

function PostScene({ name, handle, text, avatar, metrics }: SceneOf<"post">) {
  return (
    <Center>
      <PostCard name={name} handle={handle} text={text} avatar={avatarImage(avatar)} metrics={metrics} />
    </Center>
  );
}

function CtaScene({ title, button, url }: SceneOf<"cta">) {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <Center style={{ gap: u(40) }}>
      <TextReveal text={title} size={headline(title, 104)} />
      {button ? (
        <Animate effect="pop" delay={12}>
          <div
            style={{
              padding: `${u(22)}px ${u(48)}px`,
              borderRadius: u(999),
              background: theme.colors.accent,
              color: theme.colors.accentForeground,
              fontFamily: theme.fonts.heading,
              fontWeight: theme.headingWeight,
              fontSize: u(40),
            }}
          >
            {button}
          </div>
        </Animate>
      ) : null}
      {url ? <TextReveal text={url} size={36} font="mono" color={theme.colors.muted} effect="fade" delay={20} /> : null}
    </Center>
  );
}

function LogoScene({ text, src }: SceneOf<"logo">) {
  const { u } = useViewport();
  return (
    <Center style={{ gap: u(32) }}>
      {src ? (
        <Animate effect="pop">
          <Img src={src} style={{ height: u(180), width: "auto" }} />
        </Animate>
      ) : null}
      <TextReveal text={text} size={src ? 64 : 120} effect={src ? "fade" : "scale"} delay={src ? 10 : 0} />
    </Center>
  );
}

function SplitScene({ left, right, labels }: SceneOf<"split">) {
  return (
    <SplitScreen labels={labels}>
      <SceneView scene={left} />
      <SceneView scene={right} />
    </SplitScreen>
  );
}

function SceneContent({ scene }: { scene: Scene }) {
  switch (scene.type) {
    case "title":
      return <TitleScene {...scene} />;
    case "text":
      return <TextScene {...scene} />;
    case "bullets":
      return <BulletsScene {...scene} />;
    case "image":
      return <ImageScene {...scene} />;
    case "video":
      return <VideoScene {...scene} />;
    case "device":
      return <DeviceScene {...scene} />;
    case "code":
      return <CodeScene {...scene} />;
    case "terminal":
      return <TerminalScene {...scene} />;
    case "chart":
      return <ChartScene {...scene} />;
    case "stat":
      return <StatScene {...scene} />;
    case "quote":
      return <QuoteScene {...scene} />;
    case "post":
      return <PostScene {...scene} />;
    case "cta":
      return <CtaScene {...scene} />;
    case "logo":
      return <LogoScene {...scene} />;
    case "split":
      return <SplitScene {...scene} />;
  }
}

/** Draws one built-in scene over its background. */
export function SceneView({ scene }: { scene: Scene }) {
  return (
    <>
      <Backdrop name={scene.background} />
      <SceneContent scene={scene} />
    </>
  );
}
