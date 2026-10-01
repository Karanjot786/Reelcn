import { Composition } from "remotion";
import { LaunchFilm } from "./LaunchFilm";

export const Root = () => (
  <Composition id="LaunchFilm" component={LaunchFilm} durationInFrames={900} fps={60} width={1920} height={1080} />
);
