# Research: Video Overlay Engine

**Feature**: 084-video-overlay-engine | **Date**: 2026-02-28

## R1: Audio Stream Handling in FFmpeg Overlay

**Decision**: Detect audio streams via ffprobe before overlay composition; use `-c:a copy` if audio exists, `-an` if not.

**Rationale**: FFmpeg's `filter_complex` drops audio by default when no audio codec is specified. The `-c:a copy` flag passes audio through without re-encoding (zero quality loss, near-zero overhead). Detection via ffprobe is the standard approach and avoids trial-and-error.

**Alternatives considered**:
- Always use `-c:a copy`: Would fail on sources without audio streams (FFmpeg error).
- Re-encode audio with `-c:a aac`: Unnecessary quality loss and CPU overhead. Veo-generated videos may or may not have audio; passthrough is safest.
- Use `-map` to explicitly select streams: Over-engineering for our use case. `-c:a copy` with `-filter_complex` on `[0:v]` already handles the common case.

**Implementation**: Add `hasAudioStream(filePath)` function to `probe.ts` that queries ffprobe for audio stream `a:0`. Use the boolean to conditionally add `-c:a copy` or `-an` in `applyOverlayToMedia`.

## R2: Output Extension Detection

**Decision**: Detect media type from input file extension in `applyOverlay.ts`.

**Rationale**: The input path is deterministic (e.g., `output.mp4` from Veo, `output.jpg` from Imagen). Extension-based detection is simple, reliable, and doesn't require probing. The caller knows the media type, so we can also accept an optional parameter.

**Alternatives considered**:
- Always pass media type from caller: Forces signature change on all callers, including existing image callers that work fine.
- Detect via ffprobe MIME type: Over-engineering. File extension is sufficient here.
- Use a mapping object: Unnecessary abstraction for two cases (`.jpg` and `.mp4`).

**Implementation**: Derive extension from `path.extname(inputPath)` in `applyOverlay.ts`. If `.mp4`, output as `.mp4`; otherwise default to `.jpg` (preserving existing behavior).

## R3: FFmpeg Version Alignment

**Decision**: Defer production verification to a separate diagnostic step (not blocking local development).

**Rationale**: The PRD gates production deployment on version alignment, but the code changes themselves are FFmpeg-version-agnostic. The `filter_complex` overlay syntax and `-c:a copy` work identically on FFmpeg 6.x and 7.x. The risk is around codec flags and container handling differences, which are minimal for our simple overlay composition.

**Alternatives considered**:
- Block all development until version verified: Unnecessary delay. Code changes are safe to develop and test locally.
- Drop `ffmpeg-static` and use system FFmpeg: Breaking change for existing image overlay; too risky for this feature.
- Vendor a specific binary: Complexity not justified at this stage.

**Implementation**: Add a startup log that prints `ffmpeg -version` in production (cold start). Verify before enabling video overlay in production. This is a separate task from the code changes.

## R4: Timeout Configuration for Video Overlay

**Decision**: Use existing `TIMEOUTS.overlay` (45s) for video overlay initially.

**Rationale**: Veo-generated videos are typically 5-8 seconds at moderate resolution. Overlay composition on a short video should complete well within 45 seconds. The existing timeout already handles GIF overlay (multi-frame). We can bump it if monitoring shows it's tight.

**Alternatives considered**:
- Add separate `overlay_video` timeout: Premature optimization. 45s is generous for short video overlay. Add only if real-world data shows it's needed.
- Use `mp4_long` (120s): Too generous. Overlay doesn't re-encode video frames — it composites a single PNG, which is much faster than creating an MP4 from scratch.

## R5: Video Overlay Integration Point

**Decision**: Apply overlay after video generation, before thumbnail extraction — matching the image outcome pattern.

**Rationale**: The overlay must be visible in both the output video and the thumbnail. Applying before thumbnail extraction ensures consistency. This matches the exact pattern used in `aiImageOutcome.ts`.

**Alternatives considered**:
- Apply after thumbnail: Thumbnail wouldn't show overlay, creating UX inconsistency.
- Apply during upload: Would require changes to `uploadOutput`, mixing concerns.
