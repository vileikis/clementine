# Feature Specification: AI Video Backend

**Feature Branch**: `074-ai-video-backend`
**Created**: 2026-02-20
**Status**: Draft
**Input**: User description: "Implement the AI Video outcome executor in cloud functions to process AI Video jobs, completing the AI Video pipeline from guest capture to video output."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Receives Animated Video from Photo (Priority: P1)

A guest visits an experience link, uploads their photo, and the system generates an AI-animated video from that photo using the "animate" task. The guest receives a playable video result with a thumbnail preview.

**Why this priority**: The animate task is the simplest video generation flow (no AI frame generation needed — just the subject photo and a prompt). It validates the core video generation pipeline end-to-end with the fewest moving parts.

**Independent Test**: Can be fully tested by configuring an experience with an `ai.video` outcome using the `animate` task, having a guest upload a photo, and verifying a video is returned. Delivers the core value of AI video generation.

**Acceptance Scenarios**:

1. **Given** an experience configured with an `ai.video` outcome (task: `animate`), **When** a guest uploads a photo and the job is processed, **Then** the guest receives a generated video based on their photo and the configured prompt.
2. **Given** a completed `animate` video job, **When** the result is stored, **Then** a thumbnail image is generated from the video and both the video and thumbnail are accessible.
3. **Given** an `animate` job is processing, **When** a guest views the job status, **Then** they see meaningful progress updates reflecting the current processing stage.
4. **Given** an `animate` job where the video generation service fails, **When** the error is handled, **Then** the guest sees a clear, user-friendly error message and no orphaned temporary files remain.

---

### User Story 2 - Guest Receives Transformation Video (Priority: P2)

A guest uploads their photo, and the system generates an AI end-frame image (a transformed version of their photo) and then produces a video that morphs from the original photo to the transformed version using the "transform" task.

**Why this priority**: The transform task adds AI frame generation on top of the core video pipeline. It validates the integration between AI image generation and video generation, which is essential for the more advanced "reimagine" task.

**Independent Test**: Can be tested by configuring an experience with a `transform` task, uploading a photo, and verifying the output video transitions from the original photo to an AI-generated end frame.

**Acceptance Scenarios**:

1. **Given** an experience configured with an `ai.video` outcome (task: `transform`) with an end-frame image generation config, **When** a guest uploads a photo and the job is processed, **Then** the guest receives a video that transitions from their original photo to an AI-generated end frame.
2. **Given** a `transform` job is processing, **When** the AI end-frame image generation step completes, **Then** the progress updates reflect that frame generation is done and video generation has begun.
3. **Given** a `transform` job where the end-frame image generation fails, **When** the error is handled, **Then** the guest sees a user-friendly error message and the job is marked as failed.
4. **Given** a `transform` configuration missing the end-frame image generation config, **When** a job is created, **Then** the system rejects the job with a validation error.

---

### User Story 3 - Guest Receives Reimagined Video (Priority: P3)

A guest uploads their photo, and the system generates both an AI start frame and an AI end frame from the photo, then produces a video that transitions between these two AI-generated images using the "reimagine" task.

**Why this priority**: The reimagine task is the most complex flow, requiring two independent AI frame generations before video generation. It builds on all patterns established by the animate and transform tasks.

**Independent Test**: Can be tested by configuring an experience with a `reimagine` task (with both start-frame and end-frame image generation configs), uploading a photo, and verifying the output video transitions between two AI-generated frames.

**Acceptance Scenarios**:

1. **Given** an experience configured with an `ai.video` outcome (task: `reimagine`) with both start-frame and end-frame image generation configs, **When** a guest uploads a photo and the job is processed, **Then** the guest receives a video that transitions between two AI-generated frames.
2. **Given** a `reimagine` job is processing, **When** both AI frame generation steps can run independently, **Then** they are processed in parallel to minimize total processing time.
3. **Given** a `reimagine` configuration missing the start-frame image generation config, **When** a job is created, **Then** the system rejects the job with a validation error.

---

### User Story 4 - Existing Outcomes Continue Working (Priority: P1)

Photo and AI Image outcomes that were working before this feature continue to function identically. Adding video processing introduces no regressions.

**Why this priority**: Regression prevention is critical — existing paying customers rely on photo and AI image outcomes. This is co-equal with P1 because it's a hard constraint on all changes.

**Independent Test**: Can be tested by running existing photo and AI image outcome jobs after the video backend is deployed and verifying identical behavior.

**Acceptance Scenarios**:

1. **Given** an experience configured with a `photo` outcome, **When** a guest uploads a photo and the job is processed, **Then** the result is identical to the behavior before this feature was deployed.
2. **Given** an experience configured with an `ai.image` outcome, **When** a guest uploads a photo and the job is processed, **Then** the result is identical to the behavior before this feature was deployed.

---

### Edge Cases

- What happens when the video generation service takes longer than the job timeout? The job should fail with a timeout error and a user-friendly message.
- What happens when one frame generation succeeds but the other fails in a `reimagine` task? The entire job should fail with a clear error, and no orphaned temporary files should remain.
- What happens when the subject photo from the capture step is missing or corrupted? The job should fail with an `INVALID_INPUT` error before attempting any AI generation.
- What happens when the capture step referenced by `captureStepId` does not exist in the session responses? The job should fail with a clear validation error.
- What happens when the video generation prompt is empty? The job should fail with a validation error before calling the video generation service.
- What happens when an overlay is configured for an `ai.video` outcome? Overlays are skipped for video outcomes in this initial release. The system should log a warning if an overlay is configured but not applied. Overlay support for video may be added in a future iteration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST process `ai.video` outcome jobs for all three task types: `animate`, `transform`, and `reimagine`.
- **FR-002**: System MUST download the subject photo from the capture step identified by `captureStepId` as the first step of every video job.
- **FR-003**: For `animate` tasks, the system MUST generate a video using the subject photo as the start frame and the configured prompt.
- **FR-004**: For `transform` tasks, the system MUST generate an AI end-frame image from the subject photo using the configured end-frame image generation settings, then generate a video transitioning from the subject photo to the AI end frame.
- **FR-005**: For `reimagine` tasks, the system MUST generate both an AI start frame and an AI end frame from the subject photo using their respective image generation settings, then generate a video transitioning between the two frames.
- **FR-006**: For `reimagine` tasks, the system MUST generate start and end frames in parallel when possible to minimize processing time.
- **FR-007**: Frame image generation MUST use the existing AI image generation capability with prompt mention resolution.
- **FR-008**: Frame image generation MUST inherit the aspect ratio from the video outcome configuration.
- **FR-009**: The system MUST accept `ai.video` as a valid outcome type when clients request job creation (removing the current rejection).
- **FR-010**: The system MUST register the video outcome executor in the dispatcher so video jobs are routed to the correct processor.
- **FR-011**: Video job output MUST include the generated video file, its format (`video`), dimensions, file size, and a thumbnail image extracted from the video.
- **FR-012**: The system MUST report multi-stage progress to guests, reflecting which stage of the pipeline is currently executing (e.g., generating frames, generating video, uploading, finalizing).
- **FR-013**: The system MUST validate task-specific configuration before processing:
  - `captureStepId` must reference a valid capture step with media
  - `transform` tasks must have end-frame image generation config
  - `reimagine` tasks must have both start-frame and end-frame image generation configs
  - Video generation prompt must not be empty
  - Image generation prompts must not be empty when frame generation is required
- **FR-014**: The system MUST return user-friendly error messages for all failure scenarios, never exposing internal details to guests.
- **FR-015**: The system MUST clean up all temporary files (downloaded photos, generated frames, generated videos) after job completion or failure.
- **FR-016**: The system MUST send the configured video generation model, duration, and aspect ratio to the video generation service.

### Key Entities

- **AI Video Job**: A processing job that takes a guest's captured photo and produces an AI-generated video. Characterized by a task type (animate, transform, or reimagine), video generation settings (prompt, model, duration, aspect ratio), and optional frame generation settings.
- **Video Generation Request**: A request to the video generation service containing a prompt, start frame (required), optional end frame, model selection, aspect ratio, and duration.
- **Frame Generation Request**: A request to generate an AI image from a subject photo, used to produce start and/or end frames for the video. Reuses the existing AI image generation capability.
- **Job Output (Video)**: The result of a completed video job, containing the video file URL, format (`video`), dimensions, file size, thumbnail URL, and processing time.

## Assumptions

- Video generation uses Google's Veo model family via the `@google/genai` SDK. The model API is available and accessible from the cloud function environment.
- Video output format is MP4 (or whatever format the chosen video generation model produces).
- Thumbnail generation from video is handled by extracting a frame using the existing media processing utility.
- The existing job timeout and memory configuration may need adjustment for video jobs, which are more resource-intensive and longer-running than image jobs. Specific values will be tuned after initial integration.
- The existing `uploadOutput` utility will be extended to handle video files (setting format to `video` and capturing actual video dimensions).
- Progress percentages adjust dynamically based on the task type — simpler tasks (animate) skip frame generation stages and redistribute percentages accordingly.
- Overlays are not applied to video output in this release. This is a deliberate scoping decision — overlay support for video may be added later.

## References

- [Veo: Generate videos from an image](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-an-image)
- [Veo: Best practices](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/best-practice)
- [Veo: Generate videos from first and last frames](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-first-and-last-frames)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guests receive a generated video result for all three task types (animate, transform, reimagine) when an experience is configured with an `ai.video` outcome.
- **SC-002**: Video jobs complete successfully within 5 minutes for the `animate` task and within 8 minutes for `transform` and `reimagine` tasks under normal conditions.
- **SC-003**: Guests see at least 4 distinct progress updates during video job processing, reflecting the multi-stage pipeline.
- **SC-004**: 95% of video job failures produce a user-friendly error message (no raw technical errors exposed to guests).
- **SC-005**: Existing photo and AI image outcomes continue to work with zero regressions after deployment.
- **SC-006**: Frame generation for `reimagine` tasks completes faster than sequential processing by running start and end frame generation in parallel.
