/**
 * @title App Promo
 * @category templates
 * @description Vertical app ad: the app's name and promise, its screens on a phone or laptop, its rating, and a download call.
 * @duration data-driven
 * @use App store previews and paid social ads
 * @use Showing a mobile or desktop app screen by screen
 * @avoid A web product in a browser window — use `product-launch`
 * @tags app, promo, mobile, ad, template
 * @example
 * <Composition
 *   id="AppPromo"
 *   component={AppPromo}
 *   schema={appPromoSchema}
 *   defaultProps={appPromoDefaults}
 *   calculateMetadata={appPromoMetadata}
 *   width={1080}
 *   height={1920}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { z } from "zod";
import type { Scene, Story } from "./story";
import { Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";

export const appPromoSchema = templateSchema.extend({
  appName: z.string(),
  tagline: z.string().optional(),
  /** Screenshot or screen-recording URLs, one scene each. A placeholder screen stands in when empty. */
  screens: z.array(z.string()),
  device: z.enum(["phone", "laptop"]),
  /** Average rating out of 5. */
  rating: z.number().min(0).max(5).optional(),
  cta: z.string(),
});

export type AppPromoProps = z.infer<typeof appPromoSchema>;

export const appPromoDefaults: AppPromoProps = {
  appName: "Pace",
  tagline: "Training plans that bend around your week",
  screens: [],
  device: "phone",
  rating: 4.8,
  cta: "Download Pace",
};

export function appPromoStory(props: AppPromoProps): Story {
  const { appName, tagline, screens, device, rating, cta } = props;
  const shown: (string | undefined)[] = screens.length > 0 ? screens : [undefined];
  const stars: Scene[] =
    rating === undefined ? [] : [{ type: "stat", label: "Average rating", value: rating, suffix: " / 5" }];
  return templateStory(props, [
    { type: "title", title: appName, subtitle: tagline, background: "bokeh" },
    ...shown.map((src): Scene => ({ type: "device", device, src })),
    ...stars,
    { type: "cta", title: cta },
  ]);
}

export function AppPromo(props: AppPromoProps) {
  return <Storyboard story={appPromoStory(props)} />;
}

export const appPromoMetadata = templateMetadata(appPromoStory);
