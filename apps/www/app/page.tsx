import Link from "next/link";
import { CopyCommand } from "@/components/copy-command";
import { HeadlineSweep } from "@/components/headline-sweep";
import { HeroEditor } from "@/components/hero-editor";
import { themeNames } from "@/lib/demos";
import { REPO_URL } from "@/lib/layout.shared";
import { installUrl, items } from "@/lib/registry";
import "./landing.css";

export default function Home() {
  return (
    <div className="landing">
      <header className="nav">
        <div className="wrap">
          <Link className="logo" href="/">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9 4v16" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9 12h13" stroke="#FFB224" strokeWidth="1.8" />
            </svg>
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
            GitHub
          </a>
        </div>
      </header>

      <main id="main">
        <section className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-top">
            <div>
              <Link className="eyebrow-cmd" href="/docs/agents#agent-skill">
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
          <HeroEditor poster="/thumbs/hero-launch.jpg" />
        </section>
      </main>
    </div>
  );
}
