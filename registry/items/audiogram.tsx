/**
 * @title Audiogram
 * @category templates
 * @description Square podcast clip with cover art, show and episode titles, a live waveform of the audio, speaker names and captions.
 * @duration data-driven
 * @use Sharing a podcast episode or segment on social feeds
 * @use Turning any voice recording into a video
 * @avoid A short vertical teaser built on one quote — use `podcast-teaser`
 * @tags podcast, audiogram, waveform, captions, template
 * @example
 * <Composition
 *   id="Audiogram"
 *   component={Audiogram}
 *   schema={audiogramSchema}
 *   defaultProps={{ ...audiogramDefaults, audio: staticFile("episode-42.mp3"), captions }}
 *   calculateMetadata={audiogramMetadata}
 *   width={1080}
 *   height={1080}
 *   fps={30}
 *   durationInFrames={1}
 * />
 */
import { Audio } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, type CalculateMetadataFunction, Img, Sequence, useVideoConfig } from "remotion";
import { z } from "zod";
import { Animate } from "./animate";
import { Captions } from "./captions";
import { useTheme, useViewport } from "./core";
import { captionSchema, captionsSeconds, STORY_FPS } from "./story";
import { mediaSeconds, TemplateFrame, templateSchema } from "./storyboard";
import { TextReveal } from "./text-reveal";
import { useBeat } from "./use-beat";
import { Waveform } from "./waveform";

export const audiogramSchema = templateSchema.extend({
  /** The episode audio. Beat-driven bars stand in when omitted. */
  audio: z.string().optional(),
  /** Word-level captions; `reelcn-transcribe` writes them from the audio. */
  captions: z.array(captionSchema),
  show: z.string(),
  episode: z.string(),
  speakers: z.array(z.string()),
  /** Square cover art. The show's initials are drawn when omitted. */
  cover: z.string().optional(),
});

export type AudiogramProps = z.infer<typeof audiogramSchema>;

export const audiogramDefaults: AudiogramProps = {
  captions: [],
  show: "Frame by Frame",
  episode: "Episode 42: rendering at scale",
  speakers: ["Maya Chen", "Tomás Rivera"],
};

export type AudiogramLayoutProps = {
  audio?: string;
  /** Seconds into the audio where the clip starts. */
  clipStart?: number;
  show: string;
  episode?: string;
  speakers?: string[];
  cover?: string;
  captions?: AudiogramProps["captions"];
  /** A pull quote, shown under the waveform. */
  quote?: string;
};

function Cover({ src, show }: { src?: string; show: string }) {
  const theme = useTheme();
  const { u } = useViewport();
  const box: React.CSSProperties = { width: u(300), height: u(300), borderRadius: u(theme.radius), flexShrink: 0 };
  if (src) return <Img src={src} style={{ ...box, objectFit: "cover" }} />;
  const initials = show
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        ...box,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.colors.accent,
        color: theme.colors.accentForeground,
        fontFamily: theme.fonts.heading,
        fontWeight: theme.headingWeight,
        fontSize: u(120),
      }}
    >
      {initials}
    </div>
  );
}

/** Stand-in waveform when there is no audio: bars pulsing on a steady beat. */
function BeatBars() {
  const theme = useTheme();
  const { u } = useViewport();
  const { pulse } = useBeat({ bpm: 96 });
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: u(8), height: u(150) }}>
      {Array.from({ length: 36 }, (_, index) => (
        <div
          key={index}
          style={{
            width: u(10),
            height: u(20 + 110 * (0.3 + 0.7 * pulse) * Math.abs(Math.sin(index * 1.7))),
            borderRadius: u(5),
            background: theme.colors.accent,
          }}
        />
      ))}
    </div>
  );
}

/** The audiogram layout, shared with `podcast-teaser`: cover and titles, a waveform, then a quote or captions. */
export function AudiogramLayout({
  audio,
  clipStart = 0,
  show,
  episode,
  speakers = [],
  cover,
  captions = [],
  quote,
}: AudiogramLayoutProps) {
  const theme = useTheme();
  const { u, safe, isPortrait } = useViewport();
  const { fps } = useVideoConfig();
  const skip = Math.round(clipStart * fps);
  const align = isPortrait ? "center" : "left";
  return (
    <AbsoluteFill
      style={{ padding: `${safe.top}px ${safe.x}px ${safe.bottom}px`, justifyContent: "center", gap: u(48) }}
    >
      {audio ? <Audio src={audio} trimBefore={skip > 0 ? skip : undefined} /> : null}
      <div style={{ display: "flex", flexDirection: isPortrait ? "column" : "row", alignItems: "center", gap: u(40) }}>
        <Animate effect="scale">
          <Cover src={cover} show={show} />
        </Animate>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: u(14),
            alignItems: isPortrait ? "center" : "flex-start",
          }}
        >
          <TextReveal
            text={show}
            size={34}
            font="body"
            weight={600}
            color={theme.colors.accent}
            effect="fade"
            align={align}
          />
          {episode ? <TextReveal text={episode} size={60} align={align} delay={6} /> : null}
          {speakers.length > 0 ? (
            <TextReveal
              text={speakers.join(", ")}
              size={30}
              font="body"
              color={theme.colors.muted}
              effect="fade"
              align={align}
              delay={12}
            />
          ) : null}
        </div>
      </div>
      {audio ? (
        // A negative `from` moves the waveform's clock forward by the clip start, so it draws the audio being heard.
        <Sequence from={-skip} layout="none">
          <Waveform src={audio} variant="mirror" height={150} />
        </Sequence>
      ) : (
        <BeatBars />
      )}
      {quote ? <TextReveal text={`“${quote}”`} size={52} delay={10} /> : null}
      {captions.length > 0 ? <Captions captions={captions} position="bottom" /> : null}
    </AbsoluteFill>
  );
}

export function Audiogram({ audio, captions, show, episode, speakers, cover, ...fields }: AudiogramProps) {
  return (
    <TemplateFrame fields={fields}>
      <AudiogramLayout
        audio={audio}
        captions={captions}
        show={show}
        episode={episode}
        speakers={speakers}
        cover={cover}
      />
    </TemplateFrame>
  );
}

/** As long as the audio; without it, as long as the captions, or 8 s. */
export const audiogramMetadata: CalculateMetadataFunction<AudiogramProps> = async ({ props }) => ({
  durationInFrames: Math.ceil(
    STORY_FPS * (props.audio ? await mediaSeconds(props.audio) : captionsSeconds(props.captions, 8)),
  ),
});
