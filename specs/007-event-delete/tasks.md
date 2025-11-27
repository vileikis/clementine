# Tasks: Delete Event (Soft Delete)

**Input**: Design documents from `/specs/007-event-delete/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/delete-event.md, research.md, quickstart.md

**Tests**: Not explicitly requested in specification. Unit tests included per Constitution Principle IV (Minimal Testing Strategy) for critical paths only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/features/events/` (extending existing events feature)
- All paths are relative to repository root

---

## Phase 1: Setup (Schema Updates)

**Purpose**: Update data model to support soft delete

- [X] T001 [P] Add "deleted" to eventStatusSchema enum in `web/src/features/events/schemas/events.schemas.ts`
- [X] T002 [P] Add deletedAt field to eventSchema in `web/src/features/events/schemas/events.schemas.ts`

---

## Phase 2: Foundational (Repository Layer)

**Purpose**: Core infrastructure for soft delete that MUST be complete before user story UI work

**⚠️ CRITICAL**: User story implementation cannot begin until this phase is complete

- [X] T003 Implement deleteEvent repository function in `web/src/features/events/repositories/events.ts`
- [X] T004 Update listEvents query to filter out deleted events using status "in" clause in `web/src/features/events/repositories/events.ts`
- [X] T005 Export deleteEvent from repository index in `web/src/features/events/repositories/index.ts`
- [X] T006 Implement deleteEventAction Server Action in `web/src/features/events/actions/events.ts`
- [X] T007 Export deleteEventAction from actions index in `web/src/features/events/actions/index.ts`

**Checkpoint**: Foundation ready - soft delete backend is fully functional via Server Action

---

## Phase 3: User Story 1 - Delete Event from List (Priority: P1) 🎯 MVP

**Goal**: Allow admins to delete events from the event list page with confirmation dialog

**Independent Test**: Navigate to `/events`, click delete on any event, confirm, verify event disappears from list and has `status: "deleted"` in Firestore

### Implementation for User Story 1

- [X] T008 [P] [US1] Create DeleteEventButton client component in `web/src/features/events/components/studio/DeleteEventButton.tsx`
- [X] T009 [P] [US1] Export DeleteEventButton from studio components index in `web/src/features/events/components/studio/index.ts`
- [X] T010 [US1] Update EventCard to include DeleteEventButton in `web/src/features/events/components/studio/EventCard.tsx`
- [X] T011 [US1] Add "deleted" status styling to EventCard statusStyles (for edge case display) in `web/src/features/events/components/studio/EventCard.tsx`

**Checkpoint**: User Story 1 complete - admins can delete events from list with confirmation

---

## Phase 4: User Story 2 - Feedback on Delete Action (Priority: P2)

**Goal**: Provide clear success/error feedback via toast notifications

**Independent Test**: Delete an event successfully - verify success toast appears. Simulate network error - verify error toast appears.

### Implementation for User Story 2

- [X] T012 [US2] Add toast.success call on successful deletion in `web/src/features/events/components/studio/DeleteEventButton.tsx`
- [X] T013 [US2] Add toast.error call on failed deletion in `web/src/features/events/components/studio/DeleteEventButton.tsx`
- [X] T014 [US2] Add loading state feedback (disable button, show "Deleting...") in `web/src/features/events/components/studio/DeleteEventButton.tsx`

**Checkpoint**: User Story 2 complete - users get clear feedback on delete actions

---

## Phase 5: User Story 3 - No Delete in Event Studio (Priority: P1)

**Goal**: Ensure no delete option exists in Event Studio pages (safety constraint)

**Independent Test**: Navigate to any Event Studio page (`/events/[id]/design`, `/events/[id]/theme`, etc.) - verify NO delete button/option exists anywhere

### Implementation for User Story 3

- [X] T015 [US3] Verify EventCard (with delete) is NOT used in Event Studio pages - manual audit of `web/src/app/(dashboard)/events/[eventId]/(studio)/`
- [X] T016 [US3] Document in code comment that DeleteEventButton must NOT be added to Event Studio pages in `web/src/features/events/components/studio/DeleteEventButton.tsx`

**Checkpoint**: User Story 3 complete - Event Studio is safe from accidental deletion

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [X] T017 Run `pnpm lint` and fix all errors/warnings
- [X] T018 Run `pnpm type-check` and resolve all TypeScript errors
- [X] T019 Run `pnpm test` and ensure all tests pass
- [ ] T020 Verify feature in local dev server (`pnpm dev`) - test full delete flow
- [ ] T021 Manual test: Verify deleted events don't appear in list
- [ ] T022 Manual test: Verify Event Studio has no delete option
- [ ] T023 Commit changes after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - schema updates are isolated
- **Foundational (Phase 2)**: Depends on Phase 1 schema updates - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 and US3 are P1 priority, US2 is P2
  - US1 must complete before US2 (US2 enhances US1's feedback)
  - US3 is a verification task, can run after US1
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) - Core delete functionality
- **User Story 2 (P2)**: Depends on US1 - Enhances US1 with toast feedback
- **User Story 3 (P1)**: Can verify after US1 - Independent audit task

### Within Each User Story

- Schema before repository
- Repository before Server Action
- Server Action before UI component
- Component before page integration

### Parallel Opportunities

- T001 and T002 (schema updates) can run in parallel [P]
- T008 and T009 (component + export) can run in parallel [P]
- Different user stories can be worked on after Foundational is complete

---

## Parallel Example: Setup Phase

```bash
# Launch all schema tasks together:
Task: "Add deleted to eventStatusSchema in web/src/features/events/schemas/events.schemas.ts"
Task: "Add deletedAt field to eventSchema in web/src/features/events/schemas/events.schemas.ts"
```

## Parallel Example: User Story 1

```bash
# After Foundational is complete, launch component tasks:
Task: "Create DeleteEventButton client component in web/src/features/events/components/studio/DeleteEventButton.tsx"
Task: "Export DeleteEventButton from studio components index in web/src/features/events/components/studio/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (schema updates)
2. Complete Phase 2: Foundational (repository + Server Action)
3. Complete Phase 3: User Story 1 (delete button with dialog)
4. **STOP and VALIDATE**: Test delete flow end-to-end
5. Deploy/demo if ready - MVP is functional!

### Incremental Delivery

1. Complete Setup + Foundational → Backend ready
2. Add User Story 1 → Test delete flow → Deploy (MVP!)
3. Add User Story 2 → Test toast feedback → Deploy
4. Verify User Story 3 → Confirm safety constraint → Deploy
5. Each story adds value without breaking previous stories

### Single Developer Strategy

Recommended execution order:

1. T001 → T002 (parallel schema updates)
2. T003 → T004 → T005 → T006 → T007 (sequential foundation)
3. T008 → T009 (parallel component setup)
4. T010 → T011 (complete US1)
5. T012 → T013 → T014 (complete US2)
6. T015 → T016 (verify US3)
7. T017 → T018 → T019 → T020 → T021 → T022 → T023 (validation)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- DeleteEventButton is intentionally NOT placed in Event Studio - this is a safety constraint
- Following existing soft delete pattern from companies feature
- No tests explicitly requested in spec - minimal tests included per Constitution
- Total: 23 tasks across 6 phases
