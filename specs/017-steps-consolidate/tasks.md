# Tasks: Steps Consolidation (Experience-Scoped Steps)

**Input**: Design documents from `/specs/017-steps-consolidate/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No unit tests requested in this feature specification. Validation is via type-check, lint, and build.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (monorepo)**: `web/src/features/` for feature modules
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type and schema foundation required by all user stories

- [ ] T001 [P] Add `ai-transform` to StepType union in `web/src/features/steps/types/step.types.ts`
- [ ] T002 [P] Add AiTransformConfig and AiTransformVariable types to `web/src/features/steps/types/step.types.ts`
- [ ] T003 [P] Add aiTransformVariableSchema Zod schema with refinements in `web/src/features/steps/schemas/step.schemas.ts`
- [ ] T004 [P] Add aiTransformConfigSchema Zod schema in `web/src/features/steps/schemas/step.schemas.ts`
- [ ] T005 [P] Update stepTypeSchema to include `ai-transform` in `web/src/features/steps/schemas/step.schemas.ts`
- [ ] T006 [P] Export new types and schemas from `web/src/features/steps/schemas/index.ts`
- [ ] T007 [P] Export new types from `web/src/features/steps/types/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Add STEP_TYPE_META entry for `ai-transform` in `web/src/features/steps/constants.ts`
- [ ] T009 Add STEP_DEFAULTS entry for `ai-transform` with default config in `web/src/features/steps/constants.ts`
- [ ] T010 Update StepConfig union type to include AiTransformConfig in `web/src/features/steps/types/step.types.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Creates AI Transform Step (Priority: P1)

**Goal**: Enable experience creators to add and configure AI Transform steps in experience flows

**Independent Test**: Open experience editor, click "Add Step", select "AI Transform", configure model/prompt, save. Step should appear with correct defaults and persist on reload.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create AiTransformEditor component scaffold in `web/src/features/steps/components/editors/AiTransformEditor.tsx`
- [ ] T012 [P] [US1] Implement model selection input (text input or dropdown) in AiTransformEditor
- [ ] T013 [P] [US1] Implement prompt textarea with max 1000 chars validation in AiTransformEditor
- [ ] T014 [US1] Implement variables list management (add/remove/edit) in AiTransformEditor
- [ ] T015 [US1] Implement output type selector (image/video/gif) in AiTransformEditor
- [ ] T016 [US1] Implement aspect ratio selector in AiTransformEditor
- [ ] T017 [US1] Implement reference images upload (max 5) using StepMediaUpload in AiTransformEditor
- [ ] T018 [US1] Wire AiTransformEditor to react-hook-form with zodResolver for aiTransformConfigSchema
- [ ] T019 [US1] Add auto-save on form changes using form.watch pattern in AiTransformEditor
- [ ] T020 [US1] Export AiTransformEditor from `web/src/features/steps/components/editors/index.ts`
- [ ] T021 [US1] Register AiTransformEditor in step editor switch/mapping (where step type resolves to editor component)
- [ ] T022 [US1] Verify experience-picker is hidden from step picker (deprecated: true in STEP_TYPE_META)
- [ ] T023 [US1] Verify ai-transform appears in step picker with correct icon and label

**Checkpoint**: At this point, User Story 1 should be fully functional - admins can add and configure AI Transform steps

---

## Phase 4: User Story 2 - Admin Manages Experience Steps via Single Interface (Priority: P1)

**Goal**: All step CRUD operations work consistently through a single unified interface with no duplicate code

**Independent Test**: Create, read, update, delete, and reorder steps in experience editor. All operations should complete successfully with immediate UI feedback.

### Implementation for User Story 2

- [ ] T024 [US2] Update getStepsCollection helper to use `/experiences/{experienceId}/steps` path in `web/src/features/steps/repositories/steps.repository.ts`
- [ ] T025 [US2] Update listSteps function signature to accept `experienceId` only (remove eventId/journeyId) in `web/src/features/steps/repositories/steps.repository.ts`
- [ ] T026 [US2] Update getStep function to use experienceId in `web/src/features/steps/repositories/steps.repository.ts`
- [ ] T027 [US2] Update createStep function to use experienceId and batch writes in `web/src/features/steps/repositories/steps.repository.ts`
- [ ] T028 [US2] Update updateStep function to use experienceId in `web/src/features/steps/repositories/steps.repository.ts`
- [ ] T029 [US2] Update deleteStep function to use batch writes (delete doc + update stepsOrder) in `web/src/features/steps/repositories/steps.repository.ts`
- [ ] T030 [US2] Update reorderSteps function to update experience.stepsOrder in `web/src/features/steps/repositories/steps.repository.ts`
- [ ] T031 [US2] Update duplicateStep function to use batch writes in `web/src/features/steps/repositories/steps.repository.ts`
- [ ] T032 [US2] Update listStepsAction to accept experienceId only in `web/src/features/steps/actions/steps.ts`
- [ ] T033 [US2] Update getStepAction to accept experienceId in `web/src/features/steps/actions/steps.ts`
- [ ] T034 [US2] Update createStepAction to accept experienceId in input, use batch writes in `web/src/features/steps/actions/steps.ts`
- [ ] T035 [US2] Update updateStepAction signature to (experienceId, stepId, input) in `web/src/features/steps/actions/steps.ts`
- [ ] T036 [US2] Update deleteStepAction to use experienceId and batch writes in `web/src/features/steps/actions/steps.ts`
- [ ] T037 [US2] Update reorderStepsAction to use experienceId in `web/src/features/steps/actions/steps.ts`
- [ ] T038 [US2] Update duplicateStepAction to use experienceId and batch writes in `web/src/features/steps/actions/steps.ts`
- [ ] T039 [US2] Export all updated actions from `web/src/features/steps/actions/index.ts`
- [ ] T040 [US2] Update useStepMutations to import actions from `@/features/steps/actions` instead of local `../actions/steps` in `web/src/features/experiences/hooks/useStepMutations.ts`
- [ ] T041 [US2] Remove step action exports from `web/src/features/experiences/actions/index.ts`
- [ ] T042 [US2] Delete duplicate file `web/src/features/experiences/actions/steps.ts` (FR-013)

**Checkpoint**: At this point, User Story 2 should be fully functional - all step operations use consolidated code path

---

## Phase 5: User Story 3 - Steps are Scoped to Experiences (Priority: P1)

**Goal**: Steps are stored at `/experiences/{experienceId}/steps/{stepId}` with no journey references

**Independent Test**: Create step, check Firestore path shows `/experiences/{id}/steps/{id}`. Run `grep -r "journeyId" web/src/features/steps/` returns zero results.

### Implementation for User Story 3

- [ ] T043 [P] [US3] Remove journeyId field from Step interface in `web/src/features/steps/types/step.types.ts`
- [ ] T044 [P] [US3] Update stepSchema to remove journeyId, ensure experienceId is required in `web/src/features/steps/schemas/step.schemas.ts`
- [ ] T045 [US3] Remove any journey imports from steps repository in `web/src/features/steps/repositories/steps.repository.ts`
- [ ] T046 [US3] Remove any journey imports from steps actions in `web/src/features/steps/actions/steps.ts`
- [ ] T047 [US3] Search and remove journey references from steps hooks in `web/src/features/steps/hooks/`
- [ ] T048 [US3] Search and remove journey references from steps components in `web/src/features/steps/components/`
- [ ] T049 [US3] Verify zero imports from `features/journeys/` in steps module (FR-012)
- [ ] T050 [US3] Update useSteps hook to fetch from experience subcollection path in `web/src/features/experiences/hooks/useSteps.ts`

**Checkpoint**: At this point, User Story 3 should be fully functional - steps module has zero journey dependencies

---

## Phase 6: User Story 4 - Sessions Work with Experiences (Priority: P2)

**Goal**: Guest sessions correctly resolve experience data instead of journey data

**Independent Test**: Create session for an experience, verify session loads experience and steps correctly.

### Implementation for User Story 4

- [ ] T051 [P] [US4] Add experienceId field to Session type in `web/src/features/sessions/types/sessions.types.ts`
- [ ] T052 [P] [US4] Update sessionSchema to include experienceId field in `web/src/features/sessions/schemas/sessions.schemas.ts`
- [ ] T053 [US4] Add startExperienceSessionAction function in `web/src/features/sessions/actions/sessions.actions.ts`
- [ ] T054 [US4] Update getExperiencesForGuestAction to use experience repository in `web/src/features/sessions/actions/sessions.actions.ts`
- [ ] T055 [US4] Add getExperienceForGuestAction function to load experience + steps for guest in `web/src/features/sessions/actions/sessions.actions.ts`
- [ ] T056 [US4] Update advanceStepAction to read stepsOrder from experience (not journey) in `web/src/features/sessions/actions/sessions.actions.ts`
- [ ] T057 [US4] Import experience repository functions in sessions actions

**Checkpoint**: At this point, User Story 4 should be fully functional - sessions work with experiences

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T058 [P] Remove unused journey-related imports across all modified files
- [ ] T059 [P] Clean up any TODO comments added during implementation
- [ ] T060 Verify step picker modal is mobile-friendly (scrollable, touch targets >=44px)
- [ ] T061 Verify AiTransformEditor is mobile-first (works on 320px-768px viewport)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T062 Run `pnpm lint` and fix all errors/warnings (SC-005)
- [ ] T063 Run `pnpm type-check` and resolve all TypeScript errors (SC-004)
- [ ] T064 Run `pnpm build` and ensure build completes successfully (SC-006)
- [ ] T065 Verify in local dev server (`pnpm dev`) that experience editor loads steps correctly (SC-007)
- [ ] T066 Verify `grep -r "journeyId" web/src/features/steps/` returns zero results (SC-003)
- [ ] T067 Verify `grep -r "journey" web/src/features/steps/` returns zero results excluding comments (SC-003)
- [ ] T068 Verify step picker shows ai-transform, hides experience-picker (SC-008)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - can run in parallel with US2, US3
- **User Story 2 (Phase 4)**: Depends on Foundational - can run in parallel with US1, US3
- **User Story 3 (Phase 5)**: Depends on Foundational + US2 (action consolidation must complete first)
- **User Story 4 (Phase 6)**: Depends on Foundational - can run in parallel with US1, US2, US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on types/schemas from Phase 1-2. No other story dependencies.
- **User Story 2 (P1)**: Depends on types/schemas from Phase 1-2. No other story dependencies.
- **User Story 3 (P1)**: Depends on Phase 1-2 AND User Story 2 (must consolidate actions before removing journey refs)
- **User Story 4 (P2)**: Depends on types/schemas from Phase 1-2. Can integrate with US2/US3 changes.

### Within Each User Story

- Types/schemas before repository
- Repository before actions
- Actions before hooks
- Hooks before components
- Core implementation before UI integration

### Parallel Opportunities

Phase 1 (all [P] tasks):
- T001, T002, T003, T004, T005, T006, T007 can all run in parallel

User Story 1:
- T011, T012, T013 can run in parallel (different editor sections)

User Story 2:
- T024-T031 (repository) must complete before T032-T038 (actions)
- T040-T042 (cleanup) must be last

User Story 3:
- T043, T044 can run in parallel (types/schemas)
- T045-T049 depend on types being updated

User Story 4:
- T051, T052 can run in parallel (types/schemas)
- T053-T057 depend on types being updated

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all setup tasks together:
Task: "Add ai-transform to StepType union in web/src/features/steps/types/step.types.ts"
Task: "Add AiTransformConfig and AiTransformVariable types in web/src/features/steps/types/step.types.ts"
Task: "Add aiTransformVariableSchema in web/src/features/steps/schemas/step.schemas.ts"
Task: "Add aiTransformConfigSchema in web/src/features/steps/schemas/step.schemas.ts"
Task: "Update stepTypeSchema in web/src/features/steps/schemas/step.schemas.ts"
Task: "Export new types/schemas from index files"
```

## Parallel Example: User Stories After Phase 2

```bash
# Once Foundational complete, launch US1 + US4 in parallel:
# Developer A: User Story 1 (AI Transform Editor)
# Developer B: User Story 4 (Sessions)

# After US2 completes, launch US3:
# US3 depends on action consolidation from US2
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (AI Transform step)
4. **STOP and VALIDATE**: Test AI Transform step creation in experience editor
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Types and schemas ready
2. Add User Story 1 → Test AI Transform editor → Deploy/Demo (MVP!)
3. Add User Story 2 → Test consolidated CRUD ops → Deploy/Demo
4. Add User Story 3 → Verify no journey refs → Deploy/Demo
5. Add User Story 4 → Test session loading → Deploy/Demo
6. Each story adds value without breaking previous stories

### Recommended Order (Single Developer)

1. Phase 1: Setup (T001-T007)
2. Phase 2: Foundational (T008-T010)
3. Phase 3: User Story 1 (T011-T023) - Most user-visible value
4. Phase 4: User Story 2 (T024-T042) - Core consolidation
5. Phase 5: User Story 3 (T043-T050) - Cleanup journey refs
6. Phase 6: User Story 4 (T051-T057) - Session integration
7. Phase 7: Polish + Validation (T058-T068)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run validation loop (T062-T068) before creating PR
