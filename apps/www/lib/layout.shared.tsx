import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const REPO_URL = "https://github.com/Karanjot786/reelcn";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: <span className="font-extrabold text-xl [font-stretch:80%]">reelcn</span> },
    githubUrl: REPO_URL,
  };
}
