// Hand-drawn grease-pencil marks. Pure markup: no hooks, so server components can render them directly.
// The `.grease path` rule in app/global.css supplies stroke color, width and the `stroke-dasharray: 1`
// base that a `draw` keyframe (also in global.css) animates by tweening `stroke-dashoffset`. Without that
// keyframe running, the base CSS alone already renders the path fully drawn — the correct look under
// `prefers-reduced-motion: reduce`, where every keyframe animation is switched off.

function className(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

/** The keeper circle's path data (viewBox 0 0 210 150). The OG image draws the same mark. */
export const GREASE_CIRCLE_D = "M18 72C16 32 70 10 118 14c52 4 82 30 78 60-4 34-60 58-112 54C38 124 14 102 22 64";

/** A loose circle, as if drawn around a keeper frame on a contact sheet. */
export function GreaseCircle({ className: extra }: { className?: string }) {
  return (
    <svg className={className("grease", extra)} viewBox="0 0 210 150" fill="none" aria-hidden="true" focusable="false">
      <path pathLength="1" d={GREASE_CIRCLE_D} />
    </svg>
  );
}

/** A single check mark, drawn the same way — used by the copy command once the copy succeeds. */
export function GreaseTick({ className: extra }: { className?: string }) {
  return (
    <svg className={className("grease", extra)} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path pathLength="1" d="M4 13l5 5L20 6" />
    </svg>
  );
}
