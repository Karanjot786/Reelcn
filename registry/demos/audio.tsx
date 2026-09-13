import { staticFile } from "remotion";
import { AudioReactive } from "../items/audio-reactive";
import { Center, useTheme, useViewport } from "../items/core";
import { RadialVisualizer } from "../items/radial-visualizer";
import { SpeakerCard } from "../items/speaker-card";
import { Spectrum } from "../items/spectrum";
import { useBeat } from "../items/use-beat";
import { Waveform } from "../items/waveform";
import type { Demo } from "./index";

const beat = staticFile("reelcn-demo/beat.mp3");
const voice = staticFile("reelcn-demo/voice.mp3");

function BeatDot() {
  const { pulse, beat: index } = useBeat({ bpm: 120 });
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <Center>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: u(24) }}>
        <div
          style={{
            width: u(220),
            height: u(220),
            borderRadius: "50%",
            background: theme.colors.accent,
            scale: String(0.8 + pulse * 0.25),
            opacity: 0.55 + pulse * 0.45,
          }}
        />
        <div style={{ fontFamily: theme.fonts.mono, fontSize: u(28), color: theme.colors.muted }}>beat {index + 1}</div>
      </div>
    </Center>
  );
}

export default [
  { id: "use-beat", duration: 120, component: BeatDot },
  { id: "waveform-bars", duration: 150, component: () => <Waveform src={beat} /> },
  { id: "waveform-mirror", duration: 150, component: () => <Waveform src={beat} variant="mirror" bars={64} /> },
  { id: "spectrum", duration: 150, component: () => <Spectrum src={beat} /> },
  { id: "radial-visualizer", duration: 150, component: () => <RadialVisualizer src={beat} /> },
  {
    id: "speaker-card",
    duration: 150,
    component: () => (
      <Center>
        {/* biome-ignore lint/a11y/useValidAriaRole: SpeakerCardProps.role is a job title, not an ARIA role */}
        <SpeakerCard src={voice} name="Ada Lovelace" role="Founder, Analytical Engines" />
      </Center>
    ),
  },
  {
    id: "audio-reactive",
    duration: 150,
    component: () => (
      <Center>
        <AudioReactive src={beat}>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: "-0.03em" }}>On the beat</div>
        </AudioReactive>
      </Center>
    ),
  },
] satisfies Demo[];
