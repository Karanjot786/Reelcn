/**
 * @title Standings
 * @description A ranked table whose rows swap places like a split-flap departures board between weekly snapshots.
 * @category templates
 * @use A leaderboard, ranking or standings reveal across several time periods
 * @use Any "who's on top now" beat with real, specific rows — not a generic bar chart
 * @avoid A single static ranking with no re-sort — use `bar-race` or `bar-chart` instead
 * @tags standings, leaderboard, rank, split-flap, template
 * @duration data-driven
 * @example
 * <Composition
 *   id="Standings"
 *   component={Standings}
 *   schema={standingsSchema}
 *   defaultProps={standingsDefaults}
 *   calculateMetadata={standingsMetadata}
 *   width={1920} height={1080} fps={30} durationInFrames={1}
 * />
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { clamp01, rankSlots, tween, useTheme, useViewport } from "./core";
import type { CustomScene, Scene, Story } from "./story";
import { defineScene, Storyboard, templateMetadata, templateSchema, templateStory } from "./storyboard";
import { TextReveal } from "./text-reveal";

const rowSchema = z.object({ name: z.string(), value: z.number() });

export const standingsSchema = templateSchema.extend({
  rows: z.array(rowSchema),
  /** Several weekly snapshots to animate between. Omitted: `rows` is shown as a single static ranking. */
  weeks: z.array(z.array(rowSchema)).optional(),
});

export type StandingsProps = z.infer<typeof standingsSchema>;

export const standingsDefaults: StandingsProps = {
  rows: [
    { name: "Austin", value: 412 },
    { name: "Denver", value: 398 },
    { name: "Raleigh", value: 355 },
    { name: "Boise", value: 301 },
  ],
  weeks: [
    [
      { name: "Austin", value: 412 },
      { name: "Denver", value: 398 },
      { name: "Raleigh", value: 355 },
      { name: "Boise", value: 301 },
    ],
    [
      { name: "Denver", value: 430 },
      { name: "Austin", value: 415 },
      { name: "Boise", value: 340 },
      { name: "Raleigh", value: 320 },
    ],
  ],
};

type Row = { name: string; value: number };

function StandingsScene({ rows, weeks }: { rows: Row[]; weeks?: Row[][] }) {
  const theme = useTheme();
  const { u } = useViewport();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const snapshots = weeks && weeks.length > 0 ? weeks : [rows];
  const HOLD = Math.round(fps * 1.5);
  const TRANSITION = Math.round(fps * 0.8);
  const period = HOLD + TRANSITION;
  const index = Math.min(snapshots.length - 1, Math.floor(frame / period));
  const nextIndex = Math.min(snapshots.length - 1, index + 1);
  const t = clamp01(tween(frame - index * period, fps, { from: HOLD, duration: TRANSITION, motion: "smooth" }));
  const current = snapshots[index];
  const fromSlots = rankSlots(current);
  const toSlots = rankSlots(snapshots[nextIndex]);
  const rowH = u(64);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: u(640), height: rowH * current.length }}>
        {current.map((row, i) => {
          const fromSlot = fromSlots[i];
          const toSlot = i < snapshots[nextIndex].length ? toSlots[i] : fromSlot;
          const y = (fromSlot + (toSlot - fromSlot) * t) * rowH;
          const delta = toSlot - fromSlot;
          const arrowColor = delta < 0 ? theme.colors.success : delta > 0 ? theme.colors.danger : theme.colors.muted;
          return (
            <div
              key={row.name}
              style={{
                position: "absolute",
                top: y,
                left: 0,
                right: 0,
                height: rowH,
                display: "flex",
                alignItems: "center",
                gap: u(18),
              }}
            >
              <div style={{ width: u(44) }}>
                <TextReveal
                  key={`${row.name}-${index}`}
                  text={String(fromSlot + 1)}
                  effect="split-flap"
                  split="char"
                  size={30}
                  font="mono"
                  // The rank digit must stay put through the scene's own final frame — `useMotion`'s
                  // default auto-fade near the end of the enclosing Sequence (this scene spans every
                  // week, not just the one this row belongs to) would otherwise fade the last-shown
                  // rank to nothing right before the video ends.
                  exit={false}
                />
              </div>
              <span style={{ color: theme.colors.foreground, fontFamily: theme.fonts.body, fontSize: u(26), flex: 1 }}>
                {row.name}
              </span>
              <span style={{ color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: u(20) }}>
                {row.value}
              </span>
              <span style={{ color: arrowColor, fontSize: u(20), width: u(20) }}>
                {delta < 0 ? "▲" : delta > 0 ? "▼" : "–"}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

const standingsScene = defineScene({
  type: "standings-beat",
  schema: z.object({ rows: z.array(rowSchema), weeks: z.array(z.array(rowSchema)).optional() }),
  component: StandingsScene,
  duration: (scene: { weeks?: Row[][] }) => Math.max(1, scene.weeks?.length ?? 1) * 2.3,
});

export function standingsStory(props: StandingsProps): Story {
  const scenes: (Scene | CustomScene)[] = [
    { type: "standings-beat", rows: props.rows, weeks: props.weeks } as CustomScene,
  ];
  return templateStory(props, scenes as Scene[]);
}

export function Standings(props: StandingsProps) {
  return <Storyboard story={standingsStory(props)} scenes={[standingsScene]} />;
}

export const standingsMetadata = templateMetadata(standingsStory);
