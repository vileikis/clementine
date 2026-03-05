# Tasks: Functions Hardening — Pilot Prep

**Input**: Design documents from `/specs/088-functions-hardening/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by requirement area. R-001 (cleanup) and R-002/R-003 (config) are independent. R-004 (OOM) and R-005 (retry) share a foundational phase for the new utility and schema.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which requirement this task belongs to (R001–R005)
- Include exact file paths in descriptions

---

## Phase 1: Cleanup — Remove Test Functions (R-001)

**Purpose**: Delete unused test HTTP endpoints to reduce deployed function count and attack surface

- [x] T001 [P] [R001] Delete test endpoint file `functions/src/http/testVertexAI.ts`
- [x] T002 [P] [R001] Delete test endpoint file `functions/src/http/testImageGeneration.ts`
- [x] T003 [P] [R001] Delete test endpoint file `functions/src/http/testImageGenerationWithReference.ts`
- [x] T004 [R001] Remove test exports and "Vertex AI Tests" comment block from `functions/src/index.ts` (lines 19–24)

**Checkpoint**: `pnpm functions:build` should pass with 3 fewer exported functions

---

## Phase 2: Foundational — Retry Utility & Schema (R-004, R-005)

**Purpose**: Create shared infrastructure needed by both OOM prevention and retry integration

**⚠️ CRITICAL**: Phase 4 and Phase 5 depend on this phase completing first

- [x] T005 [R005] Create exponential backoff retry utility at `functions/src/services/transform/helpers/retryWithBackoff.ts` — import `ApiError` from `@google/genai`, use existing `sleep` helper, implement `retryWithBackoff<T>(fn, label, config?)` with defaults: maxRetries=3, initialDelayMs=2000, backoffMultiplier=2, jitterFraction=0.25. Check `error.status` for 429/503 retryable codes. Log each retry attempt with delay and attempt number.
- [x] T006 [R005] Re-export `retryWithBackoff` from barrel file `functions/src/services/transform/helpers/index.ts`
- [x] T007 [R004] Add optional `attemptCount` field to Job schema in `packages/shared/src/schemas/job/job.schema.ts` — add `attemptCount: z.number().int().nonnegative().default(0)` to `jobSchema`

**Checkpoint**: `pnpm --filter @clementine/shared build && pnpm functions:build` should pass

---

## Phase 3: Config & Safety Changes (R-002, R-003)

**Purpose**: Increase task worker memory and relax safety filters for pilot

**Independent Test**: Deploy functions and verify config via `gcloud functions describe transformpipelinetask`

- [x] T008 [P] [R002] Change memory from `'1GiB'` to `'2GiB'` in `functions/src/tasks/transformPipelineTask.ts` (line 60)
- [x] T009 [P] [R003] Add `personGeneration: 'ALLOW_ALL'` inside `imageConfig` block in `functions/src/services/transform/operations/aiGenerateImage.ts` (after `outputMimeType` line ~86)
- [x] T010 [P] [R003] Change `personGeneration` from `'allow_adult' as const` to `'allow_all'` in `baseConfig` in `functions/src/services/transform/operations/aiGenerateVideo.ts` (line 248)

**Checkpoint**: `pnpm functions:build` should pass — config-only changes, no logic impact

---

## Phase 4: OOM Restart Loop Prevention (R-004)

**Purpose**: Prevent infinite restart loops when task worker OOMs by tracking attempts and failing after second crash

**Depends on**: Phase 2 (T007 — attemptCount schema field)

**Independent Test**: Trigger a job, verify `attemptCount` increments in Firestore. Simulate crash recovery by manually setting job status to `running` and re-dispatching.

- [x] T011 [R004] Add `attemptCount: FieldValue.increment(1)` to the Firestore update in `updateJobStarted()` in `functions/src/repositories/job.ts`
- [x] T012 [R004] Change `retryConfig.maxAttempts` from `0` to `2` in `functions/src/tasks/transformPipelineTask.ts` (line 67)
- [x] T013 [R004] Add second-failure guard in `prepareJobExecution()` in `functions/src/tasks/transformPipelineTask.ts` — when `job.status === 'running'` and `job.attemptCount >= 2`, immediately fail the job (call `updateJobError` + `updateSessionJobStatus` with 'failed') and throw to abort execution
- [x] T014 [R004] Add `logMemoryUsage(phase, jobId)` helper in `functions/src/tasks/transformPipelineTask.ts` — logs `process.memoryUsage()` with heapUsedMB, heapTotalMB, rssMB, externalMB. Call at: job start (after `prepareJobExecution`), after `runOutcome`, on `finalizeJobSuccess`, and in `handleJobFailure`

**Checkpoint**: Build passes. Memory usage appears in structured logs at 4 execution points.

---

## Phase 5: Retry Integration for Vertex AI (R-005)

**Purpose**: Wrap AI API calls with exponential backoff retry to handle 429 RESOURCE_EXHAUSTED errors

**Depends on**: Phase 2 (T005 — retryWithBackoff utility)

**Independent Test**: Trigger an AI image or video job. Verify in logs that if a 429 occurs, retry attempts are logged with increasing delays before either succeeding or failing.

- [x] T015 [R005] Wrap `client.models.generateContent()` call in `functions/src/services/transform/operations/aiGenerateImage.ts` with `retryWithBackoff(() => client.models.generateContent(...), 'AIImageGenerate')`
- [x] T016 [R005] Wrap `client.models.generateVideos()` call in `functions/src/services/transform/operations/aiGenerateVideo.ts` with `retryWithBackoff(() => client.models.generateVideos(...), 'AIVideoGenerate')`

**Checkpoint**: `pnpm functions:build` passes. API calls are wrapped with retry logic.

---

## Phase 6: Validation & Build

**Purpose**: Final build verification across all workspaces

- [x] T017 Build shared package: `pnpm --filter @clementine/shared build`
- [x] T018 Build functions: `pnpm functions:build` — verify zero type errors and all exports resolve
- [x] T019 Verify `functions/src/index.ts` exports exactly 6 functions (was 9, minus 3 test endpoints)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Cleanup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: No dependencies — can start in parallel with Phase 1
- **Phase 3 (Config)**: No dependencies — can start in parallel with Phase 1 and 2
- **Phase 4 (OOM)**: Depends on Phase 2 (T007 schema change, T011 uses it)
- **Phase 5 (Retry)**: Depends on Phase 2 (T005 retry utility)
- **Phase 6 (Validation)**: Depends on all previous phases

### Parallel Opportunities

**Wave 1** (all independent, can run in parallel):
- Phase 1: T001, T002, T003 (delete 3 files simultaneously)
- Phase 2: T005 (create retry utility), T007 (schema change)
- Phase 3: T008, T009, T010 (3 config changes in different files)

**Wave 2** (after Wave 1 completes):
- T004 (update index.ts — after files deleted)
- T006 (update barrel — after T005)
- T011, T012, T013, T014 (OOM changes — after T007)
- T015, T016 (retry integration — after T005)

**Wave 3**:
- T017, T018, T019 (validation — after all implementation)

---

## Implementation Strategy

### Recommended Order (Single Developer)

1. **Phase 1 + Phase 3** together (quick wins, config-only) → commit
2. **Phase 2** (foundational: retry utility + schema) → commit
3. **Phase 4** (OOM prevention) → commit
4. **Phase 5** (retry integration) → commit
5. **Phase 6** (validation) → final verification

### Total: 19 tasks across 6 phases

---

## Notes

- All changes scoped to `functions/` and `packages/shared/` workspaces
- No frontend changes
- `personGeneration` uses different casing per API: uppercase `'ALLOW_ALL'` for image, lowercase `'allow_all'` for video (per SDK conventions)
- `attemptCount` is backward-compatible — existing job documents without it default to `0`
- Retry utility only retries 429 and 503 — all other errors propagate immediately
