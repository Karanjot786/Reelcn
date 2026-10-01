//! Visual regression: renders a few frames and compares them with the approved PNGs in
//! `_frame_snapshots/`. The first run only creates them, so look at the PNGs before you
//! commit them. `FFRAMES_UPDATE_SNAPSHOTS=1 cargo test` accepts intentional changes; failing
//! frames leave `.actual.png` and `.diff.png` files.
use fframes::{CombinedMediaProvider, CpuFrameRenderer, MediaDirectory, MediaProvider, Previewer, RenderOptions, StaticMediaProvider, snapshot};
use fframes_launch_film::{ FframesLaunchFilmMedia, FframesLaunchFilmVideo };

#[test]
fn key_frames_match_snapshots() {
    let static_media = FframesLaunchFilmMedia::prepare().unwrap();
    // The music loads from `audio/` at run time, as in main.rs.
    let audio_dir = MediaDirectory::read_folder("audio").unwrap();
    let audio = audio_dir.process_media_source().unwrap();
    let media = CombinedMediaProvider::from([&static_media as &dyn MediaProvider, &audio]);
    let video = FframesLaunchFilmVideo::new(&static_media, "Fframes Launch Film");
    let options = RenderOptions {
        media: Some(&media),
        scale_resolution: 0.5,
        ..Default::default()
    };
    let mut previewer = Previewer::new(&video, &options).unwrap();

    snapshot::assert_frames(
        &mut previewer,
        &mut CpuFrameRenderer::default(),
        // Settled frames: the middle of a scene, not the end of it where it fades out.
        &["2s", "4s"],
        &snapshot::SnapshotOptions::default(),
    );
}

#[test]
fn no_problems_in_any_frame() {
    // Converting a frame without rasterizing it is fast, so every frame is checked.
    let static_media = FframesLaunchFilmMedia::prepare().unwrap();
    // The music loads from `audio/` at run time, as in main.rs.
    let audio_dir = MediaDirectory::read_folder("audio").unwrap();
    let audio = audio_dir.process_media_source().unwrap();
    let media = CombinedMediaProvider::from([&static_media as &dyn MediaProvider, &audio]);
    let video = FframesLaunchFilmVideo::new(&static_media, "Fframes Launch Film");
    let options = RenderOptions {
        media: Some(&media),
        ..Default::default()
    };
    let mut previewer = Previewer::new(&video, &options).unwrap();

    let duration = previewer.timeline().duration_in_frames;
    for frame in 0..duration {
        let report = previewer.inspect(frame).unwrap();
        let problems: Vec<_> = report
            .diagnostics
            .iter()
            .filter(|d| d.severity >= fframes::diagnostics::Severity::Warning)
            // "Install." drops in from above the frame by design (11.0s to 11.33s).
            .filter(|d| !((660..=680).contains(&frame) && d.message.contains("cut off by the canvas edge")))
            .map(|d| d.message.as_str())
            .collect();
        assert!(problems.is_empty(), "frame {frame} ({:.2}s): {problems:?}", report.seconds);
    }
}
