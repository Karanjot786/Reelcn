//! The reelcn launch film on fframes: the HyperFrames film redrawn as SVG, frame by frame.
//!
//! Every animated value comes from `motion::track`, which replays the HyperFrames GSAP tweens
//! with GSAP's own ease formulas. Positions and sizes are the HyperFrames CSS numbers.
pub mod motion;

use fframes::{
    AudioMap, AudioTimestamp, AudioTrack, Color, Duration, FFramesContext, Frame, Svgr, Video, include_media_dir,
};
use motion::{Ease::*, Seg, seg, track};

// Every top-level file of `media/` is embedded. Subfolders are not, so images are flat.
include_media_dir!(pub struct FframesLaunchFilmMedia, "media");

pub const WIDTH: usize = 1920;
pub const HEIGHT: usize = 1080;

const INK: &str = "#0a0b0d";
const FG: &str = "#f2f3f5";
const AMBER: &str = "#ffb224";
const DIM: &str = "#8a8f98";
/// Font family names as the TTF files declare them.
const MONO_500: &str = "IBM Plex Mono Medium";
const SANS: &str = "IBM Plex Sans";

// Measured in the HyperFrames film (offsetWidth with Plex Mono loaded).
const PROMPT_W: f32 = 67.0;
const TYPED_W: f32 = 1243.0;
const TERM_LEFT: f32 = 305.0;
const CX0: f32 = TERM_LEFT + PROMPT_W + 6.0;
const CY0: f32 = 507.0;

const NAMES: [&str; 28] = [
    "bar-chart-revenue", "audiogram", "bar-race-cities", "beams-top", "bento-grid-features", "bokeh", "brand-reel",
    "brand-solid", "brand-sweep-default", "browser-window-dashboard", "hero-launch", "camera-tour", "card-push-default",
    "circle-burst-default", "code-block-follow", "counter-count", "data-story", "area-chart-storage", "donut-traffic",
    "gradient-mesh", "kpi-grid-overview", "line-chart-signups", "laptop-frame-dashboard", "quote-card",
    "stat-counter-mrr", "theme-midnight", "theme-chromewave", "terminal-install",
];
const COLS: usize = 7;
const TW: f32 = 248.0;
const TH: f32 = 140.0;
const SEED: usize = 10;

fn pos(i: usize) -> (f32, f32) {
    (44.0 + (i % COLS) as f32 * (TW + 16.0), 270.0 + (i / COLS) as f32 * (TH + 16.0))
}

/// A GSAP `fromTo`: the value jumps to `from` when the tween starts.
fn from_to(at: f32, dur: f32, from: f32, to: f32, ease: motion::Ease) -> Seg {
    Seg { at, dur, to, ease, from: Some(from) }
}

/// Scale `s` about the point (`px`, `py`), then move by (`x`, `y`).
fn place(x: f32, y: f32, s: f32, px: f32, py: f32) -> String {
    format!("translate({} {}) scale({s})", x + px * (1.0 - s), y + py * (1.0 - s))
}

pub struct FframesLaunchFilmVideo<'a> {
    pub media: &'a FframesLaunchFilmMedia,
}

impl<'a> FframesLaunchFilmVideo<'a> {
    pub fn new(media: &'a FframesLaunchFilmMedia, _title: &str) -> Self {
        Self { media }
    }
}

impl std::fmt::Debug for FframesLaunchFilmVideo<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("FframesLaunchFilmVideo").finish()
    }
}

fn carrier(t: f32) -> Svgr<'static> {
    let (t20x, t20y) = pos(SEED);
    let x = track(t, CX0, &[
        seg(0.1, 1.2, CX0 + TYPED_W, Steps(37)),
        seg(1.5, 0.3, CX0, In(3)),
        seg(1.78, 0.22, 946.0, InOut(3)),
        seg(2.05, 0.4, t20x - 8.0, InOut(3)),
    ]);
    let y = track(t, CY0, &[seg(1.78, 0.22, 526.0, InOut(3)), seg(2.05, 0.4, t20y - 8.0, InOut(3))]);
    let w = track(t, 30.0, &[seg(1.78, 0.22, 28.0, InOut(3)), seg(2.05, 0.4, TW + 16.0, InOut(3))]);
    let h = track(t, 66.0, &[seg(1.78, 0.22, 28.0, InOut(3)), seg(2.05, 0.4, TH + 16.0, InOut(3))]);
    let r = track(t, 4.0, &[seg(1.78, 0.22, 14.0, InOut(3)), seg(2.05, 0.4, 16.0, InOut(3))]);
    let fill = track(t, 1.0, &[seg(2.05, 0.4, 0.0, InOut(3))]);
    // GSAP's default ease is power1.out; the blink is a yoyo, so it runs there and back.
    let opacity = track(t, 1.0, &[seg(1.36, 0.06, 0.25, Out(1)), seg(1.42, 0.06, 1.0, Out(1))]);
    let s = track(t, 1.0, &[seg(3.8, 0.2, 0.92, In(2)), seg(4.0, 0.22, 1.0, BackOut(3.0))]);
    // The 5px border sits inside the box, like CSS box-sizing: border-box.
    fframes::svgr!(
        <g opacity={opacity} transform={place(x, y, s, w / 2.0, h / 2.0)}>
            <rect width={w} height={h} rx={r} fill={AMBER} fill-opacity={fill} />
            <rect x="2.5" y="2.5" width={(w - 5.0).max(0.0)} height={(h - 5.0).max(0.0)} rx={(r - 2.5).max(0.0)} fill="none" stroke={AMBER} stroke-width="5" />
        </g>
    )
}

fn terminal(t: f32) -> Svgr<'static> {
    let typed = track(t, 0.0, &[seg(0.1, 1.2, TYPED_W, Steps(37)), seg(1.5, 0.3, 0.0, In(3))]).max(0.01);
    let opacity = track(t, 1.0, &[seg(1.55, 0.25, 0.0, In(2))]);
    let blur = track(t, 0.0, &[seg(1.55, 0.25, 6.0, In(2))]);
    // A 56px line in a 72px box at top 504: the baseline sits at 561.
    fframes::svgr!(
        <g opacity={opacity} filter="url(#termblur)">
            <defs>
                <filter id="termblur" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation={blur} /></filter>
                <clipPath id="typed"><rect x={TERM_LEFT + PROMPT_W} y="490" width={typed} height="100" /></clipPath>
            </defs>
            <text x={TERM_LEFT} y="561" font-family={MONO_500} font-weight="500" font-size="56" fill={DIM}>"$"</text>
            <g clip-path="url(#typed)">
                <text x={TERM_LEFT + PROMPT_W} y="561" font-family={MONO_500} font-weight="500" font-size="56" fill={FG}>"npx shadcn add @reelcn/product-launch"</text>
            </g>
        </g>
    )
}

fn grid<'a>(t: f32, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
    let s = track(t, 1.0, &[seg(3.8, 0.2, 0.965, In(2)), seg(4.0, 0.22, 1.0, BackOut(3.0))]);
    let tiles: Vec<Svgr<'a>> = (0..NAMES.len())
        .map(|i| {
            let (x, y) = pos(i);
            // GSAP's grid stagger: each tile waits 0.046s per cell of distance from the seed tile.
            let d = (((i / COLS) as f32 - (SEED / COLS) as f32).powi(2) + ((i % COLS) as f32 - (SEED % COLS) as f32).powi(2)).sqrt();
            let at = 2.3 + 0.046 * d;
            let opacity = track(t, 0.0, &[from_to(at, 0.34, 0.0, 1.0, Out(3))]);
            let ts = track(t, 0.55, &[from_to(at, 0.34, 0.55, 1.0, Out(3))]);
            let ty = track(t, 26.0, &[from_to(at, 0.34, 26.0, 0.0, Out(3))]);
            let href = ctx.get_image(&format!("thumb-{}.jpg", NAMES[i])).expect("thumbnail in media/").href();
            let id = format!("tile{i}");
            fframes::svgr!(
                <g opacity={opacity} transform={place(x, y + ty, ts, TW / 2.0, TH / 2.0)}>
                    <defs><clipPath id={id.clone()}><rect width={TW} height={TH} rx="12" /></clipPath></defs>
                    <g clip-path={format!("url(#{id})")}>
                        <rect width={TW} height={TH} fill="#fff" />
                        <image href={href} width={TW} height={TH} preserveAspectRatio="xMidYMid slice" />
                    </g>
                </g>
            )
        })
        .collect();
    fframes::svgr!(<g transform={place(0.0, 0.0, s, 960.0, 496.0)}>{tiles}</g>)
}

fn head(t: f32) -> Svgr<'static> {
    let opacity = track(t, 0.0, &[from_to(2.25, 0.35, 0.0, 1.0, Out(3))]);
    let y = track(t, 30.0, &[from_to(2.25, 0.35, 30.0, 0.0, Out(3))]);
    let n = track(t, 0.0, &[seg(2.35, 1.45, 154.0, Out(2))]).round();
    // 96px with line-height 1 at top 104: the baseline sits at 188.
    fframes::svgr!(
        <g opacity={opacity} transform={format!("translate(0 {y})")}>
            <text x="44" y="188" font-family={SANS} font-weight="700" font-size="96" letter-spacing="-2.5" fill={FG}>{n.to_string()}</text>
            <text x="228" y="188" font-family={SANS} font-weight="700" font-size="96" letter-spacing="-2.5" fill={FG}>"components."</text>
        </g>
    )
}

impl Video for FframesLaunchFilmVideo<'_> {
    const FPS: usize = 60;
    const WIDTH: usize = WIDTH;
    const HEIGHT: usize = HEIGHT;
    const BACKGROUND_COLOR: Color = Color::BLACK;

    fn duration(&self) -> Duration<'_> {
        Duration::Seconds(15.0)
    }

    fn audio(&self) -> AudioMap<'_> {
        AudioMap::from([AudioTrack::new("track.mp3", AudioTimestamp::Second(0.)..AudioTimestamp::Eof)])
    }

    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.global_index as f32 / 60.0;
        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox={format!("0 0 {WIDTH} {HEIGHT}")} width={WIDTH} height={HEIGHT}>
                <rect width={WIDTH} height={HEIGHT} fill={INK} />
                {grid(t, ctx)}
                {head(t)}
                {terminal(t)}
                {carrier(t)}
            </svg>
        )
    }
}
