# Tasks: Router Simplification

**Input**: Design documents from `/specs/014-router-simplify/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Unit tests for breadcrumb helper only (per Constitution Principle IV - Minimal Testing Strategy)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app monorepo**: All paths relative to `web/src/`
- Layout: `app/(workspace)/[companySlug]/layout.tsx`
- Pages: `app/(workspace)/[companySlug]/**/*.tsx`
- Helper: `lib/breadcrumbs.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create foundational utilities needed by all user stories

- [X] T001 Create breadcrumb types and helper function in web/src/lib/breadcrumbs.ts
- [X] T002 [P] Write unit tests for buildBreadcrumbs helper in web/src/lib/breadcrumbs.test.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create unified layout that MUST be complete before page migrations

**⚠️ CRITICAL**: No page migration can begin until unified layout exists

- [X] T003 Create unified layout at web/src/app/(workspace)/[companySlug]/layout.tsx

**Checkpoint**: Foundation ready - page migrations can now begin

---

## Phase 3: User Story 1 - Developer Navigates Simplified Codebase (Priority: P1) 🎯 MVP

**Goal**: Consolidate 4 route group layouts into 1, migrate all pages to new structure

**Independent Test**: Verify single layout renders sidebar for all workspace routes; verify old layouts removed

### Company Route Group Migration

- [X] T004 [US1] Move dashboard page from web/src/app/(workspace)/(company)/[companySlug]/page.tsx to web/src/app/(workspace)/[companySlug]/page.tsx
- [X] T005 [P] [US1] Move projects page from web/src/app/(workspace)/(company)/[companySlug]/projects/page.tsx to web/src/app/(workspace)/[companySlug]/projects/page.tsx
- [X] T006 [P] [US1] Move experiences list page from web/src/app/(workspace)/(company)/[companySlug]/exps/page.tsx to web/src/app/(workspace)/[companySlug]/exps/page.tsx
- [X] T007 [P] [US1] Move analytics page from web/src/app/(workspace)/(company)/[companySlug]/analytics/page.tsx to web/src/app/(workspace)/[companySlug]/analytics/page.tsx
- [X] T008 [P] [US1] Move settings page from web/src/app/(workspace)/(company)/[companySlug]/settings/page.tsx to web/src/app/(workspace)/[companySlug]/settings/page.tsx
- [X] T009 [US1] Delete old company route group directory web/src/app/(workspace)/(company)/

### Project Route Group Migration

- [X] T010 [US1] Move project detail page from web/src/app/(workspace)/(project)/[companySlug]/[projectId]/page.tsx to web/src/app/(workspace)/[companySlug]/[projectId]/page.tsx
- [X] T011 [P] [US1] Move events list page from web/src/app/(workspace)/(project)/[companySlug]/[projectId]/events/page.tsx to web/src/app/(workspace)/[companySlug]/[projectId]/events/page.tsx
- [X] T012 [P] [US1] Move distribute page from web/src/app/(workspace)/(project)/[companySlug]/[projectId]/distribute/page.tsx to web/src/app/(workspace)/[companySlug]/[projectId]/distribute/page.tsx
- [X] T013 [P] [US1] Move results page from web/src/app/(workspace)/(project)/[companySlug]/[projectId]/results/page.tsx to web/src/app/(workspace)/[companySlug]/[projectId]/results/page.tsx
- [X] T014 [US1] Delete old project route group directory web/src/app/(workspace)/(project)/

### Event Route Group Migration

- [X] T015 [US1] Move event detail page from web/src/app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/page.tsx to web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/page.tsx
- [X] T016 [P] [US1] Move event experiences page from web/src/app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx to web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx
- [X] T017 [P] [US1] Move theme page from web/src/app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/theme/page.tsx to web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/theme/page.tsx
- [X] T018 [US1] Delete old event route group directory web/src/app/(workspace)/(event)/

### Experience Route Group Migration

- [X] T019 [US1] Move experience detail page from web/src/app/(workspace)/(experience)/[companySlug]/exps/[expId]/page.tsx to web/src/app/(workspace)/[companySlug]/exps/[expId]/page.tsx
- [X] T020 [US1] Delete old experience route group directory web/src/app/(workspace)/(experience)/

**Checkpoint**: All route groups migrated. User Story 1 should be fully functional - single layout serves all routes.

---

## Phase 4: User Story 2 - Creator Views Correct Breadcrumbs (Priority: P2)

**Goal**: Add page-based breadcrumbs to all migrated pages using the buildBreadcrumbs helper

**Independent Test**: Navigate to deeply nested pages and verify breadcrumb trail is accurate and clickable

### Project Pages Breadcrumbs

- [X] T021 [US2] Add breadcrumbs to project detail page at web/src/app/(workspace)/[companySlug]/[projectId]/page.tsx
- [X] T022 [P] [US2] Add breadcrumbs to events list page at web/src/app/(workspace)/[companySlug]/[projectId]/events/page.tsx
- [X] T023 [P] [US2] Add breadcrumbs to distribute page at web/src/app/(workspace)/[companySlug]/[projectId]/distribute/page.tsx
- [X] T024 [P] [US2] Add breadcrumbs to results page at web/src/app/(workspace)/[companySlug]/[projectId]/results/page.tsx

### Event Pages Breadcrumbs

- [X] T025 [US2] Add breadcrumbs to event detail page at web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/page.tsx
- [X] T026 [P] [US2] Add breadcrumbs to event experiences page at web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx
- [X] T027 [P] [US2] Add breadcrumbs to theme page at web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/theme/page.tsx

### Experience Pages Breadcrumbs

- [X] T028 [US2] Add breadcrumbs to experience detail page at web/src/app/(workspace)/[companySlug]/exps/[expId]/page.tsx

**Checkpoint**: All nested pages display correct breadcrumbs. User Story 2 complete.

---

## Phase 5: User Story 3 - User Experiences Fast Page Navigation (Priority: P3)

**Goal**: Optimize data fetching so company data loads once in layout, pages fetch only their specific entities

**Independent Test**: Navigate from dashboard to event page and verify company fetch occurs once (in layout), not on each page

### Optimize Page Data Fetching

- [X] T029 [US3] Verify layout company fetch is cached by Next.js in web/src/app/(workspace)/[companySlug]/layout.tsx
- [X] T030 [P] [US3] Optimize project page to use parallel fetches for breadcrumb data in web/src/app/(workspace)/[companySlug]/[projectId]/page.tsx
- [X] T031 [P] [US3] Optimize event page to use parallel fetches for breadcrumb data in web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/page.tsx
- [X] T032 [P] [US3] Optimize experience page to use parallel fetches for breadcrumb data in web/src/app/(workspace)/[companySlug]/exps/[expId]/page.tsx

**Checkpoint**: All pages fetch data efficiently with parallel requests. User Story 3 complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [X] T033 [P] Add mobile overflow handling for breadcrumbs in web/src/components/shared/Breadcrumbs.tsx (if not already present)
- [X] T034 Update any stale imports referencing old route group paths across codebase

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T035 Run `pnpm lint` and fix all errors/warnings
- [X] T036 Run `pnpm type-check` and resolve all TypeScript errors
- [X] T037 Run `pnpm test` and ensure all tests pass
- [ ] T038 Verify feature in local dev server (`pnpm dev`) - test all workspace routes
- [ ] T039 Test on mobile viewport (320px width) - verify breadcrumb display
- [ ] T040 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001 (breadcrumb helper) - BLOCKS all page migrations
- **User Story 1 (Phase 3)**: Depends on T003 (unified layout) - migrate pages
- **User Story 2 (Phase 4)**: Depends on T001 (breadcrumb helper) and page migrations from US1
- **User Story 3 (Phase 5)**: Depends on US1 + US2 completion
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (T003) - Core structural change
- **User Story 2 (P2)**: Can start after US1 pages are migrated - Adds breadcrumbs to migrated pages
- **User Story 3 (P3)**: Can start after US2 - Optimizes fetch patterns

### Within Each Route Group

- Migrate main page first (e.g., project detail page)
- Then migrate sub-pages in parallel (events, distribute, results)
- Delete old route group directory last

### Parallel Opportunities

**Phase 1**:
- T001 and T002 can run in parallel (after T001 types are defined)

**Phase 3 (US1)** - Company pages:
- T005, T006, T007, T008 can run in parallel after T004

**Phase 3 (US1)** - Project pages:
- T011, T012, T013 can run in parallel after T010

**Phase 3 (US1)** - Event pages:
- T016, T017 can run in parallel after T015

**Phase 4 (US2)** - Project breadcrumbs:
- T022, T023, T024 can run in parallel after T021

**Phase 4 (US2)** - Event breadcrumbs:
- T026, T027 can run in parallel after T025

**Phase 5 (US3)**:
- T030, T031, T032 can run in parallel after T029

---

## Parallel Example: User Story 1 - Company Pages

```bash
# First, move dashboard (required for layout to work):
Task T004: Move dashboard page

# Then, move remaining company pages in parallel:
Task T005: Move projects page
Task T006: Move experiences list page
Task T007: Move analytics page
Task T008: Move settings page

# Finally, delete old route group:
Task T009: Delete (company) directory
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: User Story 1 (T004-T020)
4. **STOP and VALIDATE**: Test all routes work with single layout
5. Deploy/demo if ready - structure is simplified

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test routes → Deploy (MVP!)
3. Add User Story 2 → Test breadcrumbs → Deploy
4. Add User Story 3 → Test performance → Deploy
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [US1/US2/US3] label maps task to specific user story for traceability
- Each route group must be migrated atomically (all pages + delete old directory)
- URL structure remains unchanged - only internal file organization changes
- Projects feature doesn't exist yet - use placeholder `Project ${projectId}` for breadcrumbs
- Commit after each route group migration completes
