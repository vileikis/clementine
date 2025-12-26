# Tasks: Base Navigation System

**Input**: Design documents from `/specs/001-base-nav/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests for workspace initials calculation and component tests for sidebar behavior (as per Constitution Principle IV)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `apps/clementine-app/`:
- **Source**: `src/`
- **Tests**: `tests/`
- **Routes**: `src/routes/`
- **Domains**: `src/domains/navigation/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Navigation domain structure and TypeScript types

- [ ] T001 Create navigation domain directory structure at src/domains/navigation/ with subdirectories: components/, hooks/, types/, constants/, lib/
- [ ] T002 [P] Create barrel export index.ts files in src/domains/navigation/components/, src/domains/navigation/hooks/, src/domains/navigation/types/, src/domains/navigation/constants/, src/domains/navigation/lib/
- [ ] T003 [P] Create feature-level barrel export at src/domains/navigation/index.ts
- [ ] T004 [P] Create test directory at tests/navigation/ for navigation domain tests

**Checkpoint**: Domain structure ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, mock data, and utility functions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Create Workspace interface in src/domains/navigation/types/navigation.types.ts
- [ ] T006 [P] Create RouteArea type ('admin' | 'workspace' | 'guest') in src/domains/navigation/types/navigation.types.ts
- [ ] T007 [P] Create NavItem interface with label, href, icon fields in src/domains/navigation/types/navigation.types.ts
- [ ] T008 Export all types from src/domains/navigation/types/index.ts
- [ ] T009 [P] Create MOCK_WORKSPACES const array with 5 sample workspaces in src/domains/navigation/constants/mockWorkspaces.ts
- [ ] T010 Export MOCK_WORKSPACES from src/domains/navigation/constants/index.ts
- [ ] T011 [P] Implement getWorkspaceInitials function in src/domains/navigation/lib/getWorkspaceInitials.ts
- [ ] T012 Export getWorkspaceInitials from src/domains/navigation/lib/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Navigation (Priority: P1) 🎯 MVP

**Goal**: Enable admin navigation between Workspaces and Dev Tools with collapsible sidebar

**Independent Test**: Navigate to /admin, click hamburger icon, sidebar opens with "Workspaces" and "Dev Tools" items. Click items to navigate. Sidebar collapses when clicking hamburger again.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US1] Create unit test for getWorkspaceInitials in tests/navigation/getWorkspaceInitials.test.ts (test cases: single word, two words, three+ words, empty, null, undefined, whitespace)

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create useSidebarState hook with isOpen, toggle, open, close methods in src/domains/navigation/hooks/useSidebarState.ts
- [ ] T015 [US1] Export useSidebarState from src/domains/navigation/hooks/index.ts
- [ ] T016 [P] [US1] Create AdminNav component with navigation items for "Workspaces" and "Dev Tools" in src/domains/navigation/components/AdminNav.tsx
- [ ] T017 [P] [US1] Create Sidebar component with mobile Sheet and desktop static sidebar, accepting RouteArea prop in src/domains/navigation/components/Sidebar.tsx
- [ ] T018 [US1] Create SidebarContent internal component in src/domains/navigation/components/Sidebar.tsx that renders AdminNav for 'admin' area
- [ ] T019 [US1] Export AdminNav and Sidebar from src/domains/navigation/components/index.ts
- [ ] T020 [US1] Create /admin index route with redirect to /admin/workspaces in src/routes/admin/index.tsx
- [ ] T021 [P] [US1] Create /admin/workspaces route with WIP placeholder in src/routes/admin/workspaces.tsx
- [ ] T022 [P] [US1] Create /admin/dev-tools route with WIP placeholder in src/routes/admin/dev-tools.tsx
- [ ] T023 [US1] Modify src/routes/__root.tsx to include Sidebar component, determine RouteArea from path, and pass to Sidebar
- [ ] T024 [US1] Modify src/routes/index.tsx to redirect to /admin/workspaces (remove existing home page content)
- [ ] T025 [US1] Run dev server and manually test admin navigation: sidebar toggle, navigation between routes, default redirect

**Checkpoint**: User Story 1 should be fully functional - admin can navigate between Workspaces and Dev Tools using sidebar

---

## Phase 4: User Story 2 - Workspace Navigation (Priority: P1)

**Goal**: Enable workspace navigation with workspace selector showing initials, navigation between Projects and Settings

**Independent Test**: Navigate to /workspace/acme-inc, sidebar shows "AI" workspace selector, click selector opens /admin/workspaces in new tab, click Projects and Settings to navigate

### Tests for User Story 2

- [ ] T026 [P] [US2] Create component test for WorkspaceSelector in tests/navigation/WorkspaceSelector.test.tsx (test workspace initials rendering for mock data)

### Implementation for User Story 2

- [ ] T027 [P] [US2] Create WorkspaceSelector component that displays workspace initials and opens /admin/workspaces in new tab on click in src/domains/navigation/components/WorkspaceSelector.tsx
- [ ] T028 [P] [US2] Create WorkspaceNav component with workspace selector and navigation items for "Projects" and "Settings" in src/domains/navigation/components/WorkspaceNav.tsx
- [ ] T029 [US2] Export WorkspaceNav and WorkspaceSelector from src/domains/navigation/components/index.ts
- [ ] T030 [US2] Update SidebarContent in src/domains/navigation/components/Sidebar.tsx to render WorkspaceNav for 'workspace' area
- [ ] T031 [US2] Create /workspace/$workspaceId index route with redirect to /workspace/$workspaceId/projects in src/routes/workspace/$workspaceId/index.tsx
- [ ] T032 [P] [US2] Create /workspace/$workspaceId/projects route with WIP placeholder in src/routes/workspace/$workspaceId/projects.tsx
- [ ] T033 [P] [US2] Create /workspace/$workspaceId/settings route with WIP placeholder in src/routes/workspace/$workspaceId/settings.tsx
- [ ] T034 [US2] Run dev server and manually test workspace navigation with multiple workspace IDs (acme, acme-inc, acme-corp): workspace selector initials, navigation between routes, default redirect

**Checkpoint**: User Stories 1 AND 2 should both work independently - admin navigation and workspace navigation both functional

---

## Phase 5: User Story 3 - Guest Experience (Priority: P2)

**Goal**: Provide clean guest interface without sidebar navigation

**Independent Test**: Navigate to /guest/test-project, verify no sidebar is visible, WIP content displays

### Implementation for User Story 3

- [ ] T035 [US3] Update SidebarContent in src/domains/navigation/components/Sidebar.tsx to return null for 'guest' area (no sidebar rendering)
- [ ] T036 [US3] Create /guest/$projectId route with WIP placeholder and no sidebar in src/routes/guest/$projectId.tsx
- [ ] T037 [US3] Verify src/routes/__root.tsx correctly determines 'guest' RouteArea from path starting with /guest
- [ ] T038 [US3] Run dev server and manually test guest route: no sidebar visible, clean interface, WIP content

**Checkpoint**: All P1 and P2 user stories functional - admin, workspace, and guest navigation working independently

---

## Phase 6: User Story 4 - Logout UI Placeholder (Priority: P3)

**Goal**: Display logout button placeholder at bottom of sidebar (visual only, no auth logic)

**Independent Test**: Open sidebar on /admin or /workspace routes, verify logout button appears at bottom with hover state, click does nothing (placeholder)

### Implementation for User Story 4

- [ ] T039 [US4] Add logout button to SidebarContent in src/domains/navigation/components/Sidebar.tsx at bottom of sidebar with LogOut icon from lucide-react
- [ ] T040 [US4] Add onClick handler to logout button that logs "Logout clicked (placeholder)" to console (no actual auth logic)
- [ ] T041 [US4] Verify logout button has hover state styling (hover:bg-slate-800)
- [ ] T042 [US4] Run dev server and manually test logout button: appears in sidebar, hover state works, click logs to console

**Checkpoint**: All user stories complete - full navigation system functional with logout UI placeholder

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Testing, validation, and refinements across all user stories

- [ ] T043 [P] Create component test for Sidebar toggle behavior in tests/navigation/Sidebar.test.tsx
- [ ] T044 [P] Add edge case tests for getWorkspaceInitials (single-letter workspace, three-word workspace) in tests/navigation/getWorkspaceInitials.test.ts
- [ ] T045 [US2] Test workspace selector with invalid workspaceId (not in MOCK_WORKSPACES), verify fallback to "?" initials
- [ ] T046 Test sidebar responsive behavior: mobile uses Sheet component, desktop uses static sidebar
- [ ] T047 Verify all WIP placeholder pages display "WIP" text with monochrome styling
- [ ] T048 Verify sidebar animation completes within 300ms (SC-004)
- [ ] T049 Verify all routes load within 1 second (SC-005)
- [ ] T050 Verify navigation between routes takes under 2 clicks from any starting point (SC-001)
- [ ] T051 Run validation loop: pnpm check (format + lint + type-check + test) from apps/clementine-app/
- [ ] T052 Fix any linting, formatting, or type errors from validation
- [ ] T053 Ensure 70%+ test coverage for navigation domain (Constitution Principle IV)
- [ ] T054 Review code for Constitution compliance: mobile-first design, clean code, type safety, YAGNI
- [ ] T055 Final manual testing of all acceptance scenarios from spec.md across all user stories

**Checkpoint**: Feature complete and validated - ready for commit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - Can proceed in parallel (if team has capacity)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Admin Navigation)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1 - Workspace Navigation)**: Can start after Foundational (Phase 2) - Builds on same Sidebar component as US1 but independently testable
- **User Story 3 (P2 - Guest Experience)**: Can start after Foundational (Phase 2) - Uses same routing infrastructure, no sidebar dependency
- **User Story 4 (P3 - Logout UI)**: Can start after US1 or US2 (needs Sidebar component) - Just adds logout button to existing sidebar

### Within Each User Story

- Tests SHOULD be written and FAIL before implementation (TDD approach per Constitution)
- Types/constants before components
- Hooks before components that use them
- Components before routes that import them
- Routes before integration testing
- Story complete and tested before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks can run in parallel (different directories)

**Phase 2 (Foundational)**: Tasks T005-T012 can run in parallel (different files):
- T005-T008: Type definitions (can parallelize)
- T009-T010: Mock data (can parallelize)
- T011-T012: Utility function (can parallelize)

**Phase 3 (US1)**: Parallelizable tasks:
- T013: Test (parallel with types/hook setup)
- T014-T015: Hook (parallel with components)
- T016: AdminNav (parallel with Sidebar base)
- T021-T022: Admin routes (parallel with each other)

**Phase 4 (US2)**: Parallelizable tasks:
- T026: Test (parallel with components)
- T027-T028: Components (can parallelize)
- T032-T033: Workspace routes (parallel with each other)

**Phase 5 (US3)**: Mostly sequential (modifying existing Sidebar)

**Phase 6 (US4)**: Sequential (modifying existing Sidebar)

**Phase 7 (Polish)**: Tasks T043-T044 can run in parallel (different test files)

---

## Parallel Example: User Story 1 (Admin Navigation)

```bash
# Launch all parallelizable tasks for User Story 1 together:

# Tests (can start immediately after Foundation):
Task: T013 - "Create unit test for getWorkspaceInitials in tests/navigation/getWorkspaceInitials.test.ts"

# Hook and components (can run in parallel):
Task: T014 - "Create useSidebarState hook in src/domains/navigation/hooks/useSidebarState.ts"
Task: T016 - "Create AdminNav component in src/domains/navigation/components/AdminNav.tsx"

# Admin routes (can run in parallel after AdminNav ready):
Task: T021 - "Create /admin/workspaces route in src/routes/admin/workspaces.tsx"
Task: T022 - "Create /admin/dev-tools route in src/routes/admin/dev-tools.tsx"
```

---

## Parallel Example: User Story 2 (Workspace Navigation)

```bash
# Launch all parallelizable tasks for User Story 2 together:

# Test (can start immediately after Foundation):
Task: T026 - "Create component test for WorkspaceSelector in tests/navigation/WorkspaceSelector.test.tsx"

# Components (can run in parallel):
Task: T027 - "Create WorkspaceSelector component in src/domains/navigation/components/WorkspaceSelector.tsx"
Task: T028 - "Create WorkspaceNav component in src/domains/navigation/components/WorkspaceNav.tsx"

# Workspace routes (can run in parallel):
Task: T032 - "Create /workspace/$workspaceId/projects route in src/routes/workspace/$workspaceId/projects.tsx"
Task: T033 - "Create /workspace/$workspaceId/settings route in src/routes/workspace/$workspaceId/settings.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Both P1)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T012) - CRITICAL
3. Complete Phase 3: User Story 1 - Admin Navigation (T013-T025)
4. **VALIDATE US1**: Test independently
5. Complete Phase 4: User Story 2 - Workspace Navigation (T026-T034)
6. **VALIDATE US1 + US2**: Test both stories work together
7. **STOP**: You now have an MVP with admin and workspace navigation

### Full Feature (All User Stories)

1. Complete MVP (Phases 1-4)
2. Complete Phase 5: User Story 3 - Guest Experience (T035-T038)
3. **VALIDATE US1 + US2 + US3**: Test all navigation areas
4. Complete Phase 6: User Story 4 - Logout UI (T039-T042)
5. **VALIDATE ALL**: Test complete navigation system
6. Complete Phase 7: Polish (T043-T055)
7. **FINAL VALIDATION**: Run full test suite and manual QA

### Incremental Delivery

Each user story adds value without breaking previous stories:

1. **After US1**: Admin can navigate between Workspaces and Dev Tools → Demo to stakeholders
2. **After US2**: Workspace navigation working with workspace selector → Demo multi-tenant navigation
3. **After US3**: Guest experience clean and focused → Demo guest upload flow readiness
4. **After US4**: Complete navigation structure ready for auth integration → Demo complete UI framework

### Parallel Team Strategy

With 2-3 developers after Foundational phase completes:

- **Developer A**: User Story 1 (Admin Navigation) - T013-T025
- **Developer B**: User Story 2 (Workspace Navigation) - T026-T034
- **Developer C**: User Story 3 (Guest Experience) + User Story 4 (Logout) - T035-T042

Stories complete in parallel and integrate smoothly (shared Sidebar component, different RouteArea rendering).

---

## Notes

- **[P] tasks**: Different files, no dependencies - safe to parallelize
- **[Story] labels**: Map task to specific user story for traceability (US1, US2, US3, US4)
- **Each user story independently testable**: Can validate each story works on its own
- **Tests first**: Write tests before implementation (TDD per Constitution)
- **Commit frequently**: After each task or logical group
- **Checkpoints**: Stop at any checkpoint to validate story independently
- **MVP = US1 + US2**: Admin and workspace navigation (both P1) provide core value
- **Monochrome styling**: Use Tailwind slate colors (bg-slate-900, text-slate-50, etc.)
- **Mobile-first**: Sidebar uses Sheet component on mobile, static sidebar on desktop
- **No auth logic**: Logout button is visual placeholder only (US4)
- **Mock data only**: MOCK_WORKSPACES for testing, no Firebase integration
- **Validation before commit**: Must run `pnpm check` and pass all tests (Phase 7, T051)
