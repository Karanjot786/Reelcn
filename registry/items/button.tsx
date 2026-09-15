/**
 * @title Button
 * @category product
 * @description Primary or secondary button that steps through idle, hover, press, loading and success — the loading spinner and success check crossfade in place, so the button never resizes.
 * @duration data-driven
 * @use A UI-sim walkthrough where a cursor clicks a real, named button
 * @use A `ui` scene's `component: "button"`
 * @avoid A static call-to-action with no interaction — use plain text instead
 * @tags button, ui, kit, click, loading, success
 * @example
 * <Center>
 *   <Button
 *     id="pay-button"
 *     label="Pay $48.20"
 *     steps={[{ at: 0, state: "idle" }, { at: 1, state: "press" }, { at: 1.4, state: "loading" }, { at: 2.4, state: "success" }]}
 *   />
 * </Center>
 */
import type React from "react";
import {
  type AnchorRect,
  type MotionProps,
  type Place,
  type Step,
  StrokeOverlay,
  useKeyframeState,
  useMotion,
  useTextMetrics,
  useTheme,
  useViewport,
} from "./core";

export type ButtonState = "idle" | "hover" | "press" | "loading" | "success";

export type ButtonProps = MotionProps & {
  /** Anchor id (`useButtonAnchors`' key, and a cursor's `target.id`). Required for `place`/anchors to resolve. */
  id?: string;
  label: string;
  /** Timeline of states, `at` in seconds. Omitted renders a static `idle` button. */
  steps?: Step<ButtonState>[];
  variant?: "primary" | "secondary";
  /** Label font size in design units. */
  size?: number;
  /** Absolute position, % of canvas, this button's center. Omitted lays out in normal flow. */
  place?: Place;
  style?: React.CSSProperties;
  className?: string;
};

const PAD_X = 28;
const HEIGHT = 56;
export const FONT_SIZE = 22;
const CHECK = "M4 12l5 5L20 6";

type Visual = { background: string; scale: number; shadow: number };
type Content = "label" | "spinner" | "check";

function buttonVisual(state: ButtonState, accentColor: string, successColor: string): Visual {
  switch (state) {
    case "idle":
      return { background: accentColor, scale: 1, shadow: 0.18 };
    case "hover":
      return { background: accentColor, scale: 1.02, shadow: 0.28 };
    case "press":
      return { background: accentColor, scale: 0.96, shadow: 0.1 };
    case "loading":
      return { background: accentColor, scale: 1, shadow: 0.18 };
    case "success":
      return { background: successColor, scale: 1, shadow: 0.18 };
  }
}

const contentOf = (state: ButtonState): Content =>
  state === "loading" ? "spinner" : state === "success" ? "check" : "label";

/**
 * Pure: given an already-measured label width, the button's own box. `Button`, `useButtonAnchors` and the
 * `ui` scene (Task 9) all call this one function — a caller's `size` prop can never diverge between the
 * rendered component and its anchor geometry (ponytail-review blocker 2).
 */
export function buttonBoxSize(size: number | undefined, u: (n: number) => number, measuredLabelWidth: number) {
  return { width: measuredLabelWidth + u(PAD_X) * 2, height: u(HEIGHT), fontPx: u(size ?? FONT_SIZE) };
}

/** Button's own placed size in design-unit pixels — measures once, then hands off to the pure formula
 * above (§2: computed twice, published never). */
function useButtonBox(label: string, size: number | undefined, skip: boolean) {
  const theme = useTheme();
  const { u } = useViewport();
  const fontPx = u(size ?? FONT_SIZE);
  const metrics = useTextMetrics(label, { fontFamily: theme.fonts.body, fontSize: fontPx, fontWeight: 600 }, { skip });
  return buttonBoxSize(size, u, metrics.width);
}

/** Same shape every kit resolver exports: `{}` without `place`, one entry keyed by `id` with it. */
export function useButtonAnchors(props: ButtonProps): Record<string, AnchorRect> {
  const { width, height } = useViewport();
  const skip = !props.id || !props.place;
  const box = useButtonBox(props.label, props.size, skip);
  if (!props.id || !props.place) return {};
  const wPct = (box.width / width) * 100;
  const hPct = (box.height / height) * 100;
  return { [props.id]: { x: props.place.x - wPct / 2, y: props.place.y - hPct / 2, width: wPct, height: hPct } };
}

export function Button({
  id: _id,
  label,
  steps,
  variant = "primary",
  size,
  place,
  style,
  className,
  ...motion
}: ButtonProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const box = useButtonBox(label, size, false);
  const { state, from, progress } = useKeyframeState<ButtonState>(steps, "idle");
  const accent = variant === "primary" ? theme.colors.accent : theme.colors.surface;
  const fromV = buttonVisual(from, accent, theme.colors.success);
  const toV = buttonVisual(state, accent, theme.colors.success);
  const scale = fromV.scale + (toV.scale - fromV.scale) * progress;
  const shadow = fromV.shadow + (toV.shadow - fromV.shadow) * progress;
  const background = `color-mix(in srgb, ${toV.background} ${Math.round(progress * 100)}%, ${fromV.background})`;
  // Child crossfade rule: label/spinner/check are all mounted; each's opacity is its own weight in this
  // fold, so the widest variant (the label) keeps the layout width and the button never resizes between
  // loading and success.
  const weight = (content: Content) =>
    (contentOf(from) === content ? 1 - progress : 0) + (contentOf(state) === content ? progress : 0);
  const foreground = variant === "primary" ? theme.colors.accentForeground : theme.colors.foreground;
  const spin = (m.frame * 12) % 360;
  const checkDrawn = weight("check");

  return (
    <div
      className={className}
      style={{
        position: place ? "absolute" : "relative",
        left: place ? `${place.x}%` : undefined,
        top: place ? `${place.y}%` : undefined,
        translate: place ? "-50% -50%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: box.width,
        height: box.height,
        padding: `0 ${u(PAD_X)}px`,
        borderRadius: u(theme.radius),
        background,
        boxShadow: `0 ${u(6)}px ${u(16)}px rgba(0,0,0,${shadow})`,
        scale: String(scale),
        opacity: m.presence,
        ...style,
      }}
    >
      <span
        style={{
          position: "relative",
          opacity: weight("label"),
          color: foreground,
          fontFamily: theme.fonts.body,
          fontSize: box.fontPx,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          opacity: weight("spinner"),
          width: box.fontPx,
          height: box.fontPx,
          borderRadius: "50%",
          border: `${Math.max(2, box.fontPx * 0.14)}px solid ${foreground}`,
          borderTopColor: "transparent",
          transform: `rotate(${spin}deg)`,
        }}
      />
      <svg
        aria-hidden="true"
        style={{ position: "absolute", opacity: weight("check") }}
        width={box.fontPx}
        height={box.fontPx}
        viewBox="0 0 24 24"
      >
        <StrokeOverlay
          d={CHECK}
          kind="vector"
          seed="button-check"
          color={foreground}
          strokeWidth={2.4}
          drawn={checkDrawn}
          extraProps={{ strokeLinecap: "round", strokeLinejoin: "round" }}
        />
      </svg>
    </div>
  );
}
