# Tasks: Media Assets Shared Schema

**Input**: Design documents from `/specs/040-media-assets-shared/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Schema validation tests are included per constitution (Principle IV - Minimal Testing Strategy).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **packages/shared/**: Zod schemas (single source of truth)
- **apps/clementine-app/**: TanStack Start app (frontend)
- **functions/**: Firebase Cloud Functions (backend)

---

## Phase 1: Setup

**Purpose**: Create media domain structure in shared package

- [ ] T001 Create media domain folder at `packages/shared/src/schemas/media/`
- [ ] T002 Create barrel export file at `packages/shared/src/schemas/media/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schemas that MUST be complete before ANY user story refactoring can begin

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Create `imageMimeTypeSchema` enum at `packages/shared/src/schemas/media/image-mime-type.schema.ts`
- [ ] T004 [P] Create `mediaAssetTypeSchema` enum at `packages/shared/src/schemas/media/media-asset-type.schema.ts`
- [ ] T005 [P] Create `mediaAssetStatusSchema` enum at `packages/shared/src/schemas/media/media-asset-status.schema.ts`
- [ ] T006 Create `mediaReferenceSchema` with nullable `filePath` at `packages/shared/src/schemas/media/media-reference.schema.ts`
- [ ] T007 Create `mediaAssetSchema` (full document) at `packages/shared/src/schemas/media/media-asset.schema.ts`
- [ ] T008 Update barrel exports to include all schemas at `packages/shared/src/schemas/media/index.ts`
- [ ] T009 Add media domain export to main barrel at `packages/shared/src/schemas/index.ts`
- [ ] T010 Build shared package and verify compilation with `pnpm --filter @clementine/shared build`

**Checkpoint**: Foundation ready - schemas exist and compile, user story refactoring can begin

---

## Phase 3: User Story 1 - Developer Uses Unified Media Schema (Priority: P1) 🎯 MVP

**Goal**: Developers can import unified media schemas from `@clementine/shared` in both app and functions

**Independent Test**: Import schemas in app and functions, verify TypeScript compilation succeeds

### Tests for User Story 1

- [ ] T011 [P] [US1] Create schema validation tests at `packages/shared/src/schemas/media/media-asset.schema.test.ts`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Update theme barrel to re-export from media for backward compat at `packages/shared/src/schemas/theme/index.ts`
- [ ] T013 [P] [US1] Delete old media-reference.schema.ts from theme at `packages/shared/src/schemas/theme/media-reference.schema.ts`
- [ ] T014 [US1] Refactor `overlayReferenceSchema` to use `mediaReferenceSchema` at `packages/shared/src/schemas/event/project-event-config.schema.ts`
- [ ] T015 [US1] Refactor `experienceMediaSchema` to use `mediaReferenceSchema` at `packages/shared/src/schemas/experience/experience.schema.ts`
- [ ] T016 [US1] Refactor `experienceMediaAssetSchema` to use `mediaReferenceSchema` at `packages/shared/src/schemas/experience/steps/info.schema.ts`
- [ ] T017 [US1] Build and verify shared package compiles with `pnpm --filter @clementine/shared build`
- [ ] T018 [US1] Run shared package tests with `pnpm --filter @clementine/shared test`

**Checkpoint**: User Story 1 complete - unified schemas available in shared package

---

## Phase 4: User Story 2 - Cloud Function Accesses Storage via filePath (Priority: P2)

**Goal**: Cloud functions can use `filePath` directly for storage access instead of URL parsing

**Independent Test**: Import `mediaReferenceSchema` in functions, verify `filePath` field is accessible

### Implementation for User Story 2

- [ ] T019 [US2] Verify functions can import media schemas from `@clementine/shared` (check existing imports)
- [ ] T020 [US2] Update any functions using media references to check for `filePath` before URL parsing at `functions/src/infra/storage.ts`
- [ ] T021 [US2] Build and verify functions compile with `pnpm --filter functions build`

**Checkpoint**: User Story 2 complete - cloud functions can leverage filePath for new documents

---

## Phase 5: User Story 3 - Existing App Functionality Continues Working (Priority: P2)

**Goal**: All existing app features using media references continue working with new schemas

**Independent Test**: App compiles successfully with shared schema imports, existing media features work

### Implementation for User Story 3

- [ ] T022 [P] [US3] Delete app-level `image-mime-type.schema.ts` at `apps/clementine-app/src/domains/media-library/schemas/image-mime-type.schema.ts`
- [ ] T023 [P] [US3] Delete app-level `media-asset.schema.ts` at `apps/clementine-app/src/domains/media-library/schemas/media-asset.schema.ts`
- [ ] T024 [US3] Update media-library schemas barrel to re-export from `@clementine/shared` at `apps/clementine-app/src/domains/media-library/schemas/index.ts`
- [ ] T025 [US3] Update imports in `useUploadMediaAsset.ts` to use shared types at `apps/clementine-app/src/domains/media-library/hooks/useUploadMediaAsset.ts`
- [ ] T026 [US3] Update any other components using media types to import from shared (search for `MediaAsset` imports)
- [ ] T027 [US3] Build and verify app compiles with `pnpm --filter clementine-app build`
- [ ] T028 [US3] Run app type-check with `pnpm --filter clementine-app type-check`

**Checkpoint**: User Story 3 complete - app uses shared schemas, backward compatible

---

## Phase 6: User Story 4 - Upload Logic is Reusable (Priority: P3)

**Goal**: Upload orchestration is a standalone service, hook is thin wrapper

**Independent Test**: Upload service function can be called directly without React context

### Implementation for User Story 4

- [ ] T029 [US4] Create services folder at `apps/clementine-app/src/domains/media-library/services/`
- [ ] T030 [US4] Extract upload logic to service at `apps/clementine-app/src/domains/media-library/services/upload-media-asset.service.ts`
- [ ] T031 [US4] Update service to return `filePath` in result for new uploads
- [ ] T032 [US4] Refactor hook to use service at `apps/clementine-app/src/domains/media-library/hooks/useUploadMediaAsset.ts`
- [ ] T033 [US4] Create barrel export for services at `apps/clementine-app/src/domains/media-library/services/index.ts`
- [ ] T034 [US4] Build and verify app compiles with `pnpm --filter clementine-app build`

**Checkpoint**: User Story 4 complete - upload logic reusable, returns filePath

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation

- [ ] T035 [P] Update README with Media domain documentation at `packages/shared/README.md`
- [ ] T036 [P] Run full monorepo type-check with `pnpm app:type-check`
- [ ] T037 Run full validation with `pnpm app:check`
- [ ] T038 Verify quickstart.md examples work by testing imports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 must complete before US2/US3 (schemas must exist)
  - US2 and US3 can run in parallel after US1
  - US4 depends on US3 (needs app refactoring complete)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS ALL)
    ↓
Phase 3: US1 - Unified Schemas (P1) 🎯 MVP
    ↓
    ├── Phase 4: US2 - Cloud Function filePath (P2)
    │
    └── Phase 5: US3 - App Backward Compat (P2)
            ↓
        Phase 6: US4 - Upload Service (P3)
            ↓
        Phase 7: Polish
```

### Within Each User Story

- Tests written first (T011)
- Schema files before barrel exports
- Shared package before consumers
- Build verification after changes

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
```bash
# These can run in parallel:
T003: imageMimeTypeSchema
T004: mediaAssetTypeSchema
T005: mediaAssetStatusSchema
```

**Within Phase 3 (US1)**:
```bash
# These can run in parallel:
T011: Schema validation tests
T012: Theme barrel update
T013: Delete old media-reference
```

**Within Phase 5 (US3)**:
```bash
# These can run in parallel:
T022: Delete image-mime-type.schema.ts
T023: Delete media-asset.schema.ts
```

**Within Phase 7 (Polish)**:
```bash
# These can run in parallel:
T035: README update
T036: Full type-check
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T010)
3. Complete Phase 3: User Story 1 (T011-T018)
4. **STOP and VALIDATE**: Shared package builds, tests pass
5. Deploy/merge if ready

### Incremental Delivery

1. Setup + Foundational → Schemas exist
2. Add US1 → Unified schemas available → Merge (MVP!)
3. Add US2 → Functions can use filePath → Merge
4. Add US3 → App uses shared schemas → Merge
5. Add US4 → Upload service extracted → Merge
6. Each story adds value without breaking previous stories

### Single Developer Strategy

Execute phases sequentially:
1. Phase 1 → Phase 2 → Phase 3 (MVP checkpoint)
2. Phase 4 → Phase 5 (can do in either order)
3. Phase 6 → Phase 7

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently
- Build and type-check frequently to catch issues early
