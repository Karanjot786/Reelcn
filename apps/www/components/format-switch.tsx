"use client";

import { themes } from "@reelcn/registry/items/core";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { DemoPlayer, FORMAT_SIZE, type Format, prefersReducedMotion } from "./demo-player";

const FORMATS = Object.keys(FORMAT_SIZE) as Format[];

function swatchTheme(name: string) {
  return (themes as Record<string, (typeof themes)[keyof typeof themes]>)[name] ?? themes.midnight;
}

/** Runs a state update inside a view transition, unless the browser or the visitor opts out. */
function withViewTransition(run: () => void) {
  if (typeof document === "undefined" || !document.startViewTransition || prefersReducedMotion()) {
    run();
    return;
  }
  document.startViewTransition(() => flushSync(run));
}

/**
 * The Player plus its format, theme and (when there's more than one demo) variant toggles.
 * `mobileFormat` makes the format default to 9:16 under a 640px viewport (the landing page's
 * "Rendered for every screen" section wants this; item pages don't set it).
 */
export function FormatSwitch({
  demoIds,
  category,
  themes: themeNames,
  mobileFormat = false,
}: {
  demoIds: string[];
  category: string;
  themes: string[];
  mobileFormat?: boolean;
}) {
  const [format, setFormat] = useState<Format>("16x9");
  const [theme, setTheme] = useState(themeNames[0] ?? "midnight");
  const [demoIndex, setDemoIndex] = useState(0);

  useEffect(() => {
    if (!mobileFormat) return;
    const media = window.matchMedia("(max-width: 640px)");
    const apply = () => setFormat(media.matches ? "9x16" : "16x9");
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mobileFormat]);

  const demoId = demoIds[demoIndex] ?? demoIds[0];

  return (
    <div className="format-switch">
      <div className="player-well">
        <DemoPlayer demoId={demoId} category={category} format={format} theme={theme} />
      </div>
      <div className="format-controls">
        <fieldset className="toggle-group" aria-label="Format">
          {FORMATS.map((value) => (
            <button
              key={value}
              type="button"
              className="toggle"
              aria-pressed={format === value}
              onClick={() => withViewTransition(() => setFormat(value))}
            >
              {value}
            </button>
          ))}
        </fieldset>
        <fieldset className="toggle-group" aria-label="Theme">
          {themeNames.map((name) => {
            const t = swatchTheme(name);
            return (
              <button
                key={name}
                type="button"
                className="swatch"
                aria-pressed={theme === name}
                aria-label={name}
                style={{ background: t.colors.background, color: t.colors.accent }}
                onClick={() => withViewTransition(() => setTheme(name))}
              />
            );
          })}
        </fieldset>
        {demoIds.length > 1 && (
          <fieldset className="toggle-group" aria-label="Variant">
            {demoIds.map((id, index) => (
              <button
                key={id}
                type="button"
                className="toggle"
                aria-pressed={demoIndex === index}
                onClick={() => withViewTransition(() => setDemoIndex(index))}
              >
                {index + 1}
              </button>
            ))}
          </fieldset>
        )}
      </div>
    </div>
  );
}
