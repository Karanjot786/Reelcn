//! The launch film's tweens, replayed with GSAP's ease formulas so the fframes film moves like the HyperFrames one.

#[derive(Clone, Copy)]
pub enum Ease {
    Linear,
    In(i32),
    Out(i32),
    InOut(i32),
    Steps(u32),
    BackOut(f32),
}

impl Ease {
    /// GSAP's powerN is a polynomial of degree N + 1: power3.out is 1 - (1 - p)^4.
    pub fn at(&self, p: f32) -> f32 {
        match *self {
            Ease::Linear => p,
            Ease::In(n) => p.powi(n + 1),
            Ease::Out(n) => 1.0 - (1.0 - p).powi(n + 1),
            Ease::InOut(n) => {
                if p < 0.5 {
                    (2.0 * p).powi(n + 1) / 2.0
                } else {
                    1.0 - (2.0 - 2.0 * p).powi(n + 1) / 2.0
                }
            }
            Ease::Steps(n) => {
                if p >= 1.0 { 1.0 } else { (p * n as f32).floor() / n as f32 }
            }
            Ease::BackOut(c) => {
                let q = p - 1.0;
                q * q * ((c + 1.0) * q + c) + 1.0
            }
        }
    }
}

pub struct Seg {
    pub at: f32,
    pub dur: f32,
    pub to: f32,
    pub ease: Ease,
    /// Set for a GSAP `fromTo`: the value jumps here when the tween starts.
    pub from: Option<f32>,
}

pub fn seg(at: f32, dur: f32, to: f32, ease: Ease) -> Seg {
    Seg { at, dur, to, ease, from: None }
}

/// The value of one property at time `t`: each tween runs from where the last one left it, like a GSAP timeline.
pub fn track(t: f32, from: f32, segs: &[Seg]) -> f32 {
    let mut v = from;
    for s in segs {
        if t < s.at {
            return v;
        }
        let start = s.from.unwrap_or(v);
        let p = if s.dur <= 0.0 { 1.0 } else { ((t - s.at) / s.dur).min(1.0) };
        if p < 1.0 {
            return start + (s.to - start) * s.ease.at(p);
        }
        v = s.to;
    }
    v
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eases_match_gsap() {
        assert!((Ease::Out(3).at(0.5) - (1.0 - 0.5f32.powi(4))).abs() < 1e-6);
        assert!((Ease::InOut(4).at(0.25) - 0.5f32.powi(5) / 2.0).abs() < 1e-6);
        assert_eq!(Ease::Steps(4).at(0.49), 0.25);
        assert_eq!(Ease::Steps(4).at(1.0), 1.0);
        assert!(Ease::BackOut(2.2).at(0.5) > 1.0);
        assert_eq!(Ease::Linear.at(0.3), 0.3);
    }

    #[test]
    fn track_runs_tweens_in_order_like_a_gsap_timeline() {
        let segs = [seg(1.0, 1.0, 10.0, Ease::Linear), seg(3.0, 0.0, 0.0, Ease::Linear)];
        assert_eq!(track(0.5, 2.0, &segs), 2.0);
        assert_eq!(track(1.5, 2.0, &segs), 6.0);
        assert_eq!(track(2.5, 2.0, &segs), 10.0);
        assert_eq!(track(3.0, 2.0, &segs), 0.0);
        let from_to = [Seg { at: 1.0, dur: 1.0, to: 1.0, ease: Ease::Linear, from: Some(0.5) }];
        assert_eq!(track(1.5, 0.0, &from_to), 0.75);
    }
}
