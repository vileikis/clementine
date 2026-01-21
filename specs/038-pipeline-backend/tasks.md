# Tasks: Backend Pipeline Infrastructure

**Input**: Design documents from `/specs/038-pipeline-backend/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, quickstart.md

**Tests**: Included per constitution (Principle IV - Minimal Testing Strategy)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- Functions: `functions/src/`
- Tests: Colocated with source files (e.g., `job.ts` → `job.test.ts`)
- Schemas: `functions/src/lib/schemas/`

---

## Phase 1: Setup

**Purpose**: Project structure verification and request schemas

- [ ] T001 Verify @clementine/shared exports Job and Session schemas from Phase 1 in `packages/shared/src/index.ts`
- [ ] T002 [P] Create request/response schemas in `functions/src/lib/schemas/transform-pipeline.schema.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core helpers that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Create session-v2 helpers in `functions/src/lib/session-v2.ts` (fetchSession, updateSessionJobStatus)
- [ ] T004 [P] Create job helpers in `functions/src/lib/job.ts` (createJob, fetchJob, updateJobStatus, updateJobProgress)
- [ ] T005 [P] Create session-v2 tests in `functions/src/lib/session-v2.test.ts`
- [ ] T006 [P] Create job helpers tests in `functions/src/lib/job.test.ts`
- [ ] T007 Verify build passes with `pnpm functions:build`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Guest Triggers Transform Pipeline (Priority: P1) 🎯 MVP

**Goal**: HTTP endpoint that creates a job and returns jobId to client

**Independent Test**: POST to endpoint with valid sessionId/stepId → receive jobId, verify job doc exists with status 'pending', verify session updated

### Tests for User Story 1

- [ ] T008 [P] [US1] Create HTTP endpoint tests in `functions/src/http/startTransformPipeline.test.ts`

### Implementation for User Story 1

- [ ] T009 [US1] Implement startTransformPipeline HTTP function in `functions/src/http/startTransformPipeline.ts`
  - Validate request body (sessionId, stepId)
  - Fetch session, validate exists
  - Check no active job (FR-011)
  - Fetch experience, validate transform config exists (FR-013)
  - Create job document with snapshot (FR-002)
  - Update session with jobId and jobStatus='pending' (FR-003)
  - Queue Cloud Task for transformPipelineJob
  - Return jobId (FR-014)
- [ ] T010 [US1] Add edge case handling for 404 (session not found, transform not found) in `functions/src/http/startTransformPipeline.ts`
- [ ] T011 [US1] Add edge case handling for 409 (job already in progress) in `functions/src/http/startTransformPipeline.ts`
- [ ] T012 [US1] Export startTransformPipeline from `functions/src/index.ts`

**Checkpoint**: User Story 1 complete - can create jobs via HTTP endpoint

---

## Phase 4: User Story 2 - System Executes Job to Completion (Priority: P1)

**Goal**: Cloud Task handler that executes job lifecycle (pending → running → completed)

**Independent Test**: Create a job in 'pending' status, invoke task handler → verify job transitions to 'running' then 'completed', session stays in sync

### Tests for User Story 2

- [ ] T013 [P] [US2] Create Cloud Task handler tests in `functions/src/tasks/transformPipelineJob.test.ts`

### Implementation for User Story 2

- [ ] T014 [US2] Implement transformPipelineJob Cloud Task handler in `functions/src/tasks/transformPipelineJob.ts`
  - Configure region, timeout (600s), retryConfig (maxAttempts: 0)
  - Extract payload (jobId, sessionId, projectId)
  - Fetch job, validate status is 'pending'
  - Update job status to 'running', set startedAt (FR-004)
  - Update session jobStatus to 'running' (FR-005)
- [ ] T015 [US2] Implement stub pipeline execution in `functions/src/tasks/transformPipelineJob.ts`
  - Simulate processing delay (2 seconds)
  - Update progress during processing (FR-015)
  - Create stub output data
- [ ] T016 [US2] Implement job completion flow in `functions/src/tasks/transformPipelineJob.ts`
  - Update job status to 'completed' (FR-006)
  - Set job output and completedAt
  - Update session jobStatus to 'completed' (FR-005)
- [ ] T017 [US2] Add updateJobOutput and updateJobComplete functions to `functions/src/lib/job.ts`
- [ ] T018 [US2] Export transformPipelineJob from `functions/src/index.ts`

**Checkpoint**: User Stories 1 AND 2 complete - full happy path works (create job → execute → complete)

---

## Phase 5: User Story 3 - System Handles Processing Failures (Priority: P2)

**Goal**: Error handling with sanitized client messages

**Independent Test**: Trigger a failure condition → verify job status is 'failed', error has code and sanitized message, session reflects failure

### Implementation for User Story 3

- [ ] T019 [US3] Add updateJobError function to `functions/src/lib/job.ts`
- [ ] T020 [US3] Implement error handling in `functions/src/tasks/transformPipelineJob.ts`
  - Wrap execution in try/catch
  - On error: update job status to 'failed' (FR-007)
  - Store error with code and sanitized message (FR-008)
  - Update session jobStatus to 'failed'
  - Log full error details server-side (SC-005)
- [ ] T021 [US3] Add sanitized error messages mapping (error code → client message) in `functions/src/lib/job.ts`
- [ ] T022 [US3] Update tests for error scenarios in `functions/src/tasks/transformPipelineJob.test.ts`

**Checkpoint**: User Story 3 complete - failures handled gracefully with sanitized messages

---

## Phase 6: User Story 4 - System Enforces Processing Timeout (Priority: P2)

**Goal**: 10-minute timeout with TIMEOUT error code

**Independent Test**: Verify Cloud Task configuration has 600s timeout; simulate timeout scenario → verify TIMEOUT error code

### Implementation for User Story 4

- [ ] T023 [US4] Verify timeoutSeconds: 600 in Cloud Task config in `functions/src/tasks/transformPipelineJob.ts` (already set in T014)
- [ ] T024 [US4] Add TIMEOUT error handling - when Cloud Tasks terminates, job may be stuck in 'running' (document this limitation)
- [ ] T025 [US4] Update job.test.ts with timeout error code scenario in `functions/src/lib/job.test.ts`

**Checkpoint**: User Story 4 complete - timeout configured and documented

---

## Phase 7: User Story 5 - Admin Monitors Job Status (Priority: P3)

**Goal**: Admins can read job documents for their projects

**Independent Test**: Verify Firestore security rules allow admin read on jobs collection

### Implementation for User Story 5

- [ ] T026 [US5] Add Firestore security rules for jobs collection in `firebase/firestore.rules`
  - Allow read for project admins
  - Deny write (server-only via Admin SDK)
- [ ] T027 [US5] Deploy security rules with `pnpm fb:deploy:rules`

**Checkpoint**: User Story 5 complete - admins can view job details

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T028 Run full build validation `pnpm functions:build`
- [ ] T029 Run all tests `cd functions && pnpm test`
- [ ] T030 [P] Verify HTTP endpoint with emulator using curl command from quickstart.md
- [ ] T031 [P] Verify Cloud Task execution with emulator
- [ ] T032 Code review: ensure no usage of legacy `lib/session.ts`
- [ ] T033 Validate all acceptance scenarios from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational (can run parallel to US1 but integration needs US1)
- **US3 (Phase 5)**: Depends on US2 (extends error handling)
- **US4 (Phase 6)**: Depends on US2 (extends timeout handling)
- **US5 (Phase 7)**: Depends on Foundational only (security rules)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

```
Foundational (T003-T007)
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
      US1 ──────────► US2           US5
   (T008-T012)     (T013-T018)   (T026-T027)
                      │
              ┌───────┴───────┐
              ▼               ▼
             US3             US4
          (T019-T022)     (T023-T025)
```

### Parallel Opportunities

**Phase 2 (Foundational)** - All can run in parallel:
- T003: session-v2.ts
- T004: job.ts
- T005: session-v2.test.ts
- T006: job.test.ts

**After Foundational**:
- US1 and US5 can run in parallel
- US1 tests (T008) can run parallel to US1 implementation start

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tasks in parallel:
Task: "Create session-v2 helpers in functions/src/lib/session-v2.ts"
Task: "Create job helpers in functions/src/lib/job.ts"
Task: "Create session-v2 tests in functions/src/lib/session-v2.test.ts"
Task: "Create job helpers tests in functions/src/lib/job.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T007)
3. Complete Phase 3: User Story 1 (T008-T012)
4. Complete Phase 4: User Story 2 (T013-T018)
5. **STOP and VALIDATE**: Test full happy path (create job → execute → complete)
6. Deploy to staging if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Can create jobs (partial value)
3. Add US2 → Full happy path works (MVP!)
4. Add US3 → Error handling (production-ready)
5. Add US4 → Timeout protection (reliability)
6. Add US5 → Admin visibility (operational)

---

## Notes

- Tests are included per constitution (Principle IV - Minimal Testing Strategy for critical paths)
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US1 and US2 are both P1 because they form the core flow together
- US3 and US4 extend US2's error/timeout handling
- US5 is independent (security rules only)
- Verify build after each phase before moving on
