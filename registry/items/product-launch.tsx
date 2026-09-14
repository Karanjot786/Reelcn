/**
 * @title Product Launch
 * @category templates
 * @description Launch video for a product: name and tagline, feature cards, screenshots in a browser window, and a call to action.
 * @duration data-driven
 * @use Announcing a new product or a major version
 * @use A hero video for a landing page
 * @avoid One feature in a vertical short — use `feature-short`
 * @tags launch, product, saas, announcement, template
 * @example
 * <Composition
 *   id="ProductLaunch"
 *   component={ProductLaunch}
 *   schema={productLaunchSchema}
 *   defaultProps={productLaunchDefaults}
 *   calculateMetadata={productLaunchMetadata}
 *   width={1920}
 *   height={1080}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { z } from "zod";
import type { Scene, Story } from "./story";
import { chunk, Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

export const productLaunchSchema = templateSchema.extend({
  name: z.string(),
  tagline: z.string(),
  features: z.array(z.object({ title: z.string(), body: z.string().optional() })),
  /** Screenshot or screen-recording URLs, one browser scene each. A placeholder screen stands in when empty. */
  screenshots: z.array(z.string()),
  cta: z.string(),
  url: z.string().optional(),
});

export type ProductLaunchProps = z.infer<typeof productLaunchSchema>;

export const productLaunchDefaults: ProductLaunchProps = {
  name: "Relay",
  tagline: "Release notes your users actually read",
  features: [
    { title: "Write once", body: "Draft in Markdown and publish everywhere." },
    { title: "Ship on merge", body: "Every merged pull request becomes a line." },
    { title: "See who read it", body: "Opens and clicks for every release." },
  ],
  screenshots: [],
  cta: "Start free today",
  url: "relay.example.com",
};

export function productLaunchStory(props: ProductLaunchProps): Story {
  const { name, tagline, features, screenshots, cta, url } = props;
  const logo: Scene[] = props.brand?.logo ? [{ type: "logo", text: name }] : [];
  const screens: (string | undefined)[] = screenshots.length > 0 ? screenshots : [undefined];
  // Was one bullets scene holding every feature (an ~11s single hold for the 3-feature default —
  // rule M3's "hold ≥ 1s but not forever"). Groups of 2 keep each bullets scene short, and a one-line
  // headline scene between groups breaks the hold into several shorter, varied beats instead of one
  // long one, reusing the story vocabulary's existing "text" and "bullets" scene types (P2-6d: no new
  // scene type).
  const featureGroups = chunk(features, 2);
  const featureScenes: Scene[] = ([] as Scene[]).concat(
    ...featureGroups.map((group): Scene[] => [
      { type: "text", text: group.map((feature) => feature.title).join(" · ") },
      { type: "bullets", items: group.map((feature) => ({ text: feature.title, detail: feature.body })) },
    ]),
  );
  return templateStory(props, [
    ...logo,
    { type: "title", kicker: "Introducing", title: name, subtitle: tagline, background: "gradient-mesh" },
    ...featureScenes,
    ...screens.map((src): Scene => ({ type: "device", device: "browser", src, url })),
    { type: "cta", title: cta, url, background: "spotlight" },
  ]);
}

export function ProductLaunch(props: ProductLaunchProps) {
  return <Storyboard story={productLaunchStory(props)} />;
}

export const productLaunchMetadata = templateMetadata(productLaunchStory);
