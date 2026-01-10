# Tasks: Experience Data Layer & Event Config Schema

**Input**: Design documents from `/specs/021-exp-data-layer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Included for validation utilities per plan.md (Vitest unit tests for schemas and validation).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **App root**: `apps/clementine-app/src/`
- **Experience domain**: `apps/clementine-app/src/domains/experience/`
- **Event domain**: `apps/clementine-app/src/domains/event/`
- **Firebase**: `firebase/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing scaffolding and prepare for implementation

- [X] T001 Verify experience domain scaffolding exists at `apps/clementine-app/src/domains/experience/`
- [X] T002 [P] Create `apps/clementine-app/src/domains/experience/shared/schemas/` directory if not exists
- [X] T003 [P] Create `apps/clementine-app/src/domains/experience/shared/hooks/` directory if not exists
- [X] T004 [P] Create `apps/clementine-app/src/domains/experience/shared/queries/` directory if not exists
- [X] T005 [P] Create `apps/clementine-app/src/domains/experience/shared/types/` directory if not exists

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schemas that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create workspace experience schema in `apps/clementine-app/src/domains/experience/shared/schemas/workspace-experience.schema.ts` with id, name, status, profile, media, steps, timestamps fields using z.looseObject() pattern
- [X] T007 Create experience reference schema in `apps/clementine-app/src/domains/experience/shared/schemas/experience-reference.schema.ts` with experienceId and enabled fields
- [X] T008 [P] Create experience status enum schema ('active' | 'deleted') in workspace-experience.schema.ts
- [X] T009 [P] Create experience profile enum schema ('freeform' | 'survey' | 'informational') in workspace-experience.schema.ts
- [X] T010 Create barrel export in `apps/clementine-app/src/domains/experience/shared/schemas/index.ts`
- [X] T011 Create TypeScript types in `apps/clementine-app/src/domains/experience/shared/types/workspace-experience.types.ts` for CreateExperienceInput, UpdateExperienceInput
- [X] T012 Create barrel export in `apps/clementine-app/src/domains/experience/shared/types/index.ts`
- [X] T013 Create main barrel export in `apps/clementine-app/src/domains/experience/shared/index.ts` re-exporting from schemas, types, hooks, queries
- [X] T014 Update Firestore security rules in `firebase/firestore.rules` to add `/workspaces/{workspaceId}/experiences/{experienceId}` with admin read/write, no delete

**Checkpoint**: Foundation ready - schemas defined, security rules in place

---

## Phase 3: User Story 1 - Create Experience (Priority: P1) 🎯 MVP

**Goal**: Admin can create a new experience with name and profile

**Independent Test**: Create an experience via hook and verify it persists to Firestore with correct fields

### Implementation for User Story 1

- [X] T015 [US1] Create query options in `apps/clementine-app/src/domains/experience/shared/queries/workspace-experience.query.ts` for single experience fetch
- [X] T016 [US1] Create useCreateExperience mutation hook in `apps/clementine-app/src/domains/experience/shared/hooks/useCreateExperience.ts` with input validation, serverTimestamp, transaction, cache invalidation
- [X] T017 [US1] Add Sentry error reporting to useCreateExperience hook
- [X] T018 [US1] Create barrel export in `apps/clementine-app/src/domains/experience/shared/hooks/index.ts`
- [X] T019 [US1] Create barrel export in `apps/clementine-app/src/domains/experience/shared/queries/index.ts`

**Checkpoint**: User Story 1 complete - can create experiences with name and profile

---

## Phase 4: User Story 2 - List and View Experiences (Priority: P1)

**Goal**: Admin can list all active experiences and view a single experience with real-time updates

**Independent Test**: Query workspace experiences and verify list returns only active experiences sorted by updatedAt

### Implementation for User Story 2

- [X] T020 [US2] Create query options in `apps/clementine-app/src/domains/experience/shared/queries/workspace-experiences.query.ts` for listing active experiences with status filter and updatedAt sort
- [X] T021 [US2] Create useWorkspaceExperiences hook in `apps/clementine-app/src/domains/experience/shared/hooks/useWorkspaceExperiences.ts` with onSnapshot real-time listener and TanStack Query cache update
- [X] T022 [US2] Create useWorkspaceExperience hook in `apps/clementine-app/src/domains/experience/shared/hooks/useWorkspaceExperience.ts` for single experience with real-time subscription
- [X] T023 [US2] Update hooks barrel export in `apps/clementine-app/src/domains/experience/shared/hooks/index.ts`
- [X] T024 [US2] Update queries barrel export in `apps/clementine-app/src/domains/experience/shared/queries/index.ts`

**Checkpoint**: User Stories 1 AND 2 complete - can create and list/view experiences

---

## Phase 5: User Story 5 - Event Experiences Configuration (Priority: P1)

**Goal**: Event config schema includes experiences field with main, pregate, preshare slots

**Independent Test**: Parse event config with experiences field and verify schema validates correctly

### Implementation for User Story 5

- [X] T025 [US5] Create event experiences config schema in `apps/clementine-app/src/domains/event/shared/schemas/event-experiences-config.schema.ts` with main array, pregate/preshare nullable objects
- [X] T026 [US5] Create experience release schema in `apps/clementine-app/src/domains/event/shared/schemas/experience-release.schema.ts` for immutable published snapshots
- [X] T027 [US5] Update project-event-config.schema.ts in `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts` to add experiences field with default empty main array
- [X] T028 [US5] Update Firestore security rules in `firebase/firestore.rules` to add `/projects/{projectId}/experienceReleases/{releaseId}` with public read, admin create, no update/delete
- [X] T029 [US5] Add Firestore index for experiences subcollection (status ASC, updatedAt DESC) in `firebase/firestore.indexes.json`

**Checkpoint**: User Stories 1, 2, AND 5 complete - core data layer functional

---

## Phase 6: User Story 3 - Update Experience (Priority: P2)

**Goal**: Admin can update experience name, media, and steps (profile immutable)

**Independent Test**: Update an experience name and verify change persists with updated timestamp

### Implementation for User Story 3

- [X] T030 [US3] Create useUpdateExperience mutation hook in `apps/clementine-app/src/domains/experience/shared/hooks/useUpdateExperience.ts` with profile immutability check, updatedAt auto-update, transaction
- [X] T031 [US3] Add validation to reject profile changes in useUpdateExperience
- [X] T032 [US3] Add validation to reject updates on deleted experiences
- [X] T033 [US3] Add Sentry error reporting to useUpdateExperience hook
- [X] T034 [US3] Update hooks barrel export in `apps/clementine-app/src/domains/experience/shared/hooks/index.ts`

**Checkpoint**: User Story 3 complete - can update experiences

---

## Phase 7: User Story 4 - Delete Experience (Priority: P2)

**Goal**: Admin can soft-delete an experience

**Independent Test**: Delete an experience and verify status changes to 'deleted' and it no longer appears in list

### Implementation for User Story 4

- [X] T035 [US4] Create useDeleteExperience mutation hook in `apps/clementine-app/src/domains/experience/shared/hooks/useDeleteExperience.ts` with soft delete (status='deleted', deletedAt timestamp)
- [X] T036 [US4] Add idempotency handling for already-deleted experiences
- [X] T037 [US4] Add Sentry error reporting to useDeleteExperience hook
- [X] T038 [US4] Update hooks barrel export in `apps/clementine-app/src/domains/experience/shared/hooks/index.ts`

**Checkpoint**: User Story 4 complete - can soft-delete experiences

---

## Phase 8: User Story 6 - Profile Validation (Priority: P2)

**Goal**: System validates experience profile rules for step types and slot compatibility

**Independent Test**: Run validateExperienceProfile against various step configurations and verify correct pass/fail

### Tests for User Story 6

- [X] T039 [P] [US6] Create profile validation test in `apps/clementine-app/src/domains/experience/validation/profile-rules.test.ts` covering freeform, survey, informational profiles with valid and invalid step types
- [X] T040 [P] [US6] Create slot compatibility test in `apps/clementine-app/src/domains/experience/validation/slot-compatibility.test.ts` covering main, pregate, preshare slot profile restrictions

### Implementation for User Story 6

- [X] T041 [US6] Create step category mapping (STEP_TYPE_CATEGORIES) in `apps/clementine-app/src/domains/experience/validation/profile-rules.ts`
- [X] T042 [US6] Create profile allowed categories mapping (PROFILE_ALLOWED_STEP_CATEGORIES) in `apps/clementine-app/src/domains/experience/validation/profile-rules.ts`
- [X] T043 [US6] Implement validateExperienceProfile function returning ValidationResult with violations array
- [X] T044 [US6] Create slot allowed profiles mapping (SLOT_ALLOWED_PROFILES) in `apps/clementine-app/src/domains/experience/validation/slot-compatibility.ts`
- [X] T045 [US6] Implement isProfileCompatibleWithSlot function
- [X] T046 [US6] Create barrel export in `apps/clementine-app/src/domains/experience/validation/index.ts`
- [X] T047 [US6] Update main experience domain barrel export in `apps/clementine-app/src/domains/experience/index.ts` to include validation exports

**Checkpoint**: User Story 6 complete - profile validation utilities available

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and validation

- [X] T048 Run `pnpm app:type-check` to verify TypeScript compilation
- [X] T049 Run `pnpm app:lint` to verify linting passes
- [X] T050 Run `pnpm app:test` to verify all tests pass
- [ ] T051 Verify Firestore security rules deploy correctly with `pnpm fb:deploy:rules`
- [ ] T052 Verify Firestore indexes deploy correctly with `pnpm fb:deploy:indexes`
- [ ] T053 Manual smoke test: Create, list, update, delete experience via Firestore console or dev tools
- [X] T054 Update `apps/clementine-app/src/domains/experience/index.ts` main barrel export to re-export all public APIs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - US1, US2, US5 are all P1 priority and build on each other
  - US3, US4, US6 are P2 priority and can proceed after P1 stories
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - creates experiences
- **User Story 2 (P1)**: Can start after US1 - needs create to have data to list
- **User Story 5 (P1)**: Can start after Foundational - schema only, no hooks dependency
- **User Story 3 (P2)**: Can start after US1/US2 - needs experiences to exist
- **User Story 4 (P2)**: Can start after US1/US2 - needs experiences to exist
- **User Story 6 (P2)**: Can start after Foundational - validation utilities are standalone

### Within Each User Story

- Schemas before hooks
- Hooks include error handling and cache invalidation
- Tests (US6) written before implementation

### Parallel Opportunities

- T002, T003, T004, T005 can run in parallel (different directories)
- T008, T009 can run in parallel (enum schemas in same file but independent)
- T039, T040 can run in parallel (different test files)
- US5 and US6 can run in parallel (no dependencies between them)

---

## Parallel Example: Foundational Phase

```bash
# Launch all directory setup tasks together:
Task: "Create schemas/ directory"
Task: "Create hooks/ directory"
Task: "Create queries/ directory"
Task: "Create types/ directory"
```

## Parallel Example: User Story 6

```bash
# Launch all tests together (before implementation):
Task: "Create profile validation test in profile-rules.test.ts"
Task: "Create slot compatibility test in slot-compatibility.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 5)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Create Experience)
4. Complete Phase 4: User Story 2 (List/View Experiences)
5. Complete Phase 5: User Story 5 (Event Config Schema)
6. **STOP and VALIDATE**: Test CRUD operations independently
7. Deploy/demo if ready - core data layer is functional

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Can create experiences
3. Add User Story 2 → Can list and view experiences
4. Add User Story 5 → Event config supports experiences
5. Add User Stories 3, 4 → Full CRUD operations
6. Add User Story 6 → Profile validation for data integrity

### P2 Stories After MVP

With MVP complete (US1, US2, US5):
- US3 (Update): Adds editing capability
- US4 (Delete): Adds cleanup capability
- US6 (Validation): Adds data integrity enforcement

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All schemas use `z.looseObject()` for forward compatibility
- All hooks follow existing patterns from workspace/project domains
- Security rules are admin-only for experiences, public read for releases
- Tests co-located with source files per testing.md standard
