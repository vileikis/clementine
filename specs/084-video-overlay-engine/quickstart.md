# Quickstart: Video Overlay Engine

**Feature**: 084-video-overlay-engine | **Date**: 2026-02-28

## Prerequisites

- Node.js 22+ (Cloud Functions runtime)
- pnpm 10.18.1
- FFmpeg available via `ffmpeg-static` (installed with `pnpm install` in functions/)

## Setup

```bash
cd functions
pnpm install
pnpm build
```

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `functions/src/services/ffmpeg/probe.ts` | Add `hasAudioStream()` function |
| 2 | `functions/src/services/ffmpeg/overlay.ts` | Add audio passthrough (`-c:a copy` / `-an`) |
| 3 | `functions/src/services/ffmpeg/index.ts` | Export `hasAudioStream` |
| 4 | `functions/src/services/transform/operations/applyOverlay.ts` | Dynamic output extension |
| 5 | `functions/src/services/transform/outcomes/aiVideoOutcome.ts` | Wire overlay + re-upload |

## Testing

```bash
cd functions
pnpm build   # TypeScript compilation check
```

Manual testing:
1. Create an experience with `ai.video` outcome type and an overlay configured
2. Submit a session and trigger the transform pipeline
3. Verify the output video has the overlay applied
4. Verify the thumbnail shows the overlay
5. Verify audio is preserved (if source had audio) or absent (if source had none)

## Validation

```bash
pnpm functions:build    # Must compile without errors
```
