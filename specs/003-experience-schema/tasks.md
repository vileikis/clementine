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

## Action File Organization Strategy

**Flat structure with explicit naming** to prevent duplication and scale cleanly:

```
web/src/features/experiences/actions/
├── index.ts                 # Barrel export (all actions + types)
├── types.ts                 # ActionResponse, shared types, error codes
├── photo-create.ts          # createPhotoExperience (new schema)
├── photo-update.ts          # updatePhotoExperience (new schema + migration)
├── photo-media.ts           # uploadPreview, uploadOverlay, deletePreview, deleteOverlay
├── shared.ts                # deleteExperience (works for all types)
├── legacy.ts                # Old flat-schema actions (deprecated, for backward compat)
└── utils.ts                 # checkAuth, validateEventExists, etc.
```

**Migration Path**:
- **Phase 3** (Current): New `photo-create.ts` coexists with `lib/actions.ts`
- **Phase 4-5**: Create full actions/ structure, migrate components to use new imports
- **Phase 6**: Move `lib/actions.ts` → `actions/legacy.ts`, mark deprecated
- **Future**: Add `video-create.ts`, `video-update.ts`, etc. as needed

**Key Principles**:
- **Explicit naming**: `photo-create.ts` not `create.ts` (clear which type)
- **Flat structure**: All files at same level (easy to find, no deep nesting)
- **Barrel exports**: `actions/index.ts` exports everything (clean imports)
- **Schema reuse**: Import Zod schemas from `lib/schemas.ts` (no duplication)
- **Shared utilities**: `utils.ts` for auth checks, event validation (DRY)

**Example Imports After Migration**:
```typescript
// Components import from barrel
import { createPhotoExperience, ActionResponse } from '@/features/experiences/actions';

// Or specific imports
import { createPhotoExperience } from '@/features/experiences/actions/photo-create';
import type { ActionResponse } from '@/features/experiences/actions/types';
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and schema foundation

- [X] T001 Create discriminated union schema types in web/src/features/experiences/lib/schemas.ts
- [X] T002 [P] Create migration utility function in web/src/features/experiences/lib/migration.ts
- [X] T003 [P] Add schema validation tests in web/src/features/experiences/lib/schemas.test.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Define PhotoExperience schema with Zod in web/src/features/experiences/lib/schemas.ts (including PhotoConfig and AiConfig)
- [X] T005 [P] Define future experience type schemas (VideoExperience, GifExperience, WheelExperience, SurveyExperience) with placeholder implementations in web/src/features/experiences/lib/schemas.ts
- [X] T006 [P] Create experienceSchema discriminated union combining all experience types in web/src/features/experiences/lib/schemas.ts
- [X] T007 [P] Define createPhotoExperienceSchema for input validation in web/src/features/experiences/lib/schemas.ts
- [X] T008 [P] Define updatePhotoExperienceSchema for input validation in web/src/features/experiences/lib/schemas.ts
- [X] T009 Implement migratePhotoExperience function in web/src/features/experiences/lib/migration.ts
- [X] T010 [P] Add unit tests for migration function in web/src/features/experiences/lib/migration.test.ts
- [X] T011 [P] Export all TypeScript types (PhotoExperience, Experience, PhotoConfig, AiConfig, AspectRatio) from web/src/features/experiences/lib/schemas.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✅

---

## Phase 3: User Story 1 - Create New Photo Experience with Default Configuration (Priority: P1) 🎯 MVP

**Goal**: Event creators can create new photo experiences by providing only a title, with system automatically initializing default config and aiConfig

**Independent Test**: Create a new photo experience with just a title and verify Firestore document has `type: "photo"`, `config: {countdown: 0}`, and `aiConfig: {enabled: false, aspectRatio: "1:1"}`

### Implementation for User Story 1

- [X] T012 [US1] Implement createPhotoExperience in web/src/features/experiences/actions/photo-create.ts (temporarily named create-experience.ts in Phase 3)
- [X] T013 [US1] Add validation using createPhotoExperienceSchema from lib/schemas.ts
- [X] T014 [US1] Initialize default values (config.countdown: 0, aiConfig.enabled: false, aiConfig.aspectRatio: "1:1")
- [X] T015 [US1] Write new experience document to Firestore using Admin SDK
- [X] T016 [US1] Add revalidatePath call for /events/${eventId}
- [X] T017 [US1] Return ActionResponse<PhotoExperience> with proper error handling
- [X] T018 [US1] Verify ExperienceTypeSelector shows "Coming Soon" badges for non-photo types (verified - already compliant)
- [X] T019 [US1] Update CreateExperienceForm to import from new action file (completed - uses createPhotoExperienceAction)

**Checkpoint**: At this point, User Story 1 should be fully functional - new photo experiences create with correct schema ✅

---

## Phase 4: User Story 2 - Edit Existing Photo Experience Configuration (Priority: P1)

**Goal**: Event creators can edit photo experience configuration (countdown, overlay, AI settings) with builder UI reading from and writing to new schema structure

**Independent Test**: Load an existing photo experience, modify config.countdown via UI, save, and verify Firestore document updates only config/aiConfig fields (not legacy flat fields)

### Implementation for User Story 2

- [X] T020 [US2] Implement updatePhotoExperience in web/src/features/experiences/actions/photo-update.ts
- [X] T021 [US2] Add validation using updatePhotoExperienceSchema from lib/schemas.ts
- [X] T022 [US2] Fetch existing experience document from Firestore
- [X] T023 [US2] Merge partial updates with existing config and aiConfig objects (deep merge)
- [X] T024 [US2] Update updatedAt timestamp
- [X] T025 [US2] Write merged document to Firestore using Admin SDK
- [X] T026 [US2] Add revalidatePath call for /events/${eventId}/experiences/${experienceId}
- [X] T027 [US2] Update ExperienceEditor state initialization to read from config.* and aiConfig.* with fallback to legacy fields (web/src/features/experiences/components/shared/ExperienceEditor.tsx lines 49-90)
- [X] T028 [US2] Update ExperienceEditor handleSave to write to config and aiConfig nested structure (web/src/features/experiences/components/shared/ExperienceEditor.tsx lines 66-90)
- [X] T029 [US2] Update ExperienceEditorWrapper to import from actions/photo-update.ts (web/src/features/experiences/components/shared/ExperienceEditorWrapper.tsx)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - create and edit experiences with new schema

---

## Phase 5: User Story 3 - Backward Compatibility Migration (Priority: P1)

**Goal**: Existing legacy photo experiences automatically migrate to new schema on save with zero data loss

**Independent Test**: Create a legacy-format experience in Firestore, load it in builder UI, make any edit, save, and verify document now has new schema with all data preserved

### Implementation for User Story 3

- [X] T030 [US3] Add legacy schema detection logic in updatePhotoExperience (web/src/features/experiences/actions/photo-update.ts)
- [X] T031 [US3] Call migratePhotoExperience from lib/migration.ts when legacy fields detected
- [X] T032 [US3] Remove deprecated flat fields after migration (countdownEnabled, countdownSeconds, overlayEnabled, aiEnabled, aiModel, aiPrompt, aiReferenceImagePaths, aiAspectRatio)
- [X] T033 [US3] Validate migrated document against photoExperienceSchema from lib/schemas.ts before write
- [X] T034 [US3] Add error handling for migration failures with MIGRATION_ERROR code
- [ ] T035 [US3] Test migration with legacy countdown fields (countdownEnabled: true, countdownSeconds: 5) in web/src/features/experiences/lib/migration.test.ts
- [ ] T036 [P] [US3] Test migration with legacy AI fields (aiEnabled: true, aiPrompt: "test") in web/src/features/experiences/lib/migration.test.ts
- [ ] T037 [P] [US3] Test migration with mixed old and new fields (new fields take precedence) in web/src/features/experiences/lib/migration.test.ts
- [ ] T038 [P] [US3] Test migration with missing fields (defaults to config.countdown: 0, aiConfig.enabled: false) in web/src/features/experiences/lib/migration.test.ts

**Checkpoint**: All user stories should now be independently functional - create, edit, and migrate experiences

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T039 [P] Add error boundary for schema validation failures in experience builder page in web/src/app/events/[eventId]/experiences/[experienceId]/page.tsx
- [X] T040 [P] Add loading states for Server Action calls in CreateExperienceForm and ExperienceEditor
- [X] T041 [P] Add toast notifications for success/error states in CreateExperienceForm and ExperienceEditor
- [ ] T042 Add unit tests for ExperienceEditor state initialization (new vs legacy schema) in web/src/features/experiences/components/shared/ExperienceEditor.test.tsx
- [ ] T043 [P] Add unit tests for ExperienceEditor handleSave output structure in web/src/features/experiences/components/shared/ExperienceEditor.test.tsx
- [ ] T044 [P] Add integration test for create experience flow (US1) in web/src/features/experiences/__tests__/create-experience.integration.test.ts
- [ ] T045 [P] Add integration test for edit experience flow (US2) in web/src/features/experiences/__tests__/edit-experience.integration.test.ts
- [ ] T046 [P] Add integration test for migration flow (US3) in web/src/features/experiences/__tests__/migration.integration.test.ts

### Action File Reorganization (Post-Implementation Cleanup)

**Purpose**: Migrate to flat action file structure and eliminate duplication

- [X] T047 Create web/src/features/experiences/actions/types.ts (export ActionResponse and error codes)
- [X] T048 Create web/src/features/experiences/actions/utils.ts (checkAuth, validateEventExists helpers)
- [X] T049 Rename web/src/features/experiences/actions/create-experience.ts → photo-create.ts
- [X] T050 Create web/src/features/experiences/actions/photo-update.ts (move updatePhotoExperience logic)
- [X] T051 Create web/src/features/experiences/actions/photo-media.ts (move uploadPreview, uploadOverlay, deletePreview, deleteOverlay from lib/actions.ts)
- [X] T052 Create web/src/features/experiences/actions/shared.ts (move deleteExperience from lib/actions.ts)
- [X] T053 Move web/src/features/experiences/lib/actions.ts → actions/legacy.ts and add @deprecated JSDoc comments
- [X] T054 Create web/src/features/experiences/actions/index.ts barrel export (export all actions + types)
- [X] T055 Update all component imports to use new action paths (CreateExperienceForm, ExperienceEditor, ExperienceEditorWrapper, etc.)
- [X] T056 Verify all schemas are imported from lib/schemas.ts (no inline Zod schema definitions in actions)
- [X] T057 Add deprecation warnings in legacy.ts for all exported functions

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T058 Run `pnpm lint` from root and fix all errors/warnings
- [X] T059 Run `pnpm type-check` from root and resolve all TypeScript errors
- [X] T060 Run `pnpm test` from root and ensure all tests pass
- [ ] T061 Test create new photo experience in local dev server (`pnpm dev`)
- [ ] T062 Test edit existing photo experience in local dev server
- [ ] T063 Test migration of legacy experience (create legacy doc in Firestore, edit, verify migration)
- [ ] T064 Commit only after validation loop passes cleanly

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
