/**
 * @title Toast Stack
 * @category product
 * @description Several toasts, staggered in time, that close up smoothly as each one leaves — a running sum of occupancy-weighted heights, no measured DOM.
 * @duration data-driven
 * @use Several sequential confirmations or status updates in one product demo
 * @use Simulating a busy notification tray without hand-placing each card
 * @avoid A single notification — use `toast`
 * @tags toast, stack, notification, queue
 * @example
 * <ToastStack
 *   toasts={[
 *     { at: 0, toast: { variant: "success", title: "Deployed", description: "Live in 12 regions" } },
 *     { at: 1.2, toast: { variant: "info", title: "Cache warmed" } },
 *     { at: 2.4, toast: { variant: "success", title: "Health check passed" } },
 *   ]}
 * />
 */
import { Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp01, occupancy, stackOffset, tween, useViewport } from "./core";
import { Toast, type ToastProps } from "./toast";

export type ToastStackProps = {
  /** Seconds, per toast, and its own `Toast` props (minus `edge`, shared by the whole stack). */
  toasts: { at: number; toast: Omit<ToastProps, "edge">; holdFrames?: number }[];
  edge?: ToastProps["edge"];
};

/** `ponytail:` `toast.tsx` exposes no height constant of its own (Deviation 7) — this is a hand-tuned
 * estimate matching its rendered card height, not a measurement. Upgrade path: keep in sync by eye if
 * `toast.tsx`'s own card height ever changes; both are already hand constants today. */
const TOAST_HEIGHT = 96;
const SLIDE_FRAMES_S = 0.4;
const DEFAULT_HOLD_S = 2.2;

export function ToastStack({ toasts, edge }: ToastStackProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, isPortrait } = useViewport();
  const slide = Math.round(fps * SLIDE_FRAMES_S);
  // `toast.tsx`'s own default (`edge ?? (isPortrait ? "top" : "bottom-right")`), re-derived here rather
  // than read back from the child — two independent evaluations of the same inputs, never a child→parent read.
  const resolvedEdge = edge ?? (isPortrait ? "top" : "bottom-right");
  // Toasts anchored from the top grow the stack downward, away from the anchor (positive offset).
  // Toasts anchored from the bottom must grow upward instead, or the stack would sink off the bottom edge.
  const sign = resolvedEdge === "top" || resolvedEdge === "top-right" ? 1 : -1;

  const items = toasts.map((t) => {
    const atFrame = Math.round(t.at * fps);
    const hold = t.holdFrames ?? Math.round(fps * DEFAULT_HOLD_S);
    const enter = clamp01(tween(frame, fps, { from: atFrame, duration: slide, motion: "smooth" }));
    const leave = clamp01(tween(frame, fps, { from: atFrame + slide + hold, duration: slide, motion: "smooth" }));
    const lifespan = slide + hold + slide;
    return { ...t, atFrame, lifespan, occupancy: occupancy(enter, leave), height: u(TOAST_HEIGHT) };
  });

  return (
    <>
      {items.map((item, i) => (
        // Each toast gets its own local timeline: `Toast`'s own `useMotion` anchors its exit window to
        // "the end of the parent Sequence" (`core.tsx`'s `useMotion` docs), so without a per-toast
        // `Sequence` its exit would fire at the end of the *whole* stack's duration for every toast at
        // once, not on its own enter → hold → leave schedule — exactly the staggered-close the occupancy
        // math above assumes. `delay` is intentionally omitted: the Sequence's own `from` already rebases
        // `useCurrentFrame()` for everything inside it, so passing both would double the offset.
        <Sequence key={i} from={item.atFrame} durationInFrames={item.lifespan}>
          <Toast
            {...item.toast}
            edge={resolvedEdge}
            duration={slide}
            exit={slide}
            style={{ transform: `translateY(${sign * stackOffset(items, i)}px)`, ...item.toast.style }}
          />
        </Sequence>
      ))}
    </>
  );
}
