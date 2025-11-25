# Tasks: Experiences Feature Standards Compliance

**Input**: Design documents from `/specs/001-exp-standard-compliance/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: No new tests requested. Existing tests will be migrated with import path updates only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Base path**: `web/src/features/experiences/`
- All paths below are relative to this unless prefixed with `@/`

---

## Phase 1: Setup (Create New Folder Structure)

**Purpose**: Create the new folder structure per feature-modules.md standard

- [x] T001 Create `repositories/` folder in `web/src/features/experiences/`
- [x] T002 [P] Create `schemas/` folder in `web/src/features/experiences/`
- [x] T003 [P] Create `types/` folder in `web/src/features/experiences/`

---

## Phase 2: Foundational (File Migration)

**Purpose**: Move files to new locations using git mv to preserve history

**⚠️ CRITICAL**: These moves must complete before import updates in any user story

### Schema Migration

- [x] T004 Move `lib/schemas.ts` → `schemas/experiences.schemas.ts` using git mv
- [x] T005 Move `lib/schemas.test.ts` → `schemas/experiences.schemas.test.ts` using git mv
- [x] T006 Create barrel export `schemas/index.ts` with `export * from './experiences.schemas'`

### Repository Migration

- [x] T007 Move `lib/repository.ts` → `repositories/experiences.repository.ts` using git mv
- [x] T008 Create barrel export `repositories/index.ts` with `export * from './experiences.repository'`

### Constants Migration

- [x] T009 Move `lib/constants.ts` → `constants.ts` (feature root) using git mv

### Types Extraction

- [x] T010 Create `types/experiences.types.ts` extracting type exports from schemas (Zod-inferred types)
- [x] T011 Create barrel export `types/index.ts` with `export * from './experiences.types'`

**Checkpoint**: File structure is now compliant. Import updates can begin.

---

## Phase 3: User Story 1 - Developer Navigates Feature Structure (Priority: P1) 🎯 MVP

**Goal**: Files are organized by technical concern with explicit naming conventions

**Independent Test**: Developer can locate schemas, actions, and types within 30 seconds using folder navigation

### Implementation for User Story 1

- [x] T012 [US1] Update import in `schemas/experiences.schemas.test.ts` from `./schemas` → `./experiences.schemas`
- [x] T013 [US1] Update import in `repositories/experiences.repository.ts` from `./schemas` → `../schemas`
- [x] T014 [P] [US1] Create barrel export `components/gif/index.ts` exporting GifCaptureSettings, GifExperienceEditor
- [x] T015 [P] [US1] Create barrel export `components/photo/index.ts` exporting CountdownSettings, OverlaySettings, PhotoExperienceEditor
- [x] T016 [P] [US1] Create barrel export `components/shared/index.ts` exporting all shared components
- [x] T017 [US1] Update `components/index.ts` to re-export from `./gif`, `./photo`, `./shared` subfolders

**Checkpoint**: User Story 1 complete - folder structure is navigable and follows naming convention

---

## Phase 4: User Story 2 - Developer Imports Feature Components (Priority: P1)

**Goal**: Clean imports from public API without server-only code leakage

**Independent Test**: Import from `@/features/experiences` in client component without bundling errors

### Implementation for User Story 2

- [x] T018 [P] [US2] Update import in `actions/photo-create.ts` from `../lib/schemas` → `../schemas`
- [x] T019 [P] [US2] Update import in `actions/photo-update.ts` from `../lib/schemas` → `../schemas`
- [x] T020 [P] [US2] Update import in `actions/gif-create.ts` from `../lib/schemas` → `../schemas`
- [x] T021 [P] [US2] Update import in `actions/gif-update.ts` from `../lib/schemas` → `../schemas`
- [x] T022 [P] [US2] Update import in `actions/photo-media.ts` from `../lib/schemas` → `../schemas`
- [x] T023 [US2] Update `index.ts` (feature root) imports from `./lib/constants` → `./constants`
- [x] T024 [US2] Update `index.ts` (feature root) imports from `./lib/schemas` → `./schemas`
- [x] T025 [US2] Verify `index.ts` exports ONLY components, hooks, and types (no actions, repos, schemas)
- [x] T026 [US2] Update external import in `app/(dashboard)/events/[eventId]/(studio)/design/experiences/[experienceId]/page.tsx` from `@/features/experiences/lib/repository` → `@/features/experiences/repositories`

**Checkpoint**: User Story 2 complete - imports work correctly from public API and direct paths

---

## Phase 5: User Story 3 - Developer Extends Feature (Priority: P2)

**Goal**: Clear patterns for adding new experience types

**Independent Test**: New type can be added following established patterns in schemas, components, actions

### Implementation for User Story 3

- [x] T027 [US3] Verify discriminated union pattern in `schemas/experiences.schemas.ts` is clearly documented with inline comments
- [x] T028 [US3] Verify `components/` subfolder pattern is consistent (each type has own folder with barrel export)
- [x] T029 [US3] Verify `actions/` naming pattern is consistent (`[type]-create.ts`, `[type]-update.ts`)

**Checkpoint**: User Story 3 complete - patterns are clear and documented for extension

---

## Phase 6: User Story 4 - Developer Validates Experience Data (Priority: P2)

**Goal**: Schemas use Zod v4 patterns with constants for constraints

**Independent Test**: Schemas validate correctly and reference constants, no magic numbers

### Implementation for User Story 4

- [x] T030 [US4] Audit `schemas/experiences.schemas.ts` for Zod v4 compliance (z.email() not z.string().email())
- [x] T031 [US4] Audit `schemas/experiences.schemas.ts` for magic numbers and extract to `constants.ts` if found
- [x] T032 [US4] Verify optional fields use `.nullable().optional().default(null)` for Firestore compatibility
- [x] T033 [US4] Verify nested schemas are extracted to named variables (no inline complex schemas)

**Checkpoint**: User Story 4 complete - validation patterns comply with standards

---

## Phase 7: Code Cleanup

**Purpose**: Remove deprecated/duplicate code

- [x] T034 Delete `actions/legacy.ts` (deprecated file, 815 lines)
- [x] T035 [P] Delete `components/photo/AITransformSettings.tsx` (duplicate of shared version)
- [x] T036 [P] Delete `components/photo/AITransformSettings.test.tsx` (test for deleted duplicate)
- [x] T037 [P] Update any imports of photo AITransformSettings to use shared version
- [x] T038 Delete empty `hooks/` folder
- [x] T039 Delete `lib/` folder (should be empty after migrations)

**Checkpoint**: All deprecated/duplicate code removed

---

## Phase 8: User Story 5 - CI Pipeline Validates (Priority: P3) & Polish

**Goal**: Feature passes all lint, type-check, and test validations

**Independent Test**: `pnpm lint`, `pnpm type-check`, `pnpm test` all pass

### Validation Loop (REQUIRED - Constitution Principle V)

- [x] T040 [US5] Run `pnpm type-check` and fix all TypeScript errors in experiences feature
- [x] T041 [US5] Run `pnpm lint` and fix all ESLint errors/warnings in experiences feature
- [x] T042 [US5] Run `pnpm test` and ensure all existing tests pass
- [ ] T043 [US5] Verify feature in local dev server (`pnpm dev`) - test experience creation/editing flow

### Final Verification

- [x] T044 Verify no files remain in `lib/` folder (SC-007)
- [x] T045 Verify only one `AITransformSettings.tsx` exists in `shared/` (SC-008)
- [x] T046 List all files in feature directory to verify `[domain].[purpose].ts` naming (SC-006)
- [ ] T047 Commit final changes after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - folder structure and file moves
- **User Story 2 (Phase 4)**: Depends on Foundational - import paths need new locations to exist
- **User Story 3 (Phase 5)**: Depends on US1 and US2 - patterns must be in place
- **User Story 4 (Phase 6)**: Depends on US1 - schemas must be in new location
- **Cleanup (Phase 7)**: Depends on all import updates complete (US2)
- **Validation (Phase 8)**: Depends on all user stories and cleanup

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Can run in parallel with US1
- **User Story 3 (P2)**: Depends on US1 and US2 completion for stable patterns
- **User Story 4 (P2)**: Depends on US1 completion (schemas in new location)
- **User Story 5 (P3)**: Depends on all other stories (validates final state)

### Parallel Opportunities

**Within Phase 1 (Setup):**
```
T001, T002, T003 can all run in parallel
```

**Within Phase 2 (Foundational):**
```
T004-T006 (schemas), T007-T008 (repos), T009 (constants), T010-T011 (types)
can run in parallel as they touch different folders
```

**Within Phase 3 (US1):**
```
T014, T015, T016 can run in parallel (different component folders)
```

**Within Phase 4 (US2):**
```
T018, T019, T020, T021, T022 can run in parallel (different action files)
```

**Within Phase 7 (Cleanup):**
```
T034, T035, T036 can run in parallel (different files)
```

---

## Parallel Example: User Story 2 Import Updates

```bash
# Launch all action import updates together (5 parallel tasks):
Task: "Update import in actions/photo-create.ts from ../lib/schemas → ../schemas"
Task: "Update import in actions/photo-update.ts from ../lib/schemas → ../schemas"
Task: "Update import in actions/gif-create.ts from ../lib/schemas → ../schemas"
Task: "Update import in actions/gif-update.ts from ../lib/schemas → ../schemas"
Task: "Update import in actions/photo-media.ts from ../lib/schemas → ../schemas"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (create folders)
2. Complete Phase 2: Foundational (move files)
3. Complete Phase 3: User Story 1 (folder structure navigable)
4. Complete Phase 4: User Story 2 (imports work correctly)
5. **STOP and VALIDATE**: Run type-check and lint
6. Can merge/deploy at this point - core refactoring complete

### Full Delivery

1. MVP (above)
2. Complete Phase 5: User Story 3 (patterns documented)
3. Complete Phase 6: User Story 4 (validation compliance)
4. Complete Phase 7: Cleanup (remove deprecated code)
5. Complete Phase 8: User Story 5 (full validation)

### Risk Mitigation

Run `pnpm type-check` after:
- Phase 2 completion (file moves)
- Phase 3 completion (US1 barrel exports)
- Phase 4 completion (US2 import updates)
- Phase 7 completion (cleanup deletions)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Use `git mv` for file moves to preserve history
- No new tests required - existing tests migrated with import updates only
- Zero runtime behavior changes expected - only file organization
- Commit after each phase for easy rollback if needed
