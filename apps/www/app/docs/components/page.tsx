import type { Metadata } from "next";
import { CatalogTile } from "@/components/catalog-tile";
import { firstDemo } from "@/lib/demos";
import { categories } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Components",
  description: "All 81 reelcn components, grouped by category.",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-2 py-8">
      <h1 className="font-extrabold text-3xl">Components</h1>
      <p className="text-fd-muted-foreground">Every item in the registry, grouped by category.</p>

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
    </div>
  );
}
