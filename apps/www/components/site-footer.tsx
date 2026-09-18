import Link from "next/link";
import { REPO_URL } from "@/lib/layout.shared";

// Laid out like end credits: roles right-aligned against a center gutter, names running left from it.
const credits: [role: string, links: [href: string, label: string][]][] = [
  [
    "Catalog",
    [
      ["/docs/components", "Components"],
      ["/docs/templates", "Templates"],
      ["/docs/theming", "Themes"],
    ],
  ],
  [
    "Guides",
    [
      ["/docs/installation", "Installation"],
      ["/docs/formats", "Formats"],
      ["/docs/determinism", "Determinism"],
      ["/docs/tutorials/tiktok-captions", "TikTok captions"],
    ],
  ],
  [
    "For agents",
    [
      ["/docs/agent-skill", "Agent skill"],
      ["/docs/recipes", "Recipes"],
      ["/llms.txt", "llms.txt"],
    ],
  ],
  [
    "Source",
    [
      [REPO_URL, "GitHub"],
      ["/docs/license", "License"],
    ],
  ],
];

export function SiteFooter() {
  return (
    <footer className="credits">
      <nav className="wrap roll" aria-label="Footer">
        {credits.map(([role, links]) => (
          <div className="credit" key={role}>
            <span className="role">{role}</span>
            <ul>
              {links.map(([href, label]) => (
                <li key={href}>
                  {href.startsWith("http") ? <a href={href}>{label}</a> : <Link href={href}>{label}</Link>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="wrap legal">
        <span>reelcn is MIT licensed.</span>
        <p>
          It depends on Remotion, which has its own license. Individuals, non-profits and companies of up to 3 people
          use it free; larger companies need a Remotion Company License.
        </p>
      </div>
      {/* The last frame renders as it scrolls in: an amber playhead fills the outlined wordmark. */}
      <div className="wordmark" aria-hidden="true">
        <div className="wm">
          <span className="wm-ghost">reelcn</span>
          <span className="wm-fill">reelcn</span>
          <span className="wm-head" />
        </div>
      </div>
    </footer>
  );
}
