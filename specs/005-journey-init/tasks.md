# Tasks: Journey Init

**Input**: Design documents from `/specs/005-journey-init/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/server-actions.md, research.md, quickstart.md

**Tests**: Tests not explicitly requested - focusing on implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Next.js monorepo)**: `web/src/`
- **Feature module**: `web/src/features/journeys/`
- **App routes**: `web/src/app/events/[eventId]/journeys/`

---

## Phase 1: Setup (Feature Module Structure)

**Purpose**: Create the journeys feature module skeleton with all directories and barrel exports

- [X] T001 Create feature module directory structure at `web/src/features/journeys/` with subdirectories: actions/, components/, repositories/, schemas/, types/
- [X] T002 [P] Create constants file at `web/src/features/journeys/constants.ts` with JOURNEY_CONSTRAINTS
- [X] T003 [P] Create types barrel export at `web/src/features/journeys/types/index.ts`
- [X] T004 [P] Create schemas barrel export at `web/src/features/journeys/schemas/index.ts`
- [X] T005 [P] Create repositories barrel export at `web/src/features/journeys/repositories/index.ts`
- [X] T006 [P] Create actions barrel export at `web/src/features/journeys/actions/index.ts` (types only)
- [X] T007 [P] Create components barrel export at `web/src/features/journeys/components/index.ts`
- [X] T008 Create main feature barrel export at `web/src/features/journeys/index.ts`

---

## Phase 2: Foundational (Data Layer)

**Purpose**: Core types, schemas, and repository that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create Journey TypeScript types at `web/src/features/journeys/types/journeys.types.ts` (JourneyStatus enum, Journey interface)
- [X] T010 Create Zod schemas at `web/src/features/journeys/schemas/journeys.schemas.ts` (journeyStatusSchema, journeySchema, createJourneyInput)
- [X] T011 Create action types at `web/src/features/journeys/actions/types.ts` (ActionResponse type, ErrorCodes const)
- [X] T012 Create repository at `web/src/features/journeys/repositories/journeys.repository.ts` with functions: createJourney, listJourneys, getJourney, deleteJourney (soft delete)

**Checkpoint**: Foundation ready - data layer complete, user story implementation can begin

---

## Phase 3: User Story 1 - View Journey List (Priority: P1)

**Goal**: Display all journeys for an event with empty state, sorted by newest first, showing active status

**Independent Test**: Navigate to `/events/{eventId}/journeys` and verify list displays correctly or shows empty state with CTA

### Implementation for User Story 1

- [X] T013 [US1] Implement listJourneysAction Server Action at `web/src/features/journeys/actions/journeys.ts`
- [X] T014 [P] [US1] Create JourneyCard component at `web/src/features/journeys/components/JourneyCard.tsx` (displays name, step count, created date, active indicator)
- [X] T015 [US1] Create JourneyList component at `web/src/features/journeys/components/JourneyList.tsx` (empty state with CTA, maps journeys to cards)
- [X] T016 [US1] Create journey list page at `web/src/app/events/[eventId]/journeys/page.tsx` (Server Component fetching journeys and event)

**Checkpoint**: User Story 1 complete - journey list displays with empty state or populated list

---

## Phase 4: User Story 2 - Create Journey (Priority: P1)

**Goal**: Create new journeys via dialog with name validation, redirect to detail page after creation

**Independent Test**: Click "Create Journey" button, enter name, submit, verify redirect to journey detail route

### Implementation for User Story 2

- [X] T017 [US2] Implement createJourneyAction Server Action at `web/src/features/journeys/actions/journeys.ts` (validate event exists and not archived, create journey, revalidate path)
- [X] T018 [US2] Create CreateJourneyDialog component at `web/src/features/journeys/components/CreateJourneyDialog.tsx` (form with name input, validation errors, loading state, redirect on success)
- [X] T019 [US2] Integrate CreateJourneyDialog into JourneyList component at `web/src/features/journeys/components/JourneyList.tsx` (add dialog trigger to empty state CTA and header button)

**Checkpoint**: User Story 2 complete - can create journeys with validation and redirect

---

## Phase 5: User Story 3 - Set Active Journey (Priority: P2)

**Goal**: Toggle journey active status via switch control, show toast feedback, persist state

**Independent Test**: Toggle a journey's active switch, verify event's activeJourneyId changes, refresh page and verify persistence

### Implementation for User Story 3

- [X] T020 [US3] Add active toggle handler to JourneyCard at `web/src/features/journeys/components/JourneyCard.tsx` (call updateEventSwitchboardAction, show toast)
- [X] T021 [US3] Update JourneyList to pass activeJourneyId to JourneyCard at `web/src/features/journeys/components/JourneyList.tsx` (derive isActive from event.activeJourneyId)
- [X] T022 [US3] Add optimistic UI update for toggle switch in JourneyCard at `web/src/features/journeys/components/JourneyCard.tsx` (useTransition for loading state)

**Checkpoint**: User Story 3 complete - can activate/deactivate journeys with immediate feedback

---

## Phase 6: User Story 4 - Delete Journey (Priority: P3)

**Goal**: Soft delete journeys with confirmation dialog, auto-clear active if deleting active journey

**Independent Test**: Click delete on a journey, confirm in dialog, verify journey removed from list

### Implementation for User Story 4

- [X] T023 [US4] Implement deleteJourneyAction Server Action at `web/src/features/journeys/actions/journeys.ts` (soft delete, clear activeJourneyId if needed, revalidate path)
- [X] T024 [US4] Create DeleteJourneyDialog component at `web/src/features/journeys/components/DeleteJourneyDialog.tsx` (confirmation message, cancel/delete buttons, loading state)
- [X] T025 [US4] Add delete button and dialog trigger to JourneyCard at `web/src/features/journeys/components/JourneyCard.tsx` (integrate DeleteJourneyDialog)

**Checkpoint**: User Story 4 complete - can delete journeys with confirmation and auto-switchboard cleanup

---

## Phase 7: User Story 5 - Navigate to Journey Detail (Priority: P3)

**Goal**: Click journey to navigate to detail page showing name and WIP placeholder

**Independent Test**: Click a journey card, verify navigation to detail route, see journey name and WIP message

### Implementation for User Story 5

- [X] T026 [US5] Implement getJourneyAction Server Action at `web/src/features/journeys/actions/journeys.ts` (fetch single journey by ID)
- [X] T027 [US5] Create journey detail page at `web/src/app/events/[eventId]/journeys/[journeyId]/page.tsx` (Server Component with journey name header, WIP message, back link)
- [X] T028 [US5] Add click navigation to JourneyCard at `web/src/features/journeys/components/JourneyCard.tsx` (navigate to detail route on card click)

**Checkpoint**: User Story 5 complete - can navigate to journey detail with WIP placeholder

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and quality assurance

- [X] T029 Update all barrel exports to include new types, schemas, and components
- [X] T030 [P] Add loading states to journey list page at `web/src/app/events/[eventId]/journeys/page.tsx`
- [X] T031 [P] Add error boundary handling to journey routes
- [X] T032 Verify mobile-first responsive design on all components (touch targets ≥44x44px)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T033 Run `pnpm lint` and fix all errors/warnings
- [X] T034 Run `pnpm type-check` and resolve all TypeScript errors
- [X] T035 Run `pnpm test` and ensure all tests pass
- [ ] T036 Verify feature in local dev server (`pnpm dev`) - test all user flows manually
- [ ] T037 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - US1 (View List) and US2 (Create) are both P1 - can proceed in parallel
  - US3 (Set Active) is P2 - can start after Foundational, integrates with US1 UI
  - US4 (Delete) and US5 (Navigate) are both P3 - can start after Foundational
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Parallelize With |
|-------|----------|------------|---------------------|
| US1 - View List | P1 | Foundational | US2 (separate files) |
| US2 - Create | P1 | Foundational | US1 (separate files) |
| US3 - Set Active | P2 | US1 (needs JourneyCard) | US4, US5 |
| US4 - Delete | P3 | US1 (needs JourneyCard) | US3, US5 |
| US5 - Navigate | P3 | Foundational | US3, US4 |

### Parallel Opportunities

**Within Setup Phase**:
```
T002, T003, T004, T005, T006, T007 can all run in parallel (different files)
```

**Within User Story 1**:
```
T014 (JourneyCard) can run in parallel with T013 (listJourneysAction)
```

**Across User Stories (after Foundational)**:
```
US1 tasks and US2 tasks can run in parallel (different files initially)
US3, US4, US5 can start in parallel after their dependencies are met
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 - View Journey List
4. Complete Phase 4: US2 - Create Journey
5. **STOP and VALIDATE**: Can view empty state, create journey, see it in list
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 → MVP: View and Create journeys
3. Add US3 → Can activate/deactivate journeys
4. Add US4 → Can delete journeys
5. Add US5 → Can navigate to detail (WIP)
6. Polish → Production ready

### Single Developer Recommended Order

T001 → T002-T008 (parallel) → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020-T022 → T023-T025 → T026-T028 → T029-T037

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable after completion
- US1 and US2 together form the MVP (view + create)
- Reuses existing `updateEventSwitchboardAction` from events feature (US3)
- All write operations use Admin SDK via Server Actions (Constitution Principle VI)
- Mobile-first design verified in T032 (touch targets, typography)
