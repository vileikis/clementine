# Research: AI Video Backend

**Feature Branch**: `074-ai-video-backend`
**Date**: 2026-02-20

## R-001: Veo Video Generation API via `@google/genai`

**Decision**: Use `@google/genai` SDK's `client.models.generateVideos()` method for all video generation.

**Rationale**: The SDK is already installed (`^1.38.0`) and used for AI image generation. Veo is accessed through the same client with Vertex AI mode, keeping the integration consistent.

**Key technical findings**:

- **Async operation**: `generateVideos()` returns a `GenerateVideosOperation` (long-running). Must poll via `client.operations.getVideosOperation({ operation })` every ~15 seconds until `operation.done === true`.
- **Start/end frames**: Start frame → top-level `image` parameter. End frame → `config.lastFrame`. Both use `Image` type: `{ gcsUri, mimeType }` or `{ imageBytes, mimeType }`. Only `image/jpeg` and `image/png` MIME types supported.
- **Output to GCS**: Unlike image generation (which returns base64 inline), Veo writes output directly to a GCS bucket via `config.outputGcsUri`. The response contains a `gs://` URI that must be downloaded.
- **Location**: Veo requires a regional endpoint (e.g., `us-central1`), NOT `global`. The existing `getLocationForModel()` helper forces `global` only for `gemini-3-pro-image-preview`; Veo models will use the configured `VERTEX_AI_LOCATION`.
- **RAI filtering**: Even when `operation.done === true`, `generatedVideos` may be empty if safety filtering removed all results. Must check `raiMediaFilteredCount` and `raiMediaFilteredReasons`.
- **Person generation**: Must pass `personGeneration: 'allow_adult'` since photobooth use case involves people.

**Alternatives considered**:
- REST API directly → rejected, SDK provides typed interface and handles auth automatically
- Runway ML / Pika Labs → rejected, Google Veo integrates natively with existing Vertex AI setup

---

## R-002: Aspect Ratio Compatibility Issue

**Decision**: The Veo API supports only `16:9` and `9:16` — NOT `1:1`. However, the shared schema `videoAspectRatioSchema` currently allows `9:16 | 1:1`.

**Rationale**: The `1:1` value in the schema was designed speculatively. Veo does not support it. We have two options:

1. Remove `1:1` from the schema (breaking change for any existing configs)
2. Keep `1:1` in schema but map it to the nearest supported ratio at generation time

**Resolution**: Remove `1:1` from `videoAspectRatioSchema` since no AI video outcomes have been created yet (Phase 2 editor is only just complete). This is the cleanest path. Update the schema to `'16:9' | '9:16'` to match Veo's actual capabilities.

---

## R-003: Duration Constraints

**Decision**: Veo 3.1 models support only `4`, `6`, or `8` second durations. The current schema allows `1-60`.

**Rationale**: The existing `videoGenerationConfigSchema` uses `z.number().min(1).max(60).default(5)`. Veo 3.1 only accepts 4, 6, or 8. Passing `5` (the current default) will error.

**Resolution**: Update `videoGenerationConfigSchema` to constrain duration to `4 | 6 | 8` with default `8`. Since no video outcomes exist in production yet, this is non-breaking.

---

## R-004: Upload Output Extension for Video

**Decision**: Extend `uploadOutput` to support video format rather than creating a separate function.

**Rationale**: The current `uploadOutput` hardcodes `format: 'image'`, dimensions `1024x1024`, and extension `'jpg'`. For video, we need `format: 'video'`, real dimensions from ffprobe, and extension `'mp4'`.

**Resolution**: Add optional parameters to `uploadOutput` for `format` and `dimensions`, with defaults preserving current behavior. Use `getMediaDimensions` (ffprobe, already available) to get video dimensions. Pass `'mp4'` extension for video output paths.

**Alternatives considered**:
- New `uploadVideoOutput` function → rejected, too much duplication; upload + thumbnail logic is identical
- Infer format from file extension → fragile, explicit is better

---

## R-005: Progress Reporting Enhancement

**Decision**: Inject a progress callback into `OutcomeContext` so the `aiVideoOutcome` executor can report granular, multi-stage progress.

**Rationale**: Current progress is managed entirely by the task handler with only 3 checkpoints (20%, 90%, 100%). Video jobs have 4-6 distinct stages. The executor needs to report intermediate progress. The `updateJobProgress` function is already available.

**Resolution**: Pass a `reportProgress` callback in `OutcomeContext` (or pass `jobId` + `projectId` and call `updateJobProgress` directly from the executor). This follows the existing pattern where the task handler owns job lifecycle but the executor can communicate status.

**Approach**: Add an optional `reportProgress?: (progress: JobProgress) => Promise<void>` to `OutcomeContext`. The task handler creates the callback. Existing executors ignore it. The video executor calls it at each stage.

---

## R-006: GCS Output URI Strategy

**Decision**: Use the project's Firebase Storage bucket as the `outputGcsUri` for Veo, then move the output to the canonical storage path.

**Rationale**: Veo requires a `gs://` URI to write output to. We can either:
1. Write to a temp prefix in the same bucket, then copy to the canonical path
2. Download to local, then upload via `uploadToStorage`

Option 2 is simpler and consistent with the existing `uploadOutput` flow (which takes a local file path). The file sizes are manageable (MP4 videos at 4-8 seconds are typically 5-20MB).

**Resolution**: Set `outputGcsUri` to `gs://{bucket}/tmp/veo-outputs/{jobId}/`. After polling completes, download from the returned `gs://` URI to `tmpDir`, then use the standard `uploadOutput` flow.

---

## R-007: Overlay Handling for Video

**Decision**: Skip overlay application for `ai.video` outcomes in this release.

**Rationale**: User decision (Option A). Overlays are designed for static image compositing. Video overlay requires either per-frame compositing or post-processing with FFmpeg, which adds complexity and processing time. Deferring allows shipping the core video pipeline faster.

**Resolution**: In `aiVideoOutcome`, check if `overlayChoice` is set. If so, log a warning (`logger.warn`) but do not apply the overlay. The `applyOverlay` step is skipped entirely.

---

## R-008: Cloud Task Timeout and Memory

**Decision**: Increase timeout and memory for the transform pipeline task.

**Rationale**: Current config is `512MiB / 300s (5 min)`. Veo generation typically takes 1-4 minutes, plus frame generation (if any) adds 30-60 seconds each. With polling overhead, 5 minutes is tight for `reimagine` tasks. Memory needs may increase due to video file handling.

**Resolution**: Increase to `1GiB / 540s (9 min)`. This accommodates the worst case: reimagine with 2 frame generations (~60s each) + video generation (~4 min) + upload (~30s). The 9-minute limit is the maximum for Cloud Functions v2 HTTP/task functions.

---

## R-009: Existing Patterns to Follow

**Decision**: Follow the `aiImageOutcome` pattern exactly for the new executor.

**Key patterns from the codebase**:

- **Executor signature**: `(ctx: OutcomeContext) => Promise<JobOutput>`
- **Guard pattern**: Assert required config exists, throw if missing
- **Source media**: `getSourceMedia(sessionResponses, captureStepId)` returns `MediaReference`
- **Prompt resolution**: `resolvePromptMentions(prompt, responses, refMedia)` returns `{ text, mediaRefs }`
- **Temp files**: All intermediates in `ctx.tmpDir`, cleaned up by task handler's `finally` block
- **Upload**: `uploadOutput({ outputPath, projectId, sessionId, tmpDir })` handles storage + thumbnail
- **Error propagation**: Throw errors, task handler catches and converts via `createSanitizedError`
- **Overlay**: Check `snapshot.overlayChoice`, skip for video (log warning)

**Available FFmpeg utilities**:
- `generateThumbnail(inputPath, outputPath, width)` — works for video (grabs frame 1)
- `getMediaDimensions(filePath)` — ffprobe, returns `{ width, height }`
