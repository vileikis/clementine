# Tasks: Project Navigation Tabs

**Input**: Design documents from `/specs/021-project-navigation-tabs/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Unit test for InlineTabs included per plan.md (Jest + React Testing Library).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` (Next.js App Router monorepo structure)
- Components: `web/src/components/shared/`
- Features: `web/src/features/[feature]/components/`
- App routes: `web/src/app/(workspace)/[companySlug]/[projectId]/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the reusable InlineTabs component that all user stories depend on

- [X] T001 [P] Create InlineTabs component with TabItem interface in `web/src/components/shared/InlineTabs.tsx`
- [X] T002 [P] Create InlineTabs unit test in `web/src/components/shared/InlineTabs.test.tsx`
- [X] T003 Export InlineTabs and TabItem type from barrel in `web/src/components/shared/index.ts`

**Checkpoint**: InlineTabs component ready for integration

---

## Phase 2: User Story 1 - Navigate Between Project Sections (Priority: P1) 🎯 MVP

**Goal**: Display inline tabs in project header for navigating between Events and Distribute sections

**Independent Test**: Click tabs in project header, verify navigation to correct sections, verify tabs match Experience Editor style

### Implementation for User Story 1

- [X] T004 [US1] Update ProjectDetailsHeader props to accept projectId in `web/src/features/projects/components/ProjectDetailsHeader.tsx`
- [X] T005 [US1] Add InlineTabs integration to ProjectDetailsHeader centered section in `web/src/features/projects/components/ProjectDetailsHeader.tsx`
- [X] T006 [US1] Remove inline tab navigation from layout body in `web/src/app/(workspace)/[companySlug]/[projectId]/layout.tsx`
- [X] T007 [US1] Pass projectId prop to ProjectDetailsHeader in `web/src/app/(workspace)/[companySlug]/[projectId]/layout.tsx`

**Checkpoint**: Project tabs visible in header, navigation works between Events and Distribute

---

## Phase 3: User Story 2 - Maintain Navigation While Viewing Events (Priority: P2)

**Goal**: Keep project-level navigation tabs visible when viewing nested event pages

**Independent Test**: Navigate to an event within a project, verify project tabs remain visible and functional

### Implementation for User Story 2

- [X] T008 [US2] Remove eventId early-return logic that hides project header in `web/src/app/(workspace)/[companySlug]/[projectId]/layout.tsx`

**Checkpoint**: Project tabs visible on all routes including nested event pages

---

## Phase 4: User Story 3 - View Content in Centered, Readable Width (Priority: P3)

**Goal**: Constrain tab content to a readable width (max-w-5xl) and center it horizontally on large viewports

**Independent Test**: View project tab page on wide screen (>1024px), verify content is centered with max-width constraint

### Implementation for User Story 3

- [X] T009 [US3] Add max-width content container wrapper in layout in `web/src/app/(workspace)/[companySlug]/[projectId]/layout.tsx`

**Checkpoint**: Content centered and constrained on wide viewports, full-width on mobile

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Refactor ExperienceTabs for consistency and run validation

### Refactoring

- [X] T010 [P] Refactor ExperienceTabs to use InlineTabs internally in `web/src/features/experiences/components/editor/ExperienceTabs.tsx`

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T011 Run `pnpm lint` and fix all errors/warnings
- [X] T012 Run `pnpm type-check` and resolve all TypeScript errors
- [X] T013 Run `pnpm test` and ensure all tests pass
- [ ] T014 Verify feature in local dev server (`pnpm dev`) - test all acceptance scenarios from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup (T001-T003) completion
- **User Story 2 (Phase 3)**: Can start after Setup, independent of US1
- **User Story 3 (Phase 4)**: Can start after Setup, independent of US1/US2
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Requires InlineTabs component (T001, T003)
- **User Story 2 (P2)**: Independent - only modifies layout.tsx conditional logic
- **User Story 3 (P3)**: Independent - only adds content container wrapper

### Within Setup Phase

- T001 and T002 can run in parallel (different files)
- T003 depends on T001 (must export what was created)

### Parallel Opportunities

```text
Phase 1 (parallel):
  T001: Create InlineTabs.tsx
  T002: Create InlineTabs.test.tsx
Then T003: Export from index.ts

Phase 2-4 (can interleave after T003):
  T004-T007: User Story 1 (sequential within story)
  T008: User Story 2 (independent)
  T009: User Story 3 (independent)

Phase 5 (after US1-3):
  T010: Refactor ExperienceTabs
  T011-T014: Validation (sequential)
```

---

## Parallel Example: Setup Phase

```bash
# Launch InlineTabs component and test in parallel:
Task: "Create InlineTabs component in web/src/components/shared/InlineTabs.tsx"
Task: "Create InlineTabs unit test in web/src/components/shared/InlineTabs.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (InlineTabs component)
2. Complete Phase 2: User Story 1 (tabs in project header)
3. **STOP and VALIDATE**: Test navigation between Events/Distribute
4. Deploy/demo if ready - basic functionality complete

### Incremental Delivery

1. Complete Setup → InlineTabs component ready
2. Add User Story 1 → Tabs in header → Test → Deploy/Demo (MVP!)
3. Add User Story 2 → Navigation persists on events → Test → Deploy/Demo
4. Add User Story 3 → Content centered → Test → Deploy/Demo
5. Polish → ExperienceTabs refactored, validation passes

### Single Developer Strategy

Recommended execution order:

1. T001-T003 (Setup)
2. T004-T007 (US1 - core functionality)
3. T008 (US2 - navigation persistence)
4. T009 (US3 - content width)
5. T010-T014 (Polish & validation)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after Setup phase
- Unit test (T002) should pass after T001 implementation
- Verify tests pass before marking T013 complete
- Manual testing (T014) covers all acceptance scenarios from spec.md:
  - Events ↔ Distribute navigation
  - Tabs visible on event pages
  - Content centered on wide viewports
  - Touch targets meet 44px minimum
