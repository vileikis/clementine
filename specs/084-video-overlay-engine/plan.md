# Implementation Plan: Video Overlay Engine

**Branch**: `084-video-overlay-engine` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/084-video-overlay-engine/spec.md`

## Summary

Apply branded overlay to AI-generated video output by extending the existing image overlay pipeline. Three layers need changes: (1) FFmpeg layer adds audio passthrough for video inputs, (2) operation layer uses dynamic output extension instead of hardcoded `.jpg`, (3) outcome layer wires `applyOverlay` into `aiVideoOutcome` matching the existing `aiImageOutcome` pattern.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode) on Node.js 22
**Primary Dependencies**: FFmpeg via `ffmpeg-static` 5.3.0 (bundles FFmpeg 6.1.1), `ffprobe-static` 3.1.0, Firebase Cloud Functions v2
**Storage**: Firebase Storage (overlay PNGs, output videos)
**Testing**: Vitest (functions workspace)
**Target Platform**: Firebase Cloud Functions Gen2 (Linux)
**Project Type**: Backend (Cloud Functions only — no frontend changes)
**Performance Goals**: Overlay processing < 10 seconds, zero audio corruption
**Constraints**: FFmpeg version alignment must be verified before production deployment (local 6.1.1 vs cloud potentially 7.x)
**Scale/Scope**: 5 files modified, ~60 lines of new/changed code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Backend-only change, no UI |
| II. Clean Code & Simplicity | PASS | Reuses existing pipeline, minimal new code. No new abstractions — extends existing functions with conditional logic |
| III. Type-Safe Development | PASS | All new code fully typed, no `any`. `hasAudioStream` returns `Promise<boolean>` |
| IV. Minimal Testing Strategy | PASS | Manual testing for video overlay; no complex test infrastructure needed for this backend pipeline extension |
| V. Validation Gates | PASS | `pnpm functions:build` must pass. Standards compliance review after implementation |
| VI. Frontend Architecture | N/A | No frontend changes |
| VII. Backend & Firebase | PASS | Uses existing Storage patterns for overlay download/upload |
| VIII. Project Structure | PASS | All changes in existing files within established module boundaries |

**Post-Phase 1 Re-check**: PASS — No new entities, no new modules, no architecture changes. All modifications are within existing file/module boundaries.

## Project Structure

### Documentation (this feature)

```text
specs/084-video-overlay-engine/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data model (no new entities)
├── quickstart.md        # Phase 1 quickstart guide
├── contracts/           # Phase 1 contracts (internal only)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
functions/src/services/
├── ffmpeg/
│   ├── core.ts              # Timeout config (consider overlay_video)
│   ├── overlay.ts           # Add audio passthrough logic
│   ├── probe.ts             # Add hasAudioStream() function
│   └── index.ts             # Export hasAudioStream
└── transform/
    ├── operations/
    │   └── applyOverlay.ts  # Dynamic output extension
    └── outcomes/
        └── aiVideoOutcome.ts # Wire overlay call + re-upload
```

**Structure Decision**: Backend-only changes within existing `functions/` workspace. All modifications are in existing files — no new files created. Follows established vertical slice architecture within the FFmpeg service and transform pipeline.

## Implementation Approach

### Layer 1: FFmpeg — Audio Stream Detection + Passthrough

**File**: `functions/src/services/ffmpeg/probe.ts`

Add `hasAudioStream(filePath)` function that queries ffprobe for audio stream presence. Returns `true` if source has at least one audio stream.

**File**: `functions/src/services/ffmpeg/overlay.ts`

Modify `applyOverlayToMedia` to:
1. Detect if input is video (by extension)
2. If video: call `hasAudioStream` to check for audio
3. Add `-c:a copy` (audio exists) or `-an` (no audio) to FFmpeg args
4. For non-video inputs: no change (existing behavior preserved)

### Layer 2: Operation — Dynamic Output Extension

**File**: `functions/src/services/transform/operations/applyOverlay.ts`

Replace hardcoded `.jpg` output with extension derived from `path.extname(inputPath)`. If input is `.mp4`, output is `.mp4`; otherwise default to `.jpg`.

### Layer 3: Outcome — Wire Overlay into Video Pipeline

**File**: `functions/src/services/transform/outcomes/aiVideoOutcome.ts`

Replace the "overlay not supported" warning with actual overlay application:
1. After video generation, if `overlayChoice` exists, call `applyOverlay`
2. Apply overlay to the local video file (before thumbnail extraction)
3. Re-upload the overlayed video to Storage
4. Use the overlayed video URL in the output

This follows the exact pattern from `aiImageOutcome.ts` lines 97-105.

## Complexity Tracking

No constitution violations. All changes are minimal extensions to existing code.
