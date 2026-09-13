/**
 * @title Tutorial
 * @category templates
 * @description Step-by-step coding tutorial: typed code, terminal sessions and screenshots, one step per scene, timed to the typing.
 * @duration data-driven
 * @use Getting-started guides and "how to" videos for developer tools
 * @use Walking through a setup one command at a time
 * @avoid A single snippet — use `code-block`
 * @tags tutorial, code, terminal, developer, template
 * @example
 * <Composition
 *   id="Tutorial"
 *   component={Tutorial}
 *   schema={tutorialSchema}
 *   defaultProps={tutorialDefaults}
 *   calculateMetadata={tutorialMetadata}
 *   width={1920}
 *   height={1080}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { z } from "zod";
import { LANGUAGES, type Scene, type Story } from "./story";
import { Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

export const tutorialSchema = templateSchema.extend({
  title: z.string(),
  steps: z
    .array(
      z.object({
        kind: z.enum(["code", "terminal", "screen"]),
        /** Code, a terminal session (lines starting "$ " are commands), or a screenshot URL. */
        content: z.string(),
        language: z.enum(LANGUAGES).optional(),
        /** Slow zoom on a screenshot. */
        zoom: z.boolean().optional(),
      }),
    )
    .min(1),
});

export type TutorialProps = z.infer<typeof tutorialSchema>;

export const tutorialDefaults: TutorialProps = {
  title: "Add a storyboard to your project",
  steps: [
    { kind: "terminal", content: "$ npx shadcn add @reelcn/storyboard\nCreated src/reelcn/storyboard.tsx" },
    {
      kind: "code",
      language: "tsx",
      content:
        '<Composition id="Storyboard" component={StoryVideo}\n  schema={storySchema} calculateMetadata={storyMetadata}\n  defaultProps={story} width={1920} height={1080}\n  fps={30} durationInFrames={1} />',
    },
    { kind: "terminal", content: "$ npx remotion render Storyboard out.mp4 --props=story.json\nRendered 294 frames" },
  ],
};

/** A terminal session as text: lines starting with "$ " are commands, the rest are output. */
function terminalLines(content: string) {
  return content
    .split("\n")
    .map((line) =>
      line.startsWith("$ ")
        ? { type: "command" as const, text: line.slice(2) }
        : { type: "output" as const, text: line },
    );
}

export function tutorialStory(props: TutorialProps): Story {
  return templateStory(props, [
    { type: "title", kicker: "Tutorial", title: props.title, background: "grid" },
    ...props.steps.map((step, index): Scene => {
      const label = `Step ${index + 1}`;
      if (step.kind === "code") return { type: "code", code: step.content, language: step.language, title: label };
      if (step.kind === "terminal") return { type: "terminal", lines: terminalLines(step.content), title: label };
      return { type: "image", src: step.content, zoom: step.zoom, caption: label };
    }),
  ]);
}

export function Tutorial(props: TutorialProps) {
  return <Storyboard story={tutorialStory(props)} />;
}

export const tutorialMetadata = templateMetadata(tutorialStory);
