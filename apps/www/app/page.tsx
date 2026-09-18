import type { Metadata } from "next";
import Link from "next/link";
import { type CSSProperties, type ReactNode, Suspense } from "react";
import { CopyCommand } from "@/components/copy-command";
import { FormatTrio } from "@/components/format-trio";
import { FrameSheet } from "@/components/frame-sheet";
import { HeadlineSweep } from "@/components/headline-sweep";
import { HeroEditor } from "@/components/hero-editor";
import { JsonLd } from "@/components/json-ld";
import { LogoMark } from "@/components/logo";
import { type NavItem, NavMenu } from "@/components/nav-menu";
import { SearchButton } from "@/components/search-button";
import { SiteFooter } from "@/components/site-footer";
import { ThemeCycle } from "@/components/theme-cycle";
import { TypeOnView } from "@/components/type-on-view";
import { demoFrames, firstDemo, themeNames } from "@/lib/demos";
import { REPO_URL } from "@/lib/layout.shared";
import {
  categories,
  categoryOf,
  componentUrl,
  getItem,
  installUrl,
  items,
  SITE_URL,
  sentenceCase,
} from "@/lib/registry";
import { source } from "@/lib/source";
import "./landing.css";

// Title and description come from the root layout; canonicals are per page, since a layout one would be inherited.
export const metadata: Metadata = { alternates: { canonical: "/" } };

// The library itself: source you copy in, not an app you install.
const libraryJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "@id": `${SITE_URL}/#library`,
  name: "reelcn",
  description: "Copy-paste Remotion components and templates, installed with the shadcn CLI.",
  url: SITE_URL,
  codeRepository: REPO_URL,
  programmingLanguage: "TypeScript",
  runtimePlatform: "Remotion",
  license: "https://opensource.org/licenses/MIT",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

// Icons copied from assets/reelcn-07/mockup.html; `.draw` strokes redraw on hover and rest fully drawn.
const len = (n: number) => ({ "--len": n }) as CSSProperties;
const icon = (children: ReactNode) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    {children}
  </svg>
);
const costs: [string, ReactNode, ReactNode][] = [
  [
    "No keyframes",
    "Entrances, exits and staggers come from the theme's motion preset, timed to the frame. Change the preset and every item follows.",
    icon(
      <>
        <path
          className="draw"
          style={len(70)}
          d="M4 22 L10 8 L16 18 L24 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="8" r="2" fill="#FFB224" />
        <circle cx="16" cy="18" r="2" fill="#FFB224" />
      </>,
    ),
  ],
  [
    "No second export for Reels",
    "Items size themselves in design units and respect platform safe zones. The same code renders at 16:9, 9:16 and 1:1.",
    icon(
      <>
        <rect
          className="draw"
          style={len(60)}
          x="3"
          y="8"
          width="14"
          height="10"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <rect
          className="draw"
          style={len(50)}
          x="19"
          y="5"
          width="6"
          height="18"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </>,
    ),
  ],
  [
    "No restyling per video",
    <>
      One <code className="mono">theme</code> prop sets colors, type, radius and motion across every item. Six themes,
      or your brand kit.
    </>,
    icon(
      <>
        <circle className="draw" style={len(60)} cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14 5a9 9 0 0 1 0 18z" fill="#FFB224" />
      </>,
    ),
  ],
  [
    "No render roulette",
    "No clock, no unseeded randomness, no CSS animation. CI renders sampled frames twice and fails on a single changed pixel.",
    icon(
      <>
        <rect
          className="draw"
          style={len(56)}
          x="4"
          y="6"
          width="9"
          height="16"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <rect
          className="draw"
          style={len(56)}
          x="15"
          y="6"
          width="9"
          height="16"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M7 14h3M18 14h3" stroke="#FFB224" strokeWidth="1.6" strokeLinecap="round" />
      </>,
    ),
  ],
  [
    "No black box",
    <>
      Source lands in <code className="mono">src/reelcn/</code> and stays yours. MIT, no runtime package, nothing to log
      in to.
    </>,
    icon(
      <>
        <path
          className="draw"
          style={len(60)}
          d="M9 8 L4 14 L9 20 M19 8 L24 14 L19 20"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M16 6 L12 22" stroke="#FFB224" strokeWidth="1.6" strokeLinecap="round" />
      </>,
    ),
  ],
  [
    "No timeline guesswork",
    "Templates work out their own length from the content: reading time for text, typing time for code, the file length for audio.",
    icon(
      <>
        <path
          className="draw"
          style={len(40)}
          d="M4 20h20"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          className="draw"
          style={len(40)}
          d="M4 20V9h6v11M12 20V5h6v15"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M20 20v-7h4v7" stroke="#FFB224" strokeWidth="1.6" strokeLinejoin="round" />
      </>,
    ),
  ],
];

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
];

const sheet = [
  "text-reveal",
  "captions",
  "bar-chart",
  "lower-third",
  "aurora",
  "app-promo",
  "audiogram",
  "data-story",
].flatMap((name) => {
  const item = getItem(name);
  const id = firstDemo(name);
  return item && id ? [{ id, name, category: categoryOf(item), href: componentUrl(name) }] : [];
});

export default function Home() {
  return (
    <div className="landing">
      <JsonLd data={libraryJsonLd} />
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

      <main id="main">
        <section className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-top">
            <div>
              <Link className="eyebrow-cmd" href="/docs/agent-skill">
                <b>new</b>The agent skill ships with 8 video recipes
              </Link>
              <HeadlineSweep text="Every frame, already designed." />
            </div>
            <div>
              <p className="lede">
                {items.length} Remotion components and 14 templates you add with one command and edit like the rest of
                your code. One timeline renders at 16:9, 9:16 and 1:1, in any of {themeNames.length} themes.
              </p>
              <div className="cta-row">
                <Link className="btn btn-primary" href="/docs/components">
                  Browse components
                </Link>
                <CopyCommand command={`npx shadcn add ${installUrl("product-launch")}`} />
              </div>
            </div>
          </div>
          <div className="stats">
            <div>
              <b className="tab">{items.length}</b>
              <span>components</span>
            </div>
            <div>
              <b className="tab">3</b>
              <span>formats per timeline</span>
            </div>
            <div>
              <b className="tab">{themeNames.length}</b>
              <span>themes</span>
            </div>
            <div>
              <b className="tab">0</b>
              <span>pixels different, render to render</span>
            </div>
          </div>
          {/* Each interactive island sits in its own Suspense boundary, so React hydrates them as separate tasks
              instead of the whole page in one long one. The HTML is unchanged: nothing here suspends on the server. */}
          <Suspense>
            <HeroEditor poster="/thumbs/hero-launch.jpg" install={`npx shadcn add ${installUrl("product-launch")}`} />
          </Suspense>
        </section>

        <section className="block wrap" id="costs" aria-labelledby="costs-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">00:20:16</span>
              <h2 id="costs-title">What you stop doing by hand.</h2>
            </div>
            <p>
              Keyframes, second exports and restyles eat the week before a launch. reelcn items already carry the
              timing, the layout rules and the theme, so the work left is your content.
            </p>
          </div>
          <div className="costs">
            {costs.map(([title, body, costIcon], i) => (
              <article className="cost" key={title}>
                <span className="f">f{String(i + 1).padStart(3, "0")}</span>
                {costIcon}
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="block wrap" id="steps" aria-labelledby="steps-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">00:42:00</span>
              <h2 id="steps-title">Empty folder to first render.</h2>
            </div>
            <p>Three commands. No components.json, no path aliases, no account.</p>
          </div>
          <Suspense>
            <div className="steps">
              <div className="step">
                <span className="num">1</span>
                <div className="term">
                  <div className="term-h">~/launch-video</div>
                  <TypeOnView
                    command="npx create-video@latest"
                    lines={[
                      { text: "✓ Blank template", ok: true },
                      { text: "✓ Installed remotion 4.0.523" },
                      { text: "Run npm run dev to open Studio" },
                    ]}
                  />
                </div>
                <h3>Start a Remotion project</h3>
                <p>Any Remotion project works, new or years old.</p>
              </div>
              <div className="step">
                <span className="num">2</span>
                <div className="term">
                  <div className="term-h">~/launch-video</div>
                  <TypeOnView
                    command="npx shadcn add product-launch"
                    lines={[
                      { text: "✓ src/reelcn/product-launch.tsx", ok: true },
                      { text: "✓ src/reelcn/storyboard.tsx", ok: true },
                      { text: "✓ src/reelcn/story-scenes.tsx", ok: true },
                      { text: "+ 11 files, zod, mediabunny" },
                    ]}
                  />
                </div>
                <h3>Add a template</h3>
                <p>Its scenes, theme and dependencies land as source you can read.</p>
              </div>
              <div className="step">
                <span className="num">3</span>
                <div className="term">
                  <div className="term-h">~/launch-video</div>
                  <TypeOnView
                    command="npx remotion render ProductLaunch"
                    lines={[{ text: "Bundled in 1.2 s" }]}
                    render={{ frames: 615, output: "out/ProductLaunch.mp4" }}
                  />
                </div>
                <h3>Render it</h3>
                <p>615 frames, measured from the content. Same pixels every time.</p>
              </div>
            </div>
          </Suspense>
          <p className="after">
            Prefer an agent? <a href="#agents">Give it the reelcn skill</a> and describe the video.
          </p>
        </section>

        <section className="block wrap" id="formats" aria-labelledby="formats-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">01:04:00</span>
              <h2 id="formats-title">One timeline, three screens.</h2>
            </div>
            <p>
              These three players run the same composition, untouched. Items read the canvas and reflow, so YouTube,
              Reels and a square post each come from one render command.
            </p>
          </div>
          <Suspense>
            <FormatTrio demoId="product-launch" category="templates" />
          </Suspense>
        </section>

        <section className="block wrap" id="themes" aria-labelledby="themes-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">01:26:00</span>
              <h2 id="themes-title">Change one line, restyle every frame.</h2>
            </div>
            <p>
              Pick a theme below or let it cycle. Colors, fonts, corner radius and the motion preset all change
              together.
            </p>
          </div>
          <Suspense>
            <ThemeCycle themes={themeNames} />
          </Suspense>
        </section>

        <section className="block wrap" id="catalog" aria-labelledby="catalog-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">01:48:00</span>
              <h2 id="catalog-title">Pick your frames.</h2>
            </div>
            <p>Hover a frame to watch it move. Every item has a page with a live player, props and install tabs.</p>
          </div>
          <Suspense>
            <FrameSheet frames={sheet} />
          </Suspense>
        </section>

        <section className="block wrap" id="agents" aria-labelledby="agents-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">02:10:00</span>
              <h2 id="agents-title">Your agent already knows the catalog.</h2>
            </div>
            <p>
              Every item carries use and avoid notes, and every page has a Markdown twin. Agents pick components the way
              you would.
            </p>
          </div>
          <div className="agents">
            <ul className="alist">
              <li>
                <code>Agent skill</code>
                <p>
                  Picks a video type, writes the story, checks a contact sheet and determinism, then renders. Eight
                  recipes built in.
                </p>
              </li>
              <li>
                <code>/llms.txt</code>
                <p>The whole catalog as plain text, with length, use and avoid for each item.</p>
              </li>
              <li>
                <code>shadcn MCP</code>
                <p>Search and install reelcn items from inside your editor.</p>
              </li>
              <li>
                <code>page.md</code>
                <p>Append .md to any docs URL for clean Markdown an agent can read.</p>
              </li>
            </ul>
            <div className="chat">
              <div className="term-h">agent, ~/launch-video</div>
              <div className="term-b">
                <div className="you">› Make a 15 second launch video for Relay, vertical.</div>
                <div className="tool reveal-on-view">● reading skills/reelcn/archetypes/feature-short.md</div>
                <div className="dimline reveal-on-view">vertical and one feature: feature-short at 9:16</div>
                <div className="tool reveal-on-view">● npx shadcn add feature-short</div>
                <div className="dimline reveal-on-view">story: hook, device demo, 2 bullets, cta = 14.6 s</div>
                <div className="tool reveal-on-view">● node scripts/reelcn-contact-sheet.ts FeatureShort</div>
                <div className="dimline reveal-on-view">9 frames reviewed, text inside safe zones</div>
                <div className="tool reveal-on-view">● node scripts/reelcn-check-determinism.ts</div>
                <div className="ok reveal-on-view">no determinism problems found</div>
                <div className="you reveal-on-view">Rendered out/FeatureShort.mp4, 438 frames at 1080×1920.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="final wrap" aria-labelledby="final-title">
          <span className="tc-label">02:32:00, end of reel</span>
          <h2 id="final-title">Your next video is already cut.</h2>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/docs/components">
              Browse components
            </Link>
            <Link className="btn btn-ghost" href="/docs">
              Read the docs
            </Link>
            <CopyCommand command={`npx shadcn add ${installUrl("text-reveal")}`} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
