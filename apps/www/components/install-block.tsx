"use client";

import { useState } from "react";

const MANAGERS = [
  ["npx", "npx shadcn add"],
  ["pnpm", "pnpm dlx shadcn add"],
  ["bun", "bunx --bun shadcn add"],
] as const;

/** The install command in a code block, with package-manager tabs and a copy button (mockup's Installation block). */
export function InstallBlock({ url }: { url: string }) {
  const [pm, setPm] = useState(0);
  const [copied, setCopied] = useState(false);
  const [bin, ...rest] = MANAGERS[pm][1].split(" ");
  const copy = () => {
    navigator.clipboard.writeText(`${MANAGERS[pm][1]} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="code">
      <div className="code-h">
        <div className="pv-tabs" role="tablist" aria-label="Package manager">
          {MANAGERS.map(([name], i) => (
            <button key={name} type="button" role="tab" aria-selected={pm === i} onClick={() => setPm(i)}>
              {name}
            </button>
          ))}
        </div>
        <button className="iconbtn" type="button" aria-label={copied ? "Copied" : "Copy command"} onClick={copy}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path
              d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"
              stroke="currentColor"
              strokeWidth="1.3"
            />
          </svg>
        </button>
      </div>
      <pre>
        <span className="n">{bin}</span> {rest.join(" ")} {url}
      </pre>
    </div>
  );
}
