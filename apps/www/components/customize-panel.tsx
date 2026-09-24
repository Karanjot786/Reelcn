"use client";

import { useEffect, useState } from "react";
import { type CustomProps, isHexColor, parseDefault, sliderRange, unitFor } from "@/lib/customize";
import type { PropRow } from "@/lib/props-table";

export type ControlRow = Pick<PropRow, "name" | "control" | "options" | "default" | "description">;

/** `accentColor` → "Accent color", `holdFrames` → "Hold frames". */
const humanize = (name: string) => {
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// The shared timing props every component takes (MotionProps); they go last, after the component's own.
const TIMING = new Set(["delay", "duration", "exit", "poster", "holdFrames", "motion"]);

/**
 * A text box that commits as you type but keeps your draft, so clearing it doesn't snap back to the demo's text.
 * An empty draft commits `undefined` (the demo's value); `accept` gates partial input such as a half-typed hex.
 */
function DraftInput({
  id,
  value,
  placeholder,
  parse,
  accept = () => true,
  onCommit,
}: {
  id: string;
  value: string;
  placeholder?: string;
  parse: (draft: string) => unknown;
  accept?: (draft: string) => boolean;
  onCommit: (value: unknown) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  // Outside changes (Reset, a share link) replace the draft, but never while you are typing.
  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);
  return (
    <input
      id={id}
      type="text"
      value={draft}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        if (next.trim() === "") onCommit(undefined);
        else if (accept(next.trim())) onCommit(parse(next.trim()));
      }}
    />
  );
}

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
            <DraftInput
              id={id}
              value={typeof value === "string" ? value : ""}
              placeholder="theme"
              parse={(d) => d}
              accept={isHexColor}
              onCommit={onChange}
            />
          </span>
        </div>
      );
    }
    case "slider": {
      const number = typeof value === "number" ? value : undefined;
      const range = sliderRange(row.name, number ?? 0);
      const unit = unitFor(row.name);
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
            data-auto={number === undefined || undefined}
            aria-valuetext={number === undefined ? "auto" : `${number}${unit ? ` ${unit}` : ""}`}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <output htmlFor={id}>{number === undefined ? "auto" : `${number}${unit ? "f" : ""}`}</output>
        </div>
      );
    }
    case "list":
      return (
        <div className="cz-field">
          {label}
          <DraftInput
            id={id}
            value={Array.isArray(value) ? value.join(", ") : ""}
            placeholder="comma, separated"
            parse={(d) =>
              d
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            }
            onCommit={onChange}
          />
        </div>
      );
    default:
      return (
        <div className="cz-field">
          {label}
          <DraftInput
            id={id}
            value={typeof value === "string" ? value : ""}
            parse={(d) => d.slice(0, 200)}
            onCommit={onChange}
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
  shareUrl,
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
  shareUrl: () => string;
  /** The customized element, for Copy. */
  code: string;
  /** The scene file, for Download. */
  file: string;
  fileName: string;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const copyText = (text: string, what: "code" | "link") => {
    navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
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
          <button type="button" onClick={() => copyText(shareUrl(), "link")}>
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
          <button type="button" onClick={() => copyText(code, "code")}>
            {copied === "code" ? "Copied" : "Copy code"}
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
