import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const REPO_URL = "https://github.com/Karanjot786/reelcn";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: "var(--display)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M9 4v16" stroke="currentColor" strokeWidth="1.8" />
            <path d="M9 12h13" stroke="#FFB224" strokeWidth="1.8" />
          </svg>
          reelcn
        </span>
      ),
    },
    githubUrl: REPO_URL,
    themeSwitch: { enabled: false },
  };
}
