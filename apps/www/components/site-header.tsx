import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { type NavItem, NavMenu } from "@/components/nav-menu";
import { SearchButton } from "@/components/search-button";
import { demoFrames, firstDemo } from "@/lib/demos";
import { REPO_URL } from "@/lib/layout.shared";
import { categories, componentUrl, items, sentenceCase } from "@/lib/registry";
import { source } from "@/lib/source";

// A frame is roughly a second's worth of reading: the catalog runs at 30fps, so this is what a template costs on screen.
const seconds = (name: string) => {
  const id = firstDemo(name);
  const frames = id ? demoFrames[id] : undefined;
  return frames ? `${Math.round(frames / 30)}s` : "";
};

const templateItems = categories.find((category) => category.id === "templates")?.items ?? [];
// sentenceCase lowercases initialisms, and "Ai generation" reads like a typo in a menu.
const label = (title: string) => sentenceCase(title).replace(/\bAi\b/, "AI");
const featured = ["text-reveal", "captions", "bar-chart"].flatMap((name) => {
  const id = firstDemo(name);
  return id ? [{ name, id }] : [];
});

/** The Components panel reads like an editor's bin: every category with its count, and three frames to preview the house style. */
const componentsPanel = (
  <div className="bin-grid">
    <ul className="bin-cats">
      {categories
        .filter((category) => category.items.length > 0 && category.id !== "templates")
        .map((category) => (
          <li key={category.id}>
            <Link href={`/docs/components#${category.id}`}>
              {category.title}
              <b className="tab">{category.items.length}</b>
            </Link>
          </li>
        ))}
    </ul>
    <div className="bin-side">
      <div className="bin-strip">
        {featured.map(({ name, id }) => (
          <Link key={name} href={componentUrl(name)}>
            <img src={`/thumbs/${id}.jpg`} alt="" width={480} height={270} loading="lazy" />
            <span>{name}</span>
          </Link>
        ))}
      </div>
      <Link className="bin-all" href="/docs/components">
        All {items.length} components
      </Link>
    </div>
  </div>
);

const templatesPanel = (
  <div className="bin-tpl">
    <ul>
      {templateItems.map((item) => (
        <li key={item.name}>
          <Link href={componentUrl(item.name)}>
            {label(item.title)}
            <span className="mono tab">{seconds(item.name)}</span>
          </Link>
        </li>
      ))}
    </ul>
    <Link className="bin-all" href="/docs/templates">
      How templates work
    </Link>
  </div>
);

// Titles come from the pages themselves, so renaming a guide renames it here too.
const docGroups: [string, string[]][] = [
  ["Start here", ["installation", "theming", "motion", "formats"]],
  ["Go deeper", ["determinism", "storyboard", "captions", "audio-and-sfx"]],
];

const docsPanel = (
  <div className="bin-tpl">
    <div className="bin-docs">
      {docGroups.map(([label, slugs]) => (
        <div key={label}>
          <span className="bin-label">{label}</span>
          <ul className="bin-cats">
            {slugs.flatMap((slug) => {
              const page = source.getPage([slug]);
              return page
                ? [
                    <li key={slug}>
                      <Link href={page.url}>
                        {page.data.title}
                        <em>{page.data.description}</em>
                      </Link>
                    </li>,
                  ]
                : [];
            })}
          </ul>
        </div>
      ))}
    </div>
    <div className="bin-foot">
      <Link className="bin-note" href="/docs/agent-skill">
        <b>Agent skill</b>
        Hand your agent the catalog and eight video recipes.
      </Link>
      <Link className="bin-all" href="/docs">
        Read the docs
      </Link>
    </div>
  </div>
);

const navItems: NavItem[] = [
  { href: "/docs/components", label: "Components", panel: componentsPanel },
  { href: "/docs/templates", label: "Templates", panel: templatesPanel },
  { href: "/docs", label: "Docs", panel: docsPanel },
  { href: "/docs/agents", label: "Agents" },
  { href: "/motion-design", label: "Motion" },
];

/** The site header: logo, nav with hover panels, search, GitHub and the mobile menu. Shared by / and /motion-design. */
export function SiteHeader() {
  return (
    <header className="nav">
      <div className="wrap">
        <Link className="logo" href="/">
          <LogoMark />
          reelcn
        </Link>
        <NavMenu items={navItems} />
        <span className="sp" />
        <SearchButton />
        <a className="gh" href={REPO_URL}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.01 8.01 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A8 8 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          <span className="sr-only">GitHub</span>
        </a>
        <Link className="btn btn-primary btn-sm" href="/docs/installation">
          Get started
        </Link>
        {/* Native popover: light dismiss and Escape for free, no menu state to manage. */}
        <button className="menubtn" type="button" popoverTarget="site-menu" aria-label="Open menu">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M3 6h12M3 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="menu" id="site-menu" popover="auto">
          {navItems.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          <a href={REPO_URL}>GitHub</a>
          <Link className="btn btn-primary" href="/docs/installation">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
