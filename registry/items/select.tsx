/**
 * @title Select
 * @category product
 * @description Dropdown that opens with a panel wipe and highlights rows through a continuous, proximity-weighted blend instead of snapping row to row.
 * @duration data-driven
 * @use A settings/plan picker in a UI-sim walkthrough
 * @use A `ui` scene's `component: "select"`
 * @avoid A single fixed choice with no menu — use plain text
 * @tags select, dropdown, menu, ui, kit
 * @example
 * <Center>
 *   <Select
 *     id="plan"
 *     options={["Starter", "Growth", "Scale"]}
 *     steps={[{ at: 0, state: "closed" }, { at: 0.5, state: "open" }, { at: 1.2, state: { highlight: 1 } }]}
 *   />
 * </Center>
 */
import type React from "react";
import {
  type AnchorRect,
  alpha,
  anchorId,
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

export type SelectState = "closed" | "open";

export type SelectProps = MotionProps & {
  id?: string;
  options: string[];
  steps?: Step<SelectState | { highlight: number }>[];
  place?: Place;
  style?: React.CSSProperties;
  className?: string;
};

const TRIGGER_HEIGHT = 52;
const ROW_HEIGHT = 44;
const PAD_X = 16;
const FONT_SIZE = 18;

const isHighlightState = (s: unknown): s is { highlight: number } =>
  typeof s === "object" && s !== null && typeof (s as { highlight?: unknown }).highlight === "number";

/** Splits the one union-typed `steps` prop into two same-shaped folds the existing engine already knows
 * how to blend: open/closed, and the highlighted row index. */
function useSelectFolds(steps: SelectProps["steps"]) {
  const openSteps: Step<boolean>[] = (steps ?? []).map((s) => ({ at: s.at, state: s.state !== "closed" }));
  const highlightSteps: Step<number>[] = (steps ?? [])
    .filter((s) => isHighlightState(s.state))
    .map((s) => ({ at: s.at, state: (s.state as { highlight: number }).highlight }));
  const open = useKeyframeState<boolean>(openSteps, false);
  const highlight = useKeyframeState<number>(highlightSteps, 0);
  const openAmount = (open.from ? 1 : 0) + ((open.state ? 1 : 0) - (open.from ? 1 : 0)) * open.progress;
  const offset = highlight.from + (highlight.state - highlight.from) * highlight.progress;
  return { openAmount, offset };
}

/** Pure: given the longest option's already-measured width, the trigger's own box. Shared by
 * `useSelectAnchors` and the `ui` scene (Task 9) — ponytail-review blocker 2's "one formula" contract. */
export function selectBoxSize(u: (n: number) => number, measuredLongestWidth: number) {
  return { width: measuredLongestWidth + u(PAD_X) * 2, height: u(TRIGGER_HEIGHT) };
}

/** Longest option's rendered width, the panel width every row shares — never a `len*8`px estimate. */
function usePanelWidth(options: string[], size: number, skip: boolean) {
  const theme = useTheme();
  const { u } = useViewport();
  const longest = options.reduce((a, b) => (b.length > a.length ? b : a), "");
  const metrics = useTextMetrics(
    longest,
    { fontFamily: theme.fonts.body, fontSize: u(size), fontWeight: 500 },
    { skip },
  );
  return selectBoxSize(u, metrics.width).width;
}

export function useSelectAnchors(props: SelectProps): Record<string, AnchorRect> {
  const { u, width, height } = useViewport();
  const skip = !props.id || !props.place;
  const panelW = usePanelWidth(props.options, FONT_SIZE, skip);
  if (!props.id || !props.place) return {};
  const wPct = (panelW / width) * 100;
  const triggerHPct = (u(TRIGGER_HEIGHT) / height) * 100;
  const x = props.place.x - wPct / 2;
  const triggerY = props.place.y - triggerHPct / 2;
  const anchors: Record<string, AnchorRect> = { [props.id]: { x, y: triggerY, width: wPct, height: triggerHPct } };
  // Rows are anchored at their fully-open resting position — a target/click id is for a cursor arriving
  // once the panel has settled, not a live-tracked position mid-wipe.
  const rowHPct = (u(ROW_HEIGHT) / height) * 100;
  const panelTop = triggerY + triggerHPct;
  props.options.forEach((_, i) => {
    anchors[anchorId(props.id as string, i)] = { x, y: panelTop + i * rowHPct, width: wPct, height: rowHPct };
  });
  return anchors;
}

export function Select({ id: _id, options, steps, place, style, className, ...motion }: SelectProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const { openAmount, offset } = useSelectFolds(steps);
  const panelW = usePanelWidth(options, FONT_SIZE, false);
  const open = Math.max(0, Math.min(1, openAmount));

  return (
    <div
      className={className}
      style={{
        position: place ? "absolute" : "relative",
        left: place ? `${place.x}%` : undefined,
        top: place ? `${place.y}%` : undefined,
        translate: place ? "-50% -50%" : undefined,
        width: panelW,
        opacity: m.presence,
        ...style,
      }}
    >
      <div
        style={{
          height: u(TRIGGER_HEIGHT),
          border: `${u(1.5)}px solid ${theme.colors.border}`,
          borderRadius: u(theme.radius),
          display: "flex",
          alignItems: "center",
          padding: `0 ${u(PAD_X)}px`,
          background: theme.colors.surface,
          color: theme.colors.foreground,
          fontFamily: theme.fonts.body,
          fontSize: u(FONT_SIZE),
        }}
      >
        {options[Math.round(offset)] ?? options[0]}
      </div>
      <div
        style={{
          position: "relative",
          height: u(ROW_HEIGHT) * options.length * open,
          overflow: "hidden",
          borderRadius: u(theme.radius),
          background: theme.colors.surface,
          boxShadow: open > 0.02 ? `0 ${u(8)}px ${u(20)}px rgba(0,0,0,0.2)` : "none",
        }}
      >
        {options.map((option, i) => {
          const w = proximityWeight(i, offset);
          return (
            <div
              key={option}
              style={{
                position: "absolute",
                top: u(ROW_HEIGHT) * i,
                left: 0,
                right: 0,
                height: u(ROW_HEIGHT),
                display: "flex",
                alignItems: "center",
                padding: `0 ${u(PAD_X)}px`,
                background: alpha(theme.colors.accent, w * 0.16),
                color: `color-mix(in srgb, ${theme.colors.accent} ${Math.round(w * 100)}%, ${theme.colors.foreground})`,
                fontFamily: theme.fonts.body,
                fontSize: u(FONT_SIZE),
              }}
            >
              {option}
            </div>
          );
        })}
      </div>
    </div>
  );
}
