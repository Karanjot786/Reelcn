import { LowerThird } from "../items/lower-third";
import type { Demo } from "./index";

export default (["bar", "card", "minimal"] as const).map(
  (variant): Demo => ({
    id: `lower-third-${variant}`,
    duration: 90,
    component: () => <LowerThird name="Ada Lovelace" title="Founder, Analytical Engines" variant={variant} />,
  }),
);
