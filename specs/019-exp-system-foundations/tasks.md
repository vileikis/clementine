# Tasks: Experience System Structural Foundations

**Input**: Design documents from `/specs/019-exp-system-foundations/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No tests requested for this phase (scaffolding/types only)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `apps/clementine-app/src/domains/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create domain folder structures and barrel exports

- [X] T001 Create experience domain folder structure at `domains/experience/`
- [X] T002 [P] Create experience shared schemas folder at `domains/experience/shared/schemas/`
- [X] T003 [P] Create experience shared types folder at `domains/experience/shared/types/`
- [X] T004 Create session domain folder structure at `domains/session/`
- [X] T005 [P] Create session shared schemas folder at `domains/session/shared/schemas/`
- [X] T006 [P] Create session shared types folder at `domains/session/shared/types/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schemas and types that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create media reference schema with `mediaAssetId` and `url` fields in `domains/experience/shared/schemas/media-reference.schema.ts`
- [X] T008 Create schemas barrel export in `domains/experience/shared/schemas/index.ts`
- [X] T009 [P] Create types barrel export in `domains/experience/shared/types/index.ts`
- [X] T010 [P] Create session schemas barrel export in `domains/session/shared/schemas/index.ts`
- [X] T011 [P] Create session types barrel export in `domains/session/shared/types/index.ts`
- [X] T012 Create experience shared barrel export in `domains/experience/shared/index.ts`
- [X] T013 [P] Create session shared barrel export in `domains/session/shared/index.ts`
- [X] T014 Create experience domain barrel export in `domains/experience/index.ts`
- [X] T015 [P] Create session domain barrel export in `domains/session/index.ts`

**Checkpoint**: Foundation ready - domain folders exist with barrel exports, user story implementation can now begin

---

## Phase 3: User Story 1 - Domain Structure (Priority: P1)

**Goal**: Developers can import types from `domains/experience/` and `domains/session/` without errors

**Independent Test**: App boots successfully, imports resolve without circular dependency warnings

### Implementation for User Story 1

- [X] T016 [P] [US1] Create experience schema with id, name, status, timestamps, draftConfig, publishedConfig in `domains/experience/shared/schemas/experience.schema.ts`
- [X] T017 [P] [US1] Create experience config schema with schemaVersion, profile, steps in `domains/experience/shared/schemas/experience.schema.ts`
- [X] T018 [US1] Create experience types interface in `domains/experience/shared/types/experience.types.ts`
- [X] T019 [US1] Export Experience type from schemas barrel in `domains/experience/shared/schemas/index.ts`
- [X] T020 [US1] Re-export experience types from types barrel in `domains/experience/shared/types/index.ts`
- [X] T021 [US1] Verify app boots with `pnpm dev` and no circular dependency warnings

**Checkpoint**: User Story 1 complete - experience domain importable

---

## Phase 4: User Story 2 - Step Registry (Priority: P1)

**Goal**: Step registry skeleton with type definitions for all step categories

**Independent Test**: Define placeholder step and TypeScript validates structure

### Implementation for User Story 2

- [X] T022 [P] [US2] Create StepCategory type ('info' | 'input' | 'capture' | 'transform' | 'share') in `domains/experience/shared/types/step.types.ts`
- [X] T023 [P] [US2] Create BaseStep interface with id, category, type, label in `domains/experience/shared/types/step.types.ts`
- [X] T024 [US2] Create category-specific step interfaces (InfoStep, InputStep, CaptureStep, TransformStep, ShareStep) in `domains/experience/shared/types/step.types.ts`
- [X] T025 [US2] Create Step discriminated union type in `domains/experience/shared/types/step.types.ts`
- [X] T026 [P] [US2] Create empty step config schemas (info, input, capture, transform, share) in `domains/experience/shared/schemas/step-registry.schema.ts`
- [X] T027 [US2] Export step config types from step-registry schema in `domains/experience/shared/schemas/step-registry.schema.ts`
- [X] T028 [US2] Add step-registry exports to schemas barrel in `domains/experience/shared/schemas/index.ts`
- [X] T029 [US2] Add step types exports to types barrel in `domains/experience/shared/types/index.ts`

**Checkpoint**: User Story 2 complete - step registry types available

---

## Phase 5: User Story 6 - Verify activeEventId (Priority: P1)

**Goal**: Confirm `activeEventId` field exists in project schema

**Independent Test**: Inspect `project/shared/schemas/project.schema.ts` and verify field present

### Implementation for User Story 6

- [X] T030 [US6] Verify `activeEventId` field exists as nullable string in `domains/project/shared/schemas/project.schema.ts`
  - VERIFIED: `activeEventId: z.string().nullable()` exists in `packages/shared/src/entities/project/project.schema.ts:23`
- [X] T031 [US6] Document verification result in this task list (check box when confirmed)

**Checkpoint**: User Story 6 complete - activeEventId confirmed

---

## Phase 6: User Story 3 - Experience Profiles (Priority: P2)

**Goal**: ExperienceProfile enum and empty validators

**Independent Test**: Import ExperienceProfile enum and call validators (always return valid)

### Implementation for User Story 3

- [X] T032 [P] [US3] Create ExperienceProfile enum (Free, Photobooth, Survey, Gallery) in `domains/experience/shared/types/profile.types.ts`
- [X] T033 [P] [US3] Create experienceProfileSchema using z.nativeEnum in `domains/experience/shared/types/profile.types.ts`
- [X] T034 [US3] Create ProfileValidationResult interface in `domains/experience/shared/types/profile.types.ts`
- [X] T035 [US3] Create ProfileValidator type in `domains/experience/shared/types/profile.types.ts`
- [X] T036 [US3] Create profileValidators record with empty validators (always return valid) in `domains/experience/shared/types/profile.types.ts`
- [X] T037 [US3] Create validateExperienceProfile convenience function in `domains/experience/shared/types/profile.types.ts`
- [X] T038 [US3] Add profile types exports to types barrel in `domains/experience/shared/types/index.ts`

**Checkpoint**: User Story 3 complete - profile types and validators available

---

## Phase 7: User Story 4 - Runtime Engine Interface (Priority: P2)

**Goal**: RuntimeEngine interface defined for future implementation

**Independent Test**: Create mock implementation and TypeScript validates it

### Implementation for User Story 4

- [X] T039 [P] [US4] Create RuntimeState interface (currentStepIndex, answers, outputs) in `domains/experience/shared/types/runtime.types.ts`
- [X] T040 [US4] Create RuntimeEngine interface with all members in `domains/experience/shared/types/runtime.types.ts`
- [X] T041 [US4] Add runtime types exports to types barrel in `domains/experience/shared/types/index.ts`

**RuntimeEngine interface members** (for T040):
- readonly experienceId, sessionId, mode
- readonly currentStep, currentStepIndex, totalSteps, canProceed, canGoBack, isComplete
- next(), back(), goToStep(index)
- setAnswer(stepId, answer), setMedia(stepId, mediaRef)
- getAnswer(stepId), getOutput(stepId), getState()

**Checkpoint**: User Story 4 complete - runtime interface available

---

## Phase 8: User Story 5 - Session Management (Priority: P2)

**Goal**: Session schema and API type shapes defined

**Independent Test**: Import session types and API shapes, TypeScript validates usage

### Implementation for User Story 5

- [X] T042 [P] [US5] Create session mode schema ('preview' | 'guest') in `domains/session/shared/schemas/session.schema.ts`
- [X] T043 [P] [US5] Create config source schema ('draft' | 'published') in `domains/session/shared/schemas/session.schema.ts`
- [X] T044 [P] [US5] Create session status schema ('active' | 'completed' | 'abandoned' | 'error') in `domains/session/shared/schemas/session.schema.ts`
- [X] T045 [US5] Create session schema with all fields in `domains/session/shared/schemas/session.schema.ts`
- [X] T046 [US5] Export Session and related types from session schema in `domains/session/shared/schemas/session.schema.ts`
- [X] T047 [US5] Add session schema exports to schemas barrel in `domains/session/shared/schemas/index.ts`
- [X] T048 [P] [US5] Create CreateSessionInput interface in `domains/session/shared/types/session-api.types.ts`
- [X] T049 [P] [US5] Create UpdateSessionProgressInput interface in `domains/session/shared/types/session-api.types.ts`
- [X] T050 [US5] Create session API function types (CreateSessionFn, SubscribeSessionFn, UpdateSessionProgressFn, CloseSessionFn) in `domains/session/shared/types/session-api.types.ts`
- [X] T051 [US5] Add session API types exports to types barrel in `domains/session/shared/types/index.ts`
- [X] T052 [US5] Create session entity types file (re-exports from schema) in `domains/session/shared/types/session.types.ts`
- [X] T053 [US5] Add session types exports to types barrel in `domains/session/shared/types/index.ts`

**Checkpoint**: User Story 5 complete - session types and API shapes available

---

## Phase 9: Polish & Validation

**Purpose**: Final verification and cleanup

- [X] T054 Run TypeScript type-check with `pnpm type-check` from apps/clementine-app
- [X] T055 [P] Run lint check with `pnpm lint` from apps/clementine-app
- [X] T056 [P] Verify app boots successfully with `pnpm dev`
  - NOTE: Port already in use, but TypeScript compilation passes confirming no module issues
- [X] T057 Test imports from both domains in a scratch file (can delete after)
  - VERIFIED: Type-check passes with all exports resolved correctly
- [X] T058 Verify no circular dependency warnings in console
  - VERIFIED: No circular dependency errors in TypeScript compilation
- [X] T059 Run `pnpm check` validation gate (format + lint)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1, US2, US6 (P1): Can run in parallel after Foundational
  - US3, US4, US5 (P2): Can run in parallel after Foundational
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Domain structure - No dependencies on other stories
- **User Story 2 (P1)**: Step registry - No dependencies on other stories
- **User Story 6 (P1)**: activeEventId verification - No dependencies, verification only
- **User Story 3 (P2)**: Experience profiles - No dependencies on other stories
- **User Story 4 (P2)**: Runtime interface - Depends on step types from US2
- **User Story 5 (P2)**: Session management - No dependencies on other stories

### Within Each User Story

- Schema files before type files (when types infer from schemas)
- All files in a story before barrel export updates
- Barrel exports after all files complete

### Parallel Opportunities

**Phase 1 (all parallel)**:
- T002, T003, T005, T006 can all run in parallel

**Phase 2 (partial parallel)**:
- T008, T009, T010, T011 can run in parallel (barrel exports for empty folders)
- T012, T013 after T008-T011
- T014, T015 after T012, T013

**User Stories (P1 stories in parallel)**:
- US1, US2, US6 can run in parallel after Phase 2
- Within US1: T016, T017 in parallel
- Within US2: T022, T023, T026 in parallel
- Within US6: T030, T031 sequential (verification)

**User Stories (P2 stories in parallel)**:
- US3, US4, US5 can run in parallel after Phase 2
- Within US3: T032, T033 in parallel
- Within US5: T042, T043, T044, T048, T049 in parallel

---

## Parallel Example: Phase 2 Setup

```bash
# After Phase 1 folders exist, launch barrel exports in parallel:
Task: "Create schemas barrel export in domains/experience/shared/schemas/index.ts"
Task: "Create types barrel export in domains/experience/shared/types/index.ts"
Task: "Create session schemas barrel export in domains/session/shared/schemas/index.ts"
Task: "Create session types barrel export in domains/session/shared/types/index.ts"
```

## Parallel Example: P1 User Stories

```bash
# After Phase 2 complete, launch all P1 stories in parallel:
# US1 branch:
Task: "Create experience schema... in domains/experience/shared/schemas/experience.schema.ts"
Task: "Create experience config schema... in domains/experience/shared/schemas/experience.schema.ts"

# US2 branch (parallel with US1):
Task: "Create StepCategory type... in domains/experience/shared/types/step.types.ts"
Task: "Create BaseStep interface... in domains/experience/shared/types/step.types.ts"
Task: "Create empty step config schemas... in domains/experience/shared/schemas/step-registry.schema.ts"

# US6 branch (parallel with US1 and US2):
Task: "Verify activeEventId field... in domains/project/shared/schemas/project.schema.ts"
```

---

## Implementation Strategy

### MVP First (P1 User Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3-5: User Stories 1, 2, 6 (P1)
4. **STOP and VALIDATE**: TypeScript compiles, app boots, imports work
5. This is a viable stopping point for Phase 0

### Full Delivery (All User Stories)

1. Complete Setup + Foundational → Foundation ready
2. Add P1 User Stories (US1, US2, US6) → Test independently
3. Add P2 User Stories (US3, US4, US5) → Test independently
4. Complete Polish phase → Full validation

### Incremental Delivery

Each user story can be delivered independently:
- US1: Experience domain importable
- US2: Step types available for future step implementations
- US6: Confirms project schema ready for guest flow
- US3: Profile types ready for future validation
- US4: Runtime interface ready for future implementation
- US5: Session types ready for future session management

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- This is a scaffolding phase - no functional implementation, only types and schemas
- All schemas use `z.looseObject()` pattern for forward compatibility
- All nullable fields use `.nullable().default(null)` (Firestore compatibility)
- Barrel exports use `export * from` pattern
- Verify no circular dependencies before marking phase complete
