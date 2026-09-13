"use client";

import { useState } from "react";
import { GreaseTick } from "./grease";

function CopyGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M5 16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

/** A copyable shell command. Click (or Enter/Space, since it's a real `<button>`) copies it to the clipboard. */
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // ponytail: no execCommand fallback — every browser this site targets has Clipboard API.
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      className="copy-command"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : `Copy: ${command}`}
    >
      <code>{command}</code>
      <span className="copy-icon" data-copied={copied ? "true" : "false"} aria-hidden="true">
        {copied ? <GreaseTick /> : <CopyGlyph />}
      </span>
      <span className="sr-only" role="status">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
