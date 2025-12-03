# Tasks: Nested Events

**Input**: Design documents from `/specs/017-nested-events/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/events-api.md, research.md, quickstart.md

**Tests**: Tests NOT explicitly requested - skipping test tasks per template guidelines.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Paths use `web/src/` prefix per monorepo structure

---

## Phase 1: Setup (Feature Module Structure)

**Purpose**: Create the events feature module scaffolding

- [ ] T001 Create feature module directory structure at `web/src/features/events/`
- [ ] T002 [P] Create types barrel export at `web/src/features/events/types/index.ts`
- [ ] T003 [P] Create schemas barrel export at `web/src/features/events/schemas/index.ts`
- [ ] T004 [P] Create repositories barrel export at `web/src/features/events/repositories/index.ts`
- [ ] T005 [P] Create actions barrel export at `web/src/features/events/actions/index.ts`
- [ ] T006 [P] Create hooks barrel export at `web/src/features/events/hooks/index.ts`
- [ ] T007 [P] Create components barrel export at `web/src/features/events/components/index.ts`
- [ ] T008 [P] Create designer components barrel export at `web/src/features/events/components/designer/index.ts`
- [ ] T009 Create feature-level barrel export at `web/src/features/events/index.ts`

---

## Phase 2: Foundational (Types, Schemas, Constants)

**Purpose**: Core type definitions and validation schemas that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 [P] Create Event, EventTheme, EventExperienceLink types at `web/src/features/events/types/event.types.ts`
- [ ] T011 [P] Create constants (DEFAULT_EVENT_THEME, NAME_LENGTH, COLOR_REGEX) at `web/src/features/events/constants.ts`
- [ ] T012 Create Zod schemas (eventSchema, eventThemeSchema, createEventInput, updateEventInput, updateEventThemeInput) at `web/src/features/events/schemas/events.schemas.ts`
- [ ] T013 Create events repository with CRUD operations at `web/src/features/events/repositories/events.repository.ts`

**Checkpoint**: Foundation ready - types, schemas, constants, and repository complete

---

## Phase 3: User Story 1 - Create Event Within Project (Priority: P1) 🎯 MVP

**Goal**: Enable experience creators to create events within projects with default theme configuration

**Independent Test**: Create a new event in a project's Events tab and verify it appears in the list with default theme

### Implementation for User Story 1

- [ ] T014 [US1] Implement createEventAction server action at `web/src/features/events/actions/events.actions.ts`
- [ ] T015 [US1] Implement listEventsAction server action at `web/src/features/events/actions/events.actions.ts`
- [ ] T016 [US1] Create useEvents real-time hook at `web/src/features/events/hooks/useEvents.ts`
- [ ] T017 [P] [US1] Create EventCard component at `web/src/features/events/components/EventCard.tsx`
- [ ] T018 [US1] Create EventList component with empty state at `web/src/features/events/components/EventList.tsx`
- [ ] T019 [US1] Create CreateEventDialog component at `web/src/features/events/components/CreateEventDialog.tsx`
- [ ] T020 [US1] Update ProjectEventsTab to render EventList at `web/src/features/projects/components/ProjectEventsTab.tsx`

**Checkpoint**: User Story 1 complete - can create events and see them in the list

---

## Phase 4: User Story 2 - Configure Event Theme (Priority: P1)

**Goal**: Enable experience creators to customize event themes with live preview

**Independent Test**: Navigate to event Theme tab, modify colors/logo/background, save, and verify changes persist

### Implementation for User Story 2

- [ ] T021 [US2] Implement getEventAction server action at `web/src/features/events/actions/events.actions.ts`
- [ ] T022 [US2] Implement updateEventThemeAction server action at `web/src/features/events/actions/events.actions.ts`
- [ ] T023 [US2] Create useEvent real-time hook at `web/src/features/events/hooks/useEvent.ts`
- [ ] T024 [US2] Create EventThemeEditor component (adapt from ThemeEditor) at `web/src/features/events/components/designer/EventThemeEditor.tsx`
- [ ] T025 [US2] Update theme page to use EventThemeEditor at `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/theme/page.tsx`

**Checkpoint**: User Story 2 complete - can customize and save event themes

---

## Phase 5: User Story 3 - View and Navigate Events List (Priority: P2)

**Goal**: Enable experience creators to view events list with active indicator and navigate to event details

**Independent Test**: View events list, verify active event is highlighted, click an event to navigate to its detail page

### Implementation for User Story 3

- [ ] T026 [US3] Add active event indicator styling to EventCard at `web/src/features/events/components/EventCard.tsx`
- [ ] T027 [US3] Add navigation link from EventCard to event detail at `web/src/features/events/components/EventCard.tsx`
- [ ] T028 [P] [US3] Create EventExperiencesTab placeholder component at `web/src/features/events/components/EventExperiencesTab.tsx`
- [ ] T029 [US3] Update experiences page to use EventExperiencesTab at `web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx`

**Checkpoint**: User Story 3 complete - can navigate events list and see active indicators

---

## Phase 6: User Story 4 - Set Active Event (Priority: P2)

**Goal**: Enable experience creators to designate one event as active for guest routing

**Independent Test**: Set an event as active, verify Project.activeEventId is updated, verify UI reflects active state

### Implementation for User Story 4

- [ ] T030 [US4] Implement setActiveEventAction server action at `web/src/features/events/actions/events.actions.ts`
- [ ] T031 [US4] Add "Set as Active" button to EventCard at `web/src/features/events/components/EventCard.tsx`
- [ ] T032 [US4] Add active state handling to EventCard (disable button if already active) at `web/src/features/events/components/EventCard.tsx`

**Checkpoint**: User Story 4 complete - can set events as active via switchboard pattern

---

## Phase 7: User Story 5 - Edit Event Details (Priority: P3)

**Goal**: Enable experience creators to rename events

**Independent Test**: Edit an event name, save, verify the change persists across page refreshes

### Implementation for User Story 5

- [ ] T033 [US5] Implement updateEventAction server action at `web/src/features/events/actions/events.actions.ts`
- [ ] T034 [US5] Create RenameEventDialog component at `web/src/features/events/components/RenameEventDialog.tsx`
- [ ] T035 [US5] Add rename action to EventCard menu at `web/src/features/events/components/EventCard.tsx`

**Checkpoint**: User Story 5 complete - can rename events

---

## Phase 8: User Story 6 - Delete Event (Priority: P3)

**Goal**: Enable experience creators to soft-delete events they no longer need

**Independent Test**: Delete an event, verify it disappears from the list, verify active event is cleared if deleted

### Implementation for User Story 6

- [ ] T036 [US6] Implement deleteEventAction server action at `web/src/features/events/actions/events.actions.ts`
- [ ] T037 [US6] Create DeleteEventDialog component with confirmation at `web/src/features/events/components/DeleteEventDialog.tsx`
- [ ] T038 [US6] Add delete action to EventCard menu at `web/src/features/events/components/EventCard.tsx`

**Checkpoint**: User Story 6 complete - can delete events with proper cleanup

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [ ] T039 [P] Update feature-level exports in `web/src/features/events/index.ts`
- [ ] T040 [P] Add error handling and loading states to all components
- [ ] T041 Mobile responsiveness review for all event components

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T042 Run `pnpm lint` and fix all errors/warnings
- [ ] T043 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T044 Run `pnpm test` and ensure all tests pass
- [ ] T045 Verify feature in local dev server (`pnpm dev`)
- [ ] T046 Manual test: Create event → customize theme → set active flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational completion
  - US1 and US2 are both P1 and can proceed in parallel
  - US3 depends on US1 (needs EventList)
  - US4 depends on US1 (needs EventCard)
  - US5 and US6 depend on US1 (need EventCard)
- **Polish (Phase 9)**: Depends on all user stories

### User Story Dependencies

| Story | Priority | Can Start After | Dependencies |
|-------|----------|-----------------|--------------|
| US1 - Create Event | P1 | Phase 2 | None |
| US2 - Theme Editor | P1 | Phase 2 | None (parallel with US1) |
| US3 - Events List Nav | P2 | US1 | EventCard from US1 |
| US4 - Set Active | P2 | US1 | EventCard from US1 |
| US5 - Edit Event | P3 | US1 | EventCard from US1 |
| US6 - Delete Event | P3 | US1 | EventCard from US1 |

### Parallel Opportunities

**Phase 1 (Setup)**: T002-T008 can all run in parallel

**Phase 2 (Foundational)**: T010-T011 can run in parallel, then T012-T013

**After Foundational**:
- US1 and US2 can be worked in parallel (different components)
- US3, US4, US5, US6 can start once US1 creates EventCard

**Within User Stories**:
- US1: T017 (EventCard) can parallel with T014-T016
- US3: T028 can parallel with T026-T027

---

## Parallel Example: User Stories 1 & 2

```bash
# After Phase 2 completes, launch in parallel:

# Team Member A: User Story 1
Task: "Implement createEventAction server action"
Task: "Create EventList component with empty state"
Task: "Update ProjectEventsTab to render EventList"

# Team Member B: User Story 2
Task: "Implement updateEventThemeAction server action"
Task: "Create EventThemeEditor component"
Task: "Update theme page to use EventThemeEditor"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (scaffolding)
2. Complete Phase 2: Foundational (types, schemas, repository)
3. Complete Phase 3: US1 - Create Event (core CRUD)
4. Complete Phase 4: US2 - Theme Editor (core customization)
5. **STOP and VALIDATE**: Test create + theme flow end-to-end
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Create) → Test → Can create events
3. Add US2 (Theme) → Test → Can customize events
4. Add US3 + US4 (Navigate + Active) → Test → Full event management
5. Add US5 + US6 (Edit + Delete) → Test → Complete feature

---

## Notes

- All routes already exist as placeholders - just need component updates
- EventThemeEditor should be adapted from projects/ThemeEditor
- Follow patterns from features/projects for consistency
- Remember: Admin SDK for writes (Server Actions), Client SDK for reads (hooks)
- Mobile-first: test on 320px viewport
