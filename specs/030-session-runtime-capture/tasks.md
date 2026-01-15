# Tasks: Session & Runtime Foundation

**Input**: Design documents from `/specs/030-session-runtime-capture/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec - tests are omitted per constitution (Minimal Testing Strategy).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Base path**: `apps/clementine-app/src/`
- **Session domain**: `domains/session/`
- **Experience domain**: `domains/experience/`
- **Shared**: `shared/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create folder structure and query key foundations

- [X] T001 Create session queries folder at `src/domains/session/shared/queries/`
- [X] T002 [P] Create session hooks folder at `src/domains/session/shared/hooks/`
- [X] T003 [P] Create runtime folder structure at `src/domains/experience/runtime/hooks/`
- [X] T004 Create session query keys in `src/domains/session/shared/queries/session.query.ts`
- [X] T005 [P] Create session queries barrel export in `src/domains/session/shared/queries/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Critical**: No user story work can begin until this phase is complete. Session hooks and runtime engine are foundational to all stories.

### Session Hooks (FR-001 through FR-010)

- [X] T006 Implement useCreateSession hook in `src/domains/session/shared/hooks/useCreateSession.ts`
- [X] T007 [P] Implement useSubscribeSession hook in `src/domains/session/shared/hooks/useSubscribeSession.ts`
- [X] T008 [P] Implement useUpdateSessionProgress hook in `src/domains/session/shared/hooks/useUpdateSessionProgress.ts`
- [X] T009 [P] Implement useCompleteSession hook in `src/domains/session/shared/hooks/useCompleteSession.ts`
- [X] T010 [P] Implement useAbandonSession hook in `src/domains/session/shared/hooks/useAbandonSession.ts`
- [X] T011 Create session hooks barrel export in `src/domains/session/shared/hooks/index.ts`
- [X] T012 Update session domain barrel export in `src/domains/session/index.ts` to include hooks

### Runtime Engine (FR-011 through FR-018)

- [X] T013 Implement useExperienceRuntime hook in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [X] T014 Create runtime hooks barrel export in `src/domains/experience/runtime/hooks/index.ts`
- [X] T015 Create runtime domain barrel export in `src/domains/experience/runtime/index.ts`
- [X] T016 Update experience domain barrel export in `src/domains/experience/index.ts` to include runtime

### StepLayout Enhancement

- [X] T017 Update StepLayout component to support run mode navigation props (onSubmit, onBack, canGoBack, canProceed) in `src/domains/experience/steps/renderers/StepLayout.tsx`

**Checkpoint**: Foundation ready - session hooks and runtime engine operational. User story implementation can now begin.

---

## Phase 3: User Story 5 - Session Persistence (Priority: P2) [Foundational for US1]

**Goal**: Session documents are created and persisted when experience execution begins, tracking progress and answers.

**Independent Test**: Start a preview, progress through steps, verify session document updates in Firestore with correct answers and status.

**Note**: This story is prioritized before US1 because the preview modal depends on working session persistence.

### Implementation for User Story 5

- [X] T018 [US5] Add input schema for createSessionInput in `src/domains/session/shared/types/session-api.types.ts`
- [X] T019 [US5] Add input schema for updateSessionProgressInput in `src/domains/session/shared/types/session-api.types.ts`
- [X] T020 [US5] Add input schema for completeSessionInput in `src/domains/session/shared/types/session-api.types.ts`
- [X] T021 [US5] Verify session hooks integrate with Firestore path `/projects/{projectId}/sessions/{sessionId}`
- [X] T022 [US5] Add Firestore security rules for sessions in `firebase/firestore.rules`

**Checkpoint**: Session persistence operational - can create, update, and complete sessions via hooks.

---

## Phase 3.5: Architectural Refactor (AD-001 through AD-005)

**Purpose**: Refactor Phase 1-3 implementation to align with architectural decisions. This phase improves the foundation before adding more features.

**Blocking**: Should be completed before Phase 4 to ensure runtime engine uses correct patterns.

### Schema Updates (AD-002)

- [X] T023 [AD-002] Update session schema to use `answers: Answer[]` array in `src/domains/session/shared/schemas/session.schema.ts`
- [X] T024 [AD-002] Add `Answer` schema (stepId, stepType, value, answeredAt) in `src/domains/session/shared/schemas/session.schema.ts`
- [X] T025 [AD-002] Update session schema to use `capturedMedia: CapturedMedia[]` array in `src/domains/session/shared/schemas/session.schema.ts`
- [X] T026 [AD-002] Add `CapturedMedia` schema (stepId, assetId, url, createdAt) in `src/domains/session/shared/schemas/session.schema.ts`
- [X] T027 [AD-002] Add `result: SessionResult | null` field to session schema in `src/domains/session/shared/schemas/session.schema.ts`
- [X] T028 [AD-002] Add `workspaceId` field to session schema in `src/domains/session/shared/schemas/session.schema.ts`
- [X] T029 [AD-002] Rename `activeJobId` to `jobId` in session schema in `src/domains/session/shared/schemas/session.schema.ts`
- [X] T030 [AD-002] Remove deprecated `inputs` and `outputs` fields from session schema

### Session Hooks Refactor (AD-004, AD-005)

- [X] T031 [AD-005] Update useSubscribeSession to use `convertFirestoreData` utility in `src/domains/session/shared/hooks/useSubscribeSession.ts`
- [X] T032 [AD-004] Remove queryClient.invalidateQueries from useUpdateSessionProgress in `src/domains/session/shared/hooks/useUpdateSessionProgress.ts`
- [X] T033 [AD-004] Remove queryClient.invalidateQueries from useCompleteSession in `src/domains/session/shared/hooks/useCompleteSession.ts`
- [X] T034 [AD-004] Remove queryClient.invalidateQueries from useAbandonSession in `src/domains/session/shared/hooks/useAbandonSession.ts`
- [X] T035 [AD-002] Update useCreateSession to include workspaceId in session creation in `src/domains/session/shared/hooks/useCreateSession.ts`
- [X] T036 [AD-002] Update useUpdateSessionProgress to use answers/capturedMedia arrays in `src/domains/session/shared/hooks/useUpdateSessionProgress.ts`
- [X] T037 [AD-002] Update session-api.types.ts with new input schemas for answers/capturedMedia

### Step Validation (AD-003)

- [X] T038 [AD-003] Create step-validation.ts with `validateStepInput` function in `src/domains/experience/steps/registry/step-validation.ts`
- [X] T039 [AD-003] Implement validation for info step (always valid) in `src/domains/experience/steps/registry/step-validation.ts`
- [X] T040 [AD-003] Implement validation for input.scale step (value within min/max) in `src/domains/experience/steps/registry/step-validation.ts`
- [X] T041 [AD-003] Implement validation for input.yesNo step (boolean value) in `src/domains/experience/steps/registry/step-validation.ts`
- [X] T042 [AD-003] Implement validation for input.multiSelect step (valid options, min/max selection) in `src/domains/experience/steps/registry/step-validation.ts`
- [X] T043 [AD-003] Implement validation for input.shortText/longText steps (maxLength, required) in `src/domains/experience/steps/registry/step-validation.ts`
- [X] T044 [AD-003] Implement validation for capture/transform steps (placeholder - always valid) in `src/domains/experience/steps/registry/step-validation.ts`
- [X] T045 [AD-003] Update step registry barrel export to include validation in `src/domains/experience/steps/registry/index.ts`

### Zustand Store (AD-001)

- [X] T046 [AD-001] Create stores folder at `src/domains/experience/runtime/stores/`
- [X] T047 [AD-001] Create useSessionRuntimeStore with state fields in `src/domains/experience/runtime/stores/useSessionRuntimeStore.ts`
- [X] T048 [AD-001] Implement initFromSession action to hydrate store from session document
- [X] T049 [AD-001] Implement setAnswer action with answeredAt timestamp
- [X] T050 [AD-001] Implement setCapturedMedia action
- [X] T051 [AD-001] Implement navigation actions (goToStep, nextStep, previousStep)
- [X] T052 [AD-001] Implement syncToFirestore action using useUpdateSessionProgress
- [X] T053 [AD-001] Implement complete action with Firestore sync
- [X] T054 [AD-001] Create stores barrel export in `src/domains/experience/runtime/stores/index.ts`
- [X] T055 [AD-001] Update runtime barrel export to include stores in `src/domains/experience/runtime/index.ts`

### Runtime Hook Refactor

- [X] T056 Refactor useExperienceRuntime to use useSessionRuntimeStore in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [X] T057 Remove inline isValidInput function from useExperienceRuntime (use registry validation)
- [X] T058 Update useExperienceRuntime to sync only on meaningful events (not back navigation)
- [X] T059 Verify runtime hook tests pass with new architecture

**Checkpoint**: Architecture aligned with epic spec - Zustand store for runtime, structured answers array, validation in registry.

---

## ⚠️ IMPORTANT: ExperienceRuntime Container Pattern Refactoring Complete

**Before proceeding with Phase 4 and beyond**, review the refactored runtime implementation:

📁 **Review**: `apps/clementine-app/src/domains/experience/runtime/`

### What was implemented (see `experience-runtime-container.md`):

1. **Store renamed**: `useSessionRuntimeStore` → `useExperienceRuntimeStore` (in `stores/experienceRuntimeStore.ts`)
2. **Terminology aligned**: `result` → `resultMedia`, `SessionResult` → `SessionResultMedia`
3. **RuntimeState updated**: `inputs`/`outputs` → `answers`/`capturedMedia` with `resultMedia`
4. **Container pattern**: `ExperienceRuntime.tsx` container with reactive Firestore sync
5. **Public hook**: `useRuntime()` - curated API for children components
6. **Removed**: `useAbandonSession` hook, `useExperienceRuntime` hook (replaced by container pattern)

### Architecture:
```
ExperienceRuntime (Container)     → Orchestrates lifecycle, reactive Firestore sync
    └── useExperienceRuntimeStore → Pure state + synchronous actions
    └── useRuntime()              → Public hook for children (exposes store directly)
```

### Key patterns:
- **Store is pure**: No side effects, just state management
- **Container handles sync**: Subscribes to store changes, syncs reactively
- **Children use `useRuntime()`**: Call store actions, container reacts automatically

---

## Phase 4: User Story 2 - Runtime Engine Sequences Steps (Priority: P1)

**Goal**: Runtime engine manages step sequencing, navigation, and state synchronization.

**Independent Test**: Initialize runtime with experience and session, verify next/back/goToStep work correctly per sequencing rules.

### Implementation for User Story 2

**Note**: Most US2 functionality is now implemented in Phase 3.5 via the Zustand store refactor. These tasks verify and complete the integration.

- [ ] T060 [US2] Verify step sequencing works via Zustand store (steps execute 0 → n)
- [ ] T061 [US2] Verify canGoBack/canProceed computed correctly from store state
- [ ] T062 [US2] Verify next() triggers Firestore sync via store action
- [ ] T063 [US2] Verify back() updates store without Firestore sync
- [ ] T064 [US2] Verify goToStep() works for previously visited steps only
- [ ] T065 [US2] Verify setAnswer() records answer with timestamp and syncs
- [ ] T066 [US2] Verify completion flow triggers Firestore sync and callback
- [ ] T067 [US2] Verify zero steps edge case (immediate completion)

**Checkpoint**: Runtime engine operational - step sequencing, navigation, and session sync work correctly.

---

## Phase 5: User Story 4 - Info Step in Run Mode (Priority: P2)

**Goal**: Info steps display title, description, media and provide Continue button.

**Independent Test**: Render an info step in run mode, verify content displays and Continue advances to next step.

### Implementation for User Story 4

- [ ] T068 [P] [US4] Add run mode support to InfoStepRenderer in `src/domains/experience/steps/renderers/InfoStepRenderer.tsx`
- [ ] T069 [US4] Display title, description, and optional media in run mode in `src/domains/experience/steps/renderers/InfoStepRenderer.tsx`
- [ ] T070 [US4] Wire StepLayout with onSubmit, onBack, canGoBack props in `src/domains/experience/steps/renderers/InfoStepRenderer.tsx`

**Checkpoint**: Info steps work in run mode with navigation.

---

## Phase 6: User Story 3 - Input Step Renderers in Run Mode (Priority: P2)

**Goal**: All 5 input step types (Scale, Yes/No, Multi-Select, Short Text, Long Text) work interactively in run mode.

**Independent Test**: Render each input type in run mode, provide input, verify validation and Continue button state.

### Implementation for User Story 3

#### Input Scale (FR-021)

- [ ] T071 [P] [US3] Add run mode support to InputScaleRenderer in `src/domains/experience/steps/renderers/InputScaleRenderer.tsx`
- [ ] T072 [US3] Implement clickable scale buttons with selection state in `src/domains/experience/steps/renderers/InputScaleRenderer.tsx`
- [ ] T073 [US3] Wire InputScaleRenderer to use store setAnswer action

#### Input Yes/No (FR-022)

- [ ] T074 [P] [US3] Add run mode support to InputYesNoRenderer in `src/domains/experience/steps/renderers/InputYesNoRenderer.tsx`
- [ ] T075 [US3] Implement clickable Yes/No buttons with selection state in `src/domains/experience/steps/renderers/InputYesNoRenderer.tsx`

#### Input Multi-Select (FR-023)

- [ ] T076 [P] [US3] Add run mode support to InputMultiSelectRenderer in `src/domains/experience/steps/renderers/InputMultiSelectRenderer.tsx`
- [ ] T077 [US3] Implement checkbox/radio selection based on allowMultiple config in `src/domains/experience/steps/renderers/InputMultiSelectRenderer.tsx`
- [ ] T078 [US3] Wire InputMultiSelectRenderer to use store setAnswer action

#### Input Short Text (FR-024)

- [ ] T079 [P] [US3] Add run mode support to InputShortTextRenderer in `src/domains/experience/steps/renderers/InputShortTextRenderer.tsx`
- [ ] T080 [US3] Implement text input with character count in `src/domains/experience/steps/renderers/InputShortTextRenderer.tsx`
- [ ] T081 [US3] Wire InputShortTextRenderer to use store setAnswer action

#### Input Long Text (FR-025)

- [ ] T082 [P] [US3] Add run mode support to InputLongTextRenderer in `src/domains/experience/steps/renderers/InputLongTextRenderer.tsx`
- [ ] T083 [US3] Implement textarea with character count in `src/domains/experience/steps/renderers/InputLongTextRenderer.tsx`
- [ ] T084 [US3] Wire InputLongTextRenderer to use store setAnswer action

**Checkpoint**: All input step types work in run mode with validation.

---

## Phase 7: User Story 6 - Placeholder Renderers (Priority: P3)

**Goal**: Capture Photo and Transform Pipeline steps show placeholder UI with Continue button.

**Independent Test**: Include capture/transform steps in experience, verify placeholders display and Continue works.

### Implementation for User Story 6

- [ ] T085 [P] [US6] Add placeholder run mode to CapturePhotoRenderer in `src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx`
- [ ] T086 [US6] Display "Camera capture" message and instructions in `src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx`
- [ ] T087 [P] [US6] Add placeholder run mode to TransformPipelineRenderer in `src/domains/experience/steps/renderers/TransformPipelineRenderer.tsx`
- [ ] T088 [US6] Display "Processing..." placeholder message in `src/domains/experience/steps/renderers/TransformPipelineRenderer.tsx`

**Checkpoint**: Placeholder steps allow full experience flow testing.

---

## Phase 8: User Story 1 - Admin Preview Modal (Priority: P1)

**Goal**: Admin clicks Preview in editor, modal opens, experience runs with all configured steps.

**Independent Test**: Create experience with multiple step types, click Preview, walk through all steps, close modal.

### Implementation for User Story 1

- [ ] T089 [US1] Create PreviewModal component in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T090 [US1] Implement modal open/close with PreviewShell wrapper in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T091 [US1] Create session on preview open (mode='preview', configSource='draft') in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T092 [US1] Wire runtime engine to PreviewModal in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T093 [US1] Implement step progress indicator (Step X of Y) in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T094 [US1] Route to correct step renderer based on step type in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T095 [US1] Handle preview close (abandon session if incomplete) in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T096 [US1] Add Preview button to ExperienceDesignerPage in `src/domains/experience/designer/containers/ExperienceDesignerPage.tsx`
- [ ] T097 [US1] Wire Preview button to open PreviewModal with current experience in `src/domains/experience/designer/containers/ExperienceDesignerPage.tsx`
- [ ] T098 [US1] Update designer components barrel export in `src/domains/experience/designer/components/index.ts`

**Checkpoint**: Admin preview fully functional - can test entire experience from editor.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, edge cases, and documentation

- [ ] T099 Handle network errors in session updates with toast feedback
- [ ] T100 Add loading states during session creation and updates
- [ ] T101 Handle experience with missing step configuration gracefully
- [ ] T102 Verify mobile-first design (320px viewport) for all run mode renderers
- [ ] T103 Verify touch targets meet 44x44px minimum
- [ ] T104 Run `pnpm app:check` and fix any lint/format issues
- [ ] T105 Run `pnpm app:type-check` and fix any type errors
- [ ] T106 Manual testing: Complete full preview flow with all step types

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US5 Session Persistence (Phase 3)**: Depends on Foundational - provides data layer for other stories
- **Architectural Refactor (Phase 3.5)**: Depends on Phase 3 - aligns architecture with epic spec (AD-001 through AD-005)
- **US2 Runtime Engine (Phase 4)**: Depends on Phase 3.5 - uses refactored Zustand store
- **US4 Info Renderer (Phase 5)**: Can proceed after Phase 3.5
- **US3 Input Renderers (Phase 6)**: Can proceed in parallel with Phase 5 after Phase 3.5
- **US6 Placeholder Renderers (Phase 7)**: Can proceed in parallel with Phases 5-6 after Phase 3.5
- **US1 Preview Modal (Phase 8)**: Depends on US2, US5, and at least US4 (info renderer)
- **Polish (Phase 9)**: Depends on all previous phases

### User Story Dependencies

```
Setup (Phase 1)
    │
    ▼
Foundational (Phase 2) - Session Hooks + Runtime Engine
    │
    ▼
US5: Session Persistence (Phase 3)
    │
    ▼
Architectural Refactor (Phase 3.5) - Zustand store, schema alignment, validation
    │
    ├─────────────────────────────────────┐
    │                                     │
    ▼                                     ▼
US2: Runtime Engine (Phase 4)     US3, US4, US6: Renderers (Phases 5-7)
    │                             (can proceed in parallel)
    │
    ▼
US1: Preview Modal (Phase 8) - requires US2, US5, and renderers
    │
    ▼
Polish (Phase 9)
```

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T005 can run in parallel

**Phase 2 (Foundational)**:
- T007, T008, T009, T010 can run in parallel (different hook files)

**Phase 3.5 (Architectural Refactor)**:
- T023-T030 (Schema updates) should be done sequentially
- T031-T037 (Hook refactors) can run in parallel after schema updates
- T038-T045 (Step validation) can run in parallel
- T046-T055 (Zustand store) should be done sequentially

**Phases 5-7 (Renderers)** - All can run in parallel after Phase 3.5:
- T068 (Info), T071 (Scale), T074 (Yes/No), T076 (Multi-Select), T079 (Short Text), T082 (Long Text), T085 (Capture), T087 (Transform)

---

## Parallel Example: Renderer Phase

```bash
# Launch all renderer run mode tasks in parallel (after Phase 3.5 completes):
Task: "T068 [US4] Add run mode support to InfoStepRenderer"
Task: "T071 [US3] Add run mode support to InputScaleRenderer"
Task: "T074 [US3] Add run mode support to InputYesNoRenderer"
Task: "T076 [US3] Add run mode support to InputMultiSelectRenderer"
Task: "T079 [US3] Add run mode support to InputShortTextRenderer"
Task: "T082 [US3] Add run mode support to InputLongTextRenderer"
Task: "T085 [US6] Add placeholder run mode to CapturePhotoRenderer"
Task: "T087 [US6] Add placeholder run mode to TransformPipelineRenderer"
```

---

## Implementation Strategy

### MVP First (Preview with Info Steps Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (session hooks + runtime engine)
3. Complete Phase 3: US5 Session Persistence
4. Complete Phase 3.5: Architectural Refactor (Zustand store, schema alignment, validation)
5. Complete Phase 4: US2 Runtime Engine (verification with refactored architecture)
6. Complete Phase 5: US4 Info Step Renderer
7. Complete Phase 8: US1 Preview Modal (partial - info steps only)
8. **STOP and VALIDATE**: Test preview with info-only experience
9. Deploy/demo if ready for stakeholder feedback

### Full Implementation

1. Complete MVP above
2. Add Phase 6: US3 Input Renderers (all 5 types)
3. Add Phase 7: US6 Placeholder Renderers
4. Complete Phase 8: US1 Preview Modal (all step types)
5. Complete Phase 9: Polish
6. Final validation and deploy

### Incremental Delivery

Each phase adds value without breaking previous functionality:
- **After Phase 3.5**: Foundation aligned with epic spec (Zustand, structured arrays)
- **After Phase 4**: Runtime engine verified with correct architecture
- **After Phase 5**: Info steps work in preview
- **After Phase 6**: All input types work
- **After Phase 7**: Full experience flow testable
- **After Phase 8**: Admin preview complete
- **After Phase 9**: Production ready

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 106 |
| **Phase 1 (Setup)** | 5 (T001-T005) |
| **Phase 2 (Foundational)** | 12 (T006-T017) |
| **Phase 3 (US5 Session Persistence)** | 5 (T018-T022) |
| **Phase 3.5 (Architectural Refactor)** | 37 (T023-T059) |
| **Phase 4 (US2 Runtime Engine)** | 8 (T060-T067) |
| **Phase 5 (US4 Info Renderer)** | 3 (T068-T070) |
| **Phase 6 (US3 Input Renderers)** | 14 (T071-T084) |
| **Phase 7 (US6 Placeholder Renderers)** | 4 (T085-T088) |
| **Phase 8 (US1 Preview Modal)** | 10 (T089-T098) |
| **Phase 9 (Polish)** | 8 (T099-T106) |
| **Parallel Opportunities** | 15+ tasks marked [P] |
| **Suggested MVP** | Phases 1-5 + Phase 8 (info only) |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Run `pnpm app:check` frequently to catch issues early
- Firestore security rules (T022) should be deployed with first preview release
