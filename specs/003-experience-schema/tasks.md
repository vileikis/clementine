# Tasks: Evolve Experiences Schema

**Input**: Design documents from `/specs/003-experience-schema/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification - tests are included as optional tasks for critical paths only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js 16 monorepo web app. All paths are relative to `web/`:
- Components: `web/src/features/experiences/components/`
- Schemas/Types: `web/src/features/experiences/lib/`
- Server Actions: `web/src/features/experiences/actions/`
- Tests: Co-located with source files (e.g., `schemas.test.ts`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and schema foundation

- [ ] T001 Create discriminated union schema types in web/src/features/experiences/lib/schemas.ts
- [ ] T002 [P] Create migration utility function in web/src/features/experiences/lib/migration.ts
- [ ] T003 [P] Add schema validation tests in web/src/features/experiences/lib/schemas.test.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Define PhotoExperience schema with Zod in web/src/features/experiences/lib/schemas.ts (including PhotoConfig and AiConfig)
- [ ] T005 [P] Define future experience type schemas (VideoExperience, GifExperience, WheelExperience, SurveyExperience) with placeholder implementations in web/src/features/experiences/lib/schemas.ts
- [ ] T006 [P] Create experienceSchema discriminated union combining all experience types in web/src/features/experiences/lib/schemas.ts
- [ ] T007 [P] Define createPhotoExperienceSchema for input validation in web/src/features/experiences/lib/schemas.ts
- [ ] T008 [P] Define updatePhotoExperienceSchema for input validation in web/src/features/experiences/lib/schemas.ts
- [ ] T009 Implement migratePhotoExperience function in web/src/features/experiences/lib/migration.ts
- [ ] T010 [P] Add unit tests for migration function in web/src/features/experiences/lib/migration.test.ts
- [ ] T011 [P] Export all TypeScript types (PhotoExperience, Experience, PhotoConfig, AiConfig, AspectRatio) from web/src/features/experiences/lib/schemas.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create New Photo Experience with Default Configuration (Priority: P1) 🎯 MVP

**Goal**: Event creators can create new photo experiences by providing only a title, with system automatically initializing default config and aiConfig

**Independent Test**: Create a new photo experience with just a title and verify Firestore document has `type: "photo"`, `config: {countdown: 0}`, and `aiConfig: {enabled: false, aspectRatio: "1:1"}`

### Implementation for User Story 1

- [ ] T012 [US1] Implement createPhotoExperienceAction Server Action in web/src/features/experiences/actions/create-experience.ts
- [ ] T013 [US1] Add validation for createPhotoExperienceSchema input in createPhotoExperienceAction
- [ ] T014 [US1] Initialize default values (config.countdown: 0, aiConfig.enabled: false, aiConfig.aspectRatio: "1:1") in createPhotoExperienceAction
- [ ] T015 [US1] Write new experience document to Firestore using Admin SDK in createPhotoExperienceAction
- [ ] T016 [US1] Add revalidatePath call for /events/${eventId} in createPhotoExperienceAction
- [ ] T017 [US1] Return ActionResponse<PhotoExperience> with proper error handling in createPhotoExperienceAction
- [ ] T018 [US1] Verify ExperienceTypeSelector component shows "Coming Soon" badges for non-photo types in web/src/features/experiences/components/shared/ExperienceTypeSelector.tsx (should already be compliant, just verify)
- [ ] T019 [US1] Verify CreateExperienceForm calls createPhotoExperienceAction with correct schema in web/src/features/experiences/components/shared/CreateExperienceForm.tsx (should already be compliant, just verify)

**Checkpoint**: At this point, User Story 1 should be fully functional - new photo experiences create with correct schema

---

## Phase 4: User Story 2 - Edit Existing Photo Experience Configuration (Priority: P1)

**Goal**: Event creators can edit photo experience configuration (countdown, overlay, AI settings) with builder UI reading from and writing to new schema structure

**Independent Test**: Load an existing photo experience, modify config.countdown via UI, save, and verify Firestore document updates only config/aiConfig fields (not legacy flat fields)

### Implementation for User Story 2

- [ ] T020 [US2] Implement updatePhotoExperienceAction Server Action in web/src/features/experiences/actions/update-experience.ts
- [ ] T021 [US2] Add validation for updatePhotoExperienceSchema input in updatePhotoExperienceAction
- [ ] T022 [US2] Fetch existing experience document from Firestore in updatePhotoExperienceAction
- [ ] T023 [US2] Merge partial updates with existing config and aiConfig objects in updatePhotoExperienceAction
- [ ] T024 [US2] Update updatedAt timestamp in updatePhotoExperienceAction
- [ ] T025 [US2] Write merged document to Firestore using Admin SDK in updatePhotoExperienceAction
- [ ] T026 [US2] Add revalidatePath call for /events/${eventId}/experiences/${experienceId} in updatePhotoExperienceAction
- [ ] T027 [US2] Update ExperienceEditor state initialization to read from config.* and aiConfig.* with fallback to legacy fields in web/src/features/experiences/components/shared/ExperienceEditor.tsx (lines 49-90)
- [ ] T028 [US2] Update ExperienceEditor handleSave to write to config and aiConfig nested structure in web/src/features/experiences/components/shared/ExperienceEditor.tsx (lines 66-90)
- [ ] T029 [US2] Verify ExperienceEditorWrapper calls updatePhotoExperienceAction correctly in web/src/features/experiences/components/shared/ExperienceEditorWrapper.tsx (should already work, just verify)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - create and edit experiences with new schema

---

## Phase 5: User Story 3 - Backward Compatibility Migration (Priority: P1)

**Goal**: Existing legacy photo experiences automatically migrate to new schema on save with zero data loss

**Independent Test**: Create a legacy-format experience in Firestore, load it in builder UI, make any edit, save, and verify document now has new schema with all data preserved

### Implementation for User Story 3

- [ ] T030 [US3] Add legacy schema detection logic in updatePhotoExperienceAction in web/src/features/experiences/actions/update-experience.ts
- [ ] T031 [US3] Call migratePhotoExperience function when legacy fields detected in updatePhotoExperienceAction
- [ ] T032 [US3] Remove deprecated flat fields (countdownEnabled, countdownSeconds, overlayEnabled, aiEnabled, aiModel, aiPrompt, aiReferenceImagePaths, aiAspectRatio) after migration in updatePhotoExperienceAction
- [ ] T033 [US3] Validate migrated document against photoExperienceSchema before write in updatePhotoExperienceAction
- [ ] T034 [US3] Add error handling for migration failures with MIGRATION_ERROR code in updatePhotoExperienceAction
- [ ] T035 [US3] Test migration with legacy countdown fields (countdownEnabled: true, countdownSeconds: 5) in web/src/features/experiences/lib/migration.test.ts
- [ ] T036 [P] [US3] Test migration with legacy AI fields (aiEnabled: true, aiPrompt: "test") in web/src/features/experiences/lib/migration.test.ts
- [ ] T037 [P] [US3] Test migration with mixed old and new fields (new fields take precedence) in web/src/features/experiences/lib/migration.test.ts
- [ ] T038 [P] [US3] Test migration with missing fields (defaults to config.countdown: 0, aiConfig.enabled: false) in web/src/features/experiences/lib/migration.test.ts

**Checkpoint**: All user stories should now be independently functional - create, edit, and migrate experiences

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T039 [P] Add error boundary for schema validation failures in experience builder page in web/src/app/events/[eventId]/experiences/[experienceId]/page.tsx
- [ ] T040 [P] Add loading states for Server Action calls in CreateExperienceForm and ExperienceEditor
- [ ] T041 [P] Add toast notifications for success/error states in CreateExperienceForm and ExperienceEditor
- [ ] T042 Add unit tests for ExperienceEditor state initialization (new vs legacy schema) in web/src/features/experiences/components/shared/ExperienceEditor.test.tsx
- [ ] T043 [P] Add unit tests for ExperienceEditor handleSave output structure in web/src/features/experiences/components/shared/ExperienceEditor.test.tsx
- [ ] T044 [P] Add integration test for create experience flow (US1) in web/src/features/experiences/__tests__/create-experience.integration.test.ts
- [ ] T045 [P] Add integration test for edit experience flow (US2) in web/src/features/experiences/__tests__/edit-experience.integration.test.ts
- [ ] T046 [P] Add integration test for migration flow (US3) in web/src/features/experiences/__tests__/migration.integration.test.ts

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T047 Run `pnpm lint` from root and fix all errors/warnings
- [ ] T048 Run `pnpm type-check` from root and resolve all TypeScript errors
- [ ] T049 Run `pnpm test` from root and ensure all tests pass
- [ ] T050 Test create new photo experience in local dev server (`pnpm dev`)
- [ ] T051 Test edit existing photo experience in local dev server
- [ ] T052 Test migration of legacy experience (create legacy doc in Firestore, edit, verify migration)
- [ ] T053 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent but integrates with US1 (uses same schemas)
- **User Story 3 (P1)**: Depends on US2 completion (extends updatePhotoExperienceAction with migration logic)

### Within Each User Story

- Server Actions before component updates
- State initialization before handleSave updates
- Core implementation before tests
- Unit tests before integration tests
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: All Setup tasks (T001, T002, T003) can run in parallel
- **Phase 2**: Tasks T005, T006, T007, T008, T010, T011 can run in parallel after T004 completes
- **User Story 1**: T018 and T019 can run in parallel (verification tasks)
- **User Story 3**: T035, T036, T037, T038 can run in parallel (all are tests)
- **Phase 6**: T039, T040, T041 can run in parallel (different components), T042-T046 can run in parallel (all tests)

---

## Parallel Example: Foundational Phase

```bash
# After T004 completes, launch these tasks together:
Task: "Define future experience type schemas in web/src/features/experiences/lib/schemas.ts"
Task: "Create experienceSchema discriminated union in web/src/features/experiences/lib/schemas.ts"
Task: "Define createPhotoExperienceSchema in web/src/features/experiences/lib/schemas.ts"
Task: "Define updatePhotoExperienceSchema in web/src/features/experiences/lib/schemas.ts"
Task: "Add unit tests for migration function in web/src/features/experiences/lib/migration.test.ts"
Task: "Export all TypeScript types from web/src/features/experiences/lib/schemas.ts"
```

---

## Parallel Example: User Story 3 Tests

```bash
# Launch all migration tests together:
Task: "Test migration with legacy countdown fields in web/src/features/experiences/lib/migration.test.ts"
Task: "Test migration with legacy AI fields in web/src/features/experiences/lib/migration.test.ts"
Task: "Test migration with mixed old and new fields in web/src/features/experiences/lib/migration.test.ts"
Task: "Test migration with missing fields in web/src/features/experiences/lib/migration.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T011) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T012-T019)
4. **STOP and VALIDATE**: Test US1 independently - create new photo experience, verify Firestore schema
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (schemas, migration logic)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! - can create new experiences)
3. Add User Story 2 → Test independently → Deploy/Demo (can edit experiences)
4. Add User Story 3 → Test independently → Deploy/Demo (legacy experiences migrate)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T011)
2. Once Foundational is done:
   - Developer A: User Story 1 (T012-T019)
   - Developer B: User Story 2 (T020-T029) - can start in parallel with US1
   - Developer C: User Story 3 (T030-T038) - starts after US2 completes
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability (US1, US2, US3)
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths are absolute and specific to avoid ambiguity
- Schema validation with Zod ensures type safety at runtime (TSR-001 through TSR-005)
- Migration on save ensures zero data loss (FR-008)
- Backward compatibility during reads prevents errors during transition (FR-009)
- Tests co-located with source files per minimal testing strategy (Constitution Principle IV)
