# Tasks: AI Video Backend

**Input**: Design documents from `/specs/074-ai-video-backend/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted. Schema validation is covered by existing shared package tests. Manual E2E testing is described in quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Schema Updates)

**Purpose**: Update shared package schemas to match Veo API constraints. These changes are prerequisites for all video outcome work.

- [X] T001 Update `videoAspectRatioSchema` in `packages/shared/src/schemas/experience/outcome.schema.ts` — replace `'9:16' | '1:1'` with `'16:9' | '9:16'` to match Veo's supported aspect ratios. Also update the `VideoAspectRatio` type export if it exists separately. See research.md R-002 for rationale.

- [X] T002 Update `videoGenerationConfigSchema` duration field in `packages/shared/src/schemas/experience/outcome.schema.ts` — replace `z.number().min(1).max(60).default(5)` with `z.union([z.literal(4), z.literal(6), z.literal(8)]).default(8)` to match Veo 3.1 supported durations. See research.md R-003 for rationale.

- [X] T003 Build shared package and run tests — execute `pnpm --filter @clementine/shared build && pnpm --filter @clementine/shared test` to verify schema changes compile and existing tests pass. Fix any failures from the schema tightening (e.g., test fixtures using `1:1` or `duration: 5`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented. These are the building blocks that the `aiVideoOutcome` executor depends on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Create `aiGenerateVideo` operation in `functions/src/services/transform/operations/aiGenerateVideo.ts` — new file implementing the Veo video generation operation. Must:
  - Define `GenerateVideoRequest` type: `{ prompt, model, aspectRatio, duration, startFrame, endFrame? }` (see data-model.md)
  - Define `GeneratedVideo` return type: `{ outputPath, mimeType, sizeBytes, duration, dimensions }` (see data-model.md)
  - Initialize `GoogleGenAI` client with `vertexai: true`, project from `GCLOUD_PROJECT` env, location from `VERTEX_AI_LOCATION` Firebase param (NOT `'global'` — see research.md R-001)
  - Read start frame image as base64 from local file path, pass as `image: { imageBytes, mimeType }` parameter
  - If `endFrame` provided, read as base64 and pass as `config.lastFrame: { imageBytes, mimeType }`
  - Set `config.outputGcsUri` to `gs://{bucket}/tmp/veo-outputs/{jobId}/` using Firebase Storage default bucket (see research.md R-006)
  - Set `config.aspectRatio`, `config.durationSeconds`, `config.personGeneration: 'allow_adult'`, `config.numberOfVideos: 1`
  - Call `client.models.generateVideos()` and poll `client.operations.getVideosOperation({ operation })` every 15 seconds until `operation.done === true`, with a 5-minute max timeout
  - Handle errors: check `operation.error` (throw with message), check RAI filtering (throw `"Video was filtered by safety policy"` if `generatedVideos` empty), check polling timeout (throw `"Video generation timed out"`)
  - On success: download video from returned `gs://` URI to `${tmpDir}/veo-output-${Date.now()}.mp4` using Firebase Admin Storage `bucket.file().download()`
  - Clean up the temp GCS prefix after download (best-effort delete of `tmp/veo-outputs/{jobId}/`)
  - Get dimensions via `getMediaDimensions()` from `functions/src/services/ffmpeg/images.ts` (ffprobe)
  - Get file size via `fs.stat()`
  - Return `GeneratedVideo` with all fields populated
  - Follow the same module pattern as `aiGenerateImage.ts` (named export, types at top, single exported function)

- [X] T005 [P] Extend `uploadOutput` in `functions/src/services/transform/operations/uploadOutput.ts` — add optional parameters to `UploadOutputParams` interface: `format?: 'image' | 'video'` (default `'image'`), `dimensions?: { width: number; height: number }` (default `{ width: 1024, height: 1024 }`), `extension?: string` (default `'jpg'`). Update the function body to:
  - Use `extension` param in `getOutputStoragePath()` call instead of hardcoded `'jpg'`
  - Use `format` param in the returned object instead of hardcoded `'image'`
  - Use `dimensions` param in the returned object instead of hardcoded `{ width: 1024, height: 1024 }`
  - All existing callers (photoOutcome, aiImageOutcome) must continue working unchanged since all new params have defaults matching current behavior

- [X] T006 [P] Add `reportProgress` callback to `OutcomeContext` in `functions/src/services/transform/types.ts` — add optional field `reportProgress?: (progress: JobProgress) => Promise<void>` to the `OutcomeContext` interface. Import `JobProgress` type from the shared package or the job repository. This is backward-compatible — existing executors ignore it.

- [X] T007 [P] Wire up progress callback and update config in `functions/src/tasks/transformPipelineTask.ts` — two changes:
  1. **Progress callback**: Before calling `runOutcome(outcomeContext)`, create a `reportProgress` callback that calls `updateJobProgress(projectId, jobId, progress)`. Add it to the `outcomeContext` object. This gives executors the ability to report intermediate progress.
  2. **Timeout/memory config**: Increase `timeoutSeconds` from `300` to `540` (9 min) and `memory` from `'512MiB'` to `'1GiB'` to accommodate Veo's longer processing time and video file sizes. See research.md R-008.

- [X] T008 Update `startTransformPipeline` callable in `functions/src/callable/startTransformPipeline.ts` — three changes:
  1. Add `'ai.video'` to the `IMPLEMENTED_OUTCOME_TYPES` Set
  2. Add validation guard: `if (outcome.type === 'ai.video' && !outcome.aiVideo)` → throw `HttpsError('invalid-argument', ...)`
  3. Extend `getOutcomeAspectRatio()` to handle `'ai.video'` → return `outcome.aiVideo?.aspectRatio` (same pattern as `'ai.image'` → `outcome.aiImage?.aspectRatio`)

**Checkpoint**: Foundation ready — all infrastructure for video outcome processing is in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Guest Receives Animated Video (Priority: P1) MVP

**Goal**: A guest uploads a photo to an experience configured with `ai.video` (animate task) and receives a generated video result with thumbnail.

**Independent Test**: Configure an experience with `ai.video` outcome (task: `animate`), have a guest upload a photo, verify a video is returned with a thumbnail and progress updates are shown.

### Implementation for User Story 1

- [X] T009 [US1] Create `aiVideoOutcome` executor in `functions/src/services/transform/outcomes/aiVideoOutcome.ts` — new file implementing the `animate` task flow. Follow the `aiImageOutcome.ts` pattern exactly (see research.md R-009). The executor must:
  - Export `async function aiVideoOutcome(ctx: OutcomeContext): Promise<JobOutput>`
  - Destructure `{ job, snapshot, tmpDir, startTime, reportProgress }` from `ctx`
  - Guard: assert `snapshot.outcome?.aiVideo` exists, throw if missing
  - Destructure `{ task, captureStepId, aspectRatio, videoGeneration }` from `outcome.aiVideo`
  - Validate `videoGeneration.prompt.trim()` is not empty (throw on empty)
  - Report progress: `{ currentStep: 'starting', percentage: 10, message: 'Processing video...' }`
  - Download subject photo: call `getSourceMedia(snapshot.sessionResponses, captureStepId)` then `downloadFromStorage(getStoragePathFromMediaReference(sourceMedia), localPath)` to `${tmpDir}/source.jpg`
  - For `animate` task: start frame = downloaded subject photo, no end frame
  - Resolve video generation prompt: call `resolvePromptMentions(videoGeneration.prompt, snapshot.sessionResponses, [])` (no refMedia for video gen prompt)
  - Report progress: `{ currentStep: 'generating-video', percentage: 20, message: 'Generating video...' }`
  - Call `aiGenerateVideo({ prompt: resolved.text, model: videoGeneration.model, aspectRatio: videoGeneration.aspectRatio ?? aspectRatio, duration: videoGeneration.duration, startFrame: localSourcePath, endFrame: undefined }, tmpDir)`
  - Report progress: `{ currentStep: 'uploading', percentage: 80, message: 'Uploading result...' }`
  - Handle overlay: if `snapshot.overlayChoice` is set, log `logger.warn('Overlay not supported for ai.video outcomes, skipping')` — do NOT call `applyOverlay`
  - Call `uploadOutput({ outputPath: generatedVideo.outputPath, projectId: job.projectId, sessionId: job.sessionId, tmpDir, format: 'video', dimensions: generatedVideo.dimensions, extension: 'mp4' })`
  - Return `{ ...uploaded, processingTimeMs: Date.now() - startTime }`

- [X] T010 [US1] Register `aiVideoOutcome` in dispatcher in `functions/src/services/transform/engine/runOutcome.ts` — import `aiVideoOutcome` from `../outcomes/aiVideoOutcome` and replace `'ai.video': null` with `'ai.video': aiVideoOutcome` in the `outcomeRegistry` object.

- [X] T011 [US1] Build and type-check functions workspace — run `pnpm functions:build` to verify the entire functions workspace compiles with no TypeScript errors. Fix any type errors that surface from the new code or modified interfaces.

**Checkpoint**: At this point, the animate task works end-to-end. A guest can upload a photo and receive an AI-generated video. This is the MVP.

---

## Phase 4: User Story 2 — Guest Receives Transformation Video (Priority: P2)

**Goal**: A guest uploads a photo and receives a video that transitions from their original photo to an AI-generated end frame.

**Independent Test**: Configure an experience with `ai.video` outcome (task: `transform`) with end-frame image generation config, upload a photo, verify the output video transitions from the original to an AI-generated end frame.

### Implementation for User Story 2

- [ ] T012 [US2] Extend `aiVideoOutcome` with `transform` task support in `functions/src/services/transform/outcomes/aiVideoOutcome.ts` — add the `transform` branch to the task switch. Before the video generation call:
  - Validate `endFrameImageGen` is not null (throw `INVALID_INPUT` if missing for `transform` task)
  - Validate `endFrameImageGen.prompt.trim()` is not empty
  - Resolve end frame prompt: `resolvePromptMentions(endFrameImageGen.prompt, snapshot.sessionResponses, endFrameImageGen.refMedia)`
  - Compute effective aspect ratio for frame gen: `endFrameImageGen.aspectRatio ?? aspectRatio`
  - Report progress: `{ currentStep: 'generating-end-frame', percentage: 20, message: 'Generating end frame...' }`
  - Generate end frame image: call `aiGenerateImage({ prompt: resolvedEndPrompt.text, model: endFrameImageGen.model, aspectRatio: effectiveAspectRatio, sourceMedia, referenceMedia: resolvedEndPrompt.mediaRefs }, tmpDir)`
  - Report progress: `{ currentStep: 'generating-video', percentage: 40, message: 'Generating video...' }`
  - Call `aiGenerateVideo` with `startFrame: localSourcePath` (subject photo) and `endFrame: endFrameImage.outputPath`
  - Rest of flow (upload, return) is shared with animate

- [ ] T013 [US2] Build and type-check functions workspace — run `pnpm functions:build` to verify transform task additions compile correctly.

**Checkpoint**: At this point, both animate AND transform tasks work. Transform generates an AI end frame and produces a transition video.

---

## Phase 5: User Story 3 — Guest Receives Reimagined Video (Priority: P3)

**Goal**: A guest uploads a photo and receives a video transitioning between two AI-generated frames (start and end).

**Independent Test**: Configure an experience with `ai.video` outcome (task: `reimagine`) with both start-frame and end-frame image generation configs, upload a photo, verify the output video transitions between two AI-generated frames.

### Implementation for User Story 3

- [ ] T014 [US3] Extend `aiVideoOutcome` with `reimagine` task support in `functions/src/services/transform/outcomes/aiVideoOutcome.ts` — add the `reimagine` branch to the task switch. Before the video generation call:
  - Validate both `startFrameImageGen` and `endFrameImageGen` are not null (throw `INVALID_INPUT` if either is missing)
  - Validate both prompts are non-empty
  - Resolve both prompts via `resolvePromptMentions`
  - Report progress: `{ currentStep: 'generating-frames', percentage: 20, message: 'Generating frames...' }`
  - Generate BOTH frames in parallel using `Promise.all([aiGenerateImage(startFrameConfig, tmpDir), aiGenerateImage(endFrameConfig, tmpDir)])` — this is the key difference from transform (FR-006)
  - Report progress: `{ currentStep: 'generating-video', percentage: 40, message: 'Generating video...' }`
  - Call `aiGenerateVideo` with `startFrame: startFrameImage.outputPath` and `endFrame: endFrameImage.outputPath`
  - Rest of flow (upload, return) is shared with animate and transform

- [ ] T015 [US3] Build and type-check functions workspace — run `pnpm functions:build` to verify reimagine task additions compile correctly.

**Checkpoint**: All three task types (animate, transform, reimagine) are now functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, regression check, and cleanup.

- [ ] T016 Run full build across all workspaces — execute `pnpm --filter @clementine/shared build && pnpm functions:build` to verify no cross-workspace type errors. Ensure existing photo and ai.image outcome code still compiles (US4 regression safety).

- [ ] T017 Run shared package tests — execute `pnpm --filter @clementine/shared test` to verify schema changes don't break existing validation tests. Fix any test fixtures that reference old schema values (`1:1` aspect ratio, `duration: 5`).

- [ ] T018 Verify export barrel files — ensure `functions/src/services/transform/outcomes/index.ts` (if it exists) re-exports `aiVideoOutcome`, and `functions/src/services/transform/operations/index.ts` (if it exists) re-exports `aiGenerateVideo`. Follow existing barrel export patterns.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T003 must pass) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational phase completion
- **US2 (Phase 4)**: Depends on US1 completion (extends the same file)
- **US3 (Phase 5)**: Depends on US2 completion (extends the same file further)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — creates `aiVideoOutcome.ts`
- **User Story 2 (P2)**: Depends on US1 — extends the `aiVideoOutcome.ts` file created in US1
- **User Story 3 (P3)**: Depends on US2 — extends the `aiVideoOutcome.ts` file further
- **User Story 4 (P1, regression)**: Verified by Phase 6 Polish tasks (T016, T017)

### Within Each Phase

- Setup: T001 and T002 can run in parallel → T003 depends on both
- Foundational: T004, T005, T006, T007 can run in parallel → T008 can also run in parallel (no dependency on T004-T007)
- US1: T009 → T010 (dispatcher needs executor) → T011 (build verification)
- US2: T012 → T013 (build verification)
- US3: T014 → T015 (build verification)
- Polish: T016, T017, T018 can run in parallel

### Parallel Opportunities

```
Phase 1 — parallel:
  T001 (aspect ratio schema) || T002 (duration schema)
  → T003 (build + test)

Phase 2 — parallel:
  T004 (aiGenerateVideo) || T005 (uploadOutput) || T006 (types) || T007 (task handler) || T008 (callable)
  → checkpoint

Phase 3-5 — sequential (same file):
  T009 → T010 → T011 → T012 → T013 → T014 → T015

Phase 6 — parallel:
  T016 (full build) || T017 (shared tests) || T018 (barrel exports)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (schema updates)
2. Complete Phase 2: Foundational (aiGenerateVideo, uploadOutput, types, task handler, callable)
3. Complete Phase 3: User Story 1 (animate task — create executor, register, build)
4. **STOP and VALIDATE**: Deploy and test animate task end-to-end
5. Deploy/demo if ready — guests can receive AI-animated videos

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. Add US1 (animate) → Test → Deploy (MVP — simplest video generation)
3. Add US2 (transform) → Test → Deploy (adds AI end-frame generation)
4. Add US3 (reimagine) → Test → Deploy (adds parallel frame generation)
5. Polish → Final build verification + regression check

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 and US3 extend the same `aiVideoOutcome.ts` file, so they must be sequential
- The `aiGenerateVideo` operation (T004) is the largest single task — it includes Veo client init, async polling, GCS download, error handling, and ffprobe. Refer to research.md R-001 and R-006 for implementation details.
- All temp files are cleaned up by the task handler's `finally` block — no explicit cleanup needed in the executor
- The `@google/genai` package is already installed in `functions/package.json` — no `pnpm add` needed
