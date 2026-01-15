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

- [ ] T001 Create session queries folder at `src/domains/session/shared/queries/`
- [ ] T002 [P] Create session hooks folder at `src/domains/session/shared/hooks/`
- [ ] T003 [P] Create runtime folder structure at `src/domains/experience/runtime/hooks/`
- [ ] T004 Create session query keys in `src/domains/session/shared/queries/session.query.ts`
- [ ] T005 [P] Create session queries barrel export in `src/domains/session/shared/queries/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Critical**: No user story work can begin until this phase is complete. Session hooks and runtime engine are foundational to all stories.

### Session Hooks (FR-001 through FR-010)

- [ ] T006 Implement useCreateSession hook in `src/domains/session/shared/hooks/useCreateSession.ts`
- [ ] T007 [P] Implement useSubscribeSession hook in `src/domains/session/shared/hooks/useSubscribeSession.ts`
- [ ] T008 [P] Implement useUpdateSessionProgress hook in `src/domains/session/shared/hooks/useUpdateSessionProgress.ts`
- [ ] T009 [P] Implement useCompleteSession hook in `src/domains/session/shared/hooks/useCompleteSession.ts`
- [ ] T010 [P] Implement useAbandonSession hook in `src/domains/session/shared/hooks/useAbandonSession.ts`
- [ ] T011 Create session hooks barrel export in `src/domains/session/shared/hooks/index.ts`
- [ ] T012 Update session domain barrel export in `src/domains/session/index.ts` to include hooks

### Runtime Engine (FR-011 through FR-018)

- [ ] T013 Implement useExperienceRuntime hook in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [ ] T014 Create runtime hooks barrel export in `src/domains/experience/runtime/hooks/index.ts`
- [ ] T015 Create runtime domain barrel export in `src/domains/experience/runtime/index.ts`
- [ ] T016 Update experience domain barrel export in `src/domains/experience/index.ts` to include runtime

### StepLayout Enhancement

- [ ] T017 Update StepLayout component to support run mode navigation props (onSubmit, onBack, canGoBack, canProceed) in `src/domains/experience/steps/renderers/StepLayout.tsx`

**Checkpoint**: Foundation ready - session hooks and runtime engine operational. User story implementation can now begin.

---

## Phase 3: User Story 5 - Session Persistence (Priority: P2) [Foundational for US1]

**Goal**: Session documents are created and persisted when experience execution begins, tracking progress and answers.

**Independent Test**: Start a preview, progress through steps, verify session document updates in Firestore with correct answers and status.

**Note**: This story is prioritized before US1 because the preview modal depends on working session persistence.

### Implementation for User Story 5

- [ ] T018 [US5] Add input schema for createSessionInput in `src/domains/session/shared/schemas/session.schema.ts`
- [ ] T019 [US5] Add input schema for updateSessionProgressInput in `src/domains/session/shared/schemas/session.schema.ts`
- [ ] T020 [US5] Add input schema for completeSessionInput in `src/domains/session/shared/schemas/session.schema.ts`
- [ ] T021 [US5] Verify session hooks integrate with Firestore path `/projects/{projectId}/sessions/{sessionId}`
- [ ] T022 [US5] Add Firestore security rules for sessions in `firebase/firestore.rules`

**Checkpoint**: Session persistence operational - can create, update, and complete sessions via hooks.

---

## Phase 4: User Story 2 - Runtime Engine Sequences Steps (Priority: P1)

**Goal**: Runtime engine manages step sequencing, navigation, and state synchronization.

**Independent Test**: Initialize runtime with experience and session, verify next/back/goToStep work correctly per sequencing rules.

### Implementation for User Story 2

- [ ] T023 [US2] Implement step sequencing logic (steps execute 0 → n) in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [ ] T024 [US2] Implement canGoBack calculation (false on step 0) in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [ ] T025 [US2] Implement canProceed calculation with step type validation in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [ ] T026 [US2] Implement next() with session sync in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [ ] T027 [US2] Implement back() with session sync in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [ ] T028 [US2] Implement goToStep() with bounds validation in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [ ] T029 [US2] Implement setInput() with debounced session sync in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [ ] T030 [US2] Implement completion flow (isComplete, onComplete callback) in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
- [ ] T031 [US2] Handle zero steps edge case (immediate completion) in `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`

**Checkpoint**: Runtime engine operational - step sequencing, navigation, and session sync work correctly.

---

## Phase 5: User Story 4 - Info Step in Run Mode (Priority: P2)

**Goal**: Info steps display title, description, media and provide Continue button.

**Independent Test**: Render an info step in run mode, verify content displays and Continue advances to next step.

### Implementation for User Story 4

- [ ] T032 [P] [US4] Add run mode support to InfoStepRenderer in `src/domains/experience/steps/renderers/InfoStepRenderer.tsx`
- [ ] T033 [US4] Display title, description, and optional media in run mode in `src/domains/experience/steps/renderers/InfoStepRenderer.tsx`
- [ ] T034 [US4] Wire StepLayout with onSubmit, onBack, canGoBack props in `src/domains/experience/steps/renderers/InfoStepRenderer.tsx`

**Checkpoint**: Info steps work in run mode with navigation.

---

## Phase 6: User Story 3 - Input Step Renderers in Run Mode (Priority: P2)

**Goal**: All 5 input step types (Scale, Yes/No, Multi-Select, Short Text, Long Text) work interactively in run mode.

**Independent Test**: Render each input type in run mode, provide input, verify validation and Continue button state.

### Implementation for User Story 3

#### Input Scale (FR-021)

- [ ] T035 [P] [US3] Add run mode support to InputScaleRenderer in `src/domains/experience/steps/renderers/InputScaleRenderer.tsx`
- [ ] T036 [US3] Implement clickable scale buttons with selection state in `src/domains/experience/steps/renderers/InputScaleRenderer.tsx`
- [ ] T037 [US3] Implement scale validation (value within min/max) in `src/domains/experience/steps/renderers/InputScaleRenderer.tsx`

#### Input Yes/No (FR-022)

- [ ] T038 [P] [US3] Add run mode support to InputYesNoRenderer in `src/domains/experience/steps/renderers/InputYesNoRenderer.tsx`
- [ ] T039 [US3] Implement clickable Yes/No buttons with selection state in `src/domains/experience/steps/renderers/InputYesNoRenderer.tsx`

#### Input Multi-Select (FR-023)

- [ ] T040 [P] [US3] Add run mode support to InputMultiSelectRenderer in `src/domains/experience/steps/renderers/InputMultiSelectRenderer.tsx`
- [ ] T041 [US3] Implement checkbox/radio selection based on allowMultiple config in `src/domains/experience/steps/renderers/InputMultiSelectRenderer.tsx`
- [ ] T042 [US3] Implement min/max selection validation in `src/domains/experience/steps/renderers/InputMultiSelectRenderer.tsx`

#### Input Short Text (FR-024)

- [ ] T043 [P] [US3] Add run mode support to InputShortTextRenderer in `src/domains/experience/steps/renderers/InputShortTextRenderer.tsx`
- [ ] T044 [US3] Implement text input with character count in `src/domains/experience/steps/renderers/InputShortTextRenderer.tsx`
- [ ] T045 [US3] Implement maxLength validation in `src/domains/experience/steps/renderers/InputShortTextRenderer.tsx`

#### Input Long Text (FR-025)

- [ ] T046 [P] [US3] Add run mode support to InputLongTextRenderer in `src/domains/experience/steps/renderers/InputLongTextRenderer.tsx`
- [ ] T047 [US3] Implement textarea with character count in `src/domains/experience/steps/renderers/InputLongTextRenderer.tsx`
- [ ] T048 [US3] Implement maxLength validation in `src/domains/experience/steps/renderers/InputLongTextRenderer.tsx`

**Checkpoint**: All input step types work in run mode with validation.

---

## Phase 7: User Story 6 - Placeholder Renderers (Priority: P3)

**Goal**: Capture Photo and Transform Pipeline steps show placeholder UI with Continue button.

**Independent Test**: Include capture/transform steps in experience, verify placeholders display and Continue works.

### Implementation for User Story 6

- [ ] T049 [P] [US6] Add placeholder run mode to CapturePhotoRenderer in `src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx`
- [ ] T050 [US6] Display "Camera capture" message and instructions in `src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx`
- [ ] T051 [P] [US6] Add placeholder run mode to TransformPipelineRenderer in `src/domains/experience/steps/renderers/TransformPipelineRenderer.tsx`
- [ ] T052 [US6] Display "Processing..." placeholder message in `src/domains/experience/steps/renderers/TransformPipelineRenderer.tsx`

**Checkpoint**: Placeholder steps allow full experience flow testing.

---

## Phase 8: User Story 1 - Admin Preview Modal (Priority: P1)

**Goal**: Admin clicks Preview in editor, modal opens, experience runs with all configured steps.

**Independent Test**: Create experience with multiple step types, click Preview, walk through all steps, close modal.

### Implementation for User Story 1

- [ ] T053 [US1] Create PreviewModal component in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T054 [US1] Implement modal open/close with PreviewShell wrapper in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T055 [US1] Create session on preview open (mode='preview', configSource='draft') in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T056 [US1] Wire runtime engine to PreviewModal in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T057 [US1] Implement step progress indicator (Step X of Y) in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T058 [US1] Route to correct step renderer based on step type in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T059 [US1] Handle preview close (abandon session if incomplete) in `src/domains/experience/designer/components/PreviewModal.tsx`
- [ ] T060 [US1] Add Preview button to ExperienceDesignerPage in `src/domains/experience/designer/containers/ExperienceDesignerPage.tsx`
- [ ] T061 [US1] Wire Preview button to open PreviewModal with current experience in `src/domains/experience/designer/containers/ExperienceDesignerPage.tsx`
- [ ] T062 [US1] Update designer components barrel export in `src/domains/experience/designer/components/index.ts`

**Checkpoint**: Admin preview fully functional - can test entire experience from editor.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, edge cases, and documentation

- [ ] T063 Handle network errors in session updates with toast feedback
- [ ] T064 Add loading states during session creation and updates
- [ ] T065 Handle experience with missing step configuration gracefully
- [ ] T066 Verify mobile-first design (320px viewport) for all run mode renderers
- [ ] T067 Verify touch targets meet 44x44px minimum
- [ ] T068 Run `pnpm app:check` and fix any lint/format issues
- [ ] T069 Run `pnpm app:type-check` and fix any type errors
- [ ] T070 Manual testing: Complete full preview flow with all step types

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US5 Session Persistence (Phase 3)**: Depends on Foundational - provides data layer for other stories
- **US2 Runtime Engine (Phase 4)**: Depends on US5 - uses session hooks
- **US3, US4, US6 Renderers (Phases 5-7)**: Can proceed in parallel after Phase 2
- **US1 Preview Modal (Phase 8)**: Depends on US2, US5, and at least US4 (info renderer)
- **Polish (Phase 9)**: Depends on all previous phases

### User Story Dependencies

```
Setup (Phase 1)
    │
    ▼
Foundational (Phase 2) - Session Hooks + Runtime Engine
    │
    ├─────────────────────────────────────┐
    │                                     │
    ▼                                     ▼
US5: Session Persistence          US3, US4, US6: Renderers
    │                             (can proceed in parallel)
    ▼
US2: Runtime Engine
    │
    ▼
US1: Preview Modal (requires US2, US5, and renderers)
    │
    ▼
Polish (Phase 9)
```

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T005 can run in parallel

**Phase 2 (Foundational)**:
- T007, T008, T009, T010 can run in parallel (different hook files)

**Phase 5-7 (Renderers)** - All can run in parallel:
- T032 (Info), T035 (Scale), T038 (Yes/No), T040 (Multi-Select), T043 (Short Text), T046 (Long Text), T049 (Capture), T051 (Transform)

---

## Parallel Example: Renderer Phase

```bash
# Launch all renderer run mode tasks in parallel (after Foundational completes):
Task: "[US4] Add run mode support to InfoStepRenderer"
Task: "[US3] Add run mode support to InputScaleRenderer"
Task: "[US3] Add run mode support to InputYesNoRenderer"
Task: "[US3] Add run mode support to InputMultiSelectRenderer"
Task: "[US3] Add run mode support to InputShortTextRenderer"
Task: "[US3] Add run mode support to InputLongTextRenderer"
Task: "[US6] Add placeholder run mode to CapturePhotoRenderer"
Task: "[US6] Add placeholder run mode to TransformPipelineRenderer"
```

---

## Implementation Strategy

### MVP First (Preview with Info Steps Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (session hooks + runtime engine)
3. Complete Phase 3: US5 Session Persistence
4. Complete Phase 4: US2 Runtime Engine
5. Complete Phase 5: US4 Info Step Renderer
6. Complete Phase 8: US1 Preview Modal (partial - info steps only)
7. **STOP and VALIDATE**: Test preview with info-only experience
8. Deploy/demo if ready for stakeholder feedback

### Full Implementation

1. Complete MVP above
2. Add Phase 6: US3 Input Renderers (all 5 types)
3. Add Phase 7: US6 Placeholder Renderers
4. Complete Phase 8: US1 Preview Modal (all step types)
5. Complete Phase 9: Polish
6. Final validation and deploy

### Incremental Delivery

Each phase adds value without breaking previous functionality:
- **After Phase 4**: Runtime engine testable in isolation
- **After Phase 5**: Info steps work in preview
- **After Phase 6**: All input types work
- **After Phase 7**: Full experience flow testable
- **After Phase 8**: Admin preview complete
- **After Phase 9**: Production ready

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 70 |
| **Setup Tasks** | 5 |
| **Foundational Tasks** | 12 |
| **US1 Tasks** | 10 |
| **US2 Tasks** | 9 |
| **US3 Tasks** | 14 |
| **US4 Tasks** | 3 |
| **US5 Tasks** | 5 |
| **US6 Tasks** | 4 |
| **Polish Tasks** | 8 |
| **Parallel Opportunities** | 15 tasks marked [P] |
| **Suggested MVP** | Phases 1-5 + Phase 8 (info only) |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Run `pnpm app:check` frequently to catch issues early
- Firestore security rules (T022) should be deployed with first preview release
