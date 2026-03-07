# Tasks: Error Capture & Safety Filter Reporting

**Input**: Design documents from `/specs/090-error-capture-safety-filters/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No automated tests requested. Manual verification via build checks and quickstart.md scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Schema Changes)

**Purpose**: Extend shared Zod schemas with new optional fields required by downstream phases

- [x] T001 [P] Add optional `details` field (`z.record(z.unknown()).nullable().default(null)`) to `jobErrorSchema` in `packages/shared/src/schemas/job/job.schema.ts`
- [x] T002 [P] Add optional `jobErrorCode` field (`z.string().nullable().default(null)`) to `sessionSchema` in `packages/shared/src/schemas/session/session.schema.ts`
- [x] T003 Build shared package to verify schema changes compile: `pnpm --filter @clementine/shared build`

---

## Phase 2: Foundational (Error Infrastructure)

**Purpose**: Extend error types, sanitized error codes, and repository functions that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Add `'SAFETY_FILTERED'` to `AiTransformErrorCode` type union and add optional `metadata?: Record<string, unknown>` property to `AiTransformError` class in `functions/src/services/ai/providers/types.ts`
- [x] T005 [P] Add `SAFETY_FILTERED: 'Content was blocked by safety filters.'` entry to `SANITIZED_ERROR_MESSAGES` and update `createSanitizedError` to accept an optional third parameter `details: Record<string, unknown> | null = null` that is included in the returned `JobError` object, in `functions/src/repositories/job.ts`
- [x] T006 [P] Extend `updateSessionJobStatus` to accept an optional `jobErrorCode?: string` parameter and write it to the session document alongside `jobStatus` when provided, in `functions/src/repositories/session.ts`

**Checkpoint**: Foundation ready — error infrastructure supports all user stories

---

## Phase 3: User Story 1 — Safety Filter Error Visibility (Priority: P1) MVP

**Goal**: When AI generations are blocked by safety filters, capture the specific filter reasons from the provider response and include them in the thrown error so they reach the job error record.

**Independent Test**: Trigger a safety-filtered video/image generation → verify the `AiTransformError` thrown contains the filter reasons in its `metadata` property and the error message includes the reasons for Cloud Function log visibility.

### Implementation for User Story 1

- [x] T007 [P] [US1] Update `extractVideoUri` in `functions/src/services/transform/operations/aiGenerateVideo.ts`: when `generatedVideos` is empty or missing, read `operation.response?.raiMediaFilteredCount` and `operation.response?.raiMediaFilteredReasons`. Throw an `AiTransformError` with code `'SAFETY_FILTERED'`, a descriptive message including the filter reasons, and set `metadata` to `{ raiMediaFilteredCount, raiMediaFilteredReasons }`. Fall back to a generic safety filter error if the metadata fields are unavailable.
- [x] T008 [P] [US1] Update `extractImageFromResponse` in `functions/src/services/transform/operations/aiGenerateImage.ts`: before throwing on empty candidates, check `response.promptFeedback?.blockReason` for safety-related values (SAFETY, IMAGE_SAFETY, BLOCKLIST, PROHIBITED_CONTENT). Also check `candidate.finishReason` for SAFETY/IMAGE_SAFETY values and `candidate.safetyRatings` for blocked categories. When safety filtering is detected, throw an `AiTransformError` with code `'SAFETY_FILTERED'`, a descriptive message, and set `metadata` with the available filter data (`blockReason`, `blockReasonMessage`, `finishReason`, blocked `safetyRatings`). If no safety indicators found, keep existing generic error behavior.

**Checkpoint**: Safety filter reasons are captured in errors thrown by generation functions. Verify by reading Cloud Function logs after a filtered generation.

---

## Phase 4: User Story 2 — Meaningful Error Classification in Job Records (Priority: P1)

**Goal**: Classify job failures with specific error codes instead of always using `PROCESSING_FAILED`. The job error record should contain the appropriate code and any available metadata.

**Independent Test**: Trigger different failure types (safety filter, provider error, timeout) → verify each produces a distinct error code in the job document's error field. Verify full error details remain in Cloud Function logs.

### Implementation for User Story 2

- [x] T009 [US2] Update `handleJobFailure` in `functions/src/tasks/transformPipelineTask.ts`: replace the hardcoded `createSanitizedError('PROCESSING_FAILED', 'outcome')` with error classification logic. Check `error instanceof AiTransformError` and map `error.code` to sanitized codes per the mapping: `SAFETY_FILTERED` → `SAFETY_FILTERED`, `API_ERROR` → `AI_MODEL_ERROR`, `TIMEOUT` → `TIMEOUT`, `INVALID_CONFIG`/`INVALID_INPUT_IMAGE`/`REFERENCE_IMAGE_NOT_FOUND` → `INVALID_INPUT`. For non-`AiTransformError` errors, also check for `OutcomeError` with code `INVALID_INPUT`. Default to `PROCESSING_FAILED` for unrecognized errors. Pass `error.metadata` (if `AiTransformError`) as the `details` parameter to `createSanitizedError`. Ensure full error logging (message + stack trace) is preserved.

**Checkpoint**: Job documents contain specific error codes. Query Firestore for jobs with `error.code == 'SAFETY_FILTERED'` to verify classification works.

---

## Phase 5: User Story 3 — Error Code Propagation to Session Records (Priority: P2)

**Goal**: When a job fails, propagate the error code to the session document so the frontend can determine error type without fetching the job document.

**Independent Test**: Trigger a job failure → verify the session document contains the `jobErrorCode` field matching the job's error code.

**Depends on**: User Story 2 (error codes must be classified before they can be propagated)

### Implementation for User Story 3

- [x] T010 [US3] Update the `updateSessionJobStatus` call in `handleJobFailure` in `functions/src/tasks/transformPipelineTask.ts` to pass the sanitized error code as the `jobErrorCode` parameter when the job status is `'failed'`. Also update the OOM recovery guard error path (restart-guard) to pass its error code similarly.

**Checkpoint**: Session documents contain `jobErrorCode` when job status is `'failed'`. Verify via Firestore console.

---

## Phase 6: User Story 4 — Differentiated Guest-Facing Error Messages (Priority: P2)

**Goal**: Show guests specific, helpful error messages based on the failure type instead of a generic "Something went wrong" for all errors.

**Independent Test**: Load a share page for sessions with different `jobErrorCode` values → verify the correct message appears for each: content guidelines message for `SAFETY_FILTERED`, timeout message for `TIMEOUT`, generic fallback for everything else. Verify no internal details are exposed.

**Depends on**: User Story 3 (error code must be on the session for the frontend to read it)

### Implementation for User Story 4

- [x] T011 [US4] Update error rendering in `apps/clementine-app/src/domains/guest/containers/SharePage.tsx`: read `session.jobErrorCode` from the session data. When `isJobFailed` is true, map the error code to differentiated title + message props passed to `ThemedErrorState`: `SAFETY_FILTERED` → title "Photo couldn't be processed", message "Your photo couldn't be processed because it didn't meet our content guidelines. Please try a different photo."; `TIMEOUT` → title "Processing timed out", message "Processing took longer than expected. Please try again."; default (including null/undefined) → current generic title "Something went wrong", message "We couldn't process your image. Please try again." Ensure no error codes, filter reasons, or technical details appear in the rendered output.

**Checkpoint**: Share page shows differentiated messages. Open browser dev tools → verify no internal data leaks in rendered HTML.

---

## Phase 7: Validation & Polish

**Purpose**: Verify all changes compile, lint cleanly, and work together across workspaces

- [x] T012 Build and type-check all workspaces: `pnpm --filter @clementine/shared build && pnpm functions:build && pnpm app:type-check`
- [x] T013 Run linting and formatting: `pnpm app:check`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (shared package must build first)
- **US1 (Phase 3)**: Depends on Phase 2 (needs `AiTransformError` changes + `SAFETY_FILTERED` code)
- **US2 (Phase 4)**: Depends on Phase 2 AND Phase 3 (needs `AiTransformError` with `SAFETY_FILTERED` to exist in generation functions)
- **US3 (Phase 5)**: Depends on Phase 4 (needs error classification to produce codes worth propagating)
- **US4 (Phase 6)**: Depends on Phase 5 (needs `jobErrorCode` on session to read on frontend)
- **Validation (Phase 7)**: Depends on all previous phases

### Task Dependencies

```
T001, T002 (parallel) → T003 → T004, T005, T006 (parallel) → T007, T008 (parallel) → T009 → T010 → T011 → T012 → T013
```

### Within Each User Story

- US1: T007 and T008 are parallel (different files, no shared dependencies)
- US2: T009 is a single task (one function to update)
- US3: T010 is a single task (extends T009's work in the same function)
- US4: T011 is a single task (one component to update)

### Parallel Opportunities

```
Phase 1: T001 || T002 (two schema files in parallel)
Phase 2: T004 || T005 || T006 (three different files in parallel)
Phase 3: T007 || T008 (two generation files in parallel)
```

---

## Parallel Example: Phase 2 (Foundational)

```
# Launch all three foundational tasks in parallel:
Task T004: "Extend AiTransformErrorCode in functions/src/services/ai/providers/types.ts"
Task T005: "Add SAFETY_FILTERED to SANITIZED_ERROR_MESSAGES in functions/src/repositories/job.ts"
Task T006: "Extend updateSessionJobStatus in functions/src/repositories/session.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Schema changes
2. Complete Phase 2: Error infrastructure
3. Complete Phase 3: Safety filter capture (US1)
4. Complete Phase 4: Error classification (US2)
5. **STOP and VALIDATE**: Verify job documents contain specific error codes with filter details
6. Deploy backend changes — immediate operational value

### Incremental Delivery

1. Setup + Foundational → error infrastructure ready
2. Add US1 (safety filter capture) → ops team can see filter reasons in logs
3. Add US2 (error classification) → ops team can query jobs by error code
4. Add US3 (session propagation) → error codes available to frontend
5. Add US4 (share page messages) → guests see differentiated messages
6. Each story adds value without breaking previous stories

---

## Notes

- T009 and T010 modify the same function (`handleJobFailure` in `transformPipelineTask.ts`) — execute sequentially
- All new schema fields use `.nullable().default(null)` for backward compatibility — no migration needed
- Error propagation through the outcome chain should be verified during T007/T008 implementation — if intermediate layers wrap errors, use `error.cause` chain to find the original `AiTransformError`
- The `details` field in job errors is internal-only; Firestore security rules already restrict job access to server operations
- Commit after each phase to maintain clean checkpoints
