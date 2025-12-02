# Tasks: Projects - Foundation for Nested Events

**Input**: Design documents from `/specs/001-projects/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT requested in this specification - no test tasks included per Minimal Testing Strategy (existing tests will be updated as part of refactor tasks)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js monorepo:
- Feature module: `web/src/features/projects/`
- Pages: `web/src/app/(authenticated)/projects/`
- Scripts: `scripts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Firestore migration and project initialization

- [X] T001 Create migration script at `scripts/migrate-events-to-projects.ts` to copy `/events` → `/projects` with field renaming (ownerId→companyId, joinPath→sharePath, activeJourneyId→activeEventId)
- [X] T002 Add Firestore indexes to `firebase.json` for projects collection (companyId, sharePath, status+updatedAt composite)
- [ ] T003 Run migration script in dry-run mode and verify output logs
- [ ] T004 Run migration script with writes enabled and verify document count matches
- [ ] T005 Spot-check 10 random migrated documents for field correctness

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core feature module refactor that MUST be complete before ANY user story UI can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Rename directory `web/src/features/events/` → `web/src/features/projects/`
- [X] T007 [P] Rename types file `web/src/features/projects/types/event.types.ts` → `project.types.ts` and update all type names (Event→Project, EventStatus→ProjectStatus, EventTheme→ProjectTheme, EventThemeText→ProjectThemeText, EventThemeButton→ProjectThemeButton, EventThemeBackground→ProjectThemeBackground)
- [X] T008 [P] Rename schemas file `web/src/features/projects/schemas/events.schemas.ts` → `projects.schemas.ts` and update all schema names (eventSchema→projectSchema, eventThemeSchema→projectThemeSchema, etc.) and field references
- [X] T009 Update constants file `web/src/features/projects/constants.ts` with PROJECT_STATUS constants and add SHARE_PATH_PREFIX="/p/", QR_STORAGE_PATH template
- [X] T010 [P] Rename repository file `web/src/features/projects/repositories/events.ts` → `projects.repository.ts` and update: collection reference 'events'→'projects', function names (getEvent→getProject, listEvents→listProjects), add getProjectBySharePath function, update all type references Event→Project
- [X] T011 [P] Create Server Actions file `web/src/features/projects/actions/projects.actions.ts` implementing createProject (with QR generation), updateProject, updateProjectStatus (with transition validation), deleteProject (soft delete), updateProjectTheme per contracts/projects.actions.md
- [X] T012 [P] Update barrel export `web/src/features/projects/types/index.ts` to export Project types
- [X] T013 [P] Update barrel export `web/src/features/projects/schemas/index.ts` to export Project schemas
- [X] T014 [P] Update barrel export `web/src/features/projects/repositories/index.ts` to export repository functions
- [X] T015 Run `pnpm type-check` to identify remaining Event references and update them globally (search codebase for @/features/events imports and Event type references)

**Checkpoint**: Foundation ready - feature module fully renamed, all core types/schemas/actions/repositories in place. User story UI implementation can now begin.

---

## Phase 3: User Story 1 - Create and Manage Projects as Event Containers (Priority: P1) 🎯 MVP

**Goal**: Administrators can create projects with share links and QR codes, view project details, and update project status

**Independent Test**: Create a new project via admin interface → verify it appears in project list → verify share link and QR code are generated → change status from draft to live → verify status persists

### Implementation for User Story 1

- [ ] T016 [P] [US1] Rename component `web/src/features/projects/components/studio/EventForm.tsx` → `ProjectForm.tsx`, update all Event→Project references, update import paths
- [ ] T017 [P] [US1] Rename component `web/src/features/projects/components/studio/EventStatusSwitcher.tsx` → `ProjectStatusSwitcher.tsx`, update Event→Project references
- [ ] T018 [P] [US1] Rename component `web/src/features/projects/components/studio/DeleteEventButton.tsx` → `DeleteProjectButton.tsx`, update to use deleteProject action
- [ ] T019 [P] [US1] Rename component `web/src/features/projects/components/shared/EditableEventName.tsx` → `EditableProjectName.tsx`, update Event→Project references
- [ ] T020 [P] [US1] Create hook `web/src/features/projects/hooks/useProject.ts` for single project real-time subscription (wraps getProject with subscribe: true)
- [ ] T021 [US1] Create new component `web/src/features/projects/components/ProjectDetailsHeader.tsx` with project name, ProjectStatusSwitcher, and edit controls
- [ ] T022 [US1] Create page `web/src/app/(authenticated)/projects/[projectId]/page.tsx` with ProjectDetailsHeader, tab navigation (Events, Distribute), and useProject hook
- [ ] T023 [US1] Update ProjectForm to call createProject action on submit and handle success/error states with toast notifications
- [ ] T024 [US1] Update ProjectStatusSwitcher to call updateProjectStatus action and handle transition validation errors
- [ ] T025 [US1] Update DeleteProjectButton to call deleteProject action and redirect to projects list on success
- [ ] T026 [US1] Update barrel export `web/src/features/projects/components/index.ts` to export new components (ProjectForm, ProjectStatusSwitcher, DeleteProjectButton, EditableProjectName, ProjectDetailsHeader)
- [ ] T027 [US1] Update barrel export `web/src/features/projects/hooks/index.ts` to export useProject hook
- [ ] T028 [US1] Update feature module public API `web/src/features/projects/index.ts` to export components, hooks, and types (no actions/schemas/repositories)

**Checkpoint**: At this point, administrators can create projects, view project details, and change project status. This is independently testable.

---

## Phase 4: User Story 2 - View and Navigate Project List (Priority: P1)

**Goal**: Administrators can view all projects for their company in a list and navigate to project details

**Independent Test**: Create multiple projects → verify they all appear in projects list with name and status → click a project card → verify navigation to project details page → verify empty state shows when no projects exist

### Implementation for User Story 2

- [ ] T029 [P] [US2] Rename component `web/src/features/projects/components/studio/EventCard.tsx` → `ProjectCard.tsx`, update Event→Project references, update click handler to navigate to `/projects/{projectId}`
- [ ] T030 [P] [US2] Rename component `web/src/features/projects/components/studio/EventBreadcrumb.tsx` → `ProjectBreadcrumb.tsx`, update Event→Project references and route paths
- [ ] T031 [US2] Create hook `web/src/features/projects/hooks/useProjects.ts` for projects list real-time subscription (wraps listProjects with subscribe: true, filters by companyId and deletedAt==null)
- [ ] T032 [US2] Create page `web/src/app/(authenticated)/projects/page.tsx` with ProjectCard grid, "Create Project" button (opens ProjectForm dialog), empty state, and useProjects hook
- [ ] T033 [US2] Update ProjectCard to display project name, status badge, and last updated timestamp
- [ ] T034 [US2] Add empty state UI to projects list page with "Create Project" call-to-action and illustration
- [ ] T035 [US2] Update barrel export `web/src/features/projects/components/index.ts` to export ProjectCard and ProjectBreadcrumb
- [ ] T036 [US2] Update barrel export `web/src/features/projects/hooks/index.ts` to export useProjects hook

**Checkpoint**: At this point, User Stories 1 AND 2 are both functional - administrators can view projects list, create projects, and navigate to details. Both stories are independently testable.

---

## Phase 5: User Story 3 - Access Distribution Tools (Priority: P2)

**Goal**: Administrators can copy share links and download QR codes from the Distribute tab

**Independent Test**: Navigate to project details → click Distribute tab → verify share link and QR code display → click "Copy Link" → verify clipboard contains share link with visual confirmation → click "Download QR" → verify QR image downloads

### Implementation for User Story 3

- [ ] T037 [P] [US3] Create component `web/src/features/projects/components/ProjectDistributeTab.tsx` displaying sharePath, QR code image (from qrPngPath), "Copy Link" button, "Download QR" button
- [ ] T038 [US3] Implement copy-to-clipboard functionality in ProjectDistributeTab using navigator.clipboard.writeText() with toast success notification
- [ ] T039 [US3] Implement download QR functionality in ProjectDistributeTab using anchor download or fetch + blob + URL.createObjectURL pattern
- [ ] T040 [US3] Add ProjectDistributeTab to project details page `web/src/app/(authenticated)/projects/[projectId]/page.tsx` as second tab
- [ ] T041 [US3] Style ProjectDistributeTab for mobile-first (320px-768px primary), ensure buttons are ≥44x44px touch targets, QR code scales properly
- [ ] T042 [US3] Update barrel export `web/src/features/projects/components/index.ts` to export ProjectDistributeTab

**Checkpoint**: All P1 and P2 user stories are functional. Administrators have full project management capabilities with distribution tools.

---

## Phase 6: User Story 4 - Prepare for Future Nested Events (Priority: P3)

**Goal**: Events tab displays placeholder message for Phase 5 functionality

**Independent Test**: Navigate to project details → click Events tab → verify placeholder message "Coming in Phase 5" is displayed

### Implementation for User Story 4

- [ ] T043 [US4] Create component `web/src/features/projects/components/ProjectEventsTab.tsx` with centered placeholder message "Coming in Phase 5" and optional illustration
- [ ] T044 [US4] Add ProjectEventsTab to project details page `web/src/app/(authenticated)/projects/[projectId]/page.tsx` as first tab
- [ ] T045 [US4] Update barrel export `web/src/features/projects/components/index.ts` to export ProjectEventsTab

**Checkpoint**: All user stories (US1-US4) are complete and independently functional.

---

## Phase 7: Guest Flow Update & Navigation

**Purpose**: Update guest routing and admin navigation to use Projects instead of Events

- [ ] T046 Search codebase for guest routing logic (likely in `web/src/app/(public)` or `web/src/features/guest`) and update Firestore query from `collection('events')` to `collection('projects')` and field references `joinPath`→`sharePath`
- [ ] T047 [P] Update navigation components/breadcrumbs to reference "Projects" instead of "Events" in labels and route paths (search for /events routes globally)
- [ ] T048 [P] Rename or update admin layout/sidebar to show "Projects" menu item pointing to `/projects`
- [ ] T049 Test guest flow end-to-end: visit existing share link → verify project loads from `/projects` collection → verify activeEventId resolves to experience → verify guest can complete flow

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and testing before deployment

- [ ] T050 [P] Search codebase globally for "Event" strings (case-sensitive) in comments, JSDoc, console.logs and update to "Project" where semantically appropriate
- [ ] T051 [P] Search codebase for event/events variable names and rename to project/projects (exclude node_modules, be careful with DOM events)
- [ ] T052 [P] Update any remaining import paths `@/features/events` → `@/features/projects`
- [ ] T053 [P] Review and update component prop types to ensure Project types are used consistently
- [ ] T054 [P] Update mobile responsive design for all new components (ProjectDetailsHeader, ProjectDistributeTab, ProjectEventsTab) to ensure 320px-768px viewport works correctly
- [ ] T055 [P] Verify all touch targets (buttons, cards, tabs) meet ≥44x44px requirement across all project components

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T056 Run `pnpm lint` and fix all errors/warnings
- [ ] T057 Run `pnpm type-check` and resolve all TypeScript errors (strict mode, no `any` escapes)
- [ ] T058 Run `pnpm test` - update existing Event tests to use Project terminology and ensure all tests pass
- [ ] T059 Manual testing: Create project → verify in list → view details → change status → verify persists → copy share link → download QR → verify placeholder in Events tab
- [ ] T060 Manual testing: Test guest flow with existing share link → verify project loads → verify experience loads
- [ ] T061 Manual mobile testing: Test all project pages on mobile device (iOS or Android) at 320px, 375px, 768px viewports
- [ ] T062 Performance testing: Measure Projects List page load time (target < 2 seconds), project creation time (target < 1 minute), QR generation (target < 5 seconds)
- [ ] T063 Commit all changes with clear message: "Refactor Events to Projects (Phase 4)"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
  - Firestore migration runs independently (safe to run multiple times with dry-run)
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - MUST complete T006-T015 before any UI work
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3): Can start after Foundational - Independent
  - US2 (Phase 4): Can start after Foundational - Depends on US1 components (ProjectForm, ProjectStatusSwitcher)
  - US3 (Phase 5): Can start after Foundational - Depends on US1 (project details page exists)
  - US4 (Phase 6): Can start after Foundational - Depends on US1 (project details page exists)
- **Guest Flow (Phase 7)**: Can run in parallel with user stories (different code paths)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - No dependencies on other stories (creates core project management)
- **User Story 2 (P1)**: Foundation + US1 components - Reuses ProjectForm, but adds list view (mostly independent)
- **User Story 3 (P2)**: Foundation + US1 page - Adds tab to existing project details page
- **User Story 4 (P3)**: Foundation + US1 page - Adds tab to existing project details page

### Within Each User Story

- Components can be renamed in parallel ([P] tasks)
- Hooks depend on repository being ready (T010)
- Pages depend on components and hooks being ready
- Actions integration depends on actions being implemented (T011)

### Parallel Opportunities

**Setup Phase (all can run in parallel)**:
- T001 (migration script) can run while T002 (indexes) is created
- T003-T005 (migration testing) must run sequentially after T001

**Foundational Phase (some parallelism)**:
- T007, T008, T009, T010, T011, T012, T013, T014 can all run in parallel (different files)
- T006 (directory rename) must complete first
- T015 (type-check) must run last

**User Story 1 (parallel within constraints)**:
- T016-T019, T020 can run in parallel (different files)
- T021, T022 depend on T020 (hook) being ready
- T023-T025 depend on components and actions being ready

**User Story 2**:
- T029, T030, T031 can run in parallel
- T032-T034 depend on T029, T031 being ready

**User Story 3 & 4**:
- T037, T043 can run in parallel (different components)
- Tab integration tasks depend on components being ready

**Polish Phase**:
- T050-T055 can all run in parallel (different concerns)
- T056-T063 must run sequentially (validation loop)

---

## Parallel Example: Foundational Phase

```bash
# After T006 (directory rename) completes, launch these together:
Task: "Rename types file and update all type names" (T007)
Task: "Rename schemas file and update all schema names" (T008)
Task: "Update constants file" (T009)
Task: "Rename repository file and update functions" (T010)
Task: "Create Server Actions file" (T011)
Task: "Update types barrel export" (T012)
Task: "Update schemas barrel export" (T013)
Task: "Update repositories barrel export" (T014)
```

---

## Parallel Example: User Story 1

```bash
# Launch all component renames together:
Task: "Rename EventForm.tsx → ProjectForm.tsx" (T016)
Task: "Rename EventStatusSwitcher.tsx → ProjectStatusSwitcher.tsx" (T017)
Task: "Rename DeleteEventButton.tsx → DeleteProjectButton.tsx" (T018)
Task: "Rename EditableEventName.tsx → EditableProjectName.tsx" (T019)
Task: "Create useProject hook" (T020)

# Then after hooks ready, create new components:
Task: "Create ProjectDetailsHeader component" (T021)
Task: "Create project details page" (T022)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (Firestore migration)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories) → ~30-50 files renamed
3. Complete Phase 3: User Story 1 → Core project management functional
4. Complete Phase 4: User Story 2 → Projects list and navigation functional
5. **STOP and VALIDATE**: Test US1 + US2 independently
6. Deploy/demo if ready (MVP = create, list, view, edit projects)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (~1-2 days)
2. Add User Story 1 → Test independently → Deploy/Demo (core management ~1 day)
3. Add User Story 2 → Test independently → Deploy/Demo (list view ~0.5 day)
4. Add User Story 3 → Test independently → Deploy/Demo (distribution tools ~0.5 day)
5. Add User Story 4 → Test independently → Deploy/Demo (Events tab placeholder ~0.25 day)
6. Guest Flow Update → Verify existing share links work → Deploy (~0.5 day)
7. Polish & Validation → Final testing → Deploy (~1 day)

**Total Estimated Effort**: 4-6 days for MVP (US1 + US2), 6-8 days for full feature

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together (~1-2 days)
2. Once Foundational is done:
   - Developer A: User Story 1 (core management)
   - Developer B: User Story 2 (list view) - can start components in parallel
3. After US1 + US2 complete:
   - Developer A: User Story 3 (distribute tab)
   - Developer B: User Story 4 (events tab) + Guest Flow Update
4. Both: Polish & Validation together

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story builds on foundation but is independently functional
- This is a RENAME/REFACTOR - not new feature development
- Existing Event data and functionality preserved throughout
- Migration script is idempotent (safe to re-run)
- Backwards compatibility NOT required (breaking change accepted)
- Guest flow continuity maintained via sharePath preservation
- TypeScript strict mode enforced throughout (no `any` escapes)
- Mobile-first design (320px-768px primary viewport)
- All tests updated as part of refactor tasks (no separate test phase)
- Validation loop runs at end to catch any remaining issues
