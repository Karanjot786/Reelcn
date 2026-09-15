/**
 * @title Checklist
 * @category product
 * @description Rows that check themselves off with the existing stroke-draw check technique, accelerating pace as the list winds down, and mute once checked.
 * @duration data-driven
 * @use A features/setup-steps list that completes itself in a product demo
 * @use Any "here's everything done" beat that shouldn't feel mechanically linear
 * @avoid A single item — use plain text with `svg-draw`'s check path directly
 * @tags checklist, checkmark, list, tasks, stagger
 * @example
 * <Center>
 *   <Checklist items={[{ text: "Connect your repo" }, { text: "Add a webhook" }, { text: "Ship your first release" }]} />
 * </Center>
 */
import type React from "react";
import { checklistSchedule, type MotionProps, StrokeOverlay, tween, useMotion, useTheme, useViewport } from "./core";

export type ChecklistProps = MotionProps & {
  /** `at` in seconds; omitted entries derive a content-based, accelerating schedule (`checklistSchedule`). */
  items: { text: string; at?: number }[];
  checkColor?: string;
  style?: React.CSSProperties;
  className?: string;
};

const ROW_HEIGHT = 52;
const CHECK_SIZE = 22;
const CHECK = "M4 12l5 5L20 6";

export function Checklist({ items, checkColor, style, className, ...motion }: ChecklistProps) {
  const theme = useTheme();
  const { u } = useViewport();
  const m = useMotion(motion);
  const schedule = checklistSchedule(items);
  const check = checkColor ?? theme.colors.success;

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: u(4), opacity: m.presence, ...style }}
    >
      {items.map((item, i) => {
        const arrivalFrame = m.delay + (item.at !== undefined ? Math.round(item.at * m.fps) : schedule[i]);
        const drawn = Math.max(
          0,
          Math.min(
            1,
            tween(m.frame, m.fps, { from: arrivalFrame, duration: Math.round(m.fps * 0.35), motion: "smooth" }),
          ),
        );
        const settled = Math.max(
          0,
          Math.min(
            1,
            tween(m.frame, m.fps, {
              from: arrivalFrame + Math.round(m.fps * 0.35),
              duration: Math.round(m.fps * 0.4),
              motion: "smooth",
            }),
          ),
        );
        return (
          <div key={item.text} style={{ display: "flex", alignItems: "center", gap: u(14), height: u(ROW_HEIGHT) }}>
            <svg aria-hidden="true" width={u(CHECK_SIZE)} height={u(CHECK_SIZE)} viewBox="0 0 24 24">
              <circle cx={12} cy={12} r={10.5} fill="none" stroke={check} strokeWidth={1.6} opacity={drawn} />
              <StrokeOverlay
                d={CHECK}
                kind="vector"
                seed={`checklist-${i}`}
                color={check}
                strokeWidth={2.4}
                drawn={drawn}
                extraProps={{ strokeLinecap: "round", strokeLinejoin: "round" }}
              />
            </svg>
            <span
              style={{
                fontFamily: theme.fonts.body,
                fontSize: u(22),
                color: `color-mix(in srgb, ${theme.colors.muted} ${Math.round(settled * 100)}%, ${theme.colors.foreground})`,
              }}
            >
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
