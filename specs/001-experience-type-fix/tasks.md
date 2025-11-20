# Tasks: Experience Type System Consolidation

**Input**: Design documents from `/specs/001-experience-type-fix/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/repository-contracts.md, quickstart.md

**Tests**: Tests are NOT included in this refactoring task list per spec requirements (minimal testing strategy, existing tests will be updated).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `web/src/` for Next.js app
- All paths relative to repository root
- Experience feature: `web/src/features/experiences/`

## Phase 1: Setup (Pre-Migration)

**Purpose**: Prepare for type consolidation and document current state

- [X] T001 Document current Firestore Experience documents structure (optional - for test data recreation)
- [X] T002 Verify clean slate approach is safe (check Firebase Console for production data)
- [X] T003 Create backup of test data structure if needed (manual - screenshot or notes)

**Checkpoint**: Pre-migration preparation complete, ready to delete legacy files

---

## Phase 2: User Story 1 - Developer Works with Single Type System (Priority: P1) 🎯 MVP

**Goal**: Establish single source of truth for Experience types by removing legacy type definitions and migration code, enabling developers to work with one consistent type system.

**Independent Test**: Verify all Experience code imports from `schemas.ts` only, TypeScript compilation succeeds with zero errors, no references to `experience.types.ts` or `migration.ts` exist in codebase.

### Core Cleanup

- [X] T004 [P] [US1] Delete migration utility file `web/src/features/experiences/lib/migration.ts`
- [X] T005 [P] [US1] Delete migration test file `web/src/features/experiences/lib/migration.test.ts`
- [X] T006 [US1] Delete legacy types file `web/src/features/experiences/types/experience.types.ts`

### Repository Layer Updates

- [X] T007 [US1] Update repository imports in `web/src/features/experiences/lib/repository.ts` (change line 4 from `experience.types.ts` to `schemas.ts`)
- [X] T008 [US1] Update `createExperience` function in `web/src/features/experiences/lib/repository.ts` to use nested `config` and `aiConfig` structure
- [X] T009 [US1] Update `updateExperience` parameter type from `Partial<Experience>` to `Partial<PhotoExperience>` in `web/src/features/experiences/lib/repository.ts`
- [X] T010 [US1] Add Zod validation to `getExperience` function in `web/src/features/experiences/lib/repository.ts` using `photoExperienceSchema.parse()`
- [X] T011 [US1] Add Zod validation to `listExperiences` function in `web/src/features/experiences/lib/repository.ts` using `photoExperienceSchema.parse()`

### Barrel Export Updates

- [X] T012 [US1] Update barrel export types in `web/src/features/experiences/index.ts` (lines 51-59) to export from `schemas.ts` instead of `experience.types.ts`

### TypeScript Validation

- [X] T013 [US1] Run `pnpm type-check` from repository root to identify all TypeScript errors from type changes
- [X] T014 [US1] Review TypeScript errors and create list of remaining files needing import updates

**Checkpoint**: Repository layer and exports updated - TypeScript errors will guide remaining component updates

---

## Phase 3: User Story 2 - Experience Data Follows Consistent Schema (Priority: P2)

**Goal**: Ensure all Experience data in Firestore follows the new schema structure with nested `config` and `aiConfig` objects, with runtime validation enforcing schema compliance.

**Independent Test**: Create, read, update, and delete Experience documents; verify Firestore documents match new schema structure with nested objects; confirm validation catches invalid data.

### Server Actions Updates

- [X] T015 [P] [US2] Remove migration logic from `web/src/features/experiences/actions/photo-update.ts` (delete migration check block and `stripLegacyFields` call)
- [X] T016 [P] [US2] Verify `photo-create.ts` in `web/src/features/experiences/actions/` already uses correct schema (no changes needed, just confirm)
- [X] T017 [US2] Add deprecation notice to `web/src/features/experiences/actions/legacy.ts` file header

### Data Migration

- [X] T018 [US2] Wipe all Experience documents from Firestore (manual - Firebase Console: `/events/{eventId}/experiences` subcollections)
- [X] T019 [US2] Verify Firestore is empty of Experience documents (manual - Firebase Console check)

### Manual Testing (CRUD Operations)

- [ ] T020 [US2] Start dev server with `pnpm dev` from repository root
- [ ] T021 [US2] Test: Create new photo experience, verify Firestore document has nested `config` and `aiConfig` objects
- [ ] T022 [US2] Test: Read experience, verify no validation errors in browser console
- [ ] T023 [US2] Test: Update experience settings, verify Firestore document preserves nested structure
- [ ] T024 [US2] Test: Delete experience, verify clean removal from Firestore

**Checkpoint**: Repository validation works correctly, all CRUD operations use new schema structure

---

## Phase 4: User Story 3 - Clean Codebase Without Migration Artifacts (Priority: P3)

**Goal**: Remove all legacy type references from UI components and verify codebase is free of migration artifacts, completing the consolidation.

**Independent Test**: Search codebase for `experience.types.ts` and `migration.ts` references returns zero results; UI components import from `schemas.ts` only; no type guards for legacy schema exist.

### Component Updates (7 files)

- [ ] T025 [P] [US3] Update `web/src/features/experiences/components/shared/ExperiencesList.tsx` to import `PhotoExperience` from `../../lib/schemas` (line 6)
- [ ] T026 [P] [US3] Update `web/src/features/experiences/components/shared/ExperienceEditorWrapper.tsx` to import `PhotoExperience` from `../../lib/schemas` (line 15)
- [ ] T027 [P] [US3] Update `web/src/features/experiences/components/shared/ExperienceTypeSelector.tsx` to import `ExperienceType` from `../../lib/schemas` (line 11)
- [ ] T028 [P] [US3] Update `web/src/features/experiences/components/shared/PreviewMediaUpload.tsx` to import `PreviewType` from `../../lib/schemas` (line 8)
- [ ] T029 [P] [US3] Update `web/src/features/experiences/components/photo/AITransformSettings.tsx` to import `AspectRatio` from `../../lib/schemas` (line 10)
- [ ] T030 [US3] Update `web/src/features/experiences/components/shared/ExperienceEditor.tsx` to consolidate imports (lines 16-17), remove dual-type handling, and remove type guard (lines 49-51)
- [ ] T031 [US3] Simplify state initialization in `web/src/features/experiences/components/shared/ExperienceEditor.tsx` (lines 54-90) to remove legacy field fallbacks

### Test File Updates

- [ ] T032 [US3] Update `web/src/features/experiences/components/shared/ExperienceEditor.test.tsx` to import `PhotoExperience` from `../../lib/schemas` and update test data structure (line 3)

### Cleanup & Verification

- [ ] T033 [US3] Remove empty `web/src/features/experiences/types/` directory if no other files remain
- [ ] T034 [US3] Search codebase for `experience.types.ts` imports with `grep -r "experience.types" web/src/` (expect zero results)
- [ ] T035 [US3] Search codebase for `migration` references with `grep -r "migration" web/src/features/experiences/` (expect zero results)

**Checkpoint**: All component imports updated, no legacy references remain in codebase

---

## Phase 5: Polish & Validation Loop

**Purpose**: Final validation and quality checks before merge

### Code Quality Checks

- [ ] T036 [P] Run `pnpm lint` from repository root and fix all ESLint errors/warnings
- [ ] T037 [P] Run `pnpm type-check` from repository root and verify zero TypeScript errors
- [ ] T038 Run `pnpm dev` and manually test Experience CRUD in browser (create, edit, delete)

### Final Verification

- [ ] T039 Verify Firestore Experience documents match PhotoExperience schema structure (manual - Firebase Console inspection)
- [ ] T040 Test: Create Experience with various settings (countdown, AI, overlay) and verify nested structure
- [ ] T041 Test: Refresh page and verify repository validation catches invalid data (if any test documents exist)
- [ ] T042 Verify no runtime errors in browser console during Experience operations

### Documentation & Cleanup

- [ ] T043 Update `CLAUDE.md` if it references old Experience types (search for "experience.types")
- [ ] T044 Remove unused imports flagged by ESLint in any updated files

**Checkpoint**: Validation loop complete, feature ready for commit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **User Story 2 (Phase 3)**: Depends on User Story 1 completion (needs repository validation in place)
- **User Story 3 (Phase 4)**: Depends on User Story 1 completion (needs repository types updated before component imports)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - can start after Setup
- **User Story 2 (P2)**: Depends on US1 (needs repository validation)
- **User Story 3 (P3)**: Depends on US1 (needs repository types), can run parallel with US2

### Critical Path

```
Setup (T001-T003)
  → US1: Delete files + Update repository (T004-T014)
    → US2: Update actions + Test CRUD (T015-T024)
    → US3: Update components (T025-T035)
      → Polish: Validation loop (T036-T044)
```

### Parallel Opportunities

**Within User Story 1**:
- T004, T005 can run in parallel (delete different files)
- Once repository updated: T013, T014 run sequentially (type-check then review errors)

**Within User Story 2**:
- T015, T016, T017 can run in parallel (different action files)
- T020-T024 must run sequentially (manual testing steps)

**Within User Story 3**:
- T025, T026, T027, T028, T029 can ALL run in parallel (different component files)
- T030, T031, T032 must run sequentially (same file edits)

**Polish Phase**:
- T036, T037 can run in parallel (lint and type-check are independent)

---

## Parallel Example: User Story 3 Components

```bash
# Launch all component import updates together (5 files):
Task T025: "Update ExperiencesList.tsx imports"
Task T026: "Update ExperienceEditorWrapper.tsx imports"
Task T027: "Update ExperienceTypeSelector.tsx imports"
Task T028: "Update PreviewMediaUpload.tsx imports"
Task T029: "Update AITransformSettings.tsx imports"

# These can all run in parallel since they update different files
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: User Story 1 (T004-T014)
3. **STOP and VALIDATE**: Run `pnpm type-check` to see remaining errors
4. Decision point: Continue to US2 or fix all type errors first

### Recommended Sequential Approach

1. Setup → US1 → US2 → US3 → Polish
2. Rationale: US2 and US3 both depend on US1 repository updates
3. US2 (data validation) and US3 (component cleanup) can overlap slightly
4. Each story checkpoint provides validation before proceeding

### Fastest Path (Parallel with 2 developers)

1. Both: Complete Setup + US1 together (T001-T014)
2. Dev A: User Story 2 (T015-T024) - Server actions + data testing
3. Dev B: User Story 3 (T025-T035) - Component updates
4. Both: Polish + validation loop together (T036-T044)

---

## Task Summary

- **Total Tasks**: 44
- **Setup (Phase 1)**: 3 tasks
- **User Story 1 (Phase 2)**: 11 tasks (delete files, update repository, validate types)
- **User Story 2 (Phase 3)**: 10 tasks (update actions, wipe data, test CRUD)
- **User Story 3 (Phase 4)**: 11 tasks (update 7 components, cleanup, verify)
- **Polish (Phase 5)**: 9 tasks (validation loop, final checks)

**Parallel Opportunities**: 13 tasks marked [P] can run in parallel within their phases

**Independent Test Criteria**:
- US1: TypeScript compilation passes, no legacy type imports exist
- US2: CRUD operations work, Firestore documents match schema
- US3: Component imports updated, codebase search shows zero legacy references

**MVP Scope**: User Story 1 only (T001-T014) establishes single type system - provides immediate value to developers

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story] Description with file path`
- [P] tasks = different files, no dependencies within phase
- [Story] labels (US1, US2, US3) map to spec.md user stories
- Setup and Polish phases have no story labels (cross-cutting)
- Each user story checkpoint enables independent validation
- Manual testing tasks (T018-T024, T039-T042) require running dev server and Firebase Console access
- Validation loop (Constitution Principle V) is enforced in Phase 5
- Zero test generation per spec requirements (minimal testing, update existing tests only)
