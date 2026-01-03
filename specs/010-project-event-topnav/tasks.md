---
description: "Task list for Project & Event Top Navigation Bar implementation"
---

# Tasks: Project & Event Top Navigation Bar

**Input**: Design documents from `/specs/010-project-event-topnav/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-api.md

**Tests**: Tests are OPTIONAL and not included in this task list (pragmatic testing strategy per constitution).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a TanStack Start web application within a monorepo structure:
- **App root**: `apps/clementine-app/`
- **Components**: `apps/clementine-app/src/domains/navigation/components/`
- **Routes**: `apps/clementine-app/src/app/workspace/`
- **Tests** (if needed): `apps/clementine-app/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create component files and TypeScript interfaces

- [ ] T001 [P] Create TypeScript interfaces for BreadcrumbItem, ActionButton, TopNavBarProps in apps/clementine-app/src/domains/navigation/components/TopNavBar.tsx
- [ ] T002 [P] Create empty component file apps/clementine-app/src/domains/navigation/components/TopNavBreadcrumb.tsx
- [ ] T003 [P] Create empty component file apps/clementine-app/src/domains/navigation/components/TopNavActions.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core reusable components that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [US1] Implement TopNavBreadcrumb component in apps/clementine-app/src/domains/navigation/components/TopNavBreadcrumb.tsx with breadcrumb rendering, separators, and truncation
- [ ] T005 [US1] Implement TopNavActions component in apps/clementine-app/src/domains/navigation/components/TopNavActions.tsx with button mapping and layout
- [ ] T006 [US1] Implement TopNavBar container component in apps/clementine-app/src/domains/navigation/components/TopNavBar.tsx with horizontal flex layout, border styling, and theme tokens
- [ ] T007 Update barrel export in apps/clementine-app/src/domains/navigation/components/index.ts to export TopNavBar and type interfaces (not internal components)

**Checkpoint**: Core navigation components ready - user story integration can now begin

---

## Phase 3: User Story 1 - Navigate Project Context (Priority: P1) 🎯 MVP

**Goal**: Display top navigation bar on project pages showing project name and share button

**Independent Test**: Navigate to any project page at `/workspace/[workspaceSlug]/projects/[projectId]` and verify breadcrumb displays project name with folder icon on left, share button on right. Click share button and verify "Coming soon" toast appears.

### Implementation for User Story 1

- [ ] T008 [US1] Import TopNavBar component and required icons (FolderOpen, Share2) in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx
- [ ] T009 [US1] Create breadcrumbs array with project name and folder icon in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx using loader data
- [ ] T010 [US1] Create actions array with share button and toast handler in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx
- [ ] T011 [US1] Render TopNavBar component before Outlet in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx layout

**Checkpoint**: At this point, project pages show top navigation bar with breadcrumb and share button. Clicking share shows toast. User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Navigate Event Context with Breadcrumb (Priority: P1)

**Goal**: Display top navigation bar on event pages showing project > event breadcrumb trail with clickable project link

**Independent Test**: Navigate to any event page at `/workspace/[workspaceSlug]/projects/[projectId]/events/[eventId]` and verify breadcrumb displays folder icon + project name + separator + event name. Click project name and verify navigation to project details page.

### Implementation for User Story 2

- [ ] T012 [US2] Import TopNavBar component and FolderOpen icon in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx
- [ ] T013 [US2] Get project and event data from loaders and route params in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx
- [ ] T014 [US2] Create breadcrumbs array with clickable project link and event name in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx
- [ ] T015 [US2] Create empty actions array (no actions for US2) in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx
- [ ] T016 [US2] Render TopNavBar component before existing EventLayout content in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx

**Checkpoint**: At this point, event pages show top navigation bar with breadcrumb trail. Clicking project name navigates to project page. User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Access Event Actions (Priority: P2)

**Goal**: Add play and publish action buttons to event top navigation bar

**Independent Test**: Navigate to event page and verify play and publish buttons appear on right side of top navigation bar. Click each button and verify "Coming soon" toast appears for each.

### Implementation for User Story 3

- [ ] T017 [US3] Import Play and Upload icons from lucide-react in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx
- [ ] T018 [US3] Update actions array in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx to include play and publish buttons with toast handlers and ARIA labels

**Checkpoint**: All user stories complete. Event pages now show full navigation with breadcrumb and action buttons.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Responsive testing, validation, and final quality checks

- [ ] T019 [P] Test breadcrumb text truncation on narrow screens (320px, 375px) using Chrome DevTools responsive mode
- [ ] T020 [P] Test action button touch targets on mobile (verify 44x44px minimum) using browser developer tools
- [ ] T021 [P] Verify no hard-coded colors (all theme tokens) by reviewing component source code
- [ ] T022 Test breadcrumb navigation (click project name on event page) in local dev server
- [ ] T023 Test all action button clicks trigger correct toast messages in local dev server
- [ ] T024 Run validation workflow: pnpm app:check (format, lint, type-check) in apps/clementine-app/
- [ ] T025 Manual standards review against frontend/design-system.md, frontend/component-libraries.md, global/project-structure.md per validation gates
- [ ] T026 Test full user journeys from quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 and 2 can proceed in parallel (different routes)
  - User Story 3 extends User Story 2 (same route, adds actions)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Completely independent (project route)
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Completely independent (event route, no actions)
- **User Story 3 (P2)**: Extends User Story 2 - Adds actions to same route (event route)

### Within Each User Story

- User Story 1: All route tasks sequential (same file edits)
- User Story 2: All route tasks sequential (same file edits)
- User Story 3: Sequential extension to User Story 2

### Parallel Opportunities

- **Setup (Phase 1)**: All 3 tasks can run in parallel (different files)
- **Foundational (Phase 2)**: T004, T005 can run in parallel (different component files), T006 depends on T004+T005, T007 runs after T006
- **User Stories**: US1 and US2 can run completely in parallel (different route files)
- **Polish (Phase 6)**: T019, T020, T021 can run in parallel (different testing activities)

---

## Parallel Example: Foundational Phase

```bash
# Launch component implementations together:
Task: "Implement TopNavBreadcrumb component in TopNavBreadcrumb.tsx"
Task: "Implement TopNavActions component in TopNavActions.tsx"

# Then after both complete:
Task: "Implement TopNavBar container in TopNavBar.tsx"
```

## Parallel Example: User Stories

```bash
# Launch User Story 1 and 2 together (if team capacity allows):
Task: "Integrate TopNavBar in project route $projectId.tsx" (US1)
Task: "Integrate TopNavBar in event route $eventId.tsx" (US2)

# These are completely independent - different files, no shared state
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (3 tasks, ~10 min)
2. Complete Phase 2: Foundational (4 tasks, ~50 min) - CRITICAL foundation
3. Complete Phase 3: User Story 1 (4 tasks, ~20 min)
4. **STOP and VALIDATE**: Navigate to project page, verify breadcrumb and share button work
5. Demo/commit if ready

**Result**: Project pages have contextual top navigation - MVP delivered!

### Incremental Delivery

1. Complete Setup + Foundational → Core components ready (~1 hour)
2. Add User Story 1 → Test independently → Commit (project navigation works)
3. Add User Story 2 → Test independently → Commit (event breadcrumb works)
4. Add User Story 3 → Test independently → Commit (event actions work)
5. Polish phase → Final validation → Deploy

**Result**: Each story adds value, can demo at each checkpoint

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together (~1 hour)
2. Once Foundational done:
   - Developer A: User Story 1 (project route)
   - Developer B: User Story 2 + 3 (event route)
3. Merge and test integration
4. Polish phase together

**Result**: Faster completion via parallel work on independent routes

---

## Task Statistics

**Total Tasks**: 26
- Setup: 3 tasks (~10 min)
- Foundational: 4 tasks (~50 min)
- User Story 1 (P1): 4 tasks (~20 min)
- User Story 2 (P1): 5 tasks (~20 min)
- User Story 3 (P2): 2 tasks (~10 min)
- Polish: 8 tasks (~30 min)

**Estimated Total Time**: 2-3 hours (sequential execution)
**Estimated with Parallelization**: 1.5-2 hours (with 2 developers)

**Parallel Tasks**: 6 tasks marked [P] (different files, can run concurrently)

**Independent Test Criteria**:
- US1: Project page shows breadcrumb + share button, toast works
- US2: Event page shows breadcrumb trail, project link navigates
- US3: Event page shows action buttons, toasts work

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only)

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story] Description with file path`
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story independently completable and testable
- Commit after completing each user story phase
- Stop at any checkpoint to validate story independently
- No test tasks included (optional per constitution - can add later if needed)
- Validation workflow (pnpm app:check) included in Polish phase
