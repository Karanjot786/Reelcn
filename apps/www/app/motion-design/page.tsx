import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AGENT_MARKS } from "@/components/agent-marks";
import { AgentRotate } from "@/components/agent-rotate";
import { CopyCommand } from "@/components/copy-command";
import { JsonLd } from "@/components/json-ld";
import { PlanPlayer } from "@/components/plan-player";
import { RendererSwitch } from "@/components/renderer-switch";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { counts, type Film, filmOf, RENDERER_NAMES, RENDERER_ORDER } from "@/lib/motion";
import "../landing.css";
import "./motion.css";

export const metadata: Metadata = {
  title: "Motion design for coding agents",
  description:
    "reelcn-motion is a free, MIT agent skill. Your agent reads your product, plans a launch film, builds it and checks the render.",
  alternates: { canonical: "/motion-design" },
};

const INSTALL = "npx skills add Karanjot786/reelcn -s reelcn-motion";

const FAQ: [string, string][] = [
  [
    "Do I need motion design experience?",
    "No. The skill carries the rules: one element carries the eye, motion shows meaning, something moves during every read. You approve the plan in plain words.",
  ],
  [
    "What kinds of video does it make?",
    `Launch films, showreels, title sequences, changelog clips and kinetic type: ${counts.plans} plans. Ask for something else and it adapts the closest one.`,
  ],
  [
    "Which coding agents work?",
    "Any agent with skill support. It was tested end to end with Claude Code, by running real prompts in fresh projects.",
  ],
  [
    "Which renderer should I pick?",
    "The one your project uses. With none, pick HyperFrames: it is the proven path and it checks the layout for you. Remotion and Editframe suit web teams. fframes suits Rust.",
  ],
  [
    "How does it check the film?",
    "motion-check reads the rendered file: how much of it moves, the longest still stretch, one-frame flashes, loudness and true peak, and whether hits land on picture. It also checks the plan for stock copy and for numbers your material does not back.",
  ],
  [
    "Is it free for client work?",
    "The skill's code and starters are MIT, their fonts are SIL OFL and their music is CC0, so yes. HyperFrames (Apache-2.0) and fframes (MIT, its h264 output links GPL ffmpeg) are open source. Remotion and Editframe are free for individuals and companies of three or fewer, and paid above that. Read their terms.",
  ],
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
};
const launch = filmOf("hyperframes", "launch-film");

/** A starter film with its caption. Click to play; nothing loads until then. */
function FilmFigure({ film, title }: { film: Film; title: string }) {
  return (
    <figure className="mp-film">
      <video src={film.video} poster={film.poster} aria-label={title} muted playsInline controls preload="none" />
      <figcaption>
        {title}. Built from <code translate="no">plans/{film.plan}.md</code>, rendered with{" "}
        <span translate="no">{RENDERER_NAMES[film.renderer]}</span>, {film.seconds} seconds.
      </figcaption>
    </figure>
  );
}

const STEPS: [string, ReactNode][] = [
  ["Install the skill", <code translate="no">{INSTALL}</code>],
  ["Describe the film", "Make a 15 second launch film for this repo."],
  ["Approve the plan", "Every scene, its words, its move and its sound, before any code."],
  ["Build and render", "One continuous film at 60 fps, checked after the render."],
  ["Ask for a change", "Hold the logo longer. The plan changes first, then the film."],
];
const PACK: [string, string, string][] = [
  [
    "skill",
    "The skill",
    `One SKILL.md and ${counts.references} short references: plan, motion, pacing, type, sound, review.`,
  ],
  [
    "starters",
    "Scene starters",
    `${counts.starters} finished films to adapt, each with its plan, music cues and assets.`,
  ],
  [
    "tokens",
    "Motion tokens",
    "One file of durations, curves and check targets, generated for TypeScript, JavaScript, CSS and Rust.",
  ],
  [
    "guides",
    "Renderer guides",
    `${counts.renderers} guides: setup, patterns, traps and the render command for each renderer.`,
  ],
];
const STRIP: [string, string][] = [
  ["title-sequence", "The title sequence starter"],
  ["changelog-clip", "The changelog clip starter"],
];

export default function MotionDesign() {
  return (
    <div className="landing">
      <SiteHeader />
      <main id="main">
        <section className="hero wrap mp-hero" aria-labelledby="hero-title">
          <span className="tc-label" translate="no">
            reelcn-motion
          </span>
          <h1 id="hero-title">
            Motion design <span className="sr-only">your agent</span>
            <AgentRotate /> can plan.
          </h1>
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
              {AGENT_MARKS.map(({ name, mark }) => (
                <dd key={name} className="mp-agent">
                  <span className="mp-mark">{mark(`chip-${name}`)}</span>
                  {name}
                </dd>
              ))}
            </div>
            <div>
              <dt>Renders with</dt>
              {RENDERER_ORDER.map((r) => (
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
        <section className="block wrap" aria-labelledby="meaning-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">00:15:00</span>
              <h2 id="meaning-title">Every move says something.</h2>
            </div>
            <p>
              A command types. A count rolls. A word about speed arrives fast. One element carries the eye from scene to
              scene, so the film reads as one shot, not a set of slides.
            </p>
          </div>
          <FilmFigure film={filmOf("hyperframes", "showreel")} title="The showreel starter" />
        </section>
        <section className="block wrap" aria-labelledby="material-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">00:30:00</span>
              <h2 id="material-title">Your product, not grey boxes.</h2>
            </div>
            <p>
              Point it at your codebase, a GitHub repo or a running app. It gathers the real screens, copy, numbers and
              brand. When it has to mock a screen, the plan says so.
            </p>
          </div>
          <FilmFigure film={launch} title="The launch film starter" />
        </section>
        <section className="block wrap" aria-labelledby="how-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">00:45:00</span>
              <h2 id="how-title">Plan first. Film second.</h2>
            </div>
            <p>Nothing is built until you approve the plan.</p>
          </div>
          <ol className="mp-steps">
            {STEPS.map(([title, body], i) => (
              <li key={title}>
                <span className="num tab">{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="block wrap" aria-labelledby="pack-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">01:00:00</span>
              <h2 id="pack-title">What is in the pack.</h2>
            </div>
            <p>Plain files in your repo. Read them, change them, keep them.</p>
          </div>
          <div className="costs mp-pack">
            {PACK.map(([art, title, body]) => (
              <article className="cost" key={title}>
                <span className={`mp-art mp-art-${art}`} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <div className="mp-strip">
            {STRIP.map(([plan, title]) => (
              <FilmFigure key={plan} film={filmOf("hyperframes", plan)} title={title} />
            ))}
          </div>
        </section>
        <section className="block wrap" aria-labelledby="renderers-title">
          <div className="sec-head">
            <div>
              <span className="tc-label">01:15:00</span>
              <h2 id="renderers-title">One plan, {counts.renderers} renderers.</h2>
            </div>
            <p>
              The same scene plan, built on each renderer the skill supports. Pick the one your project already uses.
            </p>
          </div>
          <RendererSwitch films={RENDERER_ORDER.map((r) => filmOf(r, "launch-film"))} />
        </section>

        <section className="block wrap" aria-labelledby="faq-title">
          <JsonLd data={faqJsonLd} />
          <div className="sec-head">
            <div>
              <span className="tc-label">01:30:00</span>
              <h2 id="faq-title">Questions.</h2>
            </div>
          </div>
          <div className="mp-faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <p className="mp-cap">
            Vendor terms: <a href="https://www.remotion.dev/license">Remotion</a>,{" "}
            <a href="https://www.editframe.com">Editframe</a>.
          </p>
        </section>

        <section className="final wrap" aria-labelledby="final-title">
          <span className="tc-label">01:45:00, end of reel</span>
          <h2 id="final-title">Describe the film. Approve the plan.</h2>
          <div className="cta-row">
            <CopyCommand command={INSTALL} />
            <a className="btn btn-ghost" href="/docs/motion-design">
              Read the docs
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
