"use client";

import { useState } from "react";
import { type CustomProps, parseDefault, sliderRange } from "@/lib/customize";
import type { PropRow } from "@/lib/props-table";

export type ControlRow = Pick<PropRow, "name" | "control" | "options" | "default" | "description">;

/** `accentColor` → "Accent color", `holdFrames` → "Hold frames". */
const humanize = (name: string) => {
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// The shared timing props every component takes (MotionProps); they go last, after the component's own.
const TIMING = new Set(["delay", "duration", "exit", "poster", "holdFrames", "motion"]);

function Field({ row, value, onChange }: { row: ControlRow; value: unknown; onChange: (value: unknown) => void }) {
  const id = `cz-${row.name}`;
  const label = (
    <label htmlFor={id} title={row.description}>
      {humanize(row.name)}
    </label>
  );
  switch (row.control) {
    case "switch":
      return (
        <div className="cz-field">
          {label}
          <button
            id={id}
            type="button"
            role="switch"
            aria-checked={value === true}
            className="cz-switch"
            onClick={() => onChange(!(value === true))}
          />
        </div>
      );
    case "select":
      return (
        <div className="cz-field">
          {label}
          <select id={id} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)}>
            {value === undefined && <option value="">auto</option>}
            {row.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    case "color": {
      const hex = typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
      return (
        <div className="cz-field">
          {label}
          <span className="cz-color">
            <input
              type="color"
              aria-label={`${row.name} swatch`}
              value={hex}
              onChange={(e) => onChange(e.target.value)}
            />
            <input
              id={id}
              type="text"
              placeholder="theme"
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value || undefined)}
            />
          </span>
        </div>
      );
    }
    case "slider": {
      const number = typeof value === "number" ? value : undefined;
      const range = sliderRange(row.name, number ?? 0);
      return (
        <div className="cz-field cz-slider">
          {label}
          <input
            id={id}
            type="range"
            min={range.min}
            max={range.max}
            step={range.step}
            value={number ?? range.min}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <output htmlFor={id}>{number ?? "auto"}</output>
        </div>
      );
    }
    default:
      return (
        <div className="cz-field">
          {label}
          <input
            id={id}
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
}

/**
 * The item page's Customize panel: one control per editable prop (see `propsTable`'s `control`), starting from the
 * demo's own props, then each prop's declared default. Edits flow to the live preview and to the Code tab.
 */
export function CustomizePanel({
  rows,
  base,
  values,
  onChange,
  onReset,
  code,
  file,
  fileName,
}: {
  rows: ControlRow[];
  /** The demo's own props (`demo.customize.props`). */
  base: CustomProps;
  /** The viewer's edits. */
  values: CustomProps;
  onChange: (name: string, value: unknown) => void;
  onReset: () => void;
  /** The customized element, for Copy. */
  code: string;
  /** The scene file, for Download. */
  file: string;
  fileName: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([file], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };
  const edited = Object.keys(values).length > 0;
  return (
    <section className="customize">
      <div className="cz-h">
        <h2 id="customize">Customize</h2>
        <div className="cz-actions">
          <button type="button" onClick={onReset} disabled={!edited}>
            Reset
          </button>
          <button type="button" onClick={copy}>
            {copied ? "Copied" : "Copy code"}
          </button>
          <button type="button" onClick={download}>
            Download .tsx
          </button>
        </div>
      </div>
      <div className="cz-grid">
        {[...rows.filter((row) => !TIMING.has(row.name)), ...rows.filter((row) => TIMING.has(row.name))].map((row) => (
          <Field
            key={row.name}
            row={row}
            value={
              row.name in values ? values[row.name] : row.name in base ? base[row.name] : parseDefault(row.default)
            }
            onChange={(value) => onChange(row.name, value)}
          />
        ))}
      </div>
    </section>
  );
}
