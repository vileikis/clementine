# Tasks: Transform Pipeline Trigger on Experience Completion

**Input**: Design documents from `/specs/053-transform-trigger/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested - skipping test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `apps/clementine-app/src/`
- **Backend**: `functions/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Firebase client configuration

- [ ] T001 [P] Add Firebase Functions to client in `apps/clementine-app/src/integrations/firebase/client.ts` - import `getFunctions` and export `functions` instance with 'europe-west1' region
- [ ] T002 [P] Update transform-pipeline schema to remove stepId in `functions/src/schemas/transform-pipeline.schema.ts` - keep only projectId and sessionId

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create callable function in `functions/src/callable/startTransformPipeline.ts` - convert from onRequest to onCall, use HttpsError for errors, validate with Zod schema
- [ ] T004 Export callable function from `functions/src/index.ts` - add export for startTransformPipeline from callable directory
- [ ] T005 [P] Create hasTransformConfig helper in `apps/clementine-app/src/domains/experience/shared/utils/hasTransformConfig.ts` - check if experience.config.transform?.nodes?.length > 0
- [ ] T006 [P] Create useStartTransformPipeline hook in `apps/clementine-app/src/domains/experience/transform/hooks/useStartTransformPipeline.ts` - use httpsCallable with fire-and-forget pattern, log errors to Sentry
- [ ] T007 [P] Create barrel export in `apps/clementine-app/src/domains/experience/transform/hooks/index.ts` - export useStartTransformPipeline
- [ ] T008 [P] Create domain barrel export in `apps/clementine-app/src/domains/experience/transform/index.ts` - re-export from hooks

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Guest Completes Main Experience with Transform (Priority: P1) 🎯 MVP

**Goal**: Guest completes experience → transform triggers → SharePage shows real-time job status

**Independent Test**: Complete an experience with transform config, verify SharePage shows loading → ready transition based on session.jobStatus

### Implementation for User Story 1

- [ ] T009 [US1] Modify ExperiencePage to trigger transform in `apps/clementine-app/src/domains/guest/containers/ExperiencePage.tsx` - import useStartTransformPipeline and hasTransformConfig, call in handleExperienceComplete after markExperienceComplete and before navigation
- [ ] T010 [US1] Modify SharePage to subscribe to session in `apps/clementine-app/src/domains/guest/containers/SharePage.tsx` - use useSubscribeSession(project.id, mainSessionId), derive isJobInProgress/isJobCompleted/isJobFailed from session.jobStatus
- [ ] T011 [US1] Update SharePage rendering logic in `apps/clementine-app/src/domains/guest/containers/SharePage.tsx` - show ShareLoadingRenderer when job in progress, ShareReadyRenderer when completed or null, error state when failed

**Checkpoint**: User Story 1 complete - guest journey with transform trigger and SharePage job status works

---

## Phase 4: User Story 2 - Preview Mode Shows Transform Job Status (Priority: P2)

**Goal**: Preview modal shows transform job progress with friendly status messages after completion

**Independent Test**: Open preview modal, complete steps, verify JobStatusDisplay shows loading/completion states

### Implementation for User Story 2

- [ ] T012 [P] [US2] Create JobStatusDisplay component in `apps/clementine-app/src/domains/experience/preview/components/JobStatusDisplay.tsx` - show spinner with status messages for pending/running, success icon for completed, error icon for failed
- [ ] T013 [P] [US2] Export JobStatusDisplay from `apps/clementine-app/src/domains/experience/preview/components/index.ts` - add export statement
- [ ] T014 [US2] Modify ExperiencePreviewModal in `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx` - import useStartTransformPipeline, hasTransformConfig, JobStatusDisplay; add showJobStatus state; modify handleComplete to trigger transform and show job status view instead of closing

**Checkpoint**: User Story 2 complete - preview modal shows transform job status

---

## Phase 5: User Story 3 - Pregate and Preshare Skip Transform (Priority: P3)

**Goal**: Ensure pregate/preshare experiences never trigger transform

**Independent Test**: Complete pregate/preshare experiences, verify no callable is invoked and navigation proceeds normally

### Implementation for User Story 3

- [ ] T015 [US3] Verify PregatePage does NOT trigger transform in `apps/clementine-app/src/domains/guest/containers/PregatePage.tsx` - confirm no useStartTransformPipeline import or call exists (should already be the case - no code changes needed, just verification)
- [ ] T016 [US3] Verify PresharePage does NOT trigger transform in `apps/clementine-app/src/domains/guest/containers/PresharePage.tsx` - confirm no useStartTransformPipeline import or call exists (should already be the case - no code changes needed, just verification)

**Checkpoint**: User Story 3 complete - pregate/preshare correctly skip transform

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and final checks

- [ ] T017 Run frontend validation with `pnpm app:check` from apps/clementine-app
- [ ] T018 Run frontend type-check with `pnpm app:type-check` from apps/clementine-app
- [ ] T019 Build backend functions with `pnpm build` from functions/
- [ ] T020 Manual testing: Complete experience with transform → verify SharePage job status flow
- [ ] T021 Manual testing: Preview experience with transform → verify JobStatusDisplay in modal

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US1 and US2 can run in parallel if needed (different files)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Verification only, no code changes

### Within Each User Story

- T009 must complete before T010-T011 (ExperiencePage trigger before SharePage consumption)
- T012-T013 can run in parallel (component + export)
- T014 depends on T012-T013 (modal uses JobStatusDisplay)

### Parallel Opportunities

**Phase 1 (Setup):**
- T001 and T002 can run in parallel (different files)

**Phase 2 (Foundational):**
- T005, T006, T007, T008 can run in parallel (different files)
- T003-T004 should be done together (backend function + export)

**Phase 3-5 (User Stories):**
- US1 and US2 can run in parallel by different developers
- US3 is verification only - can be done anytime after Foundational

---

## Parallel Example: Foundational Phase

```bash
# Launch foundational tasks in parallel:
Task: "Create hasTransformConfig helper in apps/clementine-app/src/domains/experience/shared/utils/hasTransformConfig.ts"
Task: "Create useStartTransformPipeline hook in apps/clementine-app/src/domains/experience/transform/hooks/useStartTransformPipeline.ts"
Task: "Create barrel export in apps/clementine-app/src/domains/experience/transform/hooks/index.ts"
Task: "Create domain barrel export in apps/clementine-app/src/domains/experience/transform/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T008)
3. Complete Phase 3: User Story 1 (T009-T011)
4. **STOP and VALIDATE**: Test guest journey with transform trigger
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test guest journey → Deploy (MVP!)
3. Add User Story 2 → Test preview modal → Deploy
4. Add User Story 3 → Verify pregate/preshare → Deploy
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US3 requires no code changes - just verification that pregate/preshare don't import the hook
- Fire-and-forget pattern: callable invocation does not await response
- Mock media URL continues in SharePage until separate feature integrates actual job output
- Commit after each task or logical group
