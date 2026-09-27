import { staticFile } from "remotion";
import { AudioReactive } from "../items/audio-reactive";
import { Center, useTheme, useViewport } from "../items/core";
import { RadialVisualizer } from "../items/radial-visualizer";
import { SpeakerCard } from "../items/speaker-card";
import { Spectrum } from "../items/spectrum";
import { useBeat } from "../items/use-beat";
import { Waveform } from "../items/waveform";
import { customizable } from "./customizable";
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
  {
    id: "waveform-bars",
    duration: 150,
    ...customizable("Waveform", Waveform, { src: beat }, undefined, { src: 'staticFile("reelcn-demo/beat.mp3")' }),
  },
  { id: "waveform-mirror", duration: 150, component: () => <Waveform src={beat} variant="mirror" bars={64} /> },
  {
    id: "spectrum",
    duration: 150,
    ...customizable("Spectrum", Spectrum, { src: beat }, undefined, { src: 'staticFile("reelcn-demo/beat.mp3")' }),
  },
  {
    id: "radial-visualizer",
    duration: 150,
    ...customizable("RadialVisualizer", RadialVisualizer, { src: beat }, undefined, {
      src: 'staticFile("reelcn-demo/beat.mp3")',
    }),
  },
  {
    id: "speaker-card",
    duration: 150,
    ...customizable(
      "SpeakerCard",
      SpeakerCard,
      { src: voice, name: "Maya Chen", role: "Founder, Northwind" },
      (el) => <Center>{el}</Center>,
      { src: 'staticFile("reelcn-demo/voice.mp3")' },
    ),
  },
  {
    id: "audio-reactive",
    duration: 150,
    ...customizable(
      "AudioReactive",
      AudioReactive,
      {
        src: beat,
        children: <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: "-0.03em" }}>On the beat</div>,
      },
      (el) => <Center>{el}</Center>,
      {
        src: 'staticFile("reelcn-demo/beat.mp3")',
        children: '<div style={{ fontSize: 96, fontWeight: 800, letterSpacing: "-0.03em" }}>On the beat</div>',
      },
    ),
  },
] satisfies Demo[];
