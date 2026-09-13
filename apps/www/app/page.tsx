// biome-ignore-all lint/performance/noImgElement: static thumbnails with width/height; next/image adds nothing here
import Link from "next/link";
import { CopyCommand } from "@/components/copy-command";
import { FilmStrip } from "@/components/film-strip";
import { LazyFormatSwitch } from "@/components/lazy-format-switch";
import { firstDemo, themeNames } from "@/lib/demos";
import { REPO_URL } from "@/lib/layout.shared";
import { categories, installUrl, items } from "@/lib/registry";
import "./landing.css";

// Hero stills from `pnpm thumbs`: text-reveal-blur at frames 1/10/19/28, lower-third-bar (9:16) at six frames.
const topFrames = ["f1", "f10", "f19", "f28"].map((edge, i) => ({ src: `/thumbs/hero-t${i + 1}.jpg`, edge }));
const lowerFrames = [1, 2, 3, 4, 5, 6].map((n) => ({ src: `/thumbs/hero-l${n}.jpg` }));

// Seven reels: every category except the single social item and the libraries.
const reels = categories
  .filter((category) => category.id !== "social" && category.id !== "lib")
  .map((category) => ({
    ...category,
    thumbs: category.items.flatMap((item) => firstDemo(item.name) ?? []).slice(0, 4),
  }));

const steps = [
  { title: "Start a Remotion project", command: "npx create-video@latest" },
  { title: "Add a component", command: `npx shadcn add ${installUrl("lower-third")}` },
  { title: "Render it", command: "npx remotion render" },
];

const agents = [
  {
    href: "/llms.txt",
    name: "llms.txt",
    text: "A plain-text index of every component, with what each is for, for any model.",
  },
  {
    href: "/docs/agents#agent-skill",
    name: "Agent skill",
    text: "Coming soon: picks components, writes the scenes and checks the contact sheet before rendering.",
  },
  {
    href: "/docs/agents#shadcn-mcp",
    name: "shadcn MCP",
    text: "Search and install components from inside your editor.",
  },
];

// Stands in for the Player until it loads, at the same size, so nothing shifts.
const poster = (
  <div className="player-well">
    <picture className="poster">
      <source media="(max-width: 640px)" srcSet="/thumbs/fmt-9x16.jpg" width={270} height={480} />
      <img
        className="player-frame"
        src="/thumbs/fmt-16x9.jpg"
        alt="The lower-third-card component"
        width={480}
        height={270}
        loading="lazy"
      />
    </picture>
  </div>
);

export default function Home() {
  return (
    <div className="landing">
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="nav">
        <Link className="logo" href="/">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
            <rect x="2" y="5" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M2 9.5h24M2 18.5h24" stroke="currentColor" strokeWidth="2" />
          </svg>
          reelcn
        </Link>
        <nav className="nav-links" aria-label="Main">
          <Link href="/docs/components">Components</Link>
          <Link href="/docs">Docs</Link>
          <a href={REPO_URL}>GitHub</a>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">Every frame, already designed.</h1>
            <p className="lede">
              {items.length} Remotion components for product demos, shorts and explainers. Add one with a single command
              and own the code. It restyles from your theme and fits 16:9, 9:16 and 1:1.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/docs/components">
                Browse components
              </Link>
              <CopyCommand command={`npx shadcn add ${installUrl("text-reveal")}`} />
            </div>
          </div>
          <div className="hero-strips">
            <FilmStrip frames={topFrames} crawl mark={3} note="keeper" />
            <FilmStrip frames={lowerFrames} portrait from={topFrames.length} />
          </div>
        </section>

        <section className="formats" aria-labelledby="formats-title">
          <div className="formats-copy">
            <h2 id="formats-title">Rendered for every screen.</h2>
            <p>
              The same lower third, untouched, at 16:9, 9:16 and 1:1. Components read the canvas and reflow, so one
              timeline exports to YouTube, Reels and a square post.
            </p>
          </div>
          <LazyFormatSwitch
            demoIds={["lower-third-card"]}
            category="social"
            themes={themeNames}
            mobileFormat
            poster={poster}
          />
        </section>

        <section className="steps" aria-labelledby="steps-title">
          <h2 id="steps-title">Three commands to your first render.</h2>
          <ol className="step-list">
            {steps.map((step, i) => (
              <li key={step.title}>
                <span className="step-num" aria-hidden>
                  {i + 1}
                </span>
                <h3>{step.title}</h3>
                <CopyCommand command={step.command} />
              </li>
            ))}
          </ol>
          <p>No components.json and no path aliases. Files land in src/reelcn/, and they are yours to edit.</p>
        </section>

        <section className="reels" aria-labelledby="reels-title">
          <div className="reels-head">
            <h2 id="reels-title">Seven reels to pull from.</h2>
            <Link className="all" href="/docs/components">
              Browse all {items.length}
            </Link>
          </div>
          <ul className="reel-list">
            {reels.map((reel) => (
              <li key={reel.id}>
                <Link className="reel" href={`/docs/components#${reel.id}`}>
                  <div className="reel-name">
                    <h3>{reel.title}</h3>
                    <span className="reel-count">{reel.items.length} components</span>
                  </div>
                  <div className="reel-film">
                    <div className="reel-strip">
                      {reel.thumbs.map((id) => (
                        <img key={id} src={`/thumbs/${id}.jpg`} alt="" width={480} height={270} loading="lazy" />
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="themes" aria-labelledby="themes-title">
          <div className="themes-head">
            <h2 id="themes-title">Change one line, restyle every frame.</h2>
            <code>{'<ThemeProvider theme="paper">'}</code>
          </div>
          <ul className="theme-grid">
            {themeNames.map((name) => (
              <li key={name}>
                <figure>
                  <img
                    src={`/thumbs/theme-${name}.jpg`}
                    alt={`The same title frame in the ${name} theme`}
                    width={480}
                    height={270}
                    loading="lazy"
                  />
                  <figcaption>{name}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <section className="agents" aria-labelledby="agents-title">
          <h2 id="agents-title">Your agent can read it too.</h2>
          <ul className="agent-list">
            {agents.map((agent) => (
              <li key={agent.name}>
                {agent.href.startsWith("/docs") ? (
                  <Link href={agent.href}>{agent.name}</Link>
                ) : (
                  <a href={agent.href}>{agent.name}</a>
                )}
                <p>{agent.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-links">
          <div className="footer-mark">reelcn</div>
          <nav aria-label="Footer">
            <Link href="/docs">Docs</Link>
            <Link href="/docs/components">Components</Link>
            <a href={REPO_URL}>GitHub</a>
            <Link href="/docs/license">MIT license</Link>
          </nav>
        </div>
        <p>
          reelcn builds on Remotion, which has its own license. Individuals, non-profits and companies of up to 3 people
          use it free; larger companies need a Remotion company license.
        </p>
      </footer>
    </div>
  );
}
