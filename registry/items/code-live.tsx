/**
 * @title Code Live
 * @category templates
 * @description Code types beside a live preview pane that swaps images the moment typing crosses each preview's line — a content-derived schedule, not a hand-timed cut.
 * @duration data-driven
 * @use A dev-tool or API launch that shows the code and its result side by side
 * @use A tutorial beat where the reader sees code and output update together
 * @avoid A single static code block with no preview — use `code-block` directly
 * @tags code, live, preview, split, template
 * @example
 * <Composition
 *   id="CodeLive"
 *   component={CodeLive}
 *   schema={codeLiveSchema}
 *   defaultProps={codeLiveDefaults}
 *   calculateMetadata={codeLiveMetadata}
 *   width={1920} height={1080} fps={30} durationInFrames={1}
 * />
 */
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { CodeBlock } from "./code-block";
import { codeLivePreviewSchedule, useTheme } from "./core";
import { SplitScreen } from "./split-screen";
import type { CustomScene, Scene, Story } from "./story";
import { CODE_CPS, LANGUAGES } from "./story";
import { defineScene, Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

export const codeLiveSchema = templateSchema.extend({
  code: z.string(),
  language: z.enum(LANGUAGES).optional(),
  previews: z.array(z.object({ atLine: z.number(), src: z.string() })).min(1),
});

export type CodeLiveProps = z.infer<typeof codeLiveSchema>;

export const codeLiveDefaults: CodeLiveProps = {
  code: [
    'import { z } from "zod";',
    "",
    "export const orderSchema = z.object({",
    "  sku: z.string(),",
    "  quantity: z.number().int().positive(),",
    "});",
  ].join("\n"),
  language: "ts",
  previews: [
    { atLine: 2, src: "/preview-empty.png" },
    { atLine: 6, src: "/preview-filled.png" },
  ],
};

function CodeLiveScene({
  code,
  language,
  previews,
}: {
  code: string;
  language?: (typeof LANGUAGES)[number];
  previews: { atLine: number; src: string }[];
}) {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const schedule = codeLivePreviewSchedule(code, previews, fps, CODE_CPS);
  let activeIndex = -1;
  for (let i = 0; i < schedule.length; i++) if (schedule[i] <= frame) activeIndex = i;
  const activeSrc = activeIndex >= 0 ? previews[activeIndex].src : undefined;

  return (
    <SplitScreen labels={["Code", "Preview"]}>
      <CodeBlock code={code} language={language} typing={CODE_CPS} />
      {activeSrc ? (
        <Img src={activeSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <AbsoluteFill style={{ background: theme.colors.surface }} />
      )}
    </SplitScreen>
  );
}

const codeLiveScene = defineScene({
  type: "code-live-beat",
  schema: z.object({
    code: z.string(),
    language: z.enum(LANGUAGES).optional(),
    previews: z.array(z.object({ atLine: z.number(), src: z.string() })),
  }),
  component: CodeLiveScene,
  duration: (scene: { code: string }) => scene.code.length / CODE_CPS + 2,
});

export function codeLiveStory(props: CodeLiveProps): Story {
  const scenes: (Scene | CustomScene)[] = [
    { type: "code-live-beat", code: props.code, language: props.language, previews: props.previews } as CustomScene,
  ];
  // One array-level cast, not per-scene `any` — see brand-reel.tsx's own note (Task 15).
  return templateStory(props, scenes as Scene[]);
}

export function CodeLive(props: CodeLiveProps) {
  return <Storyboard story={codeLiveStory(props)} scenes={[codeLiveScene]} />;
}

export const codeLiveMetadata = templateMetadata(codeLiveStory);
