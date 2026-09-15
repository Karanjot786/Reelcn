/**
 * @title Input
 * @category product
 * @description Text field that types a value at a fixed characters-per-second rate on a "typing" step, independent of the step's own duration, with hover/active/blur/invalid states.
 * @duration data-driven
 * @use A sign-up or checkout field a cursor clicks into and types
 * @use A `ui` scene's `component: "input"`
 * @avoid A field that never receives focus — use plain text
 * @tags input, field, form, typing, ui, kit
 * @example
 * <Center>
 *   <Input
 *     id="email"
 *     label="Work email"
 *     placeholder="you@company.com"
 *     steps={[{ at: 0, state: "idle" }, { at: 0.6, state: "active" }, { at: 0.8, state: "typing", type: "ada@hexhaus.dev" }]}
 *   />
 * </Center>
 */
import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  type AnchorRect,
  anchorId,
  type MotionProps,
  type Place,
  type Step,
  useKeyframeState,
  useMotion,
  useTextMetrics,
  useTheme,
  useTypedText,
  useViewport,
} from "./core";

export type InputState = "idle" | "hover" | "active" | "typing" | "blur" | "invalid";

export type InputProps = MotionProps & {
  id?: string;
  label?: string;
  steps?: Step<InputState>[];
  /** Static value shown outside a "typing" step (e.g. what's left after typing finishes, or a pre-filled `blur`/`invalid` demo). */
  value?: string;
  placeholder?: string;
  place?: Place;
  style?: React.CSSProperties;
  className?: string;
};

export const FIELD_WIDTH = 340;
export const FIELD_HEIGHT = 52;
const PAD_X = 16;
const FONT_SIZE = 20;
/** Characters per second the field types at — fixed, independent of the step's own `at` spacing (the bug
 * this row fixes: remocn ties typing speed to transition length instead of a real CPS). */
const INPUT_CPS = 14;

/** The most recent `steps` entry at or before `frame` that carries a `type` string, and the frame it started. */
function typingStepAt<S>(
  steps: Step<S>[] | undefined,
  frame: number,
  fps: number,
): { text: string; startFrame: number } | null {
  if (!steps) return null;
  let found: { text: string; startFrame: number } | null = null;
  for (const step of steps) {
    const stepFrame = Math.round(step.at * fps);
    if (stepFrame <= frame && step.type !== undefined) found = { text: step.type, startFrame: stepFrame };
  }
  return found;
}

/** The field's displayed text: live-typed from the applicable step, or the static `value`. Evaluated
 * identically by `Input` and `useInputAnchors` — same inputs, same formula, computed twice. */
function useDisplayedValue(
  steps: Step<InputState>[] | undefined,
  value: string | undefined,
  frame: number,
  fps: number,
): string {
  const typing = typingStepAt(steps, frame, fps);
  // useTypedText is pure (no internal hook calls), so calling it conditionally here isn't a Rules-of-Hooks issue.
  const typed = typing ? useTypedText(typing.text, frame - typing.startFrame, fps, { cps: INPUT_CPS }) : null;
  return typing ? typed!.visible : (value ?? "");
}

/** Pure: fixed field proportions — the overall box never depends on the displayed text (only the
 * `.caret` sub-anchor would, and the `ui` scene never needs sub-anchors; see Deviation 4a). Shared by
 * `useInputAnchors` and the `ui` scene (Task 9), ponytail-review blocker 2's "one formula" contract. */
export function inputBoxSize(u: (n: number) => number) {
  return { width: u(FIELD_WIDTH), height: u(FIELD_HEIGHT) };
}

export function useInputAnchors(props: InputProps): Record<string, AnchorRect> {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const { u, width, height } = useViewport();
  const displayed = useDisplayedValue(props.steps, props.value, frame, fps);
  const metrics = useTextMetrics(
    displayed,
    { fontFamily: theme.fonts.mono, fontSize: u(FONT_SIZE), fontWeight: 500 },
    { skip: !props.id || !props.place },
  );
  if (!props.id || !props.place) return {};
  const box = inputBoxSize(u);
  const wPct = (box.width / width) * 100;
  const hPct = (box.height / height) * 100;
  const fieldX = props.place.x - wPct / 2;
  const fieldY = props.place.y - hPct / 2;
  const caretXPct = fieldX + ((u(PAD_X) + metrics.width) / width) * 100;
  const caretHPct = (u(FIELD_HEIGHT * 0.5) / height) * 100;
  const caretWPct = (2 / width) * 100;
  return {
    [props.id]: { x: fieldX, y: fieldY, width: wPct, height: hPct },
    [anchorId(props.id, "caret")]: {
      x: caretXPct,
      y: props.place.y - caretHPct / 2,
      width: caretWPct,
      height: caretHPct,
    },
  };
}

export function Input({ id: _id, label, steps, value, placeholder, place, style, className, ...motion }: InputProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const { state } = useKeyframeState<InputState>(steps, "idle");
  const displayed = useDisplayedValue(steps, value, m.frame, m.fps);
  const showCaret = state === "typing" || state === "active";
  const isInvalid = state === "invalid";
  const isFocused = state === "active" || state === "typing";
  const borderColor = isInvalid ? theme.colors.danger : isFocused ? theme.colors.accent : theme.colors.border;

  return (
    <div
      className={className}
      style={{
        position: place ? "absolute" : "relative",
        left: place ? `${place.x}%` : undefined,
        top: place ? `${place.y}%` : undefined,
        translate: place ? "-50% -50%" : undefined,
        display: "inline-flex",
        flexDirection: "column",
        gap: u(6),
        opacity: m.presence,
        ...style,
      }}
    >
      {label ? (
        <span style={{ color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: u(15) }}>{label}</span>
      ) : null}
      <div
        style={{
          width: u(FIELD_WIDTH),
          height: u(FIELD_HEIGHT),
          border: `${u(1.5)}px solid ${borderColor}`,
          borderRadius: u(theme.radius),
          display: "flex",
          alignItems: "center",
          padding: `0 ${u(PAD_X)}px`,
          background: theme.colors.surface,
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: u(FONT_SIZE),
            color: displayed ? theme.colors.foreground : theme.colors.muted,
            whiteSpace: "nowrap",
          }}
        >
          {displayed || placeholder || ""}
        </span>
        {showCaret ? (
          <span
            style={{ width: u(2), height: u(FIELD_HEIGHT * 0.5), background: theme.colors.accent, marginLeft: u(2) }}
          />
        ) : null}
      </div>
    </div>
  );
}
