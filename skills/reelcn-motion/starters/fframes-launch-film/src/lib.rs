//! The reelcn launch film on fframes: the HyperFrames film redrawn as SVG, frame by frame.
//!
//! Every animated value comes from `motion::track`, which replays the HyperFrames GSAP tweens
//! with GSAP's own ease formulas. Positions and sizes are the HyperFrames CSS numbers.
pub mod motion;

use fframes::{
    AudioMap, AudioTimestamp, AudioTrack, Color, Duration, FFramesContext, FontQuery, Frame, Svgr, Video,
    include_media_dir,
};
use motion::{Ease, Ease::*, Seg, seg, track};

// Every top-level file of `media/` is embedded. Subfolders are not, so images are flat.
include_media_dir!(pub struct FframesLaunchFilmMedia, "media");

pub const WIDTH: usize = 1920;
pub const HEIGHT: usize = 1080;

const INK: &str = "#0a0b0d";
const PAPER: &str = "#eef0f2";
const FG: &str = "#f2f3f5";
const AMBER: &str = "#ffb224";
const DIM: &str = "#8a8f98";
const GREY: &str = "#6b7280";
/// Font family names as the TTF files declare them.
const MONO_500: &str = "IBM Plex Mono Medium";
const SANS: &str = "IBM Plex Sans";
const COND: &str = "IBM Plex Sans Condensed";

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
const HOPS: [usize; 10] = [4, 19, 8, 23, 1, 13, 26, 16, 5, 10];
const COLS: usize = 7;
const TW: f32 = 248.0;
const TH: f32 = 140.0;
const SEED: usize = 10;
// The hero frame at full size, and its centre line for the reshapes.
const HX: f32 = 930.0;
const HY: f32 = 262.0;
const HW: f32 = 900.0;
const HH: f32 = 506.0;
const HCX: f32 = 1380.0;
/// Reshapes: start, width, format image, label.
const SHAPES: [(f32, f32, usize, usize); 3] = [(7.0, 285.0, 1, 1), (7.5, 506.0, 2, 2), (8.0, 900.0, 0, 0)];
const FORMATS: [(&str, f32); 3] = [("still-fmt-16x9.jpg", 16.0 / 9.0), ("still-fmt-9x16.jpg", 9.0 / 16.0), ("still-fmt-1x1.jpg", 1.0)];
const FMT_LABELS: [&str; 3] = ["16:9 \u{a0}YouTube, web", "9:16 \u{a0}Shorts, Reels", "1:1 \u{a0}Feeds"];
const THEMES: [(&str, f32); 3] = [("still-theme-mono.jpg", 9.5), ("still-theme-chromewave.jpg", 10.0), ("still-theme-midnight.jpg", 10.5)];
const THEME_WORDS: [&str; 4] = ["daylight\"", "mono\"", "chromewave\"", "midnight\""];

fn pos(i: usize) -> (f32, f32) {
    (44.0 + (i % COLS) as f32 * (TW + 16.0), 270.0 + (i / COLS) as f32 * (TH + 16.0))
}

/// The time of hop `k`: one per half beat from 4s.
fn hop(k: usize) -> f32 {
    4.0 + k as f32 * 0.25
}

/// A GSAP `fromTo`: the value jumps to `from` when the tween starts.
fn from_to(at: f32, dur: f32, from: f32, to: f32, ease: Ease) -> Seg {
    Seg { at, dur, to, ease, from: Some(from) }
}

/// A GSAP `set`: the value jumps at `at`.
fn set(at: f32, to: f32) -> Seg {
    seg(at, 0.0, to, Linear)
}

/// Scale `s` about the point (`px`, `py`), then move by (`x`, `y`).
fn place(x: f32, y: f32, s: f32, px: f32, py: f32) -> String {
    format!("translate({} {}) scale({s})", x + px * (1.0 - s), y + py * (1.0 - s))
}

fn blur(id: &str, sd: f32) -> Svgr<'static> {
    let id = id.to_string();
    fframes::svgr!(
        <filter id={id} x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation={sd.max(0.0)} /></filter>
    )
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
    let mut xs = vec![
        seg(0.1, 1.2, CX0 + TYPED_W, Steps(37)),
        seg(1.5, 0.3, CX0, In(3)),
        seg(1.78, 0.22, 946.0, InOut(3)),
        seg(2.05, 0.4, t20x - 8.0, InOut(3)),
    ];
    let mut ys = vec![seg(1.78, 0.22, 526.0, InOut(3)), seg(2.05, 0.4, t20y - 8.0, InOut(3))];
    for (k, &i) in HOPS.iter().enumerate() {
        let (px, py) = pos(i);
        xs.push(seg(hop(k), 0.17, px - 8.0, Out(4)));
        ys.push(seg(hop(k), 0.17, py - 8.0, Out(4)));
    }
    xs.push(seg(6.45, 0.5, HX - 8.0, InOut(4)));
    ys.push(seg(6.45, 0.5, HY - 8.0, InOut(4)));
    let x = track(t, CX0, &xs);
    let y = track(t, CY0, &ys);
    let w = track(t, 30.0, &[seg(1.78, 0.22, 28.0, InOut(3)), seg(2.05, 0.4, TW + 16.0, InOut(3)), seg(6.45, 0.5, HW + 16.0, InOut(4))]);
    let h = track(t, 66.0, &[seg(1.78, 0.22, 28.0, InOut(3)), seg(2.05, 0.4, TH + 16.0, InOut(3)), seg(6.45, 0.5, HH + 16.0, InOut(4))]);
    let r = track(t, 4.0, &[seg(1.78, 0.22, 14.0, InOut(3)), seg(2.05, 0.4, 16.0, InOut(3)), seg(6.45, 0.5, 28.0, InOut(4))]);
    let fill = track(t, 1.0, &[seg(2.05, 0.4, 0.0, InOut(3))]);
    // GSAP's default ease is power1.out; a yoyo runs there and back.
    let opacity = track(t, 1.0, &[seg(1.36, 0.06, 0.25, Out(1)), seg(1.42, 0.06, 1.0, Out(1)), seg(6.95, 0.25, 0.0, Out(1))]);
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
    let sd = track(t, 0.0, &[seg(1.55, 0.25, 6.0, In(2))]);
    // A 56px line in a 72px box at top 504: the baseline sits at 561.
    fframes::svgr!(
        <g opacity={opacity} filter="url(#termblur)">
            <defs>
                {blur("termblur", sd)}
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
    let s = track(t, 1.0, &[seg(3.8, 0.2, 0.965, In(2)), seg(4.0, 0.22, 1.0, BackOut(3.0)), seg(6.45, 0.4, 1.3, In(2))]);
    let opacity = track(t, 1.0, &[seg(6.45, 0.4, 0.0, In(2))]);
    let sd = track(t, 0.0, &[seg(6.45, 0.4, 16.0, In(2))]);
    let tiles: Vec<Svgr<'a>> = (0..NAMES.len())
        .map(|i| {
            let (x, y) = pos(i);
            // GSAP's grid stagger with `each`: the whole spread is each * max(columns, count / columns),
            // shared out by each tile's distance from the seed tile over the farthest tile's distance.
            let dist = |j: usize| (((j / COLS) as f32 - (SEED / COLS) as f32).powi(2) + ((j % COLS) as f32 - (SEED % COLS) as f32).powi(2)).sqrt();
            let far = (0..NAMES.len()).map(dist).fold(0.0, f32::max);
            let at = 2.3 + 0.046 * COLS.max(NAMES.len() / COLS) as f32 * dist(i) / far;
            // All tiles dim at 4s; the hopped tile lights up and dims again a half beat later.
            // The dim is listed first: when both start together, the earlier tween wins, as in the film.
            let mut op = vec![from_to(at, 0.34, 0.0, 1.0, Out(3)), seg(4.0, 0.18, 0.3, Out(1))];
            let mut sc = vec![from_to(at, 0.34, 0.55, 1.0, Out(3))];
            if let Some(k) = HOPS.iter().position(|&h| h == i) {
                op.push(seg(hop(k), 0.14, 1.0, Out(3)));
                sc.push(seg(hop(k), 0.14, 1.08, Out(3)));
                if k < HOPS.len() - 1 {
                    op.push(seg(hop(k) + 0.25, 0.14, 0.3, Out(2)));
                    sc.push(seg(hop(k) + 0.25, 0.14, 1.0, Out(2)));
                }
            }
            let tile_op = track(t, 0.0, &op);
            let ts = track(t, 0.55, &sc);
            let ty = track(t, 26.0, &[from_to(at, 0.34, 26.0, 0.0, Out(3))]);
            let href = ctx.get_image(&format!("thumb-{}.jpg", NAMES[i])).expect("thumbnail in media/").href();
            let id = format!("tile{i}");
            fframes::svgr!(
                <g opacity={tile_op} transform={place(x, y + ty, ts, TW / 2.0, TH / 2.0)}>
                    <defs><clipPath id={id.clone()}><rect width={TW} height={TH} rx="12" /></clipPath></defs>
                    <g clip-path={format!("url(#{id})")}>
                        <rect width={TW} height={TH} fill="#fff" />
                        <image href={href} width={TW} height={TH} preserveAspectRatio="xMidYMid slice" />
                    </g>
                </g>
            )
        })
        .collect();
    fframes::svgr!(
        <g opacity={opacity} filter="url(#gridblur)">
            <defs>{blur("gridblur", sd)}</defs>
            <g transform={place(0.0, 0.0, s, 960.0, 496.0)}>{tiles}</g>
        </g>
    )
}

fn head(t: f32) -> Svgr<'static> {
    let opacity = track(t, 0.0, &[from_to(2.25, 0.35, 0.0, 1.0, Out(3)), seg(6.45, 0.25, 0.0, In(2))]);
    let y = track(t, 30.0, &[from_to(2.25, 0.35, 30.0, 0.0, Out(3)), seg(6.45, 0.25, -24.0, In(2))]);
    let n = track(t, 0.0, &[seg(2.35, 1.45, 154.0, Out(2))]).round();
    let one = track(t, 0.0, &[from_to(4.0, 0.3, 0.0, 1.0, Out(3))]);
    let one_x = track(t, -24.0, &[from_to(4.0, 0.3, -24.0, 0.0, Out(3))]);
    // 96px with line-height 1 at top 104: the baseline sits at 188. The count holds a 184px slot.
    fframes::svgr!(
        <g opacity={opacity} transform={format!("translate(0 {y})")}>
            <text x="44" y="188" font-family={SANS} font-weight="700" font-size="96" letter-spacing="-2.5" fill={FG}>{n.to_string()}</text>
            <text x="228" y="188" font-family={SANS} font-weight="700" font-size="96" letter-spacing="-2.5" fill={FG}>
                "components."
                <tspan dx={one_x} fill={DIM} fill-opacity={one}>"\u{a0}One command."</tspan>
            </text>
        </g>
    )
}

fn chip(t: f32) -> Svgr<'static> {
    let opacity = track(t, 0.0, &[from_to(4.0, 0.3, 0.0, 1.0, Out(3)), seg(6.45, 0.25, 0.0, In(2))]);
    let y = track(t, 24.0, &[from_to(4.0, 0.3, 24.0, 0.0, Out(3)), seg(6.45, 0.25, -24.0, In(2))]);
    // 34px Plex Mono advances 20.4px a letter: the 25-letter prefix ends at 582.
    let names: Vec<Svgr<'static>> = HOPS
        .iter()
        .enumerate()
        .map(|(k, &i)| {
            let mut op = vec![from_to(hop(k), 0.1, 0.0, 1.0, Out(2))];
            if k < HOPS.len() - 1 {
                op.push(set(hop(k + 1), 0.0));
            }
            let o = track(t, 0.0, &op);
            let dy = track(t, 14.0, &[from_to(hop(k), 0.1, 14.0, 0.0, Out(2))]);
            let label = if NAMES[i] == "hero-launch" { "product-launch" } else { NAMES[i] };
            fframes::svgr!(
                <text x="582" y={981.0 + dy} font-family={MONO_500} font-weight="500" font-size="34" fill={AMBER} opacity={o}>{label}</text>
            )
        })
        .collect();
    fframes::svgr!(
        <g opacity={opacity} transform={format!("translate(0 {y})")}>
            <rect x="44" y="932" width="1126" height="72" rx="16" fill="#16181d" />
            <rect x="44.5" y="932.5" width="1125" height="71" rx="15.5" fill="none" stroke="#2a2d34" stroke-width="1" />
            <text x="72" y="981" font-family={MONO_500} font-weight="500" font-size="34" fill={DIM}>"$ npx shadcn add @reelcn/"</text>
            {names}
        </g>
    )
}

fn flood(t: f32) -> Svgr<'static> {
    let s = track(t, 0.0, &[from_to(6.45, 0.45, 0.0, 28.0, InOut(3))]);
    let opacity = track(t, 1.0, &[set(11.0, 0.0)]);
    fframes::svgr!(<circle cx="960" cy="496" r={(50.0 * s).max(0.01)} fill={PAPER} opacity={opacity} />)
}

fn hero<'a>(t: f32, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
    let mut xs = vec![seg(6.45, 0.5, HX, InOut(4))];
    let mut ws = vec![seg(6.45, 0.5, HW, InOut(4))];
    for (at, w, _, _) in SHAPES {
        xs.push(seg(at, 0.32, HCX - w / 2.0, InOut(4)));
        ws.push(seg(at, 0.32, w, InOut(4)));
    }
    xs.push(seg(10.73, 0.27, -480.0, In(3)));
    ws.push(seg(10.73, 0.27, 2880.0, In(3)));
    let x = track(t, 836.0, &xs);
    let w = track(t, 248.0, &ws);
    let y = track(t, 426.0, &[seg(6.45, 0.5, HY, InOut(4)), seg(10.73, 0.27, -270.0, In(3))]);
    let h = track(t, 140.0, &[seg(6.45, 0.5, HH, InOut(4)), seg(10.73, 0.27, 1620.0, In(3))]);
    let r = track(t, 12.0, &[seg(6.45, 0.5, 22.0, InOut(4)), seg(10.73, 0.27, 0.0, In(3))]);
    let s = track(t, 1.0, &[from_to(6.97, 3.75, 1.0, 1.045, Linear), seg(10.73, 0.27, 1.0, In(3))]);
    let opacity = track(t, 0.0, &[set(6.44, 1.0)]);
    // Each format image sits centred at the frame's height. Every reshape fades all three out,
    // then the new one in, so the old one keeps fading while the new one rises.
    let formats: Vec<Svgr<'a>> = FORMATS
        .iter()
        .enumerate()
        .map(|(f, &(name, aspect))| {
            let mut op = Vec::new();
            for (at, _, img, _) in SHAPES {
                op.push(seg(at + 0.06, 0.16, 0.0, Out(1)));
                if img == f {
                    op.push(seg(at + 0.08, 0.16, 1.0, Out(1)));
                }
            }
            let o = track(t, if f == 0 { 1.0 } else { 0.0 }, &op);
            let iw = h * aspect;
            let href = ctx.get_image(name).expect("still in media/").href();
            fframes::svgr!(<image href={href} x={(w - iw) / 2.0} y="0" width={iw} height={h} opacity={o} />)
        })
        .collect();
    let themes: Vec<Svgr<'a>> = THEMES
        .iter()
        .enumerate()
        .map(|(k, &(name, at))| {
            let shown = track(t, 0.0, &[seg(at, 0.34, 1.0, InOut(3))]);
            let href = ctx.get_image(name).expect("still in media/").href();
            let id = format!("theme{k}");
            fframes::svgr!(
                <g>
                    <defs><clipPath id={id.clone()}><rect width={(w * shown).max(0.01)} height={h} /></clipPath></defs>
                    <image href={href} width={w} height={h} preserveAspectRatio="xMidYMid slice" clip-path={format!("url(#{id})")} />
                </g>
            )
        })
        .collect();
    fframes::svgr!(
        <g opacity={opacity} transform={place(x, y, s, w / 2.0, h / 2.0)}>
            <defs>
                <filter id="heroshadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="30" stdDeviation="40" flood-color={INK} flood-opacity="0.22" /></filter>
                <clipPath id="heroclip"><rect width={w} height={h} rx={r} /></clipPath>
            </defs>
            <rect width={w} height={h} rx={r} fill="#fff" filter="url(#heroshadow)" />
            <g clip-path="url(#heroclip)">{formats}{themes}</g>
        </g>
    )
}

/// Two masked rows of 80px bold type at top 340. Each row's span rises from below its row.
fn lines(t: f32, id: &str, words: [&'static str; 2], rows: [&[Seg]; 2], exit: &[Seg]) -> Svgr<'static> {
    let opacity = track(t, 1.0, exit);
    let x = track(t, 0.0, &exit.iter().map(|s| Seg { at: s.at, dur: s.dur, to: -60.0, ease: s.ease, from: None }).collect::<Vec<_>>());
    let spans: Vec<Svgr<'static>> = (0..2)
        .map(|k| {
            let yp = track(t, 1.0, rows[k]);
            let top = 340.0 + 98.0 * k as f32;
            let cid = format!("{id}{k}");
            fframes::svgr!(
                <g>
                    <defs><clipPath id={cid.clone()}><rect x="0" y={top} width="1920" height="98" /></clipPath></defs>
                    <g clip-path={format!("url(#{cid})")}>
                        <text x="100" y={top + 79.0 + 98.0 * yp} font-family={SANS} font-weight="700" font-size="80" letter-spacing="-2.4" fill={INK}>{words[k]}</text>
                    </g>
                </g>
            )
        })
        .collect();
    fframes::svgr!(<g opacity={opacity} transform={format!("translate({x} 0)")}>{spans}</g>)
}

fn code(t: f32) -> Svgr<'static> {
    let exit = seg(10.75, 0.2, 0.0, In(2));
    let opacity = track(t, 0.0, &[from_to(9.0, 0.3, 0.0, 1.0, Out(3)), exit]);
    let x = track(t, 0.0, &[seg(10.75, 0.2, -60.0, In(2))]);
    let y = track(t, 20.0, &[from_to(9.0, 0.3, 20.0, 0.0, Out(3))]);
    let mut pulse = Vec::new();
    for (_, at) in THEMES {
        pulse.push(from_to(at, 0.09, 1.0, 1.045, Out(1)));
        pulse.push(seg(at + 0.09, 0.09, 1.0, Out(1)));
    }
    let s = track(t, 1.0, &pulse);
    // 38px Plex Mono advances 22.8px a letter: `theme="` ends at 287.6, the box is 505.6 wide.
    let words: Vec<Svgr<'static>> = THEME_WORDS
        .iter()
        .enumerate()
        .map(|(k, &word)| {
            let mut op = vec![];
            let mut dy = vec![];
            if k == 0 {
                op.push(set(9.0, 1.0));
            } else {
                let at = THEMES[k - 1].1 + 0.04;
                op.push(from_to(at, 0.14, 0.0, 1.0, Out(2)));
                dy.push(from_to(at, 0.14, 16.0, 0.0, Out(2)));
            }
            if k < THEMES.len() {
                op.push(set(THEMES[k].1 + 0.04, 0.0));
            }
            let o = track(t, 0.0, &op);
            let d = track(t, if k == 0 { 0.0 } else { 16.0 }, &dy);
            fframes::svgr!(<text x="287.6" y={626.0 + d} font-family={MONO_500} font-weight="500" font-size="38" fill="#b45309" opacity={o}>{word}</text>)
        })
        .collect();
    fframes::svgr!(
        <g opacity={opacity} transform={place(x, y, s, 352.8, 612.0)}>
            <defs><filter id="codeshadow" x="-10%" y="-30%" width="120%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color={INK} flood-opacity="0.08" /></filter></defs>
            <rect x="100" y="572" width="505.6" height="80" rx="16" fill="#fff" filter="url(#codeshadow)" />
            <text x="128" y="626" font-family={MONO_500} font-weight="500" font-size="38" fill={GREY}>"theme="<tspan fill={INK}>"\""</tspan></text>
            {words}
        </g>
    )
}

fn bar(t: f32) -> Svgr<'static> {
    let opacity = track(t, 0.0, &[seg(6.85, 0.2, 1.0, Out(1)), seg(10.75, 0.2, 0.0, In(2))]);
    let x = track(t, 0.0, &[seg(10.75, 0.2, -60.0, In(2))]);
    let fill = track(t, 0.0, &[from_to(6.9, 4.05, 0.0, 1.0, Linear)]);
    fframes::svgr!(
        <g opacity={opacity} transform={format!("translate({x} 0)")}>
            <rect x="930" y="814" width="900" height="6" rx="3" fill={INK} fill-opacity="0.12" />
            <rect x="930" y="814" width={(900.0 * fill).max(0.01)} height="6" rx="3" fill={AMBER} />
            <circle cx={930.0 + 900.0 * fill} cy="817" r="17" fill={AMBER} fill-opacity="0.25" />
            <circle cx={930.0 + 900.0 * fill} cy="817" r="12" fill={AMBER} />
        </g>
    )
}

fn fmt(t: f32) -> Svgr<'static> {
    let opacity = track(t, 0.0, &[seg(6.85, 0.2, 1.0, Out(1)), seg(8.8, 0.2, 0.0, Out(1))]);
    let labels: Vec<Svgr<'static>> = FMT_LABELS
        .iter()
        .enumerate()
        .map(|(k, &label)| {
            let mut op = vec![];
            let mut dy = vec![];
            if k == 0 {
                op.push(set(6.85, 1.0));
            }
            for (at, _, _, l) in SHAPES {
                op.push(set(at + 0.1, 0.0));
                if l == k {
                    op.push(from_to(at + 0.1, 0.15, 0.0, 1.0, Out(1)));
                    dy.push(from_to(at + 0.1, 0.15, 10.0, 0.0, Out(1)));
                }
            }
            let o = track(t, 0.0, &op);
            let d = track(t, 0.0, &dy);
            // 28px with line-height 1 at top 842: the baseline sits at 866.5.
            fframes::svgr!(<text x="930" y={866.5 + d} font-family={MONO_500} font-weight="500" font-size="28" fill={GREY} opacity={o}>{label}</text>)
        })
        .collect();
    fframes::svgr!(<g opacity={opacity}>{labels}</g>)
}

/// One `<text>` per letter, laid out left to right from the measured advances, centred at 960.
fn letters<'a>(frame: &mut Frame, ctx: &FFramesContext<'a, '_>, word: &'static str, size: usize, spacing: f32) -> Vec<(String, f32)> {
    let font = FontQuery { family: COND, size, weight: 700, ..Default::default() };
    let advances: Vec<(String, f32)> = word
        .char_indices()
        .map(|(i, c)| {
            let one = &word[i..i + c.len_utf8()];
            (one.to_string(), frame.text_width(ctx, font, one).unwrap_or(size / 2) as f32 + spacing)
        })
        .collect();
    let total: f32 = advances.iter().map(|(_, a)| a).sum();
    let mut x = 960.0 - total / 2.0;
    advances
        .into_iter()
        .map(|(c, a)| {
            let at = x;
            x += a;
            (c, at)
        })
        .collect()
}

/// The three words: Install, Edit, Render, on the dark ground. 430px condensed type at top 270.
fn words<'a>(t: f32, frame: &mut Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
    let dark = track(t, 0.0, &[set(11.0, 1.0)]);
    // 430px with line-height 1 at top 270: the baseline sits at 646.
    let install: Vec<Svgr<'a>> = letters(frame, ctx, "Install.", 430, -10.0)
        .into_iter()
        .enumerate()
        .map(|(i, (c, x))| {
            let at = 11.0 + 0.028 * i as f32;
            let o = track(t, 0.0, &[from_to(at, 0.24, 0.0, 1.0, Out(4)), set(11.5, 0.0)]);
            let y = track(t, -260.0, &[from_to(at, 0.24, -260.0, 0.0, Out(4))]);
            let sd = track(t, 10.0, &[from_to(at, 0.24, 10.0, 0.0, Out(4))]);
            let id = format!("ib{i}");
            fframes::svgr!(
                <g opacity={o} filter={format!("url(#{id})")}>
                    <defs>{blur(&id, sd)}</defs>
                    <text x={x} y={646.0 + y} font-family={COND} font-weight="700" font-size="430" fill={FG}>{c}</text>
                </g>
            )
        })
        .collect();
    let under_o = track(t, 0.0, &[set(11.04, 1.0), set(11.5, 0.0)]);
    let under = track(t, 0.0, &[from_to(11.06, 0.4, 0.0, 1.0, InOut(1))]);

    // Edit: typed by the caret. The line stays centred while it grows, as text-align: center does.
    let edit_font = FontQuery { family: COND, size: 430, weight: 700, ..Default::default() };
    let edit_w = frame.text_width(ctx, edit_font, "Edit.").unwrap_or(900) as f32 - 50.0;
    let ew = track(t, 0.0, &[seg(11.52, 0.25, edit_w, Steps(5))]);
    let edit_o = track(t, 0.0, &[set(11.5, 1.0), set(12.0, 0.0)]);
    let caret_o = track(t, 1.0, &[
        seg(11.8, 0.05, 0.0, Out(1)),
        seg(11.85, 0.05, 1.0, Out(1)),
        seg(11.9, 0.05, 0.0, Out(1)),
        seg(11.95, 0.05, 1.0, Out(1)),
    ]);
    let edit_x = 960.0 - (ew + 48.0) / 2.0;

    // Render: the fill sweeps with a scan line and a frame counter, then squashes into a line.
    let render_o = track(t, 0.0, &[set(12.0, 1.0), seg(12.52, 0.2, 0.9, In(3)), set(12.72, 0.0)]);
    let squash = track(t, 1.0, &[seg(12.52, 0.2, 0.015, In(3))]);
    let sweep = track(t, 0.0, &[from_to(12.0, 0.45, 0.0, 1.0, Linear)]);
    let scan_x = track(t, 330.0, &[from_to(12.0, 0.45, 330.0, 1590.0, Linear)]);
    let scan_o = track(t, 0.0, &[set(12.0, 1.0), seg(12.45, 0.08, 0.0, Out(1))]);
    let frames_o = track(t, 0.0, &[set(12.0, 1.0), seg(12.5, 0.12, 0.0, Out(1))]);
    let n = track(t, 0.0, &[seg(12.0, 0.45, 900.0, Linear)]).round();
    let render_letters: Vec<Svgr<'a>> = letters(frame, ctx, "Render.", 430, -10.0)
        .into_iter()
        .map(|(c, x)| {
            let c2 = c.clone();
            fframes::svgr!(
                <g>
                    <text x={x} y="646" font-family={COND} font-weight="700" font-size="430" fill={FG} fill-opacity="0.16" stroke={FG} stroke-opacity="0.6" stroke-width="3">{c}</text>
                    <text x={x} y="646" font-family={COND} font-weight="700" font-size="430" fill={FG} clip-path="url(#sweep)">{c2}</text>
                </g>
            )
        })
        .collect();

    // The amber line travels into the logo's amber bar.
    let line_o = track(t, 0.0, &[set(12.7, 1.0), set(13.0, 0.0)]);
    let lx = track(t, 335.0, &[seg(12.72, 0.28, 622.5, InOut(4))]);
    let ly = track(t, 481.0, &[seg(12.72, 0.28, 450.25, InOut(4))]);
    let lw = track(t, 1250.0, &[seg(12.72, 0.28, 140.8, InOut(4))]);
    let lh = track(t, 8.0, &[seg(12.72, 0.28, 19.5, InOut(4))]);
    let lr = track(t, 4.0, &[seg(12.72, 0.28, 10.0, InOut(4))]);

    fframes::svgr!(
        <g>
            <defs>
                <clipPath id="sweep"><rect width={(1920.0 * sweep).max(0.01)} height="1080" /></clipPath>
                <clipPath id="editclip"><rect x={edit_x} y="0" width={ew.max(0.01)} height="1080" /></clipPath>
                <filter id="scanglow" x="-500%" y="-20%" width="1100%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="20" flood-color={AMBER} flood-opacity="0.8" /></filter>
            </defs>
            <rect width="1920" height="1080" fill={INK} opacity={dark} />
            {install}
            <rect x="360" y="760" width={(1200.0 * under).max(0.01)} height="12" rx="6" fill={AMBER} opacity={under_o} />
            <g opacity={edit_o}>
                <text x={edit_x} y="646" font-family={COND} font-weight="700" font-size="430" letter-spacing="-10" fill={FG} clip-path="url(#editclip)">"Edit."</text>
                <rect x={edit_x + ew + 14.0} y="320" width="34" height="330" fill={AMBER} opacity={caret_o} />
            </g>
            <g opacity={render_o} transform={format!("translate(0 {}) scale(1 {squash})", 485.0 * (1.0 - squash))}>
                {render_letters}
            </g>
            <rect x={scan_x} y="250" width="8" height="470" rx="4" fill={AMBER} opacity={scan_o} filter="url(#scanglow)" />
            <text x="960" y="799.75" text-anchor="middle" font-family={MONO_500} font-weight="500" font-size="34" fill={DIM} opacity={frames_o}>{format!("frame {n} / 900")}</text>
            <rect x={lx} y={ly} width={lw} height={lh} rx={lr} fill={AMBER} opacity={line_o} />
        </g>
    )
}

/// The lockup: the logo draws, the wordmark slides out of its mask, the tag and the URL arrive.
fn lockup(t: f32) -> Svgr<'static> {
    let s = track(t, 1.0, &[from_to(13.0, 2.0, 1.0, 1.03, Linear)]);
    let logo_o = track(t, 0.0, &[set(13.0, 1.0)]);
    let logo_s = track(t, 1.25, &[from_to(13.0, 0.5, 1.25, 1.0, Out(4))]);
    // fframes ignores pathLength, so the dashes use each path's real length in the 24-unit box.
    const RECT: f32 = 2.0 * (20.0 + 16.0) - 8.0 * 3.0 + 2.0 * std::f32::consts::PI * 3.0;
    let rect = track(t, 1.0, &[seg(13.0, 0.5, 0.0, Out(3))]);
    let div = track(t, 1.0, &[seg(13.18, 0.3, 0.0, Out(3))]);
    let amber = track(t, 1.0, &[set(13.0, 0.0)]);
    let mark_w = track(t, 0.0, &[seg(13.08, 0.5, 620.0, Out(4))]);
    let mark_x = track(t, -120.0, &[from_to(13.08, 0.5, -120.0, 0.0, Out(4))]);
    let tag_o = track(t, 0.0, &[from_to(13.5, 0.5, 0.0, 1.0, Out(3))]);
    let tag_y = track(t, 26.0, &[from_to(13.5, 0.5, 26.0, 0.0, Out(3))]);
    let tag_sd = track(t, 8.0, &[from_to(13.5, 0.5, 8.0, 0.0, Out(3))]);
    let url_o = track(t, 0.0, &[from_to(13.9, 0.35, 0.0, 1.0, BackOut(2.2))]);
    let url_s = track(t, 0.8, &[from_to(13.9, 0.35, 0.8, 1.0, BackOut(2.2))]);
    let ph_o = track(t, 0.0, &[seg(13.55, 0.2, 0.9, Out(1))]);
    let ph_x = track(t, 628.0, &[seg(13.55, 1.45, 756.0, Linear)]);
    let k = 260.0 / 24.0;
    fframes::svgr!(
        <g transform={place(0.0, 0.0, s, 960.0, 500.0)}>
            <defs>
                <clipPath id="markwrap"><rect x="833" y="352" width={mark_w.max(0.01)} height="220" /></clipPath>
                {blur("tagblur", tag_sd)}
            </defs>
            <g opacity={logo_o} transform={place(525.0, 330.0, logo_s, 130.0, 130.0)}>
                <g transform={format!("scale({k})")} fill="none" stroke-width="1.8">
                    <rect x="2" y="4" width="20" height="16" rx="3" stroke="#F2F3F5" stroke-dasharray={RECT} stroke-dashoffset={rect * RECT} />
                    <path d="M9 4v16" stroke="#F2F3F5" stroke-dasharray="16" stroke-dashoffset={div * 16.0} />
                    <path d="M9 12h13" stroke="#FFB224" stroke-dasharray="13" stroke-dashoffset={amber * 13.0} />
                </g>
            </g>
            <g clip-path="url(#markwrap)">
                <text x={833.0 + mark_x} y="533.5" font-family={SANS} font-weight="700" font-size="196" letter-spacing="-7" fill={FG}>"reelcn"</text>
            </g>
            <text x="960" y={694.85 + tag_y} text-anchor="middle" font-family={SANS} font-weight="400" font-size="46" fill="#a8adb7" opacity={tag_o} filter="url(#tagblur)">"Every frame, already designed."</text>
            <g opacity={url_o} transform={place(0.0, 0.0, url_s, 960.0, 781.0)}>
                <rect x="861" y="753" width="198" height="56" rx="28" fill="none" stroke={AMBER} stroke-opacity="0.55" stroke-width="2" />
                <text x="960" y="790.75" text-anchor="middle" font-family={MONO_500} font-weight="500" font-size="26" fill={AMBER}>"reelcn.dev"</text>
            </g>
            <rect x={ph_x} y="373" width="5" height="174" rx="3" fill={FG} opacity={ph_o} />
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
        // fframes mixes louder than the file: -1.6 dB lands the film at -13.7 LUFS, the approved film's level.
        AudioMap::from([AudioTrack::new("track.mp3", AudioTimestamp::Second(0.)..AudioTimestamp::Eof).gain_db(-1.6)])
    }

    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.global_index as f32 / 60.0;
        let light = track(t, 0.0, &[set(6.44, 1.0), set(11.0, 0.0)]);
        let rise = |at: f32| [seg(at, 0.45, 0.0, Out(4))];
        let (a1, a2) = (rise(6.6), rise(7.0));
        let a_out = [seg(8.7, 0.25, -1.0, In(3))];
        let a_out2 = [seg(8.75, 0.25, -1.0, In(3))];
        let row_a1: Vec<Seg> = a1.into_iter().chain(a_out).collect();
        let row_a2: Vec<Seg> = a2.into_iter().chain(a_out2).collect();
        let row_b1 = [seg(9.0, 0.4, 0.0, Out(4))];
        let row_b2 = [seg(9.5, 0.4, 0.0, Out(4))];
        let words = words(t, &mut frame, ctx);
        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox={format!("0 0 {WIDTH} {HEIGHT}")} width={WIDTH} height={HEIGHT}>
                <rect width={WIDTH} height={HEIGHT} fill={INK} />
                {terminal(t)}
                {grid(t, ctx)}
                {head(t)}
                {chip(t)}
                {flood(t)}
                <g opacity={light}>
                    {hero(t, ctx)}
                    {lines(t, "la", ["One timeline.", "Three screens."], [&row_a1, &row_a2], &[])}
                    {lines(t, "lb", ["Change one line.", "Restyle every frame."], [&row_b1, &row_b2], &[seg(10.75, 0.2, 0.0, In(2))])}
                    {code(t)}
                    {bar(t)}
                    {fmt(t)}
                </g>
                {words}
                {lockup(t)}
                {carrier(t)}
            </svg>
        )
    }
}
