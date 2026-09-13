import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { items } from "@/lib/registry";
import { docsTree } from "@/lib/tree";

// ponytail: the Remotion version is pinned once, in pnpm-workspace.yaml's catalog; update this string when that pin moves.
function VersionCard() {
  return (
    <div className="version-card">
      <span className="version-card-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6.5 6v4l3.5-2z" fill="currentColor" />
        </svg>
      </span>
      <span>
        <b>Remotion 4.0.523</b>
        <small>{items.length} items, 30 fps</small>
      </span>
    </div>
  );
}

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout tree={docsTree} {...baseOptions()} sidebar={{ banner: <VersionCard /> }}>
      {children}
    </DocsLayout>
  );
}
