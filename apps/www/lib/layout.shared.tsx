import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { LogoMark } from "@/components/logo";

export const REPO_URL = "https://github.com/Karanjot786/reelcn";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: "var(--display)" }}>
          <LogoMark size={22} />
          reelcn
        </span>
      ),
    },
    githubUrl: REPO_URL,
    themeSwitch: { enabled: false },
  };
}
