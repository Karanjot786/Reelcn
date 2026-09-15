/**
 * @title Brand Reel
 * @category templates
 * @description A brand's logo, palette, type specimen, image collage and lockup, entirely driven by one brand kit and the theme system.
 * @duration data-driven
 * @use A short agency or brand-kit showcase
 * @use Introducing a visual identity before a product launch
 * @avoid A product feature tour — use `product-launch`
 * @tags brand, identity, palette, collage, template
 * @example
 * <Composition
 *   id="BrandReel"
 *   component={BrandReel}
 *   schema={brandReelSchema}
 *   defaultProps={brandReelDefaults}
 *   calculateMetadata={brandReelMetadata}
 *   width={1920} height={1080} fps={30} durationInFrames={1}
 * />
 */
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { useTheme, useViewport } from "./core";
import { LayoutMorph } from "./layout-morph";
import type { CustomScene, Scene, Story } from "./story";
import { brandSchema, storyFrames } from "./story";
import { defineScene, Storyboard, templateSchema, templateStory } from "./storyboard";

export const brandReelSchema = templateSchema.extend({
  brand: brandSchema,
  /** A short phrase set in the brand's own heading font, at display size. */
  typeSample: z.string().optional(),
  /** Collage image URLs, shown in a `layout-morph` grid-to-mosaic morph. */
  collage: z.array(z.string()),
});

export type BrandReelProps = z.infer<typeof brandReelSchema>;

export const brandReelDefaults: BrandReelProps = {
  brand: { accent: "#2F5BFF", font: "Schibsted Grotesk" },
  typeSample: "Hexhaus",
  collage: [],
};

const brandPaletteScene = defineScene({
  type: "brand-palette",
  schema: z.object({}),
  component: function BrandPaletteScene() {
    const theme = useTheme();
    const { u } = useViewport();
    const swatches = [
      theme.colors.accent,
      theme.colors.success,
      theme.colors.warning,
      theme.colors.danger,
      theme.colors.foreground,
    ];
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", gap: u(24) }}>
        {swatches.map((color, i) => (
          <div key={i} style={{ width: u(140), height: u(140), borderRadius: u(theme.radius), background: color }} />
        ))}
      </div>
    );
  },
  duration: () => 2.5,
});

const brandCollageScene = defineScene({
  type: "brand-collage",
  schema: z.object({ collage: z.array(z.string()) }),
  component: ({ collage }: { collage: string[] }) => (
    <LayoutMorph
      items={collage.map((src) => ({ src }))}
      layouts={[
        { at: 0, layout: "grid" },
        { at: 1.4, layout: "mosaic" },
      ]}
    />
  ),
  duration: () => 3,
});

export function brandReelStory(props: BrandReelProps): Story {
  const { brand, typeSample, collage } = props;
  const scenes: (Scene | CustomScene)[] = [
    { type: "logo", text: "", src: brand.logo },
    { type: "brand-palette" } as CustomScene,
    { type: "title", title: typeSample ?? "", background: "gradient-mesh" },
    collage.length > 0 ? ({ type: "brand-collage", collage } as CustomScene) : { type: "title", title: "" },
    { type: "cta", title: typeSample ?? "" },
  ];
  // `templateStory`'s own param type is `Scene[]` (narrower than `Story["scenes"]`'s real
  // `(Scene | CustomScene)[]`); every element above is already checked against its real shape
  // (`CustomScene`, not `any`), so this one array-level cast is the only place type safety is relaxed.
  return templateStory(props, scenes as Scene[]);
}

const brandReelScenes = [brandPaletteScene, brandCollageScene];

export function BrandReel(props: BrandReelProps) {
  return <Storyboard story={brandReelStory(props)} scenes={brandReelScenes} />;
}

// Not `templateMetadata(brandReelStory)`: that helper calls `storyFrames(story)` with no custom scene
// rules, and this story carries the two template-local `defineScene` types above ("brand-palette",
// "brand-collage") — without their rules, `sceneSeconds` falls through to `Scene`'s own switch, matches
// no case, and returns `undefined`, making `durationInFrames` NaN (same failure mode documented in
// product-launch.tsx).
export const brandReelMetadata: CalculateMetadataFunction<BrandReelProps> = ({ props }) => ({
  durationInFrames: storyFrames(brandReelStory(props), brandReelScenes),
});
