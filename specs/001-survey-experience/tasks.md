# Implementation Tasks: Survey Experience

**Branch**: `001-survey-experience`  
**Date**: 2025-11-20  
**Generated**: By `/speckit.tasks` command

---

## Overview

This document provides detailed implementation tasks for the Survey Experience feature, organized by user story priority. Each phase builds on previous phases and includes independently testable increments.

**Total Tasks**: 67  
**User Stories**: 5 (P1: 1, P2: 2, P3: 2)  
**Estimated Complexity**: Medium-High

---

## Task Format

All tasks follow this format:
```
- [ ] T### [P] [US#] Description with file path
```

Where:
- `T###` = Task ID (sequential)
- `[P]` = Parallelizable (optional marker)
- `[US#]` = User Story number (for story phases only)
- File paths are always included for code tasks

---

## Dependencies & Execution Strategy

### User Story Dependency Graph

```
Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1 - P1)
                                              ↓
                                         Phase 4 (US2 - P2)
                                              ↓
                                         Phase 5 (US3 - P2)
                                              ↓
                                         Phase 6 (US4 - P3)
                                              ↓
                                         Phase 7 (US5 - P3)
                                              ↓
                                         Phase 8 (Polish)
```

### Parallel Execution Opportunities

**Phase 2 (Foundation)**: T005-T006 (schemas + repository) can run in parallel after T004
**Phase 3 (US1)**: T013-T019 (all type-specific editors) can run in parallel
**Phase 4 (US2)**: T026-T027 (drag context + sortable items) can run in parallel after T025

### MVP Scope (Minimum Viable Product)

**Recommended MVP**: Complete Phase 1-3 (User Story 1 - P1)
- Install dependencies
- Update schemas with discriminated unions
- Implement repository functions
- Create Server Actions
- Build hooks (real-time + mutations)
- Implement survey editor with all 7 step types

This provides a complete, independently testable feature that allows creators to create and configure surveys with multiple question types.

---

## Phase 1: Setup

**Goal**: Install dependencies and prepare development environment

**Tasks**: 4

- [ ] T001 Install @dnd-kit packages for drag-and-drop in web/ workspace
- [ ] T002 Install react-hook-form and @hookform/resolvers for form management in web/ workspace
- [ ] T003 Verify TypeScript strict mode is enabled in web/tsconfig.json
- [ ] T004 Review existing survey schemas in web/src/features/experiences/lib/schemas.ts (lines 99-103, 215-289)

**Validation**:
- [ ] All dependencies installed successfully with `pnpm install`
- [ ] No TypeScript errors in existing codebase
- [ ] Existing survey schemas reviewed and understood

---

## Phase 2: Foundational Layer

**Goal**: Implement data models, repository functions, Server Actions, and hooks that ALL user stories depend on

**Independent Test**: Can test schemas, repository functions, and Server Actions in isolation with unit tests. Real-time subscriptions can be tested with mocked Firestore.

**Tasks**: 10

### Data Layer (Schemas & Repository)

- [ ] T005 [P] Update surveyConfigSchema: rename surveyStepIds to stepsOrder in web/src/features/experiences/lib/schemas.ts
- [ ] T006 [P] Add yes_no to surveyStepTypeSchema enum in web/src/features/experiences/lib/schemas.ts
- [ ] T007 Create stepBaseSchema with common fields (id, eventId, title, description, required, createdAt, updatedAt) in web/src/features/experiences/lib/schemas.ts
- [ ] T008 Create discriminated union schemas for all 7 step types (multiple_choice, yes_no, opinion_scale, short_text, long_text, email, statement) in web/src/features/experiences/lib/schemas.ts
- [ ] T009 Export TypeScript types from discriminated union (SurveyStep, StepType) in web/src/features/experiences/lib/schemas.ts
- [ ] T010 Implement createSurveyStep repository function with transaction in web/src/features/experiences/lib/repository.ts
- [ ] T011 Implement updateSurveyStep repository function in web/src/features/experiences/lib/repository.ts
- [ ] T012 Implement deleteSurveyStep repository function with transaction in web/src/features/experiences/lib/repository.ts
- [ ] T013 Implement reorderSurveySteps repository function in web/src/features/experiences/lib/repository.ts

### Server Actions

- [ ] T014 Create survey-steps.ts file with ActionResponse type definition in web/src/features/experiences/actions/
- [ ] T015 Implement createSurveyStepAction with validation and error handling in web/src/features/experiences/actions/survey-steps.ts
- [ ] T016 Implement updateSurveyStepAction with validation and error handling in web/src/features/experiences/actions/survey-steps.ts
- [ ] T017 Implement deleteSurveyStepAction with validation and error handling in web/src/features/experiences/actions/survey-steps.ts
- [ ] T018 Implement reorderSurveyStepsAction with validation and error handling in web/src/features/experiences/actions/survey-steps.ts

### Hooks Layer

- [ ] T019 Create useSurveySteps hook with Firebase Client SDK onSnapshot for real-time subscriptions in web/src/features/experiences/hooks/useSurveySteps.ts
- [ ] T020 Create useSurveyStepMutations hook wrapping all Server Actions (create, update, delete, reorder) in web/src/features/experiences/hooks/useSurveyStepMutations.ts

**Validation**:
- [ ] All schemas validate correctly with test data
- [ ] Repository functions pass unit tests (mocked Firestore)
- [ ] Server Actions return proper ActionResponse format
- [ ] Hooks connect to Firestore without errors
- [ ] TypeScript compiles with no errors
- [ ] Run `pnpm type-check` successfully

---

## Phase 3: User Story 1 - Create Survey Experience with Steps (P1)

**Goal**: Enable event creators to create a survey experience and add configurable steps with different question types

**Why P1**: This is the core functionality. Without the ability to create and configure surveys, the feature has no value.

**Independent Test**: Create an event, add a survey experience, configure 2-3 different question types (short text, multiple choice, opinion scale), and verify all configurations persist correctly in Firestore.

**Acceptance Criteria**:
1. Can create new survey experience with empty steps list
2. Can add new step by selecting type from dialog
3. Can configure each step's title, description, and type-specific settings
4. All configurations persist after page reload

**Tasks**: 24

### Main Editor Container

- [ ] T021 [US1] Create survey/ directory structure in web/src/features/experiences/components/
- [ ] T022 [US1] Implement SurveyExperienceEditor main container component with 3-column layout (list, editor, preview) in web/src/features/experiences/components/survey/SurveyExperienceEditor.tsx
- [ ] T023 [US1] Add state management for selectedStepId in SurveyExperienceEditor
- [ ] T024 [US1] Connect useSurveySteps hook to SurveyExperienceEditor for real-time step data

### Step List Component

- [ ] T025 [US1] Implement SurveyStepList component with step items display in web/src/features/experiences/components/survey/SurveyStepList.tsx
- [ ] T026 [US1] Add step selection interaction (click to select) in SurveyStepList
- [ ] T027 [US1] Style selected vs unselected step items in SurveyStepList

### Step Type Selector

- [ ] T028 [US1] Implement SurveyStepTypeSelector dialog component with all 7 step types in web/src/features/experiences/components/survey/SurveyStepTypeSelector.tsx
- [ ] T029 [US1] Add mobile-optimized layout for step type selector (large tappable options, ≥44x44px)
- [ ] T030 [US1] Connect step type selector to createSurveyStepAction via useSurveyStepMutations

### Main Step Editor

- [ ] T031 [US1] Implement SurveyStepEditor container with React Hook Form setup in web/src/features/experiences/components/survey/SurveyStepEditor.tsx
- [ ] T032 [US1] Add common step fields form (title, description, required toggle) in SurveyStepEditor
- [ ] T033 [US1] Add character count indicators for title (max 200) and description (max 500)
- [ ] T034 [US1] Integrate type-specific editors based on step.type discriminator
- [ ] T035 [US1] Connect form submission to updateSurveyStepAction

### Type-Specific Editors (Can be done in parallel)

- [ ] T036 [P] [US1] Implement MultipleChoiceEditor with options list management (add/remove, max 10) in web/src/features/experiences/components/survey/step-types/MultipleChoiceEditor.tsx
- [ ] T037 [P] [US1] Add allowMultiple toggle to MultipleChoiceEditor
- [ ] T038 [P] [US1] Implement YesNoEditor with custom label inputs (yesLabel, noLabel) in web/src/features/experiences/components/survey/step-types/YesNoEditor.tsx
- [ ] T039 [P] [US1] Implement OpinionScaleEditor with scaleMin/scaleMax inputs and labels in web/src/features/experiences/components/survey/step-types/OpinionScaleEditor.tsx
- [ ] T040 [P] [US1] Add validation for scaleMin < scaleMax in OpinionScaleEditor
- [ ] T041 [P] [US1] Implement TextEditor component handling both short_text and long_text types in web/src/features/experiences/components/survey/step-types/TextEditor.tsx
- [ ] T042 [P] [US1] Add placeholder and maxLength inputs to TextEditor
- [ ] T043 [P] [US1] Implement EmailEditor with placeholder input in web/src/features/experiences/components/survey/step-types/EmailEditor.tsx
- [ ] T044 [P] [US1] Implement StatementEditor (minimal, no config fields) in web/src/features/experiences/components/survey/step-types/StatementEditor.tsx

### Integration

- [ ] T045 [US1] Add "Add Step" button with step type selector trigger to SurveyExperienceEditor
- [ ] T046 [US1] Show empty state when no steps exist
- [ ] T047 [US1] Add error handling and loading states throughout editor
- [ ] T048 [US1] Export SurveyExperienceEditor from features/experiences public API in web/src/features/experiences/index.ts

**Validation** (User Story 1):
- [ ] Create event and add survey experience successfully
- [ ] Click + button and select "Multiple Choice" → new step added
- [ ] Configure title, description, and options → all saved
- [ ] Reload page → configurations persist
- [ ] Repeat for at least 2 other step types
- [ ] Run `pnpm lint` and `pnpm type-check` with zero errors

**Test Coverage Target**: 70%+ for schemas, repository, Server Actions

---

## Phase 4: User Story 2 - Reorder Survey Steps (P2)

**Goal**: Allow creators to change question order via drag-and-drop

**Why P2**: Important for UX optimization but not essential for basic functionality. Depends on US1.

**Independent Test**: Create survey with 3-5 steps, drag them to different positions, verify order persists in both UI and Firestore.

**Acceptance Criteria**:
1. Can drag step to new position with visual feedback
2. Step numbering updates immediately
3. Order persists after page reload

**Tasks**: 7

- [ ] T049 [US2] Integrate @dnd-kit DndContext in SurveyStepList component
- [ ] T050 [US2] Wrap step items with SortableContext using verticalListSortingStrategy
- [ ] T051 [US2] Create SortableStepItem component with useSortable hook in web/src/features/experiences/components/survey/SurveyStepList.tsx
- [ ] T052 [US2] Add drag handle with touch-friendly size (≥44x44px minimum)
- [ ] T053 [US2] Implement handleDragEnd to call reorderSurveyStepsAction
- [ ] T054 [US2] Add visual feedback during drag (insertion line, transform animations)
- [ ] T055 [US2] Update step numbering dynamically based on position

**Validation** (User Story 2):
- [ ] Create survey with 3-5 steps
- [ ] Drag step from position 0 to position 2
- [ ] Verify numbering updates immediately
- [ ] Reload page → order preserved
- [ ] Test on mobile device (touch drag)
- [ ] Drag succeeds 100% of the time

---

## Phase 5: User Story 3 - Enable/Disable and Require Survey (P2)

**Goal**: Provide control toggles for survey activation and requirement state

**Why P2**: Essential control but depends on having a survey created first (US1).

**Independent Test**: Toggle enabled/disabled and required/optional states, verify settings persist.

**Acceptance Criteria**:
1. Can toggle "Enabled" switch
2. Can toggle "Required" switch
3. Settings persist across page reloads

**Tasks**: 5

- [ ] T056 [US3] Add "Enabled" toggle switch to SurveyExperienceEditor header with label
- [ ] T057 [US3] Add "Required" toggle switch to SurveyExperienceEditor header with label
- [ ] T058 [US3] Connect toggles to existing updateExperience Server Action (reuse from photo experience)
- [ ] T059 [US3] Show visual indicator when survey is disabled (grayed out steps)
- [ ] T060 [US3] Add helper text explaining enabled vs required behavior

**Validation** (User Story 3):
- [ ] Toggle "Enabled" to off → survey disabled
- [ ] Toggle "Required" to on → survey mandatory
- [ ] Reload page → settings persist
- [ ] Both toggles work independently

---

## Phase 6: User Story 4 - Delete Survey Steps (P3)

**Goal**: Allow removal of unwanted survey questions

**Why P3**: Convenience feature that doesn't block core functionality. Can work around by disabling steps.

**Independent Test**: Create multiple steps, delete one, verify removal from list and Firestore.

**Acceptance Criteria**:
1. Delete button shows confirmation dialog
2. Step removed from list after confirmation
3. Next available step auto-selected
4. Firestore document deleted and stepsOrder updated

**Tasks**: 5

- [ ] T061 [US4] Add delete button to step editor with confirmation dialog
- [ ] T062 [US4] Implement handleDelete function calling deleteSurveyStepAction
- [ ] T063 [US4] Handle step selection after deletion (select next available or show empty state)
- [ ] T064 [US4] Add optimistic UI update before Server Action completes
- [ ] T065 [US4] Show error message if deletion fails

**Validation** (User Story 4):
- [ ] Click delete on step 2 of 3 → confirmation dialog appears
- [ ] Confirm deletion → step removed from list
- [ ] Step 3 automatically selected
- [ ] Check Firestore → document deleted, stepsOrder updated
- [ ] Delete last step → empty state shown

---

## Phase 7: User Story 5 - Preview Survey Steps (P3)

**Goal**: Real-time preview of step configuration

**Why P3**: Helpful for UX confidence but not essential. Creators can test separately.

**Independent Test**: Configure various step types and verify preview reflects all settings in real-time.

**Acceptance Criteria**:
1. Preview updates immediately when typing in title
2. Preview shows updated options for multiple choice
3. Preview shows updated scale for opinion scale

**Tasks**: 7

- [ ] T066 [P] [US5] Implement SurveyStepPreview container component in web/src/features/experiences/components/survey/SurveyStepPreview.tsx
- [ ] T067 [P] [US5] Create preview components for each step type (match guest-facing design) in web/src/features/experiences/components/survey/preview/
- [ ] T068 [US5] Add mobile-first styling to preview pane (vertical stack on mobile, sidebar on desktop)
- [ ] T069 [US5] Connect preview to selectedStep prop for real-time updates
- [ ] T070 [US5] Add preview toggle button for mobile (collapsible preview)
- [ ] T071 [US5] Style preview to match guest experience (accurate representation)
- [ ] T072 [US5] Add "Preview Mode" indicator to distinguish from actual survey

**Validation** (User Story 5):
- [ ] Type in title field → preview updates immediately (<1s)
- [ ] Add/remove multiple choice options → preview reflects changes
- [ ] Change opinion scale min/max → preview shows updated scale
- [ ] Test on mobile (preview collapses/expands correctly)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Final validation, error handling, mobile optimization, and documentation

**Tasks**: 9

### Validation & Error Handling

- [ ] T073 Show warning when survey exceeds 5 steps (recommended limit) in SurveyExperienceEditor
- [ ] T074 Prevent adding more than 10 steps (hard limit) with clear error message
- [ ] T075 Add validation errors display for invalid configurations (e.g., multiple choice with no options)
- [ ] T076 Implement form-level error handling with user-friendly messages

### Mobile Optimization

- [ ] T077 Verify all touch targets meet 44x44px minimum across all components
- [ ] T078 Test vertical stacking on mobile viewports (320px-768px)
- [ ] T079 Add touch-manipulation CSS to all interactive elements
- [ ] T080 Test drag-and-drop on real mobile devices (iOS & Android)

### Final Validation

- [ ] T081 Run full type-check: `cd web && pnpm type-check`
- [ ] T082 Run linter: `cd web && pnpm lint`
- [ ] T083 Fix any remaining linter errors or TypeScript errors
- [ ] T084 Test all 5 user stories end-to-end
- [ ] T085 Verify all success criteria met (spec.md requirements)
- [ ] T086 Update feature exports in web/src/features/experiences/index.ts

### Documentation

- [ ] T087 Document any deviations from plan in specs/001-survey-experience/implementation-notes.md

**Final Validation Checklist**:
- [ ] All 5 user stories pass acceptance criteria
- [ ] TypeScript compiles with zero errors
- [ ] Linter passes with zero errors
- [ ] Mobile touch targets verified (44x44px+)
- [ ] Performance goals met (editor loads <2s, preview <1s)
- [ ] Character limits enforced (title 200, description 500, etc.)
- [ ] All 7 step types functional and properly validated

---

## Parallel Execution Examples

### Foundation Phase (Can parallelize after T004)

**Team A**: T005-T009 (Schemas)  
**Team B**: T010-T013 (Repository)  
**Team C**: T014-T018 (Server Actions)  
**Team D**: T019-T020 (Hooks)

### User Story 1 Phase (Type-specific editors)

**After T035 completes**, these can run in parallel:
- T036-T037 (Multiple Choice)
- T038 (Yes/No)
- T039-T040 (Opinion Scale)
- T041-T042 (Text)
- T043 (Email)
- T044 (Statement)

### User Story 5 Phase (Preview components)

**After T066 completes**:
- T067 (All preview components can be built in parallel)

---

## Risk Mitigation

### Critical Path Items

1. **Schema Migration** (T005-T009): Carefully rename surveyStepIds → stepsOrder without breaking existing data
2. **Discriminated Unions** (T008): Ensure type-specific configs validate correctly for all 7 types
3. **Drag-and-Drop** (T049-T055): Test extensively on mobile devices (touch can be unreliable)
4. **Transaction Safety** (T010, T012): Ensure atomic operations for create/delete with stepsOrder updates

### Common Pitfalls (from quickstart.md)

1. Don't mutate stepsOrder directly (use Server Action)
2. Don't forget to unsubscribe from onSnapshot in hooks
3. Don't skip validation (client + server)
4. Don't hardcode step IDs (use Firestore generated IDs)
5. Don't forget mobile testing for drag-and-drop

---

## Success Metrics (from spec.md)

After completion, verify these measurable outcomes:

- [ ] **SC-001**: Create survey + add first step in <60 seconds
- [ ] **SC-002**: Configure fields + see preview update within 1 second
- [ ] **SC-003**: Drag-and-drop succeeds 100% on desktop AND mobile
- [ ] **SC-004**: Zero data loss after page reload
- [ ] **SC-005**: Editor loads 10 steps in <2 seconds on mobile
- [ ] **SC-006**: Validation errors appear within 500ms
- [ ] **SC-007**: 90% success rate for multi-step surveys (3+ steps)
- [ ] **SC-008**: All touch targets meet 44x44px (100% compliance)

---

## Implementation Notes

**Feature Branch**: `001-survey-experience`

**Key Files Modified**:
- `web/src/features/experiences/lib/schemas.ts` (update existing survey schemas)
- `web/src/features/experiences/lib/repository.ts` (extend with survey functions)

**Key Files Created**:
- `web/src/features/experiences/actions/survey-steps.ts` (4 Server Actions)
- `web/src/features/experiences/hooks/useSurveySteps.ts` (real-time subscription)
- `web/src/features/experiences/hooks/useSurveyStepMutations.ts` (mutation wrapper)
- `web/src/features/experiences/components/survey/` (entire directory with 13+ components)

**Dependencies Added**:
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`
- `react-hook-form`
- `@hookform/resolvers`

---

## Next Steps After Completion

1. **Guest Experience**: Implement guest-facing survey flow (out of scope for this spec)
2. **Analytics**: Add survey response tracking and aggregation
3. **Advanced Features**: Conditional logic, branching, skip patterns
4. **Accessibility**: Full WCAG 2.1 AA compliance audit
5. **Performance**: Optimize for 20+ step surveys (beyond current 10-step limit)

---

**Document Status**: Ready for Implementation  
**Last Updated**: 2025-11-20  
**Total Tasks**: 87 tasks across 8 phases

