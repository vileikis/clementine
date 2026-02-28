# Feature Spec: Video Overlay Engine

**Branch**: `084-video-overlay-engine` | **Date**: 2026-02-28
**PRD**: `requirements/w9-mvp-polish/prd-p7-video-overlay-engine.md`

## Problem

AI video output currently skips overlay application. Image overlay works end-to-end (brand logo, campaign hashtag, frame design), but `aiVideoOutcome` logs a warning and skips overlay. This means video experiences lack the branded overlay that image experiences have, reducing shareability and brand consistency.

## Objective

Apply branded overlay to AI video output automatically, reusing the existing image overlay pipeline with video-specific adaptations.

## Requirements

### Functional

1. **FFmpeg layer — audio passthrough**: `applyOverlayToMedia` must pass audio stream through unchanged (`-c:a copy`) for video inputs. If the source has no audio stream, `-an` should be used instead.
2. **Operation layer — output extension**: `applyOverlay` must use `.mp4` output extension for video inputs instead of hardcoded `.jpg`.
3. **Outcome layer — wire overlay into video pipeline**: `aiVideoOutcome` must call `applyOverlay` (same pattern as `aiImageOutcome`) instead of skipping overlay.
4. **Aspect ratio support**: Must handle 9:16 and 1:1 without distortion.
5. **Overlay types**: Transparent PNG overlays, positioning (top-right, bottom-center, full-frame), opacity control — same as image overlay.

### Non-Functional

- Overlay processing < 10 seconds
- Zero audio corruption
- No regression to existing image overlay behavior

## Prerequisite — FFmpeg Version Alignment

Before shipping video overlay to production, local and cloud FFmpeg versions must match. See PRD for resolution steps. This is a gating requirement.

## Implementation Scope

Three layers of changes:

| Layer | File | Change |
|---|---|---|
| FFmpeg | `functions/src/services/ffmpeg/overlay.ts` | Add `-c:a copy` / `-an` for video inputs |
| Operation | `functions/src/services/transform/operations/applyOverlay.ts` | Dynamic output extension (`.jpg` vs `.mp4`) |
| Outcome | `functions/src/services/transform/outcomes/aiVideoOutcome.ts` | Call `applyOverlay` instead of skipping |
| FFmpeg | `functions/src/services/ffmpeg/core.ts` | Consider adding `overlay_video` timeout |

## Reference

- Existing image overlay flow: `aiImageOutcome.ts` lines 98-105
- PRD: `requirements/w9-mvp-polish/prd-p7-video-overlay-engine.md`

## Applicable Standards

- `standards/backend/firebase-functions.md` — Cloud Functions patterns
- `standards/global/code-quality.md` — Code quality
- `standards/global/security.md` — Security practices
