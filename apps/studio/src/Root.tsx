import { demos } from "@reelcn/registry/demos";
import { Stage, type ThemeName, ThemeProvider, themeNames, Viewport } from "@reelcn/registry/items/core";
import { AbsoluteFill, Composition, Folder, Freeze, Sequence } from "remotion";
import { z } from "zod";
import { SelfTest } from "./self-test";

export const FORMATS = { "16x9": [1920, 1080], "9x16": [1080, 1920], "1x1": [1080, 1080] } as const;
export type Format = keyof typeof FORMATS;

const formats = Object.keys(FORMATS) as Format[];
const categories = [...new Set(demos.map((d) => d.category))];
const byId = new Map(demos.map((d) => [d.id, d]));

const demoSchema = z.object({
  demo: z.string(),
  theme: z.enum(themeNames as [ThemeName, ...ThemeName[]]),
});
const sheetSchema = demoSchema.extend({ format: z.enum(formats as [Format, ...Format[]]) });

function lookup(id: string) {
  const demo = byId.get(id);
  if (!demo) throw new Error(`Unknown demo "${id}"`);
  return demo;
}

function DemoView({ demo, theme }: z.infer<typeof demoSchema>) {
  const { component: Component, bare } = lookup(demo);
  return (
    <ThemeProvider theme={theme}>
      {bare ? (
        <Component />
      ) : (
        <Stage>
          <Component />
        </Stage>
      )}
    </ThemeProvider>
  );
}

const SHEET_CELLS = 9;
const SHEET_COLUMNS = 3;

/** One still holding nine frozen frames, so motion can be reviewed without watching a render. */
function ContactSheet({ demo, theme, format }: z.infer<typeof sheetSchema>) {
  const [width, height] = FORMATS[format];
  const { duration } = lookup(demo);
  return (
    <AbsoluteFill style={{ background: "#1c1c1c" }}>
      {Array.from({ length: SHEET_CELLS }, (_, cell) => {
        // Skip frame 0 and the last frame: auto-exiting items are invisible on both.
        const frame = Math.round(1 + (cell * Math.max(duration - 3, 0)) / (SHEET_CELLS - 1));
        return (
          <div
            key={cell}
            style={{
              position: "absolute",
              left: (cell % SHEET_COLUMNS) * width,
              top: Math.floor(cell / SHEET_COLUMNS) * height,
              width,
              height,
              overflow: "hidden",
            }}
          >
            <Sequence durationInFrames={duration}>
              <Freeze frame={frame}>
                <Viewport width={width} height={height}>
                  <DemoView demo={demo} theme={theme} />
                </Viewport>
              </Freeze>
            </Sequence>
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                padding: "6px 18px",
                background: "#000c",
                color: "#fff",
                font: "600 44px monospace",
              }}
            >
              f{frame}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

export function Root() {
  return (
    <>
      <Composition id="self-test" component={SelfTest} durationInFrames={40} fps={30} width={1920} height={1080} />
      {formats.map((format) => (
        <Folder key={format} name={format}>
          {categories.map((category) => (
            <Folder key={category} name={category}>
              {demos
                .filter((demo) => demo.category === category)
                .map((demo) => (
                  <Composition
                    key={demo.id}
                    id={`${demo.id}-${format}`}
                    component={DemoView}
                    schema={demoSchema}
                    defaultProps={{ demo: demo.id, theme: "midnight" as ThemeName }}
                    durationInFrames={demo.duration}
                    fps={30}
                    width={FORMATS[format][0]}
                    height={FORMATS[format][1]}
                  />
                ))}
            </Folder>
          ))}
        </Folder>
      ))}
      <Folder name="sheets">
        {demos.flatMap((demo) =>
          formats.map((format) => (
            <Composition
              key={`${demo.id}-${format}`}
              id={`sheet-${demo.id}-${format}`}
              component={ContactSheet}
              schema={sheetSchema}
              defaultProps={{ demo: demo.id, theme: "midnight" as ThemeName, format }}
              // Not a <Still>: that reports fps 1 and durationInFrames 1, which clamps every cell's Sequence
              // to a single frame, leaving <Freeze> nothing to freeze. Only frame 0 is ever rendered.
              durationInFrames={demo.duration}
              fps={30}
              width={FORMATS[format][0] * SHEET_COLUMNS}
              height={FORMATS[format][1] * (SHEET_CELLS / SHEET_COLUMNS)}
            />
          )),
        )}
      </Folder>
    </>
  );
}
