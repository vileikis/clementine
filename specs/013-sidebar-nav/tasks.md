# Tasks: Sidebar Navigation System

**Input**: Design documents from `/specs/013-sidebar-nav/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

**Tests**: Not explicitly requested in feature specification - tests omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- All paths relative to `web/src/`

---

## Phase 1: Setup

**Purpose**: Install dependencies and create feature module structure

- [X] T001 Install Zustand dependency: `cd web && pnpm add zustand`
- [X] T002 [P] Create feature module directory structure at `features/sidebar/`
- [X] T003 [P] Create types barrel export in `features/sidebar/types/index.ts`
- [X] T004 [P] Create stores barrel export in `features/sidebar/stores/index.ts`
- [X] T005 [P] Create hooks barrel export in `features/sidebar/hooks/index.ts`
- [X] T006 [P] Create components barrel export in `features/sidebar/components/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, store, and constants that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create sidebar types (SidebarState, SidebarActions, NavigationItem) in `features/sidebar/types/sidebar.types.ts`
- [X] T008 Create Zustand store with persist middleware in `features/sidebar/stores/sidebar.store.ts`
- [X] T009 Create navigation items constants (Projects, Experiences, Analytics, Settings) in `features/sidebar/constants.ts`
- [X] T010 Create feature public API barrel export in `features/sidebar/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Navigate Between Main Sections (Priority: P1) 🎯 MVP

**Goal**: Users can navigate between Projects, Experiences, Analytics (disabled), Settings via sidebar

**Independent Test**: Load admin interface, click each nav item, verify navigation and active state highlighting

### Implementation for User Story 1

- [X] T011 [P] [US1] Create SidebarNavItem component with icon, label, active state, disabled state in `features/sidebar/components/SidebarNavItem.tsx`
- [X] T012 [P] [US1] Create SidebarNav component that renders navigation items list in `features/sidebar/components/SidebarNav.tsx`
- [X] T013 [US1] Create main Sidebar container component (layout structure only, expanded mode) in `features/sidebar/components/Sidebar.tsx`
- [X] T014 [US1] Update workspace layout to include Sidebar in `app/(workspace)/layout.tsx`
- [X] T015 [US1] Update company layout to remove AppNavbar, pass company to Sidebar in `app/(workspace)/(company)/[companySlug]/layout.tsx`
- [X] T016 [US1] Create analytics placeholder page in `app/(workspace)/(company)/[companySlug]/analytics/page.tsx`
- [X] T017 [US1] Verify navigation works: click each nav item navigates correctly with active highlighting

**Checkpoint**: User Story 1 complete - basic navigation functional

---

## Phase 4: User Story 2 - Collapse and Expand Sidebar (Priority: P1)

**Goal**: Users can collapse sidebar to icons-only mode and expand back, with state persisted

**Independent Test**: Click hamburger toggle, verify width change, close/reopen browser, verify preference persisted

### Implementation for User Story 2

- [X] T018 [US2] Add collapse toggle (hamburger menu) to Sidebar component in `features/sidebar/components/Sidebar.tsx`
- [X] T019 [US2] Update SidebarNavItem to support collapsed mode (icon + small label underneath, YouTube-style) in `features/sidebar/components/SidebarNavItem.tsx`
- [X] T020 [US2] Add CSS width transition animation (256px ↔ 72px, 200ms ease-out) to Sidebar in `features/sidebar/components/Sidebar.tsx`
- [X] T021 [US2] Add tooltip on hover for collapsed nav items in `features/sidebar/components/SidebarNavItem.tsx`
- [X] T022 [US2] Connect collapse state to Zustand store (toggleCollapsed action) in `features/sidebar/components/Sidebar.tsx`
- [X] T023 [US2] Verify persistence: collapse sidebar, refresh page, verify still collapsed

**Checkpoint**: User Story 2 complete - collapse/expand with persistence working

---

## Phase 5: User Story 3 - Root URL Smart Redirect (Priority: P1)

**Goal**: Visiting `/` redirects to last accessed company or `/companies` if none

**Independent Test**: Visit `/` with and without stored company slug, verify correct redirect behavior

### Implementation for User Story 3

- [X] T024 [US3] Create `/companies` page (move company list from workspace root) in `app/(workspace)/companies/page.tsx`
- [X] T025 [US3] Update root page with client-side redirect logic using Zustand store in `app/page.tsx`
- [X] T026 [US3] Add lastCompanySlug update when visiting company pages in `app/(workspace)/(company)/[companySlug]/layout.tsx`
- [X] T027 [US3] Handle invalid stored slug: validate company exists, clear if invalid in `app/page.tsx`
- [X] T028 [US3] Verify redirect: clear storage, visit `/`, verify redirect to `/companies`
- [X] T029 [US3] Verify redirect: visit a company, then visit `/`, verify redirect to that company

**Checkpoint**: User Story 3 complete - smart root redirect working

---

## Phase 6: User Story 4 - Company Switcher (Priority: P2)

**Goal**: Users can see current company in sidebar and click to open company list in new tab

**Independent Test**: View company switcher in expanded/collapsed modes, click to verify new tab opens `/companies`

### Implementation for User Story 4

- [X] T030 [US4] Create CompanySwitcher component (avatar + name in expanded, avatar only in collapsed) in `features/sidebar/components/CompanySwitcher.tsx`
- [X] T031 [US4] Add CompanySwitcher to Sidebar below hamburger toggle in `features/sidebar/components/Sidebar.tsx`
- [X] T032 [US4] Implement click handler to open `/companies` in new tab (target="_blank") in `features/sidebar/components/CompanySwitcher.tsx`
- [X] T033 [US4] Pass company prop from layout to Sidebar in `app/(workspace)/(company)/[companySlug]/layout.tsx`
- [X] T034 [US4] Verify: click company switcher opens `/companies` in new tab

**Checkpoint**: User Story 4 complete - company switcher functional

---

## Phase 7: User Story 5 - Contextual Breadcrumbs (Priority: P2)

**Goal**: Breadcrumbs appear in content area showing hierarchy (excluding company name)

**Independent Test**: Navigate to nested pages, verify breadcrumbs display correctly and are clickable

### Implementation for User Story 5

- [X] T035 [US5] Create content header component with breadcrumbs slot in `features/sidebar/components/ContentHeader.tsx`
- [X] T036 [US5] Update company layout to render breadcrumbs in content area (not sidebar) in `app/(workspace)/(company)/[companySlug]/layout.tsx`
- [X] T037 [US5] Update project layout breadcrumbs (Projects / [Project Name]) in `app/(workspace)/(project)/[companySlug]/[projectId]/layout.tsx`
- [X] T038 [US5] Update event layout breadcrumbs (Projects / [Project] / [Event]) in `app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/layout.tsx`
- [X] T039 [US5] Ensure breadcrumbs exclude company name (company context in sidebar) in all layouts
- [X] T040 [US5] Verify: breadcrumbs are clickable and navigate to correct sections

**Checkpoint**: User Story 5 complete - breadcrumbs in content area working

---

## Phase 8: User Story 6 - Logout from Sidebar (Priority: P2)

**Goal**: Logout button anchored at bottom of sidebar, works in both expanded and collapsed modes

**Independent Test**: View logout button in expanded/collapsed modes, click to verify logout and redirect to login

### Implementation for User Story 6

- [X] T041 [US6] Create SidebarLogout component (icon + label expanded, icon only collapsed) in `features/sidebar/components/SidebarLogout.tsx`
- [X] T042 [US6] Add SidebarLogout to Sidebar anchored at bottom in `features/sidebar/components/Sidebar.tsx`
- [X] T043 [US6] Connect logout to existing auth signout functionality in `features/sidebar/components/SidebarLogout.tsx`
- [X] T044 [US6] Verify: click logout signs out and redirects to login page

**Checkpoint**: User Story 6 complete - logout from sidebar working

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [X] T045 [P] Update components barrel export with all new components in `features/sidebar/components/index.ts`
- [X] T046 [P] Ensure all touch targets meet 44x44px minimum requirement across sidebar components
- [X] T047 [P] Remove or deprecate AppNavbar component in `components/shared/AppNavbar.tsx`
- [X] T048 [P] Remove NavTabs usage from company layout (replaced by sidebar) in `app/(workspace)/(company)/[companySlug]/layout.tsx`
- [X] T049 Clean up any unused imports and dead code in modified layout files

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T050 Run `pnpm lint` and fix all errors/warnings
- [X] T051 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T052 Verify feature in local dev server (`pnpm dev`)
- [ ] T053 Test all user stories manually per acceptance scenarios in spec.md
- [ ] T054 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001 (Zustand installed) - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Phase 2 completion
  - US1, US2, US3 are all P1 priority - do sequentially
  - US4, US5, US6 are P2 priority - can do after P1 stories
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Navigation)**: Depends on Phase 2 - No dependencies on other stories ✅
- **US2 (Collapse)**: Depends on US1 (Sidebar must exist) - Can be tested independently
- **US3 (Root Redirect)**: Depends on Phase 2 only - Can be done in parallel with US1/US2
- **US4 (Company Switcher)**: Depends on US1 (Sidebar must exist) - Can be done after US1
- **US5 (Breadcrumbs)**: Depends on US1 (layout changes) - Can be done after US1
- **US6 (Logout)**: Depends on US1 (Sidebar must exist) - Can be done after US1

### Within Each User Story

- Components before layout integration
- Layout changes after components are ready
- Verification after implementation

### Parallel Opportunities

**Phase 1 (all parallel)**:
```
T002, T003, T004, T005, T006 - all directory/barrel setup
```

**Phase 2 (sequential)**:
```
T007 → T008 → T009 → T010 (types before store before constants before export)
```

**Phase 3 (US1)**:
```
T011, T012 can run in parallel (separate component files)
T013 depends on T011, T012
```

**Phase 9 (all parallel)**:
```
T045, T046, T047, T048 - all cleanup tasks
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T010)
3. Complete Phase 3: User Story 1 - Navigation (T011-T017)
4. Complete Phase 4: User Story 2 - Collapse/Expand (T018-T023)
5. Complete Phase 5: User Story 3 - Root Redirect (T024-T029)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo MVP if ready

### Full Feature

8. Complete Phase 6: User Story 4 - Company Switcher (T030-T034)
9. Complete Phase 7: User Story 5 - Breadcrumbs (T035-T040)
10. Complete Phase 8: User Story 6 - Logout (T041-T044)
11. Complete Phase 9: Polish (T045-T054)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All P1 stories (US1, US2, US3) should be completed for MVP
- P2 stories (US4, US5, US6) can be deferred if needed
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
