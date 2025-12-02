# Tasks: Experience Library

**Input**: Design documents from `/specs/015-experience-library/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in specification - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app monorepo**: `web/src/` for Next.js application
- Feature modules: `web/src/features/experiences/`
- App routes: `web/src/app/(workspace)/[companySlug]/exps/`

---

## Phase 1: Setup (Feature Module Structure)

**Purpose**: Create the experiences feature module structure by copying from journeys

- [X] T001 Create feature module directory structure at `web/src/features/experiences/`
- [X] T002 [P] Create barrel export file at `web/src/features/experiences/index.ts`
- [X] T003 [P] Create constants file with DEFAULT_EXPERIENCE_NAME="Untitled" at `web/src/features/experiences/constants.ts`

---

## Phase 2: Foundational (Data Layer)

**Purpose**: Core types, schemas, repository, and actions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Types & Schemas

- [X] T004 [P] Create Experience types at `web/src/features/experiences/types/experiences.types.ts`
- [X] T005 [P] Create types barrel export at `web/src/features/experiences/types/index.ts`
- [X] T006 [P] Create Experience Zod schemas at `web/src/features/experiences/schemas/experiences.schemas.ts`
- [X] T007 [P] Create schemas barrel export at `web/src/features/experiences/schemas/index.ts`

### Repository

- [X] T008 Create experiences repository at `web/src/features/experiences/repositories/experiences.repository.ts` (listExperiences, getExperience, createExperience, updateExperience, deleteExperience)
- [X] T009 [P] Create repository barrel export at `web/src/features/experiences/repositories/index.ts`

### Server Actions

- [X] T010 Create action response types at `web/src/features/experiences/actions/types.ts`
- [X] T011 Create experience server actions at `web/src/features/experiences/actions/experiences.ts` (listExperiencesAction, getExperienceAction, createExperienceAction, updateExperienceAction, deleteExperienceAction)
- [X] T012 [P] Create actions barrel export at `web/src/features/experiences/actions/index.ts`

### Step Actions (Refactored)

- [X] T013 Create step server actions at `web/src/features/experiences/actions/steps.ts` (listStepsAction, createStepAction, updateStepAction, deleteStepAction, reorderStepsAction, duplicateStepAction)

### Hooks

- [X] T014 [P] Create useExperiences hook at `web/src/features/experiences/hooks/useExperiences.ts`
- [X] T015 [P] Create useExperience hook at `web/src/features/experiences/hooks/useExperience.ts`
- [X] T016 [P] Create useSteps hook at `web/src/features/experiences/hooks/useSteps.ts`
- [X] T017 [P] Create useStepMutations hook at `web/src/features/experiences/hooks/useStepMutations.ts`
- [X] T018 [P] Create useSelectedStep hook at `web/src/features/experiences/hooks/useSelectedStep.ts`
- [X] T019 [P] Create hooks barrel export at `web/src/features/experiences/hooks/index.ts`

### Step Type Filtering

- [X] T020 Update step constants to mark experience-picker as deprecated at `web/src/features/steps/constants.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create New Experience (Priority: P1) 🎯 MVP

**Goal**: Allow users to create a new experience with default name "Untitled" and auto-redirect to editor

**Independent Test**: Click "New Experience" button, verify experience is created and editor page opens automatically

### Implementation for User Story 1

- [X] T021 [US1] Create CreateExperienceButton component at `web/src/features/experiences/components/CreateExperienceButton.tsx` (creates with default name "Untitled", redirects to editor on success)
- [X] T022 [US1] Create components barrel export at `web/src/features/experiences/components/index.ts`

**Checkpoint**: User Story 1 complete - users can create new experiences

---

## Phase 4: User Story 2 - View Company Experiences (Priority: P1)

**Goal**: Display a list/grid of all experiences belonging to the active company

**Independent Test**: Navigate to `/{companySlug}/exps` and verify experiences list displays (or empty state with create prompt)

### Implementation for User Story 2

- [X] T023 [P] [US2] Create ExperienceCard component at `web/src/features/experiences/components/ExperienceCard.tsx`
- [X] T024 [P] [US2] Create EmptyExperiences component at `web/src/features/experiences/components/EmptyExperiences.tsx` (includes create prompt)
- [X] T025 [US2] Create ExperienceList component at `web/src/features/experiences/components/ExperienceList.tsx` (uses ExperienceCard, EmptyExperiences, CreateExperienceButton)
- [X] T026 [US2] Update components barrel export at `web/src/features/experiences/components/index.ts`
- [X] T027 [US2] Implement experiences list page at `web/src/app/(workspace)/[companySlug]/exps/page.tsx` (replace placeholder)

**Checkpoint**: User Story 2 complete - users can view their company's experience library

---

## Phase 5: User Story 3 - Edit Experience in Editor (Priority: P1)

**Goal**: Open an experience and edit its steps using the ExperienceEditor

**Independent Test**: Click an experience, verify editor loads with steps, add/edit/delete/reorder steps

### Editor Components

- [ ] T028 [P] [US3] Create StepListItem component at `web/src/features/experiences/components/editor/StepListItem.tsx`
- [ ] T029 [P] [US3] Create StepList component at `web/src/features/experiences/components/editor/StepList.tsx` (drag-and-drop ordering)
- [ ] T030 [P] [US3] Create StepTypeSelector component at `web/src/features/experiences/components/editor/StepTypeSelector.tsx` (filter deprecated types)
- [ ] T031 [P] [US3] Create StepEditor component at `web/src/features/experiences/components/editor/StepEditor.tsx` (routes to type-specific editors)
- [ ] T032 [P] [US3] Create StepPreview component at `web/src/features/experiences/components/editor/StepPreview.tsx`
- [ ] T033 [P] [US3] Create ExperienceEditorHeader component at `web/src/features/experiences/components/editor/ExperienceEditorHeader.tsx`
- [ ] T034 [P] [US3] Create useKeyboardShortcuts hook at `web/src/features/experiences/hooks/useKeyboardShortcuts.ts`
- [ ] T035 [US3] Create ExperienceEditor component at `web/src/features/experiences/components/editor/ExperienceEditor.tsx` (3-panel layout)
- [ ] T036 [US3] Create editor components barrel export at `web/src/features/experiences/components/editor/index.ts`
- [ ] T037 [US3] Implement experience editor page at `web/src/app/(workspace)/[companySlug]/exps/[expId]/page.tsx` (replace placeholder)

**Checkpoint**: User Story 3 complete - users can edit experiences with full step management

---

## Phase 6: User Story 4 - Rename Experience (Priority: P2)

**Goal**: Allow users to rename an experience via a dialog triggered by clicking the title

**Independent Test**: Click experience title in editor, enter new name, verify it updates

### Implementation for User Story 4

- [ ] T038 [US4] Create RenameExperienceDialog component at `web/src/features/experiences/components/RenameExperienceDialog.tsx`
- [ ] T039 [US4] Integrate RenameExperienceDialog into ExperienceEditorHeader at `web/src/features/experiences/components/editor/ExperienceEditorHeader.tsx`

**Checkpoint**: User Story 4 complete - users can rename experiences

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, delete functionality, and validation

### Delete Experience

- [ ] T040 [P] Create DeleteExperienceDialog component at `web/src/features/experiences/components/DeleteExperienceDialog.tsx`
- [ ] T041 Integrate DeleteExperienceDialog into ExperienceCard at `web/src/features/experiences/components/ExperienceCard.tsx`

### Terminology Cleanup

- [ ] T042 Audit and replace all "Journey" terminology with "Experience" in UI strings across `web/src/features/experiences/`

### Update Feature Module Public API

- [ ] T043 Update feature module public exports at `web/src/features/experiences/index.ts` (export only components and types, not actions/schemas/repositories)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T044 Run `pnpm lint` and fix all errors/warnings
- [ ] T045 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T046 Verify feature in local dev server (`pnpm dev`) - test all user stories
- [ ] T047 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - US1 (Create) → US2 (View) → US3 (Edit) in sequence (P1 priority)
  - US4 (Rename) is P2 - complete after P1 stories
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - creates experiences with default name
- **User Story 2 (P1)**: Depends on US1 (needs CreateExperienceButton)
- **User Story 3 (P1)**: Foundation only - editor for step management
- **User Story 4 (P2)**: Depends on US3 (editor header exists)

### Within Each Phase

- Tasks marked [P] can run in parallel
- Non-[P] tasks have implicit dependencies on prior tasks in that phase
- Components that compose others depend on those components existing

### Parallel Opportunities

**Phase 2 (Foundational)**:
```
Parallel: T004, T005, T006, T007 (types and schemas)
Parallel: T014, T015, T016, T017, T018 (hooks)
```

**Phase 5 (User Story 3)**:
```
Parallel: T028, T029, T030, T031, T032, T033, T034 (all editor sub-components)
```

---

## Parallel Example: Foundational Types & Hooks

```bash
# Launch all type/schema tasks together:
Task: "Create Experience types at web/src/features/experiences/types/experiences.types.ts"
Task: "Create types barrel export at web/src/features/experiences/types/index.ts"
Task: "Create Experience Zod schemas at web/src/features/experiences/schemas/experiences.schemas.ts"
Task: "Create schemas barrel export at web/src/features/experiences/schemas/index.ts"

# After schemas complete, launch all hooks together:
Task: "Create useExperiences hook at web/src/features/experiences/hooks/useExperiences.ts"
Task: "Create useExperience hook at web/src/features/experiences/hooks/useExperience.ts"
Task: "Create useSteps hook at web/src/features/experiences/hooks/useSteps.ts"
Task: "Create useStepMutations hook at web/src/features/experiences/hooks/useStepMutations.ts"
Task: "Create useSelectedStep hook at web/src/features/experiences/hooks/useSelectedStep.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T020)
3. Complete Phase 3: User Story 1 - Create Experience (T021-T022)
4. Complete Phase 4: User Story 2 - View Experiences (T023-T027)
5. Complete Phase 5: User Story 3 - Edit Experience (T028-T037)
6. **STOP and VALIDATE**: Test creating, viewing, and editing experiences
7. Deploy/demo if ready

### Full Feature Delivery

1. Complete MVP (Phases 1-5)
2. Add Phase 6: User Story 4 - Rename (T038-T039)
3. Add Phase 7: Polish (T040-T047)
4. Full validation and deployment

---

## Notes

- All components should follow existing journeys module patterns
- Refactor from journeys code rather than writing from scratch
- Mobile-first: ensure 44x44px touch targets and responsive layouts
- Use existing step editors from `web/src/features/steps/components/editors/`
- Use existing step previews from `web/src/features/steps/components/preview/`
- Default experience name is "Untitled" - user can rename via US4
- Create action auto-redirects to editor page after success
