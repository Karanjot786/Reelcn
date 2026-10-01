import type { Metadata } from "next";
import { CopyCommand } from "@/components/copy-command";
import { PlanPlayer } from "@/components/plan-player";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { filmOf, RENDERER_NAMES } from "@/lib/motion";
import "../landing.css";
import "./motion.css";

export const metadata: Metadata = {
  title: "Motion design for coding agents",
  description:
    "reelcn-motion is a free, MIT agent skill. Your agent reads your product, plans a launch film, builds it and checks the render.",
  alternates: { canonical: "/motion-design" },
};

const INSTALL = "npx skills add Karanjot786/reelcn -s reelcn-motion";
const AGENTS = ["Claude Code", "Codex", "Cursor", "Gemini CLI", "OpenCode"];
const ORDER = ["hyperframes", "remotion", "editframe", "fframes"];
const launch = filmOf("hyperframes", "launch-film");

export default function MotionDesign() {
  return (
    <div className="landing">
      <SiteHeader />
      <main id="main">
        <section className="hero wrap mp-hero" aria-labelledby="hero-title">
          <span className="tc-label">reelcn-motion</span>
          <h1 id="hero-title">Motion design your agent can plan.</h1>
          <p className="lede">
            A free agent skill, MIT licensed. Your agent reads your product, writes a scene plan, builds the film from
            it and checks the render.
          </p>
          <div className="cta-row">
            <CopyCommand command={INSTALL} />
          </div>
          <dl className="mp-chips">
            <div>
              <dt>Works with</dt>
              {AGENTS.map((a) => (
                <dd key={a}>{a}</dd>
              ))}
            </div>
            <div>
              <dt>Renders with</dt>
              {ORDER.map((r) => (
                <dd key={r} translate="no">
                  {RENDERER_NAMES[r]}
                </dd>
              ))}
            </div>
          </dl>
          <PlanPlayer
            film={launch}
            label={`The reelcn launch film, ${launch.seconds} seconds, rendered with HyperFrames from the plan beside it`}
          />
          <p className="mp-cap">
            The launch film starter: {launch.scenes.length} scenes, {launch.seconds} seconds, rendered from the plan
            beside it. Press a row to jump to its scene.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
