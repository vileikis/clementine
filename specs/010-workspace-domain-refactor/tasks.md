# Tasks: Workspace Domain Refactoring

**Input**: Design documents from `/specs/010-workspace-domain-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No test tasks - this is a pure refactoring with existing test validation.

**Organization**: Tasks are grouped by refactoring phase (functional requirements) to enable incremental implementation with validation checkpoints.

## Format: `- [X] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which refactoring phase this task belongs to (US1-US5)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `apps/clementine-app/src/`, `packages/shared/src/`
- All paths shown below follow the monorepo structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites and establish baseline

- [X] T001 Verify current branch is 010-workspace-domain-refactor
- [X] T002 Run type check to establish baseline: `cd apps/clementine-app && pnpm type-check`
- [X] T003 Run tests to establish baseline: `cd apps/clementine-app && pnpm test`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared package infrastructure that all subsequent phases depend on

**⚠️ CRITICAL**: No refactoring work can begin until this phase is complete

- [X] T004 Create workspace entity directory: `packages/shared/src/entities/workspace/`
- [X] T005 [P] [US1] Create workspace.schema.ts in packages/shared/src/entities/workspace/workspace.schema.ts
- [X] T006 [P] [US1] Create workspace entity index.ts in packages/shared/src/entities/workspace/index.ts
- [X] T007 [US1] Update entities barrel export in packages/shared/src/entities/index.ts
- [X] T008 [US1] Build shared package: `cd packages/shared && pnpm build`
- [X] T009 [US1] Verify shared package exports workspace types correctly

**Checkpoint**: Shared package workspace schema ready - domain refactoring can now begin

---

## Phase 3: User Story 1 - Shared Package Workspace Schema (Priority: P1) 🎯 Foundation

**Goal**: Extract core workspace entity schema to packages/shared/ for cross-package type consistency

**Independent Test**: Import `Workspace` type from `@clementine/shared` in a test file and verify TypeScript compilation succeeds

### Implementation for User Story 1

✅ **Completed in Phase 2 (Foundational)** - Tasks T004-T009 above

**Checkpoint**: Workspace schema exists in shared package and can be imported from `@clementine/shared`

---

## Phase 4: User Story 2 - Create workspace/shared/ Subdomain (Priority: P2)

**Goal**: Reorganize shared workspace utilities into a subdomain structure

**Independent Test**: Import `useWorkspace`, `WORKSPACE_NAME` from `@/domains/workspace/shared` and verify TypeScript compilation succeeds

### Implementation for User Story 2

- [X] T010 [P] [US2] Create subdomain directory structure: `apps/clementine-app/src/domains/workspace/shared/{hooks,store,constants,schemas}/`
- [X] T011 [P] [US2] Move useWorkspace.ts to apps/clementine-app/src/domains/workspace/shared/hooks/useWorkspace.ts
- [X] T012 [P] [US2] Move useWorkspaceStore.ts to apps/clementine-app/src/domains/workspace/shared/store/useWorkspaceStore.ts
- [X] T013 [P] [US2] Move workspace.constants.ts to apps/clementine-app/src/domains/workspace/shared/constants/workspace.constants.ts
- [X] T014 [P] [US2] Move workspace.schemas.ts to apps/clementine-app/src/domains/workspace/shared/schemas/workspace.schemas.ts
- [X] T015 [US2] Update workspace.schemas.ts to remove workspaceStatusSchema and workspaceSchema (now in @clementine/shared)
- [X] T016 [US2] Update workspace.schemas.ts to keep only slugSchema, createWorkspaceSchema, updateWorkspaceSchema, deleteWorkspaceSchema
- [X] T017 [US2] Create workspace/shared/index.ts with re-exports from @clementine/shared and local schemas
- [X] T018 [US2] Update internal imports in workspace/shared/ files to use relative paths
- [X] T019 [US2] Verify TypeScript compilation: `cd apps/clementine-app && pnpm type-check`

**Checkpoint**: workspace/shared/ subdomain complete with all utilities and proper barrel exports

---

## Phase 5: User Story 3 - Create workspace/settings/ Subdomain (Priority: P3)

**Goal**: Reorganize workspace settings UI into a subdomain structure

**Independent Test**: Import `WorkspaceSettingsPage`, `WorkspaceSettingsForm` from `@/domains/workspace/settings` and verify TypeScript compilation succeeds

### Implementation for User Story 3

- [X] T020 [P] [US3] Create subdomain directory structure: `apps/clementine-app/src/domains/workspace/settings/{components,containers,hooks}/`
- [X] T021 [P] [US3] Move WorkspaceSettingsForm.tsx to apps/clementine-app/src/domains/workspace/settings/components/WorkspaceSettingsForm.tsx
- [X] T022 [P] [US3] Move WorkspacePage.tsx to apps/clementine-app/src/domains/workspace/settings/containers/ (will rename in next step)
- [X] T023 [P] [US3] Move useUpdateWorkspace.ts to apps/clementine-app/src/domains/workspace/settings/hooks/useUpdateWorkspace.ts
- [X] T024 [US3] Rename WorkspacePage.tsx to WorkspaceSettingsPage.tsx in apps/clementine-app/src/domains/workspace/settings/containers/
- [X] T025 [US3] Update component name from WorkspacePage to WorkspaceSettingsPage inside WorkspaceSettingsPage.tsx
- [X] T026 [US3] Update imports in WorkspaceSettingsForm.tsx to use relative paths to hooks and shared types
- [X] T027 [US3] Update imports in WorkspaceSettingsPage.tsx to use relative paths to components and shared hooks
- [X] T028 [US3] Update imports in useUpdateWorkspace.ts to use workspace/shared types
- [X] T029 [US3] Create workspace/settings/index.ts with exports for WorkspaceSettingsForm, WorkspaceSettingsPage, useUpdateWorkspace
- [X] T030 [US3] Verify TypeScript compilation: `cd apps/clementine-app && pnpm type-check`

**Checkpoint**: workspace/settings/ subdomain complete with all settings-related code

---

## Phase 6: User Story 4 - Update Root workspace/index.ts & Cleanup (Priority: P4)

**Goal**: Update root workspace barrel export and remove deprecated files

**Independent Test**: Import from `@/domains/workspace` root and verify all exports resolve correctly

### Implementation for User Story 4

- [X] T031 [US4] Update apps/clementine-app/src/domains/workspace/index.ts to re-export from ./shared, ./settings, ./projects
- [X] T032 [US4] Delete apps/clementine-app/src/domains/workspace/types/workspace.types.ts (replaced by @clementine/shared)
- [X] T033 [US4] Remove empty root-level directories: components/, containers/, hooks/, schemas/, store/, constants/, types/
- [X] T034 [US4] Verify only shared/, settings/, projects/, and index.ts remain at workspace root
- [X] T035 [US4] Verify TypeScript compilation: `cd apps/clementine-app && pnpm type-check`

**Checkpoint**: Root workspace domain structure clean with proper barrel exports

---

## Phase 7: User Story 5 - Update All Consumer Imports (Priority: P5)

**Goal**: Update all files importing from workspace domain to use new structure

**Independent Test**: TypeScript compilation succeeds and all tests pass

### Implementation for User Story 5

- [X] T036 [US5] Find all workspace imports: `cd apps/clementine-app && grep -r "from '@/domains/workspace'" src/`
- [X] T037 [US5] Update route files under src/app/routes/ that import WorkspacePage to import WorkspaceSettingsPage
- [X] T038 [US5] Update route files to use WorkspaceSettingsPage component name instead of WorkspacePage
- [X] T039 [US5] Check if src/domains/admin/workspace/ exists and update its imports if present
- [X] T040 [US5] Update any other consumer files identified in T036 to use correct import paths
- [X] T041 [US5] Verify TypeScript compilation: `cd apps/clementine-app && pnpm type-check`
- [X] T042 [US5] Run all tests: `cd apps/clementine-app && pnpm test`

**Checkpoint**: All consumers updated, TypeScript compiles, tests pass

---

## Phase 8: Polish & Validation

**Purpose**: Final validation and code quality checks

- [X] T043 Run auto-fix command: `cd apps/clementine-app && pnpm check`
- [X] T044 Run type-check: `cd apps/clementine-app && pnpm type-check`
- [X] T045 Run all tests: `cd apps/clementine-app && pnpm test`
- [X] T046 Build the app: `cd apps/clementine-app && pnpm build`
- [X] T047 Start dev server and manually test workspace features: `cd apps/clementine-app && pnpm dev`
- [X] T048 Verify workspace settings page loads and functions correctly
- [X] T049 Verify workspace name/slug editing works
- [X] T050 Verify no console errors in browser during workspace operations
- [X] T051 Review all changes against acceptance criteria from spec.md
- [X] T052 Commit changes with descriptive message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all refactoring work
- **User Story 1 (Phase 3)**: Completed in Foundational phase (Phase 2)
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion, can run parallel to US2
- **User Story 4 (Phase 6)**: Depends on US2 and US3 completion
- **User Story 5 (Phase 7)**: Depends on US4 completion (must run after all structure changes)
- **Polish (Phase 8)**: Depends on US5 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - No dependencies (foundation)
- **User Story 2 (P2)**: Can start after Foundational - No dependencies on US1
- **User Story 3 (P3)**: Can start after Foundational - No dependencies on US1 or US2 (parallel with US2)
- **User Story 4 (P4)**: Depends on US2 and US3 completion
- **User Story 5 (P5)**: Depends on US4 completion (must update imports AFTER structure is finalized)

### Within Each User Story

- Directory creation before file moves
- File moves before import updates
- Import updates before barrel exports
- Type-check after each phase completion

### Parallel Opportunities

- **Phase 1 (Setup)**: All tasks run sequentially (baseline establishment)
- **Phase 2 (Foundational)**: Tasks T005-T006 can run in parallel
- **Phase 4 (US2)**: Tasks T011-T014 (file moves) can run in parallel
- **Phase 5 (US3)**: Tasks T021-T023 (file moves) can run in parallel
- **User Stories 2 and 3**: Can be implemented in parallel by different developers after Phase 2 completes

---

## Parallel Example: User Story 2 (workspace/shared/)

```bash
# Launch all file moves for User Story 2 together:
Task: "Move useWorkspace.ts to apps/clementine-app/src/domains/workspace/shared/hooks/useWorkspace.ts"
Task: "Move useWorkspaceStore.ts to apps/clementine-app/src/domains/workspace/shared/store/useWorkspaceStore.ts"
Task: "Move workspace.constants.ts to apps/clementine-app/src/domains/workspace/shared/constants/workspace.constants.ts"
Task: "Move workspace.schemas.ts to apps/clementine-app/src/domains/workspace/shared/schemas/workspace.schemas.ts"
```

## Parallel Example: User Story 3 (workspace/settings/)

```bash
# Launch all file moves for User Story 3 together:
Task: "Move WorkspaceSettingsForm.tsx to apps/clementine-app/src/domains/workspace/settings/components/WorkspaceSettingsForm.tsx"
Task: "Move WorkspacePage.tsx to apps/clementine-app/src/domains/workspace/settings/containers/"
Task: "Move useUpdateWorkspace.ts to apps/clementine-app/src/domains/workspace/settings/hooks/useUpdateWorkspace.ts"
```

---

## Implementation Strategy

### Incremental Delivery (Recommended)

1. **Complete Phase 1: Setup** → Baseline established
2. **Complete Phase 2: Foundational** → Shared package ready (CRITICAL)
3. **Complete Phase 4: User Story 2** → workspace/shared/ subdomain ready → Type-check → Checkpoint
4. **Complete Phase 5: User Story 3** → workspace/settings/ subdomain ready → Type-check → Checkpoint
5. **Complete Phase 6: User Story 4** → Root structure cleaned → Type-check → Checkpoint
6. **Complete Phase 7: User Story 5** → All imports updated → Tests pass → Checkpoint
7. **Complete Phase 8: Polish** → Final validation → Ready to commit

### Checkpoint Validation

After each user story phase:

1. Run `pnpm type-check` - Must pass with zero errors
2. Review file structure - Verify expected files in place
3. Spot-check imports - Verify no broken imports
4. Continue to next phase only if checkpoint passes

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup (Phase 1) together
2. Team completes Foundational (Phase 2) together
3. Once Foundational is done:
   - **Developer A**: User Story 2 (workspace/shared/)
   - **Developer B**: User Story 3 (workspace/settings/)
4. Developer A or B completes User Story 4 (cleanup) after US2 and US3
5. Developer A or B completes User Story 5 (imports) after US4
6. Team reviews Polish phase together

---

## Summary

**Total Tasks**: 52 tasks across 8 phases

**Task Breakdown by Phase**:
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational / US1): 6 tasks
- Phase 3 (US1 Summary): 0 tasks (completed in Phase 2)
- Phase 4 (US2): 10 tasks
- Phase 5 (US3): 11 tasks
- Phase 6 (US4): 5 tasks
- Phase 7 (US5): 7 tasks
- Phase 8 (Polish): 10 tasks

**Parallel Opportunities**:
- 2 tasks can run in parallel in Phase 2
- 4 tasks can run in parallel in Phase 4 (US2)
- 3 tasks can run in parallel in Phase 5 (US3)
- User Stories 2 and 3 can be developed in parallel after Phase 2

**Independent Test Criteria**:
- US1: Can import `Workspace` type from `@clementine/shared`
- US2: Can import utilities from `@/domains/workspace/shared`
- US3: Can import components from `@/domains/workspace/settings`
- US4: All exports available from `@/domains/workspace` root
- US5: TypeScript compiles cleanly, all tests pass

**Estimated Time**: 30-45 minutes for full implementation (sequential execution)

---

## Notes

- All tasks include exact file paths for clarity
- [P] marker indicates tasks that can run in parallel
- [US#] marker maps tasks to user stories (refactoring phases)
- Each phase has a checkpoint for validation
- Type-check after each phase ensures no breaking changes
- Commit after Phase 8 completion only (keep changes atomic)
- This is a pure refactoring - no functional changes, no new tests required
- Existing tests validate correctness of refactoring
