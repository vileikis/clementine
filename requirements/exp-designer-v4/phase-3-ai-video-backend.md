# Phase 3: AI Video Backend

> Part of [Experience Designer v4 — Outcome Schema Redesign](./brief.md)
>
> Depends on: [Phase 2 — AI Video Editor](./phase-2-ai-video-editor.md)

## Overview

Implement the `aiVideoOutcome` executor in cloud functions to process AI Video jobs. This phase completes the AI Video pipeline — admins can configure ai.video outcomes (Phase 2) and guests can receive generated video results.

## Goals

1. Implement `aiVideoOutcome` executor supporting all three tasks (animate, transform, reimagine)
2. Integrate video generation AI model
3. Enable end-to-end AI Video pipeline from guest capture to video output

## Prerequisites

- Phase 1 complete: new outcome schema, updated dispatcher with `'ai.video': null` slot
- Phase 2 complete: admins can configure ai.video outcomes in the editor
- Video generation AI model selected and API access available

---

## 1. AI Video Outcome Executor

### 1.1 New File

Create `functions/src/services/transform/outcomes/aiVideoOutcome.ts`

### 1.2 Execution Flow (by task)

**All tasks share these steps:**
1. Download subject photo from capture step
2. Execute task-specific frame generation (see below)
3. Run video generation with resolved frames
4. Upload output video
5. Generate thumbnail
6. Return `JobOutput`

**Task: `animate`**
- Start frame: subject photo (downloaded in step 1)
- End frame: none
- Video generation: prompt + subject photo → video

**Task: `transform`**
- Start frame: subject photo (downloaded in step 1)
- End frame: AI-generate image using `endFrameImageGen` config + subject photo as source
- Video generation: prompt + start frame + end frame → video

**Task: `reimagine`**
- Start frame: AI-generate image using `startFrameImageGen` config + subject photo as source
- End frame: AI-generate image using `endFrameImageGen` config + subject photo as source
- Video generation: prompt + start frame + end frame → video

### 1.3 Frame Image Generation

For tasks that require AI-generated frames (`transform`, `reimagine`):
- Use the existing `aiGenerateImage` operation from `functions/src/services/transform/operations/`
- Resolve prompt mentions using `resolvePromptMentions`
- Aspect ratio inherited from `AIVideoOutcomeConfig.aspectRatio`
- Source media is always the subject photo from the capture step
- Each frame generation is an independent AI image generation call

Frame generation can be parallelized where possible:
- `transform`: only end frame — sequential with download
- `reimagine`: start and end frames can run in parallel (both use same subject photo)

---

## 2. Video Generation Operation

### 2.1 New Operation

Create `functions/src/services/transform/operations/aiGenerateVideo.ts`

**Input:**

```
{
  prompt: string              // Video generation prompt
  model: AIVideoModel         // Video generation model
  aspectRatio: VideoAspectRatio
  duration: number            // Duration in seconds
  startFrame: string          // Local file path to start frame image
  endFrame?: string           // Local file path to end frame image (optional)
}
```

**Output:**

```
{
  outputPath: string          // Local file path to generated video
  mimeType: string            // e.g., 'video/mp4'
  duration: number            // Actual duration in seconds
}
```

### 2.2 Model Integration

Integrate with the chosen video generation AI model. Implementation details depend on the selected model API (to be determined). The operation should:

- Accept start frame (required) and optional end frame
- Use the prompt to guide generation
- Respect aspect ratio and duration parameters
- Save output to temp directory
- Handle API errors with clear error messages

---

## 3. Update Dispatcher

### 3.1 Register Executor

Update `runOutcome.ts` dispatcher registry:

```
outcomeRegistry: {
  'photo':    photoOutcome,
  'gif':      null,
  'video':    null,
  'ai.image': aiImageOutcome,
  'ai.video': aiVideoOutcome,    // null → aiVideoOutcome
}
```

### 3.2 Update `startTransformPipeline`

Remove the validation that rejects `ai.video` type. The callable function should now accept `ai.video` as a valid outcome type and create jobs for it.

---

## 4. Job Output Format

AI Video jobs produce video output. Update the `JobOutput` handling:

- `format`: `'video'` (instead of `'image'`)
- Output file: `.mp4` (or format returned by video generation model)
- Thumbnail: extract frame from video using existing `generateThumbnail` FFmpeg utility
- Storage path: use `getOutputStoragePath` with video extension

---

## 5. Progress Reporting

AI Video jobs involve multiple stages. Update progress reporting for better UX:

| Stage | Percentage | Message |
|-------|-----------|---------|
| Starting | 10% | "Processing video..." |
| Generating start frame (if applicable) | 20-30% | "Generating start frame..." |
| Generating end frame (if applicable) | 30-50% | "Generating end frame..." |
| Generating video | 50-80% | "Generating video..." |
| Uploading | 80-90% | "Uploading result..." |
| Finalizing | 90-100% | "Finalizing..." |

Percentage ranges adjust based on task (e.g., `animate` skips frame generation stages).

---

## 6. Error Handling

Task-specific validation at execution time:

| Validation | Error Code | When |
|-----------|-----------|------|
| Missing `captureStepId` | `INVALID_INPUT` | Always |
| Capture step not found in responses | `INVALID_INPUT` | Always |
| Capture step has no media | `INVALID_INPUT` | Always |
| Missing `endFrameImageGen` for transform/reimagine | `INVALID_INPUT` | Task requires it |
| Missing `startFrameImageGen` for reimagine | `INVALID_INPUT` | Task requires it |
| Empty prompt in image generation config | `INVALID_INPUT` | When frame gen required |
| Empty video generation prompt | `INVALID_INPUT` | Always |
| Video generation API failure | `PROCESSING_FAILED` | Runtime |
| Frame generation API failure | `PROCESSING_FAILED` | Runtime |

Use existing `createSanitizedError` pattern for guest-safe error messages.

---

## 7. Cloud Task Configuration

AI Video jobs are more resource-intensive and longer-running than image jobs. Consider adjusting `transformPipelineTask` configuration:

- `timeoutSeconds`: May need increase from 300s (5 min) depending on video generation model latency
- `memory`: May need increase from 512MiB if handling video files in memory
- Evaluate after initial integration with actual video generation model

---

## 8. Overlay Behavior

Overlay application for video output needs consideration:

- Current overlay system applies a static image overlay to image output
- For video: overlay could be applied as a watermark/frame on the final video
- Or: overlay applied to individual frames before video generation
- Decision depends on product requirements — may be deferred or applied post-generation using FFmpeg

If overlay behavior for video differs from images, document the decision and implement accordingly. If deferred, skip overlay for `ai.video` jobs (log a warning).

---

## Acceptance Criteria

### Executor
- [ ] `aiVideoOutcome` executor created and registered in dispatcher
- [ ] `animate` task: subject photo → video generation → output
- [ ] `transform` task: subject photo + AI end frame → video generation → output
- [ ] `reimagine` task: AI start frame + AI end frame → video generation → output
- [ ] Frame generation uses existing `aiGenerateImage` operation
- [ ] Aspect ratio correctly inherited by frame generation

### Video Generation
- [ ] `aiGenerateVideo` operation created
- [ ] Accepts start frame, optional end frame, prompt, model, duration, aspect ratio
- [ ] Outputs video file to temp directory
- [ ] Handles API errors gracefully

### Pipeline Integration
- [ ] `startTransformPipeline` accepts `ai.video` outcome type
- [ ] Job snapshot correctly captures `AIVideoOutcomeConfig`
- [ ] Progress reporting reflects multi-stage pipeline
- [ ] Job output has `format: 'video'` with correct metadata
- [ ] Thumbnail generated from video output

### Error Handling
- [ ] Task-specific validation catches missing/invalid config
- [ ] Sanitized errors returned for guest-facing failure messages
- [ ] Frame generation failures don't leave orphaned temp files

### End-to-End
- [ ] Admin configures `ai.video` (animate) → guest receives generated video
- [ ] Admin configures `ai.video` (transform) → guest receives generated video
- [ ] Admin configures `ai.video` (reimagine) → guest receives generated video
- [ ] Photo and AI Image outcomes continue to work (no regressions)
