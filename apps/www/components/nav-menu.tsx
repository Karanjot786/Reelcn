"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";

export type NavItem = { href: string; label: string; panel?: ReactNode };

// The panel is a pointer affordance on wide screens; below that the header falls back to the menu popover.
const canOpen = () => window.matchMedia("(min-width: 1000px) and (hover: hover)").matches;

/**
 * Nav links sharing one highlight that slides between them like a playhead, plus a bin panel for the links that have one.
 * Hover positions are written to CSS vars so moving along the row never re-renders, and the transition retargets from
 * the live position, so reversing mid-slide follows the pointer instead of jumping.
 */
export function NavMenu({ items }: { items: NavItem[] }) {
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const clear = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };
  useEffect(
    () => () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  // The panel grows to the active section, so switching sections slides the content instead of reopening the panel.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `open` decides which section is rendered active, so the measurement has to run after it changes.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const active = panel.querySelector<HTMLElement>("[data-active]");
    panel.style.setProperty("--h", `${active?.offsetHeight ?? 0}px`);
  }, [open]);

  const scheduleOpen = (href: string, hasPanel: boolean) => {
    clear();
    if (!hasPanel || !canOpen()) {
      if (open) closeTimer.current = setTimeout(() => setOpen(null), 120);
      return;
    }
    // Once a panel is up, switching is instant; opening the first one waits out a pointer just passing through.
    if (open) setOpen(href);
    else openTimer.current = setTimeout(() => setOpen(href), 60);
  };

  const scheduleClose = () => {
    clear();
    closeTimer.current = setTimeout(() => setOpen(null), 140);
  };

  const closeNow = () => {
    clear();
    setOpen(null);
  };

  const move = (el: HTMLElement | null) => {
    const nav = navRef.current;
    if (!nav) return;
    if (!el) {
      nav.removeAttribute("data-hl");
      return;
    }
    nav.style.setProperty("--hl-x", `${el.offsetLeft}px`);
    nav.style.setProperty("--hl-w", `${el.offsetWidth}px`);
    // On first entry, place the pill before enabling its slide, so it appears under the item instead of flying in from 0.
    if (!nav.hasAttribute("data-hl")) {
      void nav.offsetWidth;
      nav.setAttribute("data-hl", "");
    }
  };

  const panels = items.filter((item) => item.panel);

  return (
    <nav
      ref={navRef}
      className="navlinks"
      aria-label="Main"
      data-open={open ? "" : undefined}
      onPointerEnter={clear}
      onPointerLeave={() => {
        move(null);
        scheduleClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") closeNow();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          move(null);
          closeNow();
        }
      }}
    >
      <span className="hl" aria-hidden="true" />
      {items.map(({ href, label, panel }) => (
        <Link
          key={href}
          href={href}
          onPointerEnter={(e) => {
            move(e.currentTarget);
            scheduleOpen(href, Boolean(panel));
          }}
          onFocus={(e) => {
            move(e.currentTarget);
            clear();
            setOpen(panel && canOpen() ? href : null);
          }}
          onClick={closeNow}
          aria-haspopup={panel ? "true" : undefined}
          aria-expanded={panel ? open === href : undefined}
          aria-controls={panel ? "nav-bin" : undefined}
        >
          {label}
        </Link>
      ))}
      {panels.length > 0 && (
        <div className="bin" id="nav-bin" ref={panelRef}>
          <div className="bin-in">
            {panels.map(({ href, panel }) => {
              const active = open === href;
              return (
                <div className="bin-sec" key={href} data-active={active || undefined} inert={!active}>
                  {panel}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
