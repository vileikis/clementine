# Tasks: Events Management

**Feature**: 009-events-management
**Input**: Design documents from `/specs/009-events-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are included based on plan.md requirements (70%+ overall coverage, 90%+ for critical paths). Unit tests for hooks and component tests for UI components.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US5)
- Include exact file paths in descriptions

## Path Conventions

This is a TanStack Start application in a monorepo:
- **App Root**: `apps/clementine-app/`
- **Source**: `apps/clementine-app/src/`
- **Domain**: `apps/clementine-app/src/domains/project/events/`
- **Tests**: `apps/clementine-app/src/domains/project/events/**/__tests__/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create domain directory structure at apps/clementine-app/src/domains/project/events/
- [X] T002 Create subdirectories: components/, containers/, hooks/, schemas/, types/ in apps/clementine-app/src/domains/project/events/
- [X] T003 [P] Create barrel export file at apps/clementine-app/src/domains/project/events/index.ts
- [X] T004 [P] Create schema barrel export at apps/clementine-app/src/domains/project/events/schemas/index.ts
- [X] T005 [P] Create types barrel export at apps/clementine-app/src/domains/project/events/types/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create ProjectEventStatus enum type in apps/clementine-app/src/domains/project/events/types/project-event.types.ts
- [X] T007 Create ProjectEvent type definition in apps/clementine-app/src/domains/project/events/types/project-event.types.ts
- [X] T008 Create projectEventStatusSchema Zod schema in apps/clementine-app/src/domains/project/events/schemas/project-event.schema.ts
- [X] T009 Create projectEventSchema Zod schema with all fields in apps/clementine-app/src/domains/project/events/schemas/project-event.schema.ts
- [X] T010 Update Project type to add optional activeEventId field in apps/clementine-app/src/domains/workspace/projects/types/ (existing file)
- [X] T011 Update project Zod schema to include activeEventId field validation in apps/clementine-app/src/domains/workspace/projects/schemas/ (existing file)
- [X] T012 Create Firestore security rules for events subcollection in firebase/firestore.rules (add simple admin-only checks)
- [X] T013 Update Firestore indexes configuration for collection group query in firebase/firestore.indexes.json
- [X] T014 Deploy Firestore security rules using pnpm fb:deploy:rules (Note: Skipped - requires Firebase project configuration)
- [X] T015 Deploy Firestore indexes using pnpm fb:deploy:indexes (Note: Skipped - requires Firebase project configuration)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 5 - View Events List (Priority: P1) 🎯 MVP

**Goal**: Display all project events in a list with empty state when no events exist

**Independent Test**: Navigate to a project details page and verify all non-deleted events are displayed in a list, or empty state is shown when no events exist

### Implementation for User Story 5

- [X] T016 [P] [US5] Create useProjectEvents hook for real-time subscription in apps/clementine-app/src/domains/project/events/hooks/useProjectEvents.ts
- [X] T017 [P] [US5] Create ProjectEventsList component with empty state in apps/clementine-app/src/domains/project/events/components/ProjectEventsList.tsx
- [X] T018 [P] [US5] Create ProjectEventItem component with basic display in apps/clementine-app/src/domains/project/events/components/ProjectEventItem.tsx
- [X] T019 [US5] Create ProjectEventsPage container component in apps/clementine-app/src/domains/project/events/containers/ProjectEventsPage.tsx
- [X] T020 [US5] Integrate ProjectEventsPage into project details route at apps/clementine-app/src/app/routes/workspace/$workspaceSlug/projects/$projectId/index.tsx

### Tests for User Story 5

- [ ] T021 [P] [US5] Unit test for useProjectEvents hook in apps/clementine-app/src/domains/project/events/hooks/__tests__/useProjectEvents.test.ts (Deferred - requires test infrastructure)
- [ ] T022 [P] [US5] Component test for ProjectEventsList empty state in apps/clementine-app/src/domains/project/events/components/__tests__/ProjectEventsList.test.tsx (Deferred - requires test infrastructure)
- [ ] T023 [P] [US5] Component test for ProjectEventsList with events in apps/clementine-app/src/domains/project/events/components/__tests__/ProjectEventsList.test.tsx (Deferred - requires test infrastructure)
- [ ] T024 [P] [US5] Component test for ProjectEventItem display in apps/clementine-app/src/domains/project/events/components/__tests__/ProjectEventItem.test.tsx (Deferred - requires test infrastructure)

**Checkpoint**: At this point, User Story 5 should be fully functional - admins can view all events in a project

---

## Phase 4: User Story 1 - Create First Event (Priority: P1) 🎯 MVP

**Goal**: Allow workspace admins to create new events with default naming and navigate to event detail page

**Independent Test**: Click "Create event" button on project details page, verify new event is created with "Untitled event" name and appears in the list

### Implementation for User Story 1

- [X] T025 [P] [US1] Create createProjectEventInputSchema in apps/clementine-app/src/domains/project/events/schemas/create-project-event.schema.ts
- [X] T026 [US1] Create useCreateProjectEvent mutation hook in apps/clementine-app/src/domains/project/events/hooks/useCreateProjectEvent.ts
- [X] T027 [US1] Create CreateProjectEventButton component in apps/clementine-app/src/domains/project/events/components/CreateProjectEventButton.tsx
- [X] T028 [US1] Integrate CreateProjectEventButton into ProjectEventsPage in apps/clementine-app/src/domains/project/events/containers/ProjectEventsPage.tsx
- [X] T029 [US1] Add navigation to event detail page after creation in useCreateProjectEvent hook (placeholder route for future feature)

### Tests for User Story 1

- [ ] T030 [P] [US1] Unit test for useCreateProjectEvent hook in apps/clementine-app/src/domains/project/events/hooks/__tests__/useCreateProjectEvent.test.ts (Deferred - requires test infrastructure)
- [ ] T031 [P] [US1] Unit test for createProjectEventInputSchema validation in apps/clementine-app/src/domains/project/events/schemas/__tests__/create-project-event.schema.test.ts (Deferred - requires test infrastructure)
- [ ] T032 [P] [US1] Component test for CreateProjectEventButton in apps/clementine-app/src/domains/project/events/components/__tests__/CreateProjectEventButton.test.tsx (Deferred - requires test infrastructure)
- [ ] T033 [P] [US1] Integration test for event creation flow in apps/clementine-app/src/domains/project/events/__tests__/integration/create-event.test.tsx (Deferred - requires test infrastructure)

**Checkpoint**: ✅ COMPLETE - User Stories 1 AND 5 work independently - admins can view and create events (Tested by user)

---

## Phase 5: User Story 2 - Activate Single Event (Priority: P2)

**Goal**: Allow workspace admins to activate exactly one event at a time using a switch control

**Independent Test**: Create multiple events, activate one using the switch, verify only one is active. Activate a different event and verify the first is deactivated.

### Implementation for User Story 2

- [X] T034 [P] [US2] Create activateProjectEventInputSchema in apps/clementine-app/src/domains/project/events/schemas/activate-project-event.schema.ts
- [X] T035 [P] [US2] Create deactivateProjectEventInputSchema in apps/clementine-app/src/domains/project/events/schemas/deactivate-project-event.schema.ts
- [X] T036 [US2] Create useActivateProjectEvent mutation hook with transaction logic in apps/clementine-app/src/domains/project/events/hooks/useActivateProjectEvent.ts
- [X] T037 [US2] Add activation Switch component to ProjectEventItem in apps/clementine-app/src/domains/project/events/components/ProjectEventItem.tsx
- [X] T038 [US2] Update ProjectEventsList to pass activeEventId to ProjectEventItem in apps/clementine-app/src/domains/project/events/components/ProjectEventsList.tsx
- [X] T039 [US2] Update useProjectEvents hook to also fetch project.activeEventId in apps/clementine-app/src/domains/project/events/hooks/useProjectEvents.ts
- [X] T040 [US2] Add visual indication of active event status in ProjectEventItem in apps/clementine-app/src/domains/project/events/components/ProjectEventItem.tsx

### Tests for User Story 2

- [ ] T041 [P] [US2] Unit test for useActivateProjectEvent hook in apps/clementine-app/src/domains/project/events/hooks/__tests__/useActivateProjectEvent.test.ts
- [ ] T042 [P] [US2] Unit test for activateProjectEventInputSchema validation in apps/clementine-app/src/domains/project/events/schemas/__tests__/activate-project-event.schema.test.ts
- [ ] T043 [P] [US2] Component test for ProjectEventItem activation switch in apps/clementine-app/src/domains/project/events/components/__tests__/ProjectEventItem.test.tsx
- [ ] T044 [P] [US2] Integration test for activation flow (single active constraint) in apps/clementine-app/src/domains/project/events/__tests__/integration/activate-event.test.tsx

**Checkpoint**: At this point, User Stories 1, 2, AND 5 should all work independently - admins can view, create, and activate events

---

## Phase 6: User Story 3 - Rename Event (Priority: P3)

**Goal**: Allow workspace admins to rename events through a context menu for better organization

**Independent Test**: Create an event, open context menu, select "Rename", enter new name, verify name updates in list and detail page

### Implementation for User Story 3

- [X] T045 [P] [US3] Create updateProjectEventInputSchema in apps/clementine-app/src/domains/project/events/schemas/update-project-event.schema.ts
- [X] T046 [US3] Create useRenameProjectEvent mutation hook in apps/clementine-app/src/domains/project/events/hooks/useRenameProjectEvent.ts
- [X] T047 [US3] Create RenameProjectEventDialog component in apps/clementine-app/src/domains/project/events/components/RenameProjectEventDialog.tsx
- [X] T048 [US3] Add DropdownMenu context menu to ProjectEventItem in apps/clementine-app/src/domains/project/events/components/ProjectEventItem.tsx
- [X] T049 [US3] Add "Rename" option to context menu that opens RenameProjectEventDialog in apps/clementine-app/src/domains/project/events/components/ProjectEventItem.tsx

### Tests for User Story 3

- [ ] T050 [P] [US3] Unit test for useRenameProjectEvent hook in apps/clementine-app/src/domains/project/events/hooks/__tests__/useRenameProjectEvent.test.ts
- [ ] T051 [P] [US3] Unit test for updateProjectEventInputSchema validation in apps/clementine-app/src/domains/project/events/schemas/__tests__/update-project-event.schema.test.ts
- [ ] T052 [P] [US3] Component test for RenameProjectEventDialog in apps/clementine-app/src/domains/project/events/components/__tests__/RenameProjectEventDialog.test.tsx
- [ ] T053 [P] [US3] Integration test for rename flow in apps/clementine-app/src/domains/project/events/__tests__/integration/rename-event.test.tsx

**Checkpoint**: At this point, all user stories except delete should work - admins can view, create, activate, and rename events

---

## Phase 7: User Story 4 - Delete Event (Priority: P3)

**Goal**: Allow workspace admins to soft-delete events to keep workspace clean

**Independent Test**: Create an event, open context menu, select "Delete", confirm deletion, verify event is removed from list and inaccessible via direct URL

### Implementation for User Story 4

- [X] T054 [P] [US4] Create deleteProjectEventInputSchema in apps/clementine-app/src/domains/project/events/schemas/delete-project-event.schema.ts
- [X] T055 [US4] Create useDeleteProjectEvent mutation hook with transaction logic in apps/clementine-app/src/domains/project/events/hooks/useDeleteProjectEvent.ts
- [X] T056 [US4] Create DeleteProjectEventDialog component with confirmation in apps/clementine-app/src/domains/project/events/components/DeleteProjectEventDialog.tsx
- [X] T057 [US4] Add "Delete" option to context menu in ProjectEventItem in apps/clementine-app/src/domains/project/events/components/ProjectEventItem.tsx
- [X] T058 [US4] Update useDeleteProjectEvent to clear activeEventId if deleted event was active in apps/clementine-app/src/domains/project/events/hooks/useDeleteProjectEvent.ts

### Tests for User Story 4

- [ ] T059 [P] [US4] Unit test for useDeleteProjectEvent hook in apps/clementine-app/src/domains/project/events/hooks/__tests__/useDeleteProjectEvent.test.ts
- [ ] T060 [P] [US4] Unit test for deleteProjectEventInputSchema validation in apps/clementine-app/src/domains/project/events/schemas/__tests__/delete-project-event.schema.test.ts
- [ ] T061 [P] [US4] Component test for DeleteProjectEventDialog in apps/clementine-app/src/domains/project/events/components/__tests__/DeleteProjectEventDialog.test.tsx
- [ ] T062 [P] [US4] Integration test for delete flow (clearing active event) in apps/clementine-app/src/domains/project/events/__tests__/integration/delete-event.test.tsx

**Checkpoint**: All user stories should now be independently functional - complete feature implementation

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T063 [P] Add mobile-responsive styles (44x44px touch targets) to all components in apps/clementine-app/src/domains/project/events/components/
- [X] T064 [P] Add loading states for all mutations in components in apps/clementine-app/src/domains/project/events/components/
- [X] T065 [P] Add error handling and user feedback for all operations in apps/clementine-app/src/domains/project/events/hooks/
- [X] T066 [P] Add accessibility attributes (ARIA labels, keyboard navigation) to all interactive components in apps/clementine-app/src/domains/project/events/components/
- [ ] T067 Add optimistic updates to all mutations for instant feedback in apps/clementine-app/src/domains/project/events/hooks/
- [X] T068 [P] Add comprehensive error messages for Firestore operations in apps/clementine-app/src/domains/project/events/hooks/
- [X] T069 Run validation loop: pnpm app:check (format, lint, auto-fixes) from apps/clementine-app/
- [X] T070 Run type checking: pnpm type-check from apps/clementine-app/
- [ ] T071 Run test suite: pnpm test from apps/clementine-app/
- [ ] T072 Verify quickstart.md scenarios work as documented in specs/009-events-management/quickstart.md
- [ ] T073 Test on real mobile devices (iOS Safari, Android Chrome) for touch targets and responsiveness
- [ ] T074 [P] Performance optimization: code-split event dialogs and lazy-load in apps/clementine-app/src/domains/project/events/components/
- [ ] T075 [P] Add telemetry/analytics for event operations (create, rename, delete, activate) in apps/clementine-app/src/domains/project/events/hooks/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User Story 5 (View Events List - P1): Can start after Foundational - No dependencies on other stories
  - User Story 1 (Create First Event - P1): Depends on User Story 5 (needs list to display created events)
  - User Story 2 (Activate Single Event - P2): Depends on User Stories 1 & 5 (needs events to activate and list to show status)
  - User Story 3 (Rename Event - P3): Depends on User Stories 1 & 5 (needs events to rename)
  - User Story 4 (Delete Event - P3): Depends on User Stories 1 & 5 (needs events to delete)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 5 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ FIRST
- **User Story 1 (P1)**: Depends on User Story 5 - Needs list component to show created events
- **User Story 2 (P2)**: Depends on User Stories 1 & 5 - Needs events to exist and list to display activation status
- **User Story 3 (P3)**: Depends on User Stories 1 & 5 - Needs events to exist for renaming
- **User Story 4 (P3)**: Depends on User Stories 1 & 5 - Needs events to exist for deletion

### Within Each User Story

- Implementation tasks before test tasks (tests verify implementation)
- Schemas before hooks (hooks use schemas for validation)
- Hooks before components (components use hooks)
- Components before integration (integration uses all components)
- Core implementation before polish/optimization

### Parallel Opportunities

- **Phase 1 (Setup)**: All tasks T001-T005 can run in parallel
- **Phase 2 (Foundational)**: T006-T009 (schemas/types) can run in parallel, T010-T011 (project updates) can run in parallel, T012-T013 (Firestore rules/indexes) can run in parallel
- **Within User Story 5**: T016-T018 can run in parallel (hook and components in different files)
- **Within User Story 5 Tests**: T021-T024 can all run in parallel (different test files)
- **Within User Story 1**: T025-T026 can run in parallel (schema and hook in different files)
- **Within User Story 1 Tests**: T030-T033 can all run in parallel (different test files)
- **Within User Story 2**: T034-T035 can run in parallel (different schema files)
- **Within User Story 2 Tests**: T041-T044 can all run in parallel (different test files)
- **Within User Story 3**: T045-T046 can run in parallel (schema and hook in different files)
- **Within User Story 3 Tests**: T050-T053 can all run in parallel (different test files)
- **Within User Story 4**: T054-T055 can run in parallel (schema and hook in different files)
- **Within User Story 4 Tests**: T059-T062 can all run in parallel (different test files)
- **Phase 8 (Polish)**: T063-T066 can run in parallel, T068 can run in parallel with T064-T066, T074-T075 can run in parallel

---

## Parallel Example: User Story 5

```bash
# Launch all implementation tasks for User Story 5 in parallel:
Task T016: "Create useProjectEvents hook in apps/clementine-app/src/domains/project/events/hooks/useProjectEvents.ts"
Task T017: "Create ProjectEventsList component in apps/clementine-app/src/domains/project/events/components/ProjectEventsList.tsx"
Task T018: "Create ProjectEventItem component in apps/clementine-app/src/domains/project/events/components/ProjectEventItem.tsx"

# Then run integration task (depends on above):
Task T019: "Create ProjectEventsPage container in apps/clementine-app/src/domains/project/events/containers/ProjectEventsPage.tsx"

# Launch all tests for User Story 5 together (after implementation):
Task T021: "Unit test for useProjectEvents hook"
Task T022: "Component test for ProjectEventsList empty state"
Task T023: "Component test for ProjectEventsList with events"
Task T024: "Component test for ProjectEventItem display"
```

---

## Implementation Strategy

### MVP First (User Stories 5 + 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T015) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 5 - View Events List (T016-T024)
4. Complete Phase 4: User Story 1 - Create First Event (T025-T033)
5. **STOP and VALIDATE**: Test that admins can view and create events
6. Deploy/demo if ready - this is a minimal but valuable increment

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 5 (View List) → Test independently → Foundation for all features
3. Add User Story 1 (Create) → Test independently → Deploy/Demo (MVP! 🎯)
4. Add User Story 2 (Activate) → Test independently → Deploy/Demo
5. Add User Story 3 (Rename) → Test independently → Deploy/Demo
6. Add User Story 4 (Delete) → Test independently → Deploy/Demo
7. Add Polish (Phase 8) → Final validation → Production deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T015)
2. Developer A: User Story 5 (View List) - T016-T024
3. Once US5 is complete:
   - Developer A: User Story 1 (Create) - T025-T033
   - Developer B: User Story 2 (Activate) - T034-T044 (needs US1 to be testable)
4. Once US1 & US2 are complete:
   - Developer A: User Story 3 (Rename) - T045-T053
   - Developer B: User Story 4 (Delete) - T054-T062
5. Team: Polish phase together - T063-T075

---

## Notes

- **[P]** tasks = different files, no dependencies, can run in parallel
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are written AFTER implementation to verify behavior
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Mobile-first**: All components must have 44x44px touch targets minimum
- **Client-first**: All operations use Firestore client SDK (no server functions)
- **Subcollection structure**: `projects/{projectId}/events` (projectId in path, not field)
- **Simple security rules**: Admin checks only (no data validation in Firestore rules)
- **Zod validation**: All validation happens in application code, not security rules
- **Real-time updates**: Use `onSnapshot()` for live event list updates
- **Soft delete only**: Never hard-delete events (use status field)
- **Single active event**: Use Firestore transaction to enforce atomic constraint

---

## Success Metrics

- ✅ 75 total tasks organized across 8 phases
- ✅ 5 user stories mapped to tasks (US1, US2, US3, US4, US5)
- ✅ 20 test tasks (unit + component + integration tests for all stories)
- ✅ 24 parallel opportunities identified ([P] markers)
- ✅ MVP scope defined: User Stories 5 + 1 (view and create events)
- ✅ All tasks follow strict checklist format (checkbox + ID + [P]/[Story] + file path)
- ✅ Independent test criteria for each user story documented
- ✅ Clear dependencies and execution order documented
- ✅ Incremental delivery strategy defined

---

## Validation Checklist

- [x] All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- [x] All user stories from spec.md are covered (US1, US2, US3, US4, US5)
- [x] All entities from data-model.md are implemented (ProjectEvent, Project update)
- [x] All operations from contracts/ are implemented (CRUD operations)
- [x] Setup phase includes project structure and dependencies
- [x] Foundational phase includes schemas, types, security rules, indexes
- [x] Each user story has independent test criteria
- [x] Each user story has implementation tasks with file paths
- [x] Each user story has test tasks (unit, component, integration)
- [x] Dependencies section shows story completion order
- [x] Parallel opportunities are identified with [P] markers
- [x] MVP scope is clearly defined (US5 + US1)
- [x] All tasks reference exact file paths in monorepo structure
- [x] Implementation strategy explains incremental delivery
