import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { CatalogTile } from "@/components/catalog-tile";
import { firstDemo } from "@/lib/demos";
import { categories, items } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Components",
  description: `All ${items.length} reelcn components, grouped by category.`,
};

const toc = categories.map((category) => ({ title: category.title, url: `#${category.id}`, depth: 2 }));

export default function Page() {
  return (
    <DocsPage toc={toc} tableOfContent={{ style: "clerk", single: true }} breadcrumb={{ enabled: false }}>
      <DocsTitle>Components</DocsTitle>
      <DocsDescription>Every item in the registry, grouped by category.</DocsDescription>
      <DocsBody>
        {/* Category filter chips are anchor links to each section below — no JavaScript. */}
        <nav className="chips" aria-label="Jump to category">
          {categories.map((category) => (
            <a key={category.id} className="chip" href={`#${category.id}`}>
              {category.title} ({category.items.length})
            </a>
          ))}
        </nav>

        {categories.map((category) => (
          <section key={category.id} id={category.id} aria-labelledby={`${category.id}-heading`}>
            <h2 id={`${category.id}-heading`} className="mt-10 font-extrabold text-2xl">
              {category.title}
            </h2>
            <div className="catalog-grid">
              {category.items.map((item) => (
                <CatalogTile
                  key={item.name}
                  name={item.name}
                  title={item.title}
                  category={category.id}
                  demoId={category.id === "lib" ? undefined : firstDemo(item.name)}
                />
              ))}
            </div>
          </section>
        ))}
      </DocsBody>
    </DocsPage>
  );
}
