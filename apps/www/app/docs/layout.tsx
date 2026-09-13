import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { docsTree } from "@/lib/tree";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout tree={docsTree} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
