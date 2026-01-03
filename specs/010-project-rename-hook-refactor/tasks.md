# Tasks: Project Rename & Hook Refactor

**Input**: Design documents from `/specs/010-project-rename-hook-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/mutation-api.md

**Tests**: NOT requested - this feature follows existing patterns without requiring new test infrastructure

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **TanStack Start App**: `apps/clementine-app/src/`
- **Domain Structure**: `domains/workspace/projects/` (vertical slice architecture)
- All paths are relative to repository root

---

## Phase 1: Setup (No Tasks Required)

**Purpose**: Project initialization and basic structure

**Status**: ✅ **COMPLETE** - No setup needed

This feature extends an existing domain (`domains/workspace/projects/`). The project structure, dependencies, and tooling are already in place:
- TypeScript 5.7.2 (strict mode) ✅
- TanStack Start 1.132.0, React 19.2.0 ✅
- Firebase SDK 12.5.0, TanStack Query 5.66.5 ✅
- Zod 4.1.12 ✅
- Vitest 3.0.5, Testing Library ✅
- shadcn/ui components ✅

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 2: Foundational (No Tasks Required)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Status**: ✅ **COMPLETE** - No foundational work needed

All foundational infrastructure is already in place:
- Firestore client SDK integrated ✅
- TanStack Query configured ✅
- Zod validation framework ✅
- Error handling with Sentry ✅
- Real-time updates via `onSnapshot` ✅
- Project domain structure established ✅

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Rename Project Feature (Priority: P1) 🎯 MVP

**Goal**: Allow workspace admins to rename projects via a context menu with a dialog, following the established pattern from event renaming.

**Independent Test**:
1. Navigate to projects list in a workspace (as admin)
2. Click context menu (three dots) on any project
3. Click "Rename" option
4. Dialog opens with current project name pre-filled
5. Edit name and submit
6. Toast shows "Project renamed"
7. Dialog closes automatically
8. Project list updates with new name in real-time

**Acceptance Criteria**:
- Admin can click menu button on project item to see actions
- "Rename" option opens dialog with current name
- Dialog validates name (1-100 chars, non-empty)
- Submitting updates project name in Firestore
- Success shows toast "Project renamed"
- Dialog closes on successful rename
- Project list updates with new name (query invalidation)
- Keyboard shortcuts work (Enter to submit, Escape to cancel)

### Implementation for User Story 1

- [ ] T001 [P] [US1] Add `updateProjectInputSchema` and `UpdateProjectInput` type to `apps/clementine-app/src/domains/workspace/projects/schemas/project.schemas.ts`
- [ ] T002 [P] [US1] Add `RenameProjectInput` and `UpdateProjectInput` interfaces to `apps/clementine-app/src/domains/workspace/projects/types/project.types.ts`
- [ ] T003 [US1] Create `useRenameProject` hook in `apps/clementine-app/src/domains/workspace/projects/hooks/useRenameProject.ts` (depends on T001, T002)
- [ ] T004 [US1] Export `useRenameProject` from `apps/clementine-app/src/domains/workspace/projects/hooks/index.ts` (depends on T003)
- [ ] T005 [US1] Create `RenameProjectDialog` component in `apps/clementine-app/src/domains/workspace/projects/components/RenameProjectDialog.tsx` (depends on T003)
- [ ] T006 [US1] Export `RenameProjectDialog` from `apps/clementine-app/src/domains/workspace/projects/components/index.ts` (depends on T005)
- [ ] T007 [US1] Update `ProjectListItem` to add context menu (DropdownMenu) in `apps/clementine-app/src/domains/workspace/projects/components/ProjectListItem.tsx` (depends on T005)
- [ ] T008 [US1] Update `ProjectsPage` to pass `workspaceId` prop to `ProjectListItem` in `apps/clementine-app/src/domains/workspace/projects/containers/ProjectsPage.tsx` (depends on T007)

**Checkpoint**: At this point, User Story 1 should be fully functional - admins can rename projects via context menu

---

## Phase 4: User Story 2 - useCreateProject Hook Refactor (Priority: P2)

**Goal**: Remove navigation side effect from `useCreateProject` hook to follow the principle of single responsibility (database operations only, no navigation).

**Independent Test**:
1. Navigate to projects list in a workspace (as admin)
2. Click "Create Project" button
3. New project is created in Firestore
4. Browser navigates to the new project's details page
5. Toast shows "Project created"
6. Projects list updates with new project (when navigating back)

**Acceptance Criteria**:
- `useCreateProject` no longer navigates after creation
- `useCreateProject` still invalidates the projects query
- `useCreateProject` returns project data for consumer navigation
- All consumers of `useCreateProject` handle navigation themselves
- Create project flow still navigates to project details (from consumer)

### Implementation for User Story 2

- [ ] T009 [P] [US2] Remove navigation side effect from `useCreateProject` hook in `apps/clementine-app/src/domains/workspace/projects/hooks/useCreateProject.ts`
- [ ] T010 [US2] Update `ProjectsPage` to handle navigation after create using `mutateAsync` in `apps/clementine-app/src/domains/workspace/projects/containers/ProjectsPage.tsx` (depends on T009)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - create project still navigates (from consumer), rename works via context menu

---

## Phase 5: Validation & Polish

**Purpose**: Validate the feature works correctly and meets constitution standards

- [ ] T011 Run type checking with `pnpm type-check` (must pass without errors)
- [ ] T012 Run linting with `pnpm lint` (must pass without errors)
- [ ] T013 Run formatting check with `pnpm format` (must pass without errors)
- [ ] T014 Verify mobile-first design - all touch targets ≥ 44x44px (manual test on mobile viewport)
- [ ] T015 Test rename feature on real device or mobile viewport (320px-768px)
- [ ] T016 Test keyboard shortcuts (Enter to submit, Escape to cancel) in rename dialog
- [ ] T017 Test error handling - rename with empty name shows validation error
- [ ] T018 Test error handling - rename with >100 char name shows validation error
- [ ] T019 Test real-time updates - rename in one tab, verify update appears in another tab
- [ ] T020 Verify create project still navigates correctly after refactor

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ Complete - no tasks needed
- **Foundational (Phase 2)**: ✅ Complete - no tasks needed
- **User Stories (Phase 3-4)**: Can proceed immediately
  - User Story 1 (Rename) - No dependencies on other stories
  - User Story 2 (Refactor) - No dependencies on User Story 1
  - Stories can run in parallel (if multiple developers)
- **Validation (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: ✅ Can start immediately - No dependencies
- **User Story 2 (P2)**: ✅ Can start immediately - Independent of US1

### Within User Story 1 (Rename Feature)

**Parallel Track 1 - Schema & Types (can run in parallel)**:
- T001 [P] [US1] - Schema addition
- T002 [P] [US1] - Type addition

**Sequential Track 2 - Hook (depends on Track 1)**:
- T003 [US1] - Create hook (needs T001, T002)
- T004 [US1] - Export hook

**Sequential Track 3 - Component (depends on Track 2)**:
- T005 [US1] - Create dialog (needs T003)
- T006 [US1] - Export dialog

**Sequential Track 4 - Integration (depends on Track 3)**:
- T007 [US1] - Update ProjectListItem (needs T005)
- T008 [US1] - Update ProjectsPage (needs T007)

### Within User Story 2 (Hook Refactor)

**Parallel Execution (independent tasks)**:
- T009 [P] [US2] - Refactor hook
- T010 [US2] - Update consumer (can start in parallel, but test after T009)

### Parallel Opportunities

**Maximum Parallelism**:
```bash
# Both user stories can start simultaneously:
Parallel Stream 1: User Story 1 tasks (T001-T008)
Parallel Stream 2: User Story 2 tasks (T009-T010)

# Within User Story 1:
Parallel: T001, T002 (different files - schema and types)
Sequential: T003 → T004 (hook creation and export)
Sequential: T005 → T006 (component creation and export)
Sequential: T007 → T008 (integration)
```

**Realistic Single-Developer Sequence**:
```bash
1. T001, T002 (schema and types) - 5 minutes
2. T003, T004 (hook) - 15 minutes
3. T005, T006 (dialog) - 20 minutes
4. T007 (ProjectListItem update) - 25 minutes
5. T008 (ProjectsPage update) - 5 minutes
6. T009 (refactor useCreateProject) - 10 minutes
7. T010 (update ProjectsPage consumer) - 15 minutes
8. T011-T020 (validation) - 20 minutes

Total: ~2-3 hours
```

---

## Parallel Example: User Story 1

```bash
# Step 1: Launch schema and types together (different files):
Task T001: "Add updateProjectInputSchema to project.schemas.ts"
Task T002: "Add RenameProjectInput types to project.types.ts"

# Step 2: After schema/types complete, create hook:
Task T003: "Create useRenameProject hook"
Task T004: "Export hook from index.ts"

# Step 3: After hook complete, create component:
Task T005: "Create RenameProjectDialog component"
Task T006: "Export component from index.ts"

# Step 4: After component complete, integrate:
Task T007: "Update ProjectListItem with context menu"
Task T008: "Update ProjectsPage to pass workspaceId"
```

---

## Parallel Example: Both User Stories

```bash
# Optimal parallel execution with 2 developers:

Developer A (User Story 1 - Rename):
- T001, T002 (parallel) → T003, T004 → T005, T006 → T007, T008

Developer B (User Story 2 - Refactor):
- T009, T010 (can work independently)

# Both streams merge at validation:
- T011-T020 (validation tasks)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

If you want to ship the rename feature first:

1. ✅ Skip Phase 1 & 2 (already complete)
2. Complete Phase 3: User Story 1 (T001-T008)
3. **STOP and VALIDATE**: Run T011-T019 to test rename feature
4. Deploy/demo rename feature
5. Later: Add Phase 4 (User Story 2 - Refactor) when ready

### Incremental Delivery

Full feature implementation:

1. ✅ Setup + Foundational → Already complete
2. Add User Story 1 (T001-T008) → Test independently → Deploy/Demo (Rename MVP!)
3. Add User Story 2 (T009-T010) → Test independently → Deploy/Demo (Hook Refactor)
4. Run Validation (T011-T020) → Final testing
5. Each story adds value without breaking previous work

### Parallel Team Strategy

With 2 developers:

1. ✅ Team already has Setup + Foundational complete
2. Developer A: User Story 1 (T001-T008)
3. Developer B: User Story 2 (T009-T010) - can start immediately
4. Merge: Both developers run validation (T011-T020)
5. Stories complete and integrate independently

---

## File Inventory

### Files to CREATE (2 files):

| File | Task | User Story | Description |
|------|------|------------|-------------|
| `apps/clementine-app/src/domains/workspace/projects/hooks/useRenameProject.ts` | T003 | US1 | Rename mutation hook |
| `apps/clementine-app/src/domains/workspace/projects/components/RenameProjectDialog.tsx` | T005 | US1 | Rename dialog component |

### Files to MODIFY (8 files):

| File | Tasks | User Story | Changes |
|------|-------|------------|---------|
| `apps/clementine-app/src/domains/workspace/projects/schemas/project.schemas.ts` | T001 | US1 | Add `updateProjectInputSchema` |
| `apps/clementine-app/src/domains/workspace/projects/types/project.types.ts` | T002 | US1 | Add `RenameProjectInput`, `UpdateProjectInput` |
| `apps/clementine-app/src/domains/workspace/projects/hooks/index.ts` | T004 | US1 | Export `useRenameProject` |
| `apps/clementine-app/src/domains/workspace/projects/components/index.ts` | T006 | US1 | Export `RenameProjectDialog` |
| `apps/clementine-app/src/domains/workspace/projects/components/ProjectListItem.tsx` | T007 | US1 | Add context menu with rename action |
| `apps/clementine-app/src/domains/workspace/projects/containers/ProjectsPage.tsx` | T008, T010 | US1, US2 | Pass `workspaceId` prop, handle navigation after create |
| `apps/clementine-app/src/domains/workspace/projects/hooks/useCreateProject.ts` | T009 | US2 | Remove navigation side effect |

---

## Task Details

### T001 [P] [US1] - Add Schema

**File**: `apps/clementine-app/src/domains/workspace/projects/schemas/project.schemas.ts`

**Action**: Add after existing schemas:

```typescript
/**
 * Validates project update input (rename operation)
 */
export const updateProjectInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long'),
})

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>
```

**Validation**: Run `pnpm type-check` - should pass

---

### T002 [P] [US1] - Add Types

**File**: `apps/clementine-app/src/domains/workspace/projects/types/project.types.ts`

**Action**: Add after existing types:

```typescript
/**
 * Input type for renaming a project
 */
export interface RenameProjectInput {
  projectId: string
  name: string
}

/**
 * Input type for updating project fields
 */
export interface UpdateProjectInput {
  name: string
}
```

**Validation**: Run `pnpm type-check` - should pass

---

### T003 [US1] - Create useRenameProject Hook

**File**: `apps/clementine-app/src/domains/workspace/projects/hooks/useRenameProject.ts` (NEW FILE)

**Action**: Create hook following `domains/project/events/hooks/useRenameProjectEvent.ts` pattern

**Dependencies**: Requires T001 (schema), T002 (types)

**Validation**: Run `pnpm type-check` - should pass

**Reference**: See `contracts/mutation-api.md` Section "Hook: useRenameProject"

---

### T004 [US1] - Export useRenameProject

**File**: `apps/clementine-app/src/domains/workspace/projects/hooks/index.ts`

**Action**: Add barrel export:

```typescript
export * from './useRenameProject'
```

**Validation**: Run `pnpm type-check` - should pass

---

### T005 [US1] - Create RenameProjectDialog Component

**File**: `apps/clementine-app/src/domains/workspace/projects/components/RenameProjectDialog.tsx` (NEW FILE)

**Action**: Create dialog following `domains/project/events/components/RenameProjectEventDialog.tsx` pattern

**Dependencies**: Requires T003 (hook)

**Validation**: Run `pnpm type-check` - should pass

**Reference**: See `contracts/mutation-api.md` Section "Component API: RenameProjectDialog"

---

### T006 [US1] - Export RenameProjectDialog

**File**: `apps/clementine-app/src/domains/workspace/projects/components/index.ts`

**Action**: Add barrel export:

```typescript
export * from './RenameProjectDialog'
```

**Validation**: Run `pnpm type-check` - should pass

---

### T007 [US1] - Update ProjectListItem

**File**: `apps/clementine-app/src/domains/workspace/projects/components/ProjectListItem.tsx`

**Action**: Following `domains/project/events/components/ProjectEventItem.tsx` pattern:
1. Add `workspaceId: string` to props interface
2. Add state for rename dialog: `const [renameDialogOpen, setRenameDialogOpen] = useState(false)`
3. Replace delete button with `DropdownMenu` from shadcn/ui
4. Add menu items: Rename (opens rename dialog), Delete (opens delete dialog)
5. Render `<RenameProjectDialog>` component with proper props

**Dependencies**: Requires T005 (dialog component)

**Validation**: Run `pnpm type-check`, test in browser

**Reference**: See `quickstart.md` Step 4.1 for detailed code

---

### T008 [US1] - Update ProjectsPage

**File**: `apps/clementine-app/src/domains/workspace/projects/containers/ProjectsPage.tsx`

**Action**: Update `ProjectListItem` usage to pass `workspaceId` prop:

```typescript
<ProjectListItem
  project={project}
  workspaceId={workspaceId}  // ADD THIS
  workspaceSlug={workspaceSlug}
  onDelete={handleDeleteProject}
  isDeleting={deleteProject.isPending}
/>
```

**Dependencies**: Requires T007 (ProjectListItem update)

**Validation**: Run `pnpm type-check`, test in browser

---

### T009 [P] [US2] - Refactor useCreateProject Hook

**File**: `apps/clementine-app/src/domains/workspace/projects/hooks/useCreateProject.ts`

**Action**: Remove navigation side effect from `onSuccess`:

**BEFORE**:
```typescript
onSuccess: ({ projectId, workspaceId, workspaceSlug }) => {
  queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })

  navigate({ // REMOVE THIS
    to: '/workspace/$workspaceSlug/projects/$projectId',
    params: { workspaceSlug, projectId },
  })
}
```

**AFTER**:
```typescript
onSuccess: ({ workspaceId }) => {
  queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
  // No navigation - consumer handles this
}
```

Also remove `navigate` import if no longer used.

**Validation**: Run `pnpm type-check` - should pass

**Reference**: See `data-model.md` Section "2. Create Project (REFACTORED)"

---

### T010 [US2] - Update ProjectsPage Consumer

**File**: `apps/clementine-app/src/domains/workspace/projects/containers/ProjectsPage.tsx`

**Action**: Update create project handler to use `mutateAsync` and handle navigation:

**BEFORE**:
```typescript
const handleCreateProject = () => {
  createProject.mutate({
    workspaceId,
    workspaceSlug,
    name: 'New Project',
  })
  // Navigation happens in hook
}
```

**AFTER**:
```typescript
const handleCreateProject = async () => {
  try {
    const result = await createProject.mutateAsync({
      workspaceId,
      workspaceSlug,
      name: 'New Project',
    })

    // Consumer handles navigation
    navigate({
      to: '/workspace/$workspaceSlug/projects/$projectId',
      params: {
        workspaceSlug: result.workspaceSlug,
        projectId: result.projectId,
      },
    })

    toast.success('Project created')
  } catch (error) {
    toast.error('Failed to create project')
  }
}
```

Add imports if needed:
```typescript
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
```

**Dependencies**: Should test with T009 complete

**Validation**: Run `pnpm type-check`, test create flow in browser

**Reference**: See `quickstart.md` Step 6.1 for detailed code

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow existing patterns: `useRenameProjectEvent` (hook), `RenameProjectEventDialog` (component), `ProjectEventItem` (context menu)
- All code must pass `pnpm type-check`, `pnpm lint`, `pnpm format`
- Test on mobile viewport (320px-768px) to verify touch targets ≥ 44px
- Use `quickstart.md` as reference for detailed implementation guidance
