# Tasks: App Navigation Refactor

**Input**: Design documents from `/specs/020-app-nav-refactor/`
**Prerequisites**: plan.md (required), research.md, quickstart.md

**Tests**: No tests requested (constitution states: "No new tests required - refactor, not new feature")

**Organization**: Tasks are grouped by migration step to enable incremental implementation. Each step results in a working application state.

## Format: `[ID] [P?] [Step] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Step]**: Which migration step this task belongs to (MS1, MS2, MS3, MS4, MS5)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `apps/clementine-app/src/`.

---

## Phase 1: Setup (Folder Structure)

**Purpose**: Create folder structure for new navigation organization

- [ ] T001 [P] Create shell folder: `domains/navigation/components/shell/`
- [ ] T002 [P] Create admin folder: `domains/navigation/components/admin/`
- [ ] T003 [P] Create workspace folder: `domains/navigation/components/workspace/`
- [ ] T004 [P] Create shared folder: `domains/navigation/components/shared/`

**Checkpoint**: Folder structure ready for component migration

---

## Phase 2: Foundational (Types & Shared Components)

**Purpose**: Update types and create shared components that all sidebars depend on

**⚠️ CRITICAL**: Shared components must be complete before area-specific sidebars can be created

- [ ] T005 Update NavItem type: rename `href` to `to` in `domains/navigation/types/navigation.types.ts`
- [ ] T006 Move and update NavigationLink: copy from `domains/navigation/components/NavigationLink.tsx` to `domains/navigation/components/shared/NavigationLink.tsx`, add `params` prop and `closeMobile` on click
- [ ] T007 [P] Create LogoutButton component: extract from Sidebar into `domains/navigation/components/shared/LogoutButton.tsx`
- [ ] T008 Create shared barrel export: `domains/navigation/components/shared/index.ts`

**Checkpoint**: Shared components ready - area sidebars can now be created

---

## Phase 3: Migration Step 1 - Shell Component (MS1)

**Goal**: Extract generic shell component that handles mobile/desktop responsiveness

**Independent Test**: Shell renders without errors when given children; collapse/mobile states work

### Implementation for MS1

- [ ] T009 [MS1] Create AppSidebarShell component in `domains/navigation/components/shell/AppSidebarShell.tsx` (extract from Sidebar.tsx, preserve SIDEBAR_WIDTH and SIDEBAR_ANIMATION_DURATION constants)
- [ ] T010 [MS1] Create shell barrel export: `domains/navigation/components/shell/index.ts`

**Checkpoint**: Shell component exists and can be composed by area sidebars

---

## Phase 4: Migration Step 2 - Admin Sidebar (MS2)

**Goal**: Create self-contained admin navigation sidebar

**Independent Test**: Navigate to `/admin/workspaces` and `/admin/dev-tools` using AdminSidebar

### Implementation for MS2

- [ ] T011 [P] [MS2] Create adminNavItems config: `domains/navigation/components/admin/adminNavItems.ts` (use `to` instead of `href`)
- [ ] T012 [MS2] Create AdminSidebar component: `domains/navigation/components/admin/AdminSidebar.tsx` (compose AppSidebarShell with NavigationLink and LogoutButton)
- [ ] T013 [MS2] Create admin barrel export: `domains/navigation/components/admin/index.ts`

**Checkpoint**: AdminSidebar is self-contained and ready for route integration

---

## Phase 5: Migration Step 3 - Workspace Sidebar (MS3)

**Goal**: Create self-contained workspace navigation sidebar with type-safe route params

**Independent Test**: Navigate to `/workspace/{slug}/projects` and `/workspace/{slug}/settings` using WorkspaceSidebar

### Implementation for MS3

- [ ] T014 [P] [MS3] Create workspaceNavItems config: `domains/navigation/components/workspace/workspaceNavItems.ts` (use `to` with `$workspaceSlug` placeholder)
- [ ] T015 [MS3] Move WorkspaceSelector: copy `domains/navigation/components/WorkspaceSelector.tsx` to `domains/navigation/components/workspace/WorkspaceSelector.tsx`
- [ ] T016 [MS3] Create WorkspaceSidebar component: `domains/navigation/components/workspace/WorkspaceSidebar.tsx` (compose AppSidebarShell, pass params to NavigationLink)
- [ ] T017 [MS3] Create workspace barrel export: `domains/navigation/components/workspace/index.ts`

**Checkpoint**: WorkspaceSidebar is self-contained and ready for route integration

---

## Phase 6: Migration Step 4 - Route Integration (MS4)

**Goal**: Update routes to use new area-specific sidebars

**Independent Test**: All navigation works identically to before in both admin and workspace areas

### Implementation for MS4

- [ ] T018 [P] [MS4] Update admin route: change `app/admin/route.tsx` to import and use `AdminSidebar` instead of `<Sidebar area="admin" />`
- [ ] T019 [P] [MS4] Update workspace route: change `app/workspace/route.tsx` to import and use `WorkspaceSidebar` with `workspaceSlug` prop
- [ ] T020 [MS4] Update components barrel export: `domains/navigation/components/index.ts` to export from shell/, admin/, workspace/, shared/ subfolders
- [ ] T021 [MS4] Update domain barrel export: `domains/navigation/index.ts` to export new components (AdminSidebar, WorkspaceSidebar, AppSidebarShell, LogoutButton)

**Checkpoint**: Application works with new sidebar components; old Sidebar is no longer used

---

## Phase 7: Migration Step 5 - Cleanup (MS5)

**Goal**: Remove deprecated files and verify clean state

**Independent Test**: `pnpm type-check` and `pnpm lint` pass; no dead code

### Implementation for MS5

- [ ] T022 [P] [MS5] Delete old Sidebar component: `domains/navigation/components/Sidebar.tsx`
- [ ] T023 [P] [MS5] Delete old AdminNav component: `domains/navigation/components/AdminNav.tsx`
- [ ] T024 [P] [MS5] Delete old WorkspaceNav component: `domains/navigation/components/WorkspaceNav.tsx`
- [ ] T025 [P] [MS5] Delete old NavigationLink from root: `domains/navigation/components/NavigationLink.tsx` (now in shared/)
- [ ] T026 [P] [MS5] Delete old WorkspaceSelector from root: `domains/navigation/components/WorkspaceSelector.tsx` (now in workspace/)
- [ ] T027 [MS5] Remove RouteArea type from exports if no longer needed: check `domains/navigation/types/navigation.types.ts`

**Checkpoint**: All deprecated files removed; codebase is clean

---

## Phase 8: Polish & Validation

**Purpose**: Final verification and validation gates

- [ ] T028 Run type-check: `pnpm type-check` from `apps/clementine-app/`
- [ ] T029 Run lint and format: `pnpm check` from `apps/clementine-app/`
- [ ] T030 Manual verification: Desktop sidebar collapse/expand works correctly
- [ ] T031 Manual verification: Mobile sheet opens/closes correctly
- [ ] T032 Manual verification: Mobile sheet closes on navigation
- [ ] T033 Manual verification: Admin navigation works (`/admin/workspaces`, `/admin/dev-tools`)
- [ ] T034 Manual verification: Workspace navigation works with param substitution
- [ ] T035 Manual verification: Collapse state persists across page refreshes
- [ ] T036 Manual verification: Logout button works in both admin and workspace areas

**Checkpoint**: All validation gates pass; refactor complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all migration steps
- **MS1 Shell (Phase 3)**: Depends on Foundational
- **MS2 Admin (Phase 4)**: Depends on MS1 Shell
- **MS3 Workspace (Phase 5)**: Depends on MS1 Shell (can run parallel to MS2)
- **MS4 Route Integration (Phase 6)**: Depends on MS2 + MS3 completion
- **MS5 Cleanup (Phase 7)**: Depends on MS4 completion
- **Polish (Phase 8)**: Depends on MS5 completion

### Migration Step Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (Types + Shared)
    ↓
Phase 3: MS1 Shell ──────────────────┐
    ↓                                │
Phase 4: MS2 Admin  ←────────────────┤
    ↓ (can parallel)                 │
Phase 5: MS3 Workspace ←─────────────┘
    ↓
Phase 6: MS4 Route Integration
    ↓
Phase 7: MS5 Cleanup
    ↓
Phase 8: Polish & Validation
```

### Parallel Opportunities

**Phase 1 (all parallel)**:
```bash
T001: Create shell folder
T002: Create admin folder
T003: Create workspace folder
T004: Create shared folder
```

**Phase 2 (T007 parallel after T005)**:
```bash
T005: Update NavItem type (FIRST - others depend on this)
T006: Move NavigationLink (depends on T005)
T007: Create LogoutButton (parallel with T006)
T008: Create barrel export (after T006, T007)
```

**MS2 + MS3 can run in parallel** (after MS1):
```bash
# Developer A: MS2
T011: Create adminNavItems
T012: Create AdminSidebar
T013: Create admin barrel

# Developer B: MS3 (parallel)
T014: Create workspaceNavItems
T015: Move WorkspaceSelector
T016: Create WorkspaceSidebar
T017: Create workspace barrel
```

**MS4 route updates (parallel)**:
```bash
T018: Update admin route
T019: Update workspace route
```

**MS5 deletions (all parallel)**:
```bash
T022: Delete Sidebar.tsx
T023: Delete AdminNav.tsx
T024: Delete WorkspaceNav.tsx
T025: Delete NavigationLink.tsx (root)
T026: Delete WorkspaceSelector.tsx (root)
```

---

## Parallel Example: MS2 + MS3

```bash
# After MS1 Shell is complete, launch both migration steps in parallel:

# MS2 Admin tasks:
Task: "Create adminNavItems config in domains/navigation/components/admin/adminNavItems.ts"
Task: "Create AdminSidebar in domains/navigation/components/admin/AdminSidebar.tsx"
Task: "Create admin barrel export in domains/navigation/components/admin/index.ts"

# MS3 Workspace tasks (parallel):
Task: "Create workspaceNavItems config in domains/navigation/components/workspace/workspaceNavItems.ts"
Task: "Move WorkspaceSelector to domains/navigation/components/workspace/WorkspaceSelector.tsx"
Task: "Create WorkspaceSidebar in domains/navigation/components/workspace/WorkspaceSidebar.tsx"
Task: "Create workspace barrel export in domains/navigation/components/workspace/index.ts"
```

---

## Implementation Strategy

### MVP First (Minimal Working State)

1. Complete Phase 1: Setup (create folders)
2. Complete Phase 2: Foundational (types + shared components)
3. Complete Phase 3: MS1 Shell
4. Complete Phase 4: MS2 Admin
5. Update admin route ONLY (partial MS4)
6. **STOP and VALIDATE**: Admin area works with new pattern
7. Continue with MS3 Workspace + remaining MS4 + cleanup

### Incremental Delivery

1. Setup + Foundational → Shared components ready
2. MS1 Shell → Generic shell exists
3. MS2 Admin + admin route update → Admin area migrated (can deploy/demo)
4. MS3 Workspace + workspace route update → Workspace area migrated
5. MS5 Cleanup → Dead code removed
6. Polish → All validation gates pass

### Single Developer Strategy

Execute phases sequentially in order. Use parallel task markers to batch related file creations within each phase.

---

## Notes

- [P] tasks = different files, no dependencies
- [MS#] label maps task to specific migration step
- Each migration step results in a working application state
- Verify type-check passes after each phase
- Commit after each phase completion
- The refactor preserves all existing UX (collapse persistence, mobile behavior, animations)
- No tests are included per constitution guidance (refactor, not new feature)

---

## Summary

| Phase | Task Count | Parallel Tasks |
|-------|------------|----------------|
| Setup | 4 | 4 |
| Foundational | 4 | 1 |
| MS1 Shell | 2 | 0 |
| MS2 Admin | 3 | 1 |
| MS3 Workspace | 4 | 1 |
| MS4 Route Integration | 4 | 2 |
| MS5 Cleanup | 6 | 5 |
| Polish | 9 | 0 |
| **Total** | **36** | **14** |
