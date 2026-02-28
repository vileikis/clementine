# PRD P7 — Video Overlay Engine

> **Master Plan**: [plan-video-support.md](./plan-video-support.md)
> **Priority**: P7 — Growth / Differentiation (unless pilot requires it)
> **Area**: Cloud (Backend)

---

## Why This Could Be a Major Differentiator

If we can dynamically overlay brand logo, campaign hashtag, and frame design on AI video output — we increase shareability significantly.

Only high priority if overlay is a brand requirement for pilots. Otherwise secondary.

---

## Objective

Apply branded overlay to AI video output automatically.

---

## Prerequisite — FFmpeg Version Alignment

Image overlay already works via `ffmpeg-static` v5.3.0 (bundles FFmpeg **6.1.1**).
However, Cloud Functions Gen2 (Node.js 22) ships FFmpeg **7.x** at the system level.
Since `ffmpeg-static` is marked as an external dependency in `esbuild.config.mjs`, the
bundled binary _should_ be used everywhere — but this has not been verified in production.

Video compositing is more sensitive to version differences than image processing
(codec flags, filter behavior, audio stream handling). Before implementing video overlay
we need to confirm both environments use the same FFmpeg version.

### Resolution steps

1. **Diagnose** — log the FFmpeg version (`-version`) on cold start in production to
   confirm what binary is actually resolved by `ffmpeg-static` in Cloud Functions.
2. **Standardize** — pick one of:
   - **Keep `ffmpeg-static`**: confirm the v6.1.1 binary loads correctly in Cloud
     Functions. All devs use the `ffmpeg-static` binary (not system FFmpeg).
   - **Use system FFmpeg 7**: drop `ffmpeg-static`, resolve the binary from `$PATH`,
     require FFmpeg 7.x locally (e.g. `brew install ffmpeg`).
   - **Vendor a specific binary**: download a pinned FFmpeg build, store it in the
     repo or GCS, resolve the path manually.
3. **Gate** — do not ship video overlay until local and cloud FFmpeg versions match.

### Key files

| File | Role |
|---|---|
| `functions/package.json` | `ffmpeg-static` pinned at 5.3.0 (FFmpeg 6.1.1) |
| `functions/src/services/ffmpeg/core.ts` | Binary path resolution (`import ffmpegStatic from 'ffmpeg-static'`) |
| `functions/esbuild.config.mjs` | Marks `ffmpeg-static` as external (not bundled) |

---

## Approach

- FFmpeg-based compositing (reuse existing `applyOverlayToMedia` pipeline)
- Support:
  - Transparent PNG overlays
  - Positioning (top-right, bottom-center, full-frame)
  - Opacity control

---

## Implementation Scope

Image overlay already works end-to-end. Video overlay reuses the same FFmpeg filter
graph but requires changes in three layers:

### 1. FFmpeg layer — audio passthrough

`applyOverlayToMedia` currently runs a `filter_complex` that composites the overlay
onto all video frames. For video inputs it must also **pass the audio stream through
unchanged** (`-c:a copy`) to satisfy the "zero audio corruption" metric. If the source
has no audio stream, `-an` should be used instead.

### 2. Operation layer — output extension

`applyOverlay` hardcodes the output path as `.jpg`. For video inputs the output must
be `.mp4` (or match the source container). The caller should pass the media type or
the function should detect it from the input extension.

### 3. Outcome layer — wire overlay into video pipeline

`aiVideoOutcome` currently logs a warning and skips overlay. After the video is
generated (and before the thumbnail is extracted), it should call `applyOverlay` in
the same way `aiImageOutcome` does.

### Key files

| File | What changes |
|---|---|
| `functions/src/services/ffmpeg/overlay.ts` | Add `-c:a copy` / `-an` for video inputs |
| `functions/src/services/transform/operations/applyOverlay.ts` | Dynamic output extension (`.jpg` vs `.mp4`) |
| `functions/src/services/transform/outcomes/aiVideoOutcome.ts` | Call `applyOverlay` instead of skipping |
| `functions/src/services/ffmpeg/core.ts` | Consider adding `overlay_video` timeout |

### Reference — existing image overlay flow

`functions/src/services/transform/outcomes/aiImageOutcome.ts` lines 98-105 show the
pattern: check `overlayChoice`, log, call `applyOverlay(outputPath, overlayChoice, tmpDir)`,
then continue to upload.

---

## Must Support

- 9:16 and 1:1 without distortion

---

## Success Metrics

- Overlay processing < 10 sec
- Zero audio corruption
