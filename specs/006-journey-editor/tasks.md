# Tasks: Journey Editor

**Input**: Design documents from `/specs/006-journey-editor/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/steps-api.md, research.md, quickstart.md

**Tests**: Not explicitly requested - tests are omitted per minimal testing strategy.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US7)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` at repository root
- Features in `web/src/features/`
- Shared components in `web/src/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared building blocks

- [X] T001 [P] Create EventThemeProvider context in `web/src/components/providers/EventThemeProvider.tsx`
- [X] T002 [P] Create step-primitives barrel export in `web/src/components/step-primitives/index.ts`
- [X] T003 [P] Create StepLayout primitive in `web/src/components/step-primitives/StepLayout.tsx`
- [X] T004 [P] Create ActionButton primitive in `web/src/components/step-primitives/ActionButton.tsx`
- [X] T005 [P] Create OptionButton primitive in `web/src/components/step-primitives/OptionButton.tsx`
- [X] T006 [P] Create ScaleButton primitive in `web/src/components/step-primitives/ScaleButton.tsx`
- [X] T007 [P] Create TextInput primitive in `web/src/components/step-primitives/TextInput.tsx`
- [X] T008 [P] Create TextArea primitive in `web/src/components/step-primitives/TextArea.tsx`

---

## Phase 2: Foundational (Steps Data Layer)

**Purpose**: Core data infrastructure for steps - MUST complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create step type definitions in `web/src/features/steps/types/step.types.ts`
- [X] T010 Create step constants in `web/src/features/steps/constants.ts`
- [X] T011 Create Zod schemas for all 11 step types in `web/src/features/steps/schemas/step.schemas.ts`
- [X] T012 Create steps repository in `web/src/features/steps/repositories/steps.repository.ts`
- [X] T013 Implement listStepsAction server action in `web/src/features/steps/actions/steps.ts`
- [X] T014 Implement getStepAction server action in `web/src/features/steps/actions/steps.ts`
- [X] T015 Implement createStepAction server action in `web/src/features/steps/actions/steps.ts`
- [X] T016 Implement updateStepAction server action in `web/src/features/steps/actions/steps.ts`
- [X] T017 Implement deleteStepAction server action in `web/src/features/steps/actions/steps.ts`
- [X] T018 Implement reorderStepsAction server action in `web/src/features/steps/actions/steps.ts`
- [X] T019 Create steps feature barrel export in `web/src/features/steps/index.ts`

**Checkpoint**: Steps data layer ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create and Configure Journey Steps (Priority: P1) 🎯 MVP

**Goal**: Enable event creators to add, order, and configure steps in journeys

**Independent Test**: Create a journey, add 3+ steps of different types, configure properties, verify step list displays correctly

### Implementation for User Story 1

- [X] T020 [P] [US1] Create useSteps hook for real-time subscription in `web/src/features/journeys/hooks/useSteps.ts`
- [X] T021 [P] [US1] Create useStepMutations hook in `web/src/features/journeys/hooks/useStepMutations.ts`
- [X] T022 [P] [US1] Create useSelectedStep hook for URL sync in `web/src/features/journeys/hooks/useSelectedStep.ts`
- [X] T023 [US1] Create StepTypeSelector dialog in `web/src/features/journeys/components/editor/StepTypeSelector.tsx`
- [X] T024 [US1] Create StepListItem component in `web/src/features/journeys/components/editor/StepListItem.tsx`
- [X] T025 [US1] Create StepList component with dnd-kit in `web/src/features/journeys/components/editor/StepList.tsx`
- [X] T026 [P] [US1] Create BaseStepEditor for common fields in `web/src/features/steps/components/editors/BaseStepEditor.tsx`
- [X] T027 [P] [US1] Create InfoStepEditor in `web/src/features/steps/components/editors/InfoStepEditor.tsx`
- [X] T028 [US1] Create step editors barrel export in `web/src/features/steps/components/editors/index.ts`
- [X] T029 [US1] Create StepEditor component (form router) in `web/src/features/journeys/components/editor/StepEditor.tsx`
- [X] T030 [US1] Create JourneyEditorHeader in `web/src/features/journeys/components/editor/JourneyEditorHeader.tsx`
- [X] T031 [US1] Create JourneyEditor 3-panel layout in `web/src/features/journeys/components/editor/JourneyEditor.tsx`
- [X] T032 [US1] Create journey editor page in `web/src/app/events/[eventId]/design/journeys/[journeyId]/page.tsx`

**Checkpoint**: User Story 1 complete - can add, configure, and reorder steps

---

## Phase 4: User Story 2 - Preview Step with Event Theme (Priority: P1)

**Goal**: Show live preview of selected step with event's theme applied

**Independent Test**: Select different step types and verify preview displays with theme (background, text, buttons)

### Implementation for User Story 2

- [X] T033 [P] [US2] Create SimulatorScreen in `web/src/features/steps/components/preview/SimulatorScreen.tsx`
- [X] T034 [P] [US2] Create InfoStep preview in `web/src/features/steps/components/preview/steps/InfoStep.tsx`
- [X] T035 [P] [US2] Create ShortTextStep preview in `web/src/features/steps/components/preview/steps/ShortTextStep.tsx`
- [X] T036 [P] [US2] Create LongTextStep preview in `web/src/features/steps/components/preview/steps/LongTextStep.tsx`
- [X] T037 [P] [US2] Create MultipleChoiceStep preview in `web/src/features/steps/components/preview/steps/MultipleChoiceStep.tsx`
- [X] T038 [P] [US2] Create YesNoStep preview in `web/src/features/steps/components/preview/steps/YesNoStep.tsx`
- [X] T039 [P] [US2] Create OpinionScaleStep preview in `web/src/features/steps/components/preview/steps/OpinionScaleStep.tsx`
- [X] T040 [P] [US2] Create EmailStep preview in `web/src/features/steps/components/preview/steps/EmailStep.tsx`
- [X] T041 [US2] Create step previews barrel export in `web/src/features/steps/components/preview/steps/index.ts`
- [X] T042 [US2] Create preview barrel export in `web/src/features/steps/components/preview/index.ts`
- [X] T043 [US2] Create StepPreview component in `web/src/features/journeys/components/editor/StepPreview.tsx`
- [X] T044 [US2] Integrate StepPreview into JourneyEditor middle panel

**Checkpoint**: User Story 2 complete - steps preview with theme applied

---

## Phase 5: User Story 3 - Navigate to Journey Editor (Priority: P2)

**Goal**: URL routing with deep linking to specific steps

**Independent Test**: Access URLs directly, verify correct journey/step loaded

### Implementation for User Story 3

- [X] T045 [US3] Update useSelectedStep hook for bidirectional URL sync in `web/src/features/journeys/hooks/useSelectedStep.ts`
- [X] T046 [US3] Add auto-select first step logic when no stepId in URL
- [X] T047 [US3] Add URL update on step selection in StepList
- [X] T048 [US3] Handle deleted step - auto-select next/previous

**Checkpoint**: User Story 3 complete - deep linking works correctly

---

## Phase 6: User Story 4 - Configure Experience Picker Step (Priority: P2)

**Goal**: Configure experience picker with layout options and experience selection

**Independent Test**: Add Experience Picker step, configure layout/experiences, verify preview

### Implementation for User Story 4

- [X] T049 [P] [US4] Create ExperiencePickerEditor in `web/src/features/steps/components/editors/ExperiencePickerEditor.tsx`
- [X] T050 [P] [US4] Create ExperiencePickerStep preview in `web/src/features/steps/components/preview/steps/ExperiencePickerStep.tsx`
- [X] T051 [US4] Add ExperiencePickerEditor to step editors barrel export
- [X] T052 [US4] Add ExperiencePickerStep to step previews barrel export
- [X] T053 [US4] Update StepEditor to route to ExperiencePickerEditor

**Checkpoint**: User Story 4 complete - experience picker fully configurable

---

## Phase 7: User Story 5 - Configure Capture Step (Priority: P2)

**Goal**: Configure capture step with source variable and fallback experience

**Independent Test**: Add Capture step, set source/fallback, verify preview shows camera UI

### Implementation for User Story 5

- [X] T054 [P] [US5] Create CaptureStepEditor in `web/src/features/steps/components/editors/CaptureStepEditor.tsx`
- [X] T055 [P] [US5] Create CaptureStep preview in `web/src/features/steps/components/preview/steps/CaptureStep.tsx`
- [X] T056 [US5] Add CaptureStepEditor to step editors barrel export
- [X] T057 [US5] Add CaptureStep to step previews barrel export
- [X] T058 [US5] Update StepEditor to route to CaptureStepEditor

**Checkpoint**: User Story 5 complete - capture step fully configurable

---

## Phase 8: User Story 6 - Configure Input Steps (Priority: P3)

**Goal**: Configure all input step types (short text, long text, multiple choice, yes/no, opinion scale, email)

**Independent Test**: Add each input step type, configure options, verify preview

### Implementation for User Story 6

- [X] T059 [P] [US6] Create ShortTextEditor in `web/src/features/steps/components/editors/ShortTextEditor.tsx`
- [X] T060 [P] [US6] Create LongTextEditor in `web/src/features/steps/components/editors/LongTextEditor.tsx`
- [X] T061 [P] [US6] Create MultipleChoiceEditor in `web/src/features/steps/components/editors/MultipleChoiceEditor.tsx`
- [X] T062 [P] [US6] Create YesNoEditor in `web/src/features/steps/components/editors/YesNoEditor.tsx`
- [X] T063 [P] [US6] Create OpinionScaleEditor in `web/src/features/steps/components/editors/OpinionScaleEditor.tsx`
- [X] T064 [P] [US6] Create EmailEditor in `web/src/features/steps/components/editors/EmailEditor.tsx`
- [X] T065 [US6] Add all input editors to step editors barrel export
- [X] T066 [US6] Update StepEditor to route to all input editors

**Checkpoint**: User Story 6 complete - all input steps fully configurable

---

## Phase 9: User Story 7 - Configure Completion Steps (Priority: P3)

**Goal**: Configure processing and reward steps with messages and sharing options

**Independent Test**: Add Processing/Reward steps, configure options, verify preview

### Implementation for User Story 7

- [ ] T067 [P] [US7] Create ProcessingStepEditor in `web/src/features/steps/components/editors/ProcessingStepEditor.tsx`
- [ ] T068 [P] [US7] Create RewardStepEditor in `web/src/features/steps/components/editors/RewardStepEditor.tsx`
- [ ] T069 [P] [US7] Create ProcessingStep preview in `web/src/features/steps/components/preview/steps/ProcessingStep.tsx`
- [ ] T070 [P] [US7] Create RewardStep preview in `web/src/features/steps/components/preview/steps/RewardStep.tsx`
- [ ] T071 [US7] Add completion editors to step editors barrel export
- [ ] T072 [US7] Add completion previews to step previews barrel export
- [ ] T073 [US7] Update StepEditor to route to completion editors

**Checkpoint**: User Story 7 complete - all completion steps fully configurable

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T074 [P] Add empty state for journey with no steps in StepList
- [ ] T075 [P] Add keyboard shortcuts (Cmd+S save, arrows navigate, Delete remove)
- [ ] T076 [P] Add duplicateStepAction to `web/src/features/steps/actions/steps.ts`
- [ ] T077 [P] Add duplicate step functionality to StepList context menu
- [ ] T078 [P] Handle edge case: step references deleted experience (warning indicator)
- [ ] T079 [P] Handle edge case: event has no experiences (warning in picker/capture)
- [ ] T080 Ensure responsive layout works on mobile (panels stack vertically)
- [ ] T081 Ensure touch targets are ≥44x44px on mobile

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T082 Run `pnpm lint` and fix all errors/warnings
- [ ] T083 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T084 Run `pnpm test` and ensure all tests pass
- [ ] T085 Verify feature in local dev server (`pnpm dev`)
- [ ] T086 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational completion
  - US1 and US2 are both P1 priority - can proceed in parallel after Foundational
  - US3, US4, US5 are P2 priority - can start after US1+US2 or in parallel with team capacity
  - US6, US7 are P3 priority - can start after P2 stories or in parallel
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core step CRUD - No dependencies on other stories
- **User Story 2 (P1)**: Preview with theme - Can parallelize with US1 after Foundational
- **User Story 3 (P2)**: URL deep linking - Depends on US1 (step selection)
- **User Story 4 (P2)**: Experience Picker - Depends on US1 (step creation) + US2 (preview)
- **User Story 5 (P2)**: Capture Step - Depends on US1 + US2, can parallel with US4
- **User Story 6 (P3)**: Input Steps - Depends on US1 + US2, can parallel with US4/US5
- **User Story 7 (P3)**: Completion Steps - Depends on US1 + US2, can parallel with US6

### Within Each User Story

- Hooks before components
- Editors and previews can be parallel (different files)
- Barrel exports after individual components
- Integration tasks last

### Parallel Opportunities

**Phase 1 (8 parallel tasks)**:
- All step-primitives can be built in parallel
- EventThemeProvider independent

**Phase 2 (sequential)**:
- Types → Constants → Schemas → Repository → Actions
- Actions depend on schemas and repository

**Phase 3 (US1)**:
- T020, T021, T022 hooks in parallel
- T026, T027 editors in parallel
- Layout components sequential

**Phase 4 (US2)**:
- T033-T040 all preview components in parallel (8 tasks)
- Then barrel exports and integration

**Phase 6-9 (US4-7)**:
- Editors and previews for each step type in parallel

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all primitives together:
Task: "Create StepLayout primitive in web/src/components/step-primitives/StepLayout.tsx"
Task: "Create ActionButton primitive in web/src/components/step-primitives/ActionButton.tsx"
Task: "Create OptionButton primitive in web/src/components/step-primitives/OptionButton.tsx"
Task: "Create ScaleButton primitive in web/src/components/step-primitives/ScaleButton.tsx"
Task: "Create TextInput primitive in web/src/components/step-primitives/TextInput.tsx"
Task: "Create TextArea primitive in web/src/components/step-primitives/TextArea.tsx"
Task: "Create EventThemeProvider context in web/src/components/providers/EventThemeProvider.tsx"
```

## Parallel Example: Phase 4 Previews

```bash
# Launch all step previews together:
Task: "Create InfoStep preview in web/src/features/steps/components/preview/steps/InfoStep.tsx"
Task: "Create ShortTextStep preview in web/src/features/steps/components/preview/steps/ShortTextStep.tsx"
Task: "Create LongTextStep preview in web/src/features/steps/components/preview/steps/LongTextStep.tsx"
Task: "Create MultipleChoiceStep preview in web/src/features/steps/components/preview/steps/MultipleChoiceStep.tsx"
Task: "Create YesNoStep preview in web/src/features/steps/components/preview/steps/YesNoStep.tsx"
Task: "Create OpinionScaleStep preview in web/src/features/steps/components/preview/steps/OpinionScaleStep.tsx"
Task: "Create EmailStep preview in web/src/features/steps/components/preview/steps/EmailStep.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (primitives + theme provider)
2. Complete Phase 2: Foundational (types, schemas, actions)
3. Complete Phase 3: User Story 1 (add/configure/reorder steps)
4. Complete Phase 4: User Story 2 (preview with theme)
5. **STOP and VALIDATE**: Can create and preview steps with Info type
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Data layer ready
2. Add US1 → Can create/configure steps → Demo (MVP!)
3. Add US2 → Can preview steps → Demo
4. Add US3 → URL deep linking → Demo
5. Add US4 + US5 → Experience Picker + Capture → Demo
6. Add US6 + US7 → All step types complete → Full feature

### Parallel Team Strategy

With 2+ developers after Foundational:

1. Developer A: User Story 1 (step CRUD UI)
2. Developer B: User Story 2 (preview components)
3. Both integrate in JourneyEditor after parallel work

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Uses updated PRD architecture: `features/steps/` owns data + preview + editors
