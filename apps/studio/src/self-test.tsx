import { graphemes, tween, useMotion, useViewport, Viewport } from "@reelcn/registry/items/core";
import { Sequence } from "remotion";

function check(ok: boolean, message: string) {
  if (!ok) throw new Error(`self-test failed: ${message}`);
}

const near = (a: number, b: number, tolerance = 0.01) => Math.abs(a - b) <= tolerance;

function ViewportCase({
  label,
  orientation,
  scale,
  safeBottom,
}: {
  label: string;
  orientation: "landscape" | "portrait" | "square";
  scale: number;
  safeBottom: number;
}) {
  const v = useViewport();
  check(v.orientation === orientation, `${label}: orientation ${v.orientation} \u2260 ${orientation}`);
  check(near(v.scale, scale), `${label}: scale ${v.scale} \u2260 ${scale}`);
  check(near(v.u(90), 90 * scale, 0.1), `${label}: u(90) ${v.u(90)} \u2260 ${90 * scale}`);
  check(near(v.safe.bottom, safeBottom, 0.5), `${label}: safe.bottom ${v.safe.bottom} \u2260 ${safeBottom}`);
  return null;
}

/** Rendered at the last frame of a 10-frame Sequence, so the exit must be complete. */
function ExitCase() {
  const m = useMotion();
  check(near(m.exit, 1), `exit at last frame is ${m.exit}, expected 1`);
  check(near(m.presence, 0), `presence at last frame is ${m.presence}, expected 0`);
  return null;
}

/**
 * Rendered at frame 0 of a Sequence, so nothing has entered or left yet.
 * The Sequence has to outlast the default exit window (11 frames at 30fps) or frame 0 sits inside the exit.
 */
function EnterCase() {
  const m = useMotion({ delay: 5 });
  check(m.enter === 0, `enter at frame 0 with delay 5 is ${m.enter}, expected 0`);
  check(m.exit === 0, `exit at frame 0 is ${m.exit}, expected 0`);
  return null;
}

export function SelfTest() {
  check(tween(0, 30, { from: 10, duration: 20 }) === 0, "tween before start must be 0");
  check(tween(30, 30, { from: 10, duration: 20 }) === 1, "tween at end must be 1");
  check(tween(20, 30, { from: 10, duration: 20 }) > 0.5, "smooth easing must be past halfway at the midpoint");

  const bouncy = Array.from({ length: 21 }, (_, frame) => tween(frame, 30, { duration: 20, motion: "bouncy" }));
  check(Math.max(...bouncy) > 1, "bouncy must overshoot 1");
  check(near(bouncy[20], 1, 0.05), `bouncy must settle near 1, got ${bouncy[20]}`);

  // The "e" below carries a combining acute accent: a plain code-point split returns 6, not 5.
  check(graphemes("héllo").length === 5, "graphemes must keep combining marks attached");

  return (
    <>
      <Viewport width={1920} height={1080}>
        <ViewportCase label="1920x1080" orientation="landscape" scale={1} safeBottom={86.4} />
      </Viewport>
      <Viewport width={1280} height={720}>
        <ViewportCase label="1280x720" orientation="landscape" scale={0.6667} safeBottom={57.6} />
      </Viewport>
      <Viewport width={1080} height={1920}>
        <ViewportCase label="1080x1920" orientation="portrait" scale={1} safeBottom={384} />
      </Viewport>
      <Viewport width={1080} height={1350}>
        <ViewportCase label="1080x1350" orientation="portrait" scale={1} safeBottom={270} />
      </Viewport>
      <Viewport width={1080} height={1080}>
        <ViewportCase label="1080x1080" orientation="square" scale={1} safeBottom={86.4} />
      </Viewport>
      <Sequence from={-9} durationInFrames={10}>
        <ExitCase />
      </Sequence>
      <Sequence durationInFrames={40}>
        <EnterCase />
      </Sequence>
      <div style={{ font: "600 64px sans-serif", color: "#0a0", padding: 64 }}>self-test ok</div>
    </>
  );
}
