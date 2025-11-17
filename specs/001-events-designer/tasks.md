# Tasks: Events Designer

**Input**: Design documents from `/specs/001-events-designer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: NOT included (not explicitly requested in feature specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Web app monorepo structure: `web/src/`
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and validation schema enhancements

- [X] T001 Update createExperienceSchema to add .trim() and custom error messages in web/src/lib/schemas/firestore.ts
- [X] T002 Verify ActionResult type exists in web/src/lib/types/actions.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core routing structure and shared components that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create base design route with redirect in web/src/app/(event-builder)/events/[eventId]/design/page.tsx
- [X] T004 Create design layout with experiences context in web/src/app/(event-builder)/events/[eventId]/design/layout.tsx
- [X] T005 Create DesignSidebar component in web/src/components/organizer/builder/DesignSidebar.tsx
- [X] T006 Create createExperienceAction Server Action in web/src/app/actions/experiences.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Navigate Between Event Design Sections (Priority: P1) 🎯 MVP

**Goal**: Establish URL-based navigation between Welcome, Experiences, and Ending sections with persistent sidebar

**Independent Test**: Navigate to `/events/:eventId/design/welcome`, `/events/:eventId/design/ending`, verify URL updates, sidebar persists, and browser back/forward work

### Implementation for User Story 1

- [X] T007 [P] [US1] Create Welcome editor route in web/src/app/(event-builder)/events/[eventId]/design/welcome/page.tsx
- [X] T008 [P] [US1] Create Ending editor route in web/src/app/(event-builder)/events/[eventId]/design/ending/page.tsx
- [X] T009 [US1] Extract WelcomeEditor component from ContentBuilder to web/src/components/organizer/builder/WelcomeEditor.tsx
- [X] T010 [US1] Extract EndingEditor component from ContentBuilder to web/src/components/organizer/builder/EndingEditor.tsx
- [X] T011 [US1] Update DesignSidebar to highlight active section based on pathname in web/src/components/organizer/builder/DesignSidebar.tsx
- [X] T012 [US1] Update main navigation tab from "Content" to "Design" in web/src/app/(event-builder)/events/[eventId]/layout.tsx
- [X] T013 [US1] Verify browser back/forward navigation works correctly

**Checkpoint**: At this point, User Story 1 should be fully functional - can navigate between Welcome/Ending sections with URL updates

---

## Phase 4: User Story 2 - Create New Experience Inline (Priority: P2)

**Goal**: Replace modal-based experience creation with inline form at dedicated route

**Independent Test**: Navigate to `/events/:eventId/design/experiences/create`, fill form, submit, verify redirect to experience editor

### Implementation for User Story 2

- [ ] T014 [US2] Create experience creation route in web/src/app/(event-builder)/events/[eventId]/design/experiences/create/page.tsx
- [ ] T015 [US2] Create CreateExperienceForm component with React Hook Form + Zod in web/src/components/organizer/builder/CreateExperienceForm.tsx
- [ ] T016 [US2] Implement form validation (enable submit only when name and type are valid) in web/src/components/organizer/builder/CreateExperienceForm.tsx
- [ ] T017 [US2] Add "Create Experience" button to sidebar that navigates to create route in web/src/components/organizer/builder/DesignSidebar.tsx
- [ ] T018 [US2] Implement redirect to experience editor after successful creation in web/src/components/organizer/builder/CreateExperienceForm.tsx
- [ ] T019 [US2] Remove ExperienceTypeDialog component from web/src/components/organizer/builder/ExperienceTypeDialog.tsx (deprecated)
- [ ] T020 [US2] Verify whitespace-only names are rejected (trim validation)

**Checkpoint**: At this point, User Story 2 should be fully functional - can create experiences via inline form

---

## Phase 5: User Story 3 - View and Manage Experiences in Sidebar (Priority: P2)

**Goal**: Display all experiences in sidebar permanently, enable navigation to experience editors

**Independent Test**: Create multiple experiences, verify they appear in sidebar across all design routes, click to navigate to editors

### Implementation for User Story 3

- [ ] T021 [US3] Create experience editor route in web/src/app/(event-builder)/events/[eventId]/design/experiences/[experienceId]/page.tsx
- [ ] T022 [US3] Extract ExperienceEditor component from ContentBuilder to web/src/components/organizer/builder/ExperienceEditor.tsx
- [ ] T023 [US3] Implement 404 handler for invalid experience IDs in web/src/app/(event-builder)/events/[eventId]/design/experiences/[experienceId]/not-found.tsx
- [ ] T024 [US3] Add notFound() call for invalid experience IDs in web/src/app/(event-builder)/events/[eventId]/design/experiences/[experienceId]/page.tsx
- [ ] T025 [US3] Update DesignSidebar to render experiences list always visible (remove menu toggle) in web/src/components/organizer/builder/DesignSidebar.tsx
- [ ] T026 [US3] Update DesignSidebar to highlight active experience based on pathname in web/src/components/organizer/builder/DesignSidebar.tsx
- [ ] T027 [US3] Verify experiences list updates in real-time when new experience is created
- [ ] T028 [US3] Verify sidebar remains visible across all design route transitions

**Checkpoint**: All experiences are visible in sidebar and navigable

---

## Phase 6: User Story 4 - Rename Content to Design (Priority: P3)

**Goal**: Update all UI references from "Content" to "Design" for clearer terminology

**Independent Test**: Verify all navigation tabs, routes, and UI text use "Design" instead of "Content"

### Implementation for User Story 4

- [ ] T029 [P] [US4] Update route paths from /content to /design (already done in previous phases, verify consistency)
- [ ] T030 [P] [US4] Update component names from ContentBuilder to DesignBuilder in web/src/components/organizer/builder/DesignBuilder.tsx
- [ ] T031 [P] [US4] Update all UI strings and labels from "Content" to "Design" throughout sidebar and navigation
- [ ] T032 [US4] Search codebase for any remaining "content" references and update to "design" where applicable

**Checkpoint**: All terminology consistently uses "Design"

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T033 [P] Implement mobile-responsive sidebar with Sheet component for mobile viewports in web/src/app/(event-builder)/events/[eventId]/design/layout.tsx
- [ ] T034 [P] Verify all touch targets meet 44x44px minimum on mobile (MFR-002)
- [ ] T035 [P] Add loading states to create experience form submission
- [ ] T036 [P] Add error toast notifications for failed experience creation
- [ ] T037 Optimize context value memoization to prevent unnecessary re-renders in web/src/app/(event-builder)/events/[eventId]/design/layout.tsx
- [ ] T038 Verify Firestore subscription cleanup on component unmount
- [ ] T039 Test all routes on mobile viewport (320px-768px)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T040 Run `pnpm lint` from repository root and fix all errors/warnings
- [ ] T041 Run `pnpm type-check` from repository root and resolve all TypeScript errors
- [ ] T042 Verify all routes render correctly in dev server (`pnpm dev`)
- [ ] T043 Test complete user flow: navigate to design → create experience → navigate between sections → verify browser navigation
- [ ] T044 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Integrates with sidebar from US1
  - User Story 3 (P2): Can start after Foundational - Requires experience creation (US2) for meaningful testing
  - User Story 4 (P3): Can start after Foundational - Cosmetic changes across all routes
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Works with sidebar from US1 but independently testable
- **User Story 3 (P2)**: Should complete after US2 for meaningful testing (need experiences to display)
- **User Story 4 (P3)**: Can run in parallel with any story - purely cosmetic

### Within Each User Story

- Models before services (N/A - no new models)
- Foundational routes before feature routes
- Components before pages that use them
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks can run sequentially (shared files)
- Once Foundational phase completes:
  - US1 can start immediately
  - US2 can start in parallel with US1 (different files)
  - US4 can start in parallel with US1/US2 (cosmetic only)
  - US3 should wait for US2 completion (needs experiences to test)
- Within US1: T007 and T008 can run in parallel
- Within US4: T029, T030, T031 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch Welcome and Ending routes together:
Task: "Create Welcome editor route in web/src/app/(event-builder)/events/[eventId]/design/welcome/page.tsx"
Task: "Create Ending editor route in web/src/app/(event-builder)/events/[eventId]/design/ending/page.tsx"

# Extract components in parallel:
Task: "Extract WelcomeEditor component to web/src/components/organizer/builder/WelcomeEditor.tsx"
Task: "Extract EndingEditor component to web/src/components/organizer/builder/EndingEditor.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (validation schema)
2. Complete Phase 2: Foundational (routing structure, layout, sidebar, server action)
3. Complete Phase 3: User Story 1 (navigation between sections)
4. **STOP and VALIDATE**: Test navigation, URL updates, browser back/forward
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - basic navigation!)
3. Add User Story 2 → Test independently → Deploy/Demo (inline creation flow!)
4. Add User Story 3 → Test independently → Deploy/Demo (full experience management!)
5. Add User Story 4 → Test independently → Deploy/Demo (polished terminology!)
6. Polish phase → Final validation → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T006)
2. Once Foundational is done:
   - Developer A: User Story 1 (T007-T013)
   - Developer B: User Story 2 (T014-T020)
   - Developer C: User Story 4 (T029-T032) in parallel
3. After US1 and US2 complete:
   - Developer A or B: User Story 3 (T021-T028)
4. Everyone: Polish phase (T033-T044)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests not included (not explicitly requested in spec)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: same file conflicts, cross-story dependencies that break independence

---

## Task Summary

- **Total Tasks**: 44
- **Phase 1 (Setup)**: 2 tasks
- **Phase 2 (Foundational)**: 4 tasks
- **Phase 3 (US1 - Navigate)**: 7 tasks
- **Phase 4 (US2 - Create Inline)**: 7 tasks
- **Phase 5 (US3 - Sidebar Management)**: 8 tasks
- **Phase 6 (US4 - Rename to Design)**: 4 tasks
- **Phase 7 (Polish)**: 12 tasks

**Parallel Opportunities Identified**: 8 tasks can run in parallel across phases

**Independent Test Criteria**:
- US1: Navigate between sections, verify URL updates and browser navigation
- US2: Create experience via inline form, verify redirect
- US3: View experiences in sidebar, navigate to editors
- US4: Verify "Design" terminology throughout UI

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (US1) = 13 tasks for basic navigation
