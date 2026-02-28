# Contracts: Video Overlay Engine

No new API contracts required. This feature modifies internal processing pipeline functions only — no new endpoints, no new callable functions, no new webhook handlers.

## Modified Internal Contracts

### applyOverlayToMedia (FFmpeg layer)

**Before**: `(inputPath, overlayPath, outputPath) => Promise<void>`
**After**: Same signature, but internally handles audio stream detection for video inputs. No caller-visible change.

### applyOverlay (Operation layer)

**Before**: `(inputPath, overlay, tmpDir) => Promise<string>` — always outputs `.jpg`
**After**: Same signature, but output extension is derived from input extension (`.jpg` for images, `.mp4` for videos).

### aiVideoOutcome (Outcome layer)

**Before**: Skips overlay with warning log.
**After**: Calls `applyOverlay` when `overlayChoice` is present, then re-uploads the overlayed video. Same `OutcomeContext` input, same `JobOutput` return type.
