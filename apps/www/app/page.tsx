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
import { SearchButton } from "@/components/search-button";
import { ThemeCycle } from "@/components/theme-cycle";
import { TypeOnView } from "@/components/type-on-view";
import { firstDemo, themeNames } from "@/lib/demos";
import { REPO_URL } from "@/lib/layout.shared";
import { categoryOf, componentUrl, getItem, installUrl, items, SITE_URL } from "@/lib/registry";
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
          <nav aria-label="Main">
            <Link href="/docs/components">Components</Link>
            <Link href="/docs/templates">Templates</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/docs/agents">Agents</Link>
          </nav>
          <span className="sp" />
          <a className="stars" href={REPO_URL}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 .2 10.4 5l5.3.8-3.8 3.7.9 5.3L8 12.3l-4.8 2.5.9-5.3L.3 5.8 5.6 5z" />
            </svg>
            <span>GitHub</span>
          </a>
          <SearchButton />
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
      <footer>
        <div className="wrap">
          <span>reelcn, MIT</span>
          <p>
            reelcn depends on Remotion, which has its own license. Individuals, non-profits and companies of up to 3
            people use it free; larger companies need a Remotion Company License.
          </p>
        </div>
      </footer>
    </div>
  );
}
