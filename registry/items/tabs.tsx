/**
 * @title Tabs
 * @category product
 * @description Tab row where one continuous fractional index positions the sliding pill, the lit label color and a small per-row parallax — nothing animates independently of that one number.
 * @duration data-driven
 * @use Switching between views inside a UI-sim walkthrough
 * @use A `ui` scene's `component: "tabs"`
 * @avoid Two or fewer static labels with no switch — use plain text
 * @tags tabs, segmented, ui, kit
 * @example
 * <Center>
 *   <Tabs id="view" labels={["Overview", "Usage", "Billing"]} steps={[{ at: 0, state: { active: 0 } }, { at: 1, state: { active: 2 } }]} />
 * </Center>
 */
import type React from "react";
import {
  type AnchorRect,
  anchorId,
  measurePx,
  type MotionProps,
  type Place,
  proximityWeight,
  type Step,
  useKeyframeState,
  useMotion,
  useTextMetrics,
  useTheme,
  useViewport,
} from "./core";

export type TabsProps = MotionProps & {
  id?: string;
  labels: string[];
  steps?: Step<{ active: number }>[];
  place?: Place;
  style?: React.CSSProperties;
  className?: string;
};

const TAB_HEIGHT = 48;
const PAD_X = 22;
const FONT_SIZE = 18;
const FONT_WEIGHT = 600;

/** `values[index]`, linearly interpolated between its two neighboring integer entries. */
function lerpAt(values: number[], index: number): number {
  const i = Math.max(0, Math.min(values.length - 1, Math.floor(index)));
  const j = Math.max(0, Math.min(values.length - 1, i + 1));
  return values[i] + (values[j] - values[i]) * (index - i);
}

/** Pure: given each label's already-measured raw width, every tab's padded width, its running offset
 * and the row's total width — shared by `useTabsAnchors`, `Tabs` and the `ui` scene (Task 9), so a
 * caller's `labels` are always the one thing sizing everything (ponytail-review blocker 2). */
export function tabsBoxSize(u: (n: number) => number, measuredLabelWidths: number[]) {
  const widths = measuredLabelWidths.map((w) => w + u(PAD_X) * 2);
  const offsets: number[] = [];
  let acc = 0;
  for (const w of widths) {
    offsets.push(acc);
    acc += w;
  }
  return { widths, offsets, total: acc, height: u(TAB_HEIGHT) };
}

/** Each label's own raw width, measured once font-ready is known. */
function useTabLayout(labels: string[], size: number, u: (n: number) => number, skip: boolean) {
  const theme = useTheme();
  const gate = useTextMetrics(labels.join(""), { fontFamily: theme.fonts.body, fontSize: u(size), fontWeight: FONT_WEIGHT }, { skip });
  const fontString = `${FONT_WEIGHT} ${u(size)}px ${theme.fonts.body}`;
  const measuredWidths = labels.map((l) => (gate.ready ? measurePx(l, fontString) : u(48)));
  return tabsBoxSize(u, measuredWidths);
}

export function useTabsAnchors(props: TabsProps): Record<string, AnchorRect> {
  const { u, width, height } = useViewport();
  const skip = !props.id || !props.place;
  const layout = useTabLayout(props.labels, FONT_SIZE, u, skip);
  if (!props.id || !props.place) return {};
  const hPct = (u(TAB_HEIGHT) / height) * 100;
  const leftPx = (props.place.x / 100) * width - layout.total / 2;
  const topPct = props.place.y - hPct / 2;
  const anchors: Record<string, AnchorRect> = {};
  props.labels.forEach((_, i) => {
    anchors[anchorId(props.id as string, i)] = {
      x: ((leftPx + layout.offsets[i]) / width) * 100,
      y: topPct,
      width: (layout.widths[i] / width) * 100,
      height: hPct,
    };
  });
  return anchors;
}

export function Tabs({ id: _id, labels, steps, place, style, className, ...motion }: TabsProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const layout = useTabLayout(labels, FONT_SIZE, u, false);
  const { from, state, progress } = useKeyframeState<{ active: number }>(steps, { active: 0 });
  // The one continuous number everything below reads off — the pill's x/width, every label's color, and
  // the per-row parallax are all a function of this same `index`, nothing animated independently (M1).
  const index = from.active + (state.active - from.active) * progress;
  const pillX = lerpAt(layout.offsets, index);
  const pillW = lerpAt(layout.widths, index);

  return (
    <div
      className={className}
      style={{
        position: place ? "absolute" : "relative",
        left: place ? `${place.x}%` : undefined,
        top: place ? `${place.y}%` : undefined,
        translate: place ? "-50% -50%" : undefined,
        display: "flex",
        height: u(TAB_HEIGHT),
        borderRadius: u(theme.radius),
        background: theme.colors.surface,
        opacity: m.presence,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: pillX,
          top: 0,
          width: pillW,
          height: u(TAB_HEIGHT),
          borderRadius: u(theme.radius),
          background: theme.colors.accent,
        }}
      />
      {labels.map((label, i) => {
        const w = proximityWeight(i, index);
        return (
          <div
            key={label}
            style={{
              position: "relative",
              width: layout.widths[i],
              height: u(TAB_HEIGHT),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              translate: `0 ${(1 - w) * u(2)}px`,
              color: `color-mix(in srgb, ${theme.colors.accentForeground} ${Math.round(w * 100)}%, ${theme.colors.muted})`,
              fontFamily: theme.fonts.body,
              fontSize: u(FONT_SIZE),
              fontWeight: FONT_WEIGHT,
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
