import type gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { build, CSS, MARKUP } from "./film";

const ASSETS = staticFile("assets");
const css = CSS.replaceAll('url("assets/', `url("${ASSETS}/`);
// One object for every render: React must never re-apply the markup GSAP has already animated.
const html = { __html: MARKUP.replaceAll('"assets/', `"${ASSETS}/`) };

/** The launch film. The GSAP timeline is paused and seeked to Remotion's frame, so every render is exact. */
export const LaunchFilm = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const root = useRef<HTMLDivElement>(null);
  const [timeline, setTimeline] = useState<gsap.core.Timeline | null>(null);
  const [handle] = useState(() => delayRender("fonts and timeline"));
  const frameRef = useRef(frame);
  frameRef.current = frame;

  useLayoutEffect(() => {
    document.fonts.ready.then(async () => {
      const el = root.current;
      if (el) {
        const tl = build(el);
        // build() creates the tiles with relative image paths; point them at Remotion's static folder.
        const imgs = [...el.querySelectorAll<HTMLImageElement>('img[src^="assets/"]')];
        for (const img of imgs) img.src = `${ASSETS}/${img.getAttribute("src")?.slice(7)}`;
        await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
        // Seek before releasing the render, so the first captured frame is already on the timeline.
        tl.seek(frameRef.current / fps, false);
        setTimeline(tl);
      }
      continueRender(handle);
    });
  }, [handle, fps]);

  useLayoutEffect(() => {
    timeline?.seek(frame / fps, false);
  }, [timeline, frame, fps]);

  return (
    <AbsoluteFill>
      <style>{css}</style>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the film's own static markup */}
      <div id="root" ref={root} style={{ width: 1920, height: 1080 }} dangerouslySetInnerHTML={html} />
      <Audio src={staticFile("assets/audio/track.mp3")} />
    </AbsoluteFill>
  );
};
