# Tasks: Job + Cloud Functions

**Input**: Design documents from `/specs/062-job-cloud-functions/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests for prompt resolution included per constitution (Principle IV).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Shared Package**: `packages/shared/src/schemas/`
- **Functions**: `functions/src/`
- **Transform Service**: `functions/src/services/transform/`

---

## Phase 1: Setup

**Purpose**: Create new directory structure and remove deprecated files

- [x] T001 Create new directories: `functions/src/services/transform/engine/`, `functions/src/services/transform/outcomes/`, `functions/src/services/transform/bindings/`
- [x] T002 [P] Delete deprecated file `functions/src/services/transform/pipeline-runner.ts`
- [x] T003 [P] Delete deprecated file `functions/src/services/transform/overlay.ts`
- [x] T004 [P] Delete deprecated file `functions/src/services/transform/executors/ai-image.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema updates and types that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Update `jobSnapshotSchema` to add `sessionResponses` and `outcome` fields in `packages/shared/src/schemas/job/job.schema.ts`
- [x] T006 Add `OutcomeContext` and `OutcomeExecutor` interfaces to `functions/src/services/transform/types.ts`
- [x] T007 Build shared package to verify schema changes: `pnpm --filter @clementine/shared build`

**Checkpoint**: Schema and types ready - user story implementation can now begin

---

## Phase 3: US4 - Job Snapshot Captures Complete Context (Priority: P1) 🎯 MVP

**Goal**: Update job creation to capture `sessionResponses` and `outcome` in snapshot, validate outcome configuration

**Independent Test**: Create a job, verify snapshot contains sessionResponses array and outcome object

### Implementation for User Story 4

- [x] T008 [US4] Update `buildJobSnapshot()` to use `session.responses` and `experience.published.outcome` in `functions/src/repositories/job.ts`
- [x] T009 [US4] Update validation in `startTransformPipeline.ts` to check `outcome.type !== null` instead of `transformNodes.length > 0` in `functions/src/callable/startTransformPipeline.ts`
- [x] T010 [US4] Add passthrough validation: reject if `!aiEnabled && !captureStepId` in `functions/src/callable/startTransformPipeline.ts`

**Checkpoint**: Job creation validates outcome and builds correct snapshot

---

## Phase 4: US3 - Prompt Mentions Resolve to Session Data (Priority: P2)

**Goal**: Create utility to resolve `@{step:stepName}` and `@{ref:displayName}` mentions in prompts

**Independent Test**: Call `resolvePromptMentions()` with test data, verify placeholders are replaced correctly

### Tests for User Story 3

- [x] T011 [P] [US3] Create unit test for `resolvePromptMentions()` covering text, multi-select, and capture step types in `functions/src/services/transform/bindings/__tests__/resolvePromptMentions.test.ts`

### Implementation for User Story 3

- [x] T012 [US3] Create `resolvePromptMentions()` function handling `@{step:stepName}` for text/multi-select/capture data types in `functions/src/services/transform/bindings/resolvePromptMentions.ts`
- [x] T013 [US3] Add `@{ref:displayName}` resolution from reference media array in `functions/src/services/transform/bindings/resolvePromptMentions.ts`
- [x] T014 [US3] Add warning logging for unresolved mentions (preserve original text) in `functions/src/services/transform/bindings/resolvePromptMentions.ts`

**Checkpoint**: Prompt resolution works for all data types, tests pass

---

## Phase 5: Executors - Atomic Operations

**Purpose**: Refactor existing code into reusable atomic executors

- [x] T015 [P] Create `aiGenerateImage()` executor (refactored from ai-image.ts, accept `GenerationRequest` interface) in `functions/src/services/transform/executors/aiGenerateImage.ts`
- [x] T016 [P] Create `applyOverlay()` executor (refactored from overlay.ts, accept media path and overlay reference) in `functions/src/services/transform/executors/applyOverlay.ts`
- [x] T017 Update executors barrel exports in `functions/src/services/transform/executors/index.ts`

**Checkpoint**: Atomic executors ready for orchestration by outcomes

---

## Phase 6: US1 - Guest Completes Experience and Receives AI-Generated Image (Priority: P1) 🎯 MVP

**Goal**: Implement outcome dispatcher and image outcome executor for AI generation flow

**Independent Test**: Complete an experience with AI enabled, verify generated image is returned to session

### Implementation for User Story 1

- [x] T018 [US1] Create `runOutcome()` dispatcher with registry pattern in `functions/src/services/transform/engine/runOutcome.ts`
- [x] T019 [US1] Add non-retryable error for unimplemented outcome types (gif, video) in `functions/src/services/transform/engine/runOutcome.ts`
- [x] T020 [US1] Create `imageOutcome()` executor with AI generation mode in `functions/src/services/transform/outcomes/imageOutcome.ts`
- [x] T021 [US1] Integrate prompt resolution, source media extraction, and AI generation call in `functions/src/services/transform/outcomes/imageOutcome.ts`
- [x] T022 [US1] Add overlay application after AI generation (lookup by aspect ratio) in `functions/src/services/transform/outcomes/imageOutcome.ts`
- [x] T023 [US1] Update `transformPipelineJob.ts` to call `runOutcome()` instead of `executeTransformPipeline()` in `functions/src/tasks/transformPipelineJob.ts`

**Checkpoint**: AI image generation flow works end-to-end

---

## Phase 7: US2 - Guest Receives Passthrough Image with Overlay (Priority: P2)

**Goal**: Handle passthrough mode (aiEnabled=false) - return captured media with optional overlay

**Independent Test**: Complete an experience with aiEnabled=false, verify captured image (with overlay) is returned

### Implementation for User Story 2

- [x] T024 [US2] Add passthrough mode branch in `imageOutcome()` (skip AI, apply overlay only) in `functions/src/services/transform/outcomes/imageOutcome.ts`
- [x] T025 [US2] Handle missing overlay gracefully (return media without overlay) in `functions/src/services/transform/outcomes/imageOutcome.ts`
- [x] T026 [US2] Add error handling for missing capture media in passthrough mode in `functions/src/services/transform/outcomes/imageOutcome.ts`

**Checkpoint**: Passthrough mode works, returns captured media with overlay

---

## Phase 8: US5 - Session Updated with Job Result (Priority: P2)

**Goal**: Ensure session is updated with result media after successful job completion

**Independent Test**: Process a job, verify session.resultMedia contains generated asset

### Implementation for User Story 5

- [x] T027 [US5] Verify `updateSessionResultMedia()` is called with correct stepId ('create') in `functions/src/tasks/transformPipelineJob.ts`
- [x] T028 [US5] Verify `updateSessionJobStatus()` is called with 'completed' status in `functions/src/tasks/transformPipelineJob.ts`

**Checkpoint**: Session updates work correctly after job completion

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, exports, and validation

- [x] T029 Update transform service barrel exports in `functions/src/services/transform/index.ts`
- [x] T030 Run type-check: `pnpm --filter functions type-check`
- [x] T031 Run lint: `pnpm --filter functions lint` (no lint script in functions package - N/A)
- [x] T032 Build functions package: `pnpm --filter functions build`
- [x] T033 Run tests: `pnpm --filter functions test`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US4 (Phase 3)**: Depends on Foundational - schema must be ready
- **US3 (Phase 4)**: Depends on Foundational - can run parallel with US4
- **Executors (Phase 5)**: Depends on Foundational - can run parallel with US3/US4
- **US1 (Phase 6)**: Depends on US4, US3, and Executors
- **US2 (Phase 7)**: Depends on US1 (imageOutcome exists)
- **US5 (Phase 8)**: Depends on US1 (job execution flow exists)
- **Polish (Phase 9)**: Depends on all user stories complete

### User Story Dependencies

- **US4 (P1)**: Foundational schema - blocks US1, US2
- **US3 (P2)**: Prompt resolution - blocks US1 (AI generation needs resolved prompts)
- **US1 (P1)**: AI generation - depends on US4, US3, Executors
- **US2 (P2)**: Passthrough - depends on Executors (applyOverlay), extends US1's imageOutcome
- **US5 (P2)**: Session update - verification only, depends on US1 job flow

### Parallel Opportunities

```
After Setup:
├── T002 [P] Delete pipeline-runner.ts
├── T003 [P] Delete overlay.ts
└── T004 [P] Delete ai-image.ts

After Foundational:
├── US4 (T008-T010) - Schema/Validation
├── US3 (T011-T014) - Prompt Resolution [P]
└── Executors (T015-T017) - Atomic Operations [P]

Within Executors:
├── T015 [P] aiGenerateImage.ts
└── T016 [P] applyOverlay.ts
```

---

## Parallel Example: Executors Phase

```bash
# Launch both executor refactors together (different files):
Task: "Create aiGenerateImage() in functions/src/services/transform/executors/aiGenerateImage.ts"
Task: "Create applyOverlay() in functions/src/services/transform/executors/applyOverlay.ts"
```

---

## Implementation Strategy

### MVP First (US4 + US1)

1. Complete Phase 1: Setup (delete old files)
2. Complete Phase 2: Foundational (schema + types)
3. Complete Phase 3: US4 - Job Snapshot (validation)
4. Complete Phase 4: US3 - Prompt Resolution (utility)
5. Complete Phase 5: Executors (atomic operations)
6. Complete Phase 6: US1 - AI Generation
7. **STOP and VALIDATE**: Test AI generation end-to-end
8. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Schema ready
2. Add US4 (Snapshot) → Job creation works
3. Add US3 (Prompt) + Executors → Utilities ready
4. Add US1 (AI Image) → **MVP Complete** ✓
5. Add US2 (Passthrough) → Simple mode works
6. Add US5 (Session) → Verification complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US4 is foundational but labeled as user story per spec
- Executors phase is shared infrastructure for US1 and US2
- US5 is mostly verification of existing code
- Commit after each phase or logical group
- Run `pnpm app:check` before committing
