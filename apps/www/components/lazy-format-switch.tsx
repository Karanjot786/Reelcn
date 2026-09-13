"use client";

import { type ComponentProps, lazy, type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import type { FormatSwitch as FormatSwitchType } from "./format-switch";

// A separate chunk. It's requested only once the section is within 600px of the viewport (site spec §9).
const FormatSwitch = lazy(() => import("./format-switch").then((m) => ({ default: m.FormatSwitch })));

/** Shows the server-rendered `poster` until the section nears the viewport, then swaps in the live FormatSwitch. */
export function LazyFormatSwitch({
  poster,
  ...props
}: ComponentProps<typeof FormatSwitchType> & { poster: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {near ? (
        <Suspense fallback={poster}>
          <FormatSwitch {...props} />
        </Suspense>
      ) : (
        poster
      )}
    </div>
  );
}
