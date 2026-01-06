# Tasks: Event Designer - Global Changes Tracker

**Input**: Design documents from `/specs/014-event-designer-global-changes-tracker/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Unit tests included for all new components (store, hook, component) per constitution compliance.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- Base path: `apps/clementine-app/app/domains/event/`
- Designer domain: `designer/` (stores, hooks, components)
- Settings domain: `settings/hooks/` (existing mutation hooks)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create folder structure and barrel exports for new designer domain components

- [X] T001 Create stores directory at apps/clementine-app/app/domains/event/designer/stores/
- [X] T002 [P] Create barrel export file apps/clementine-app/app/domains/event/designer/stores/index.ts
- [X] T003 [P] Verify hooks directory exists at apps/clementine-app/app/domains/event/designer/hooks/
- [X] T004 [P] Verify components directory exists at apps/clementine-app/app/domains/event/designer/components/

**Checkpoint**: Folder structure ready for implementation ✓ COMPLETE

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Zustand store that ALL user stories depend on for save tracking

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create useEventDesignerStore.ts with Zustand store interface in apps/clementine-app/app/domains/event/designer/stores/useEventDesignerStore.ts
- [X] T006 Implement store state (pendingSaves: number, lastCompletedAt: number | null) in useEventDesignerStore.ts
- [X] T007 Implement startSave action (increment pendingSaves) in useEventDesignerStore.ts
- [X] T008 Implement completeSave action (decrement pendingSaves, set lastCompletedAt when 0) in useEventDesignerStore.ts
- [X] T009 Implement resetSaveState action (reset to initial state) in useEventDesignerStore.ts
- [X] T010 Add TypeScript interface EventDesignerStore with proper typing in useEventDesignerStore.ts
- [X] T011 Export store from apps/clementine-app/app/domains/event/designer/stores/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✓ COMPLETE

---

## Phase 3: User Story 1 - Real-time Save Progress Feedback (Priority: P1) 🎯 MVP

**Goal**: Display spinner when saves are in progress and checkmark for 3 seconds after completion

**Independent Test**: Toggle a share option and observe spinner → checkmark → hidden sequence

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T012 [P] [US1] Write store test for startSave increments counter in apps/clementine-app/app/domains/event/designer/stores/useEventDesignerStore.test.ts
- [X] T013 [P] [US1] Write store test for completeSave decrements counter in useEventDesignerStore.test.ts
- [X] T014 [P] [US1] Write store test for completeSave sets lastCompletedAt when counter reaches 0 in useEventDesignerStore.test.ts
- [X] T015 [P] [US1] Write store test for resetSaveState clears all state in useEventDesignerStore.test.ts

### Implementation for User Story 1

- [X] T016 [P] [US1] Create useTrackedMutation hook with TypeScript generics in apps/clementine-app/app/domains/event/designer/hooks/useTrackedMutation.ts
- [X] T017 [US1] Implement state transition tracking (idle → pending, pending → idle) using useRef in useTrackedMutation.ts
- [X] T018 [US1] Call startSave on mutation.isPending transition to true in useTrackedMutation.ts
- [X] T019 [US1] Call completeSave on mutation.isPending transition to false in useTrackedMutation.ts
- [X] T020 [US1] Add passthrough return (no mutation modification) in useTrackedMutation.ts
- [X] T021 [US1] Export useTrackedMutation from apps/clementine-app/app/domains/event/designer/hooks/index.ts
- [X] T022 [P] [US1] Write hook test for idle → pending transition calls startSave in apps/clementine-app/app/domains/event/designer/hooks/useTrackedMutation.test.ts
- [X] T023 [P] [US1] Write hook test for pending → idle transition calls completeSave in useTrackedMutation.test.ts
- [X] T024 [P] [US1] Write hook test for no double-counting on re-renders in useTrackedMutation.test.ts
- [X] T025 [P] [US1] Create DesignerStatusIndicators component in apps/clementine-app/app/domains/event/designer/components/DesignerStatusIndicators.tsx
- [X] T026 [US1] Add useEventDesignerStore subscription (pendingSaves, lastCompletedAt) in DesignerStatusIndicators.tsx
- [X] T027 [US1] Compute isSaving derived state (pendingSaves > 0) in DesignerStatusIndicators.tsx
- [X] T028 [US1] Implement 3-second timer logic with useEffect and setTimeout in DesignerStatusIndicators.tsx
- [X] T029 [US1] Add timer cleanup in useEffect return function in DesignerStatusIndicators.tsx
- [X] T030 [US1] Render Loader2 spinner when isSaving is true in DesignerStatusIndicators.tsx
- [X] T031 [US1] Render Check checkmark when showSuccess is true in DesignerStatusIndicators.tsx
- [X] T032 [US1] Return null when idle (no spinner or checkmark) in DesignerStatusIndicators.tsx
- [X] T033 [US1] Add ARIA attributes (role="status", aria-live="polite") in DesignerStatusIndicators.tsx
- [X] T034 [US1] Add sr-only labels for screen readers in DesignerStatusIndicators.tsx
- [X] T035 [US1] Apply Tailwind classes (h-4 w-4, animate-spin, text colors) in DesignerStatusIndicators.tsx
- [X] T036 [US1] Export DesignerStatusIndicators from apps/clementine-app/app/domains/event/designer/components/index.ts
- [X] T037 [P] [US1] Write component test for shows spinner when pendingSaves > 0 in apps/clementine-app/app/domains/event/designer/components/DesignerStatusIndicators.test.tsx
- [X] T038 [P] [US1] Write component test for shows checkmark for 3 seconds in DesignerStatusIndicators.test.tsx
- [X] T039 [P] [US1] Write component test for timer cleanup on unmount in DesignerStatusIndicators.test.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently ✓ COMPLETE

---

## Phase 4: User Story 2 - Multiple Concurrent Saves Handling (Priority: P1)

**Goal**: Accurately track multiple saves using reference counting, spinner stays until ALL complete

**Independent Test**: Make 3 rapid changes and verify spinner remains until all 3 saves complete

### Implementation for User Story 2

- [ ] T040 [P] [US2] Integrate useTrackedMutation in useUpdateOverlays hook at apps/clementine-app/app/domains/event/settings/hooks/useUpdateOverlays.ts
- [ ] T041 [P] [US2] Wrap useMutation return with useTrackedMutation in useUpdateOverlays.ts
- [ ] T042 [P] [US2] Import useTrackedMutation from designer hooks in useUpdateOverlays.ts
- [ ] T043 [P] [US2] Integrate useTrackedMutation in useUpdateShareOptions hook at apps/clementine-app/app/domains/event/settings/hooks/useUpdateShareOptions.ts
- [ ] T044 [P] [US2] Wrap useMutation return with useTrackedMutation in useUpdateShareOptions.ts
- [ ] T045 [P] [US2] Import useTrackedMutation from designer hooks in useUpdateShareOptions.ts
- [ ] T046 [US2] Add DesignerStatusIndicators to EventDesignerLayout right slot in apps/clementine-app/app/domains/event/designer/containers/EventDesignerLayout.tsx
- [ ] T047 [US2] Import DesignerStatusIndicators component in EventDesignerLayout.tsx
- [ ] T048 [US2] Import useEventDesignerStore hook in EventDesignerLayout.tsx
- [ ] T049 [US2] Add cleanup effect calling resetSaveState on unmount in EventDesignerLayout.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - multiple saves tracked correctly

---

## Phase 5: User Story 3 - Unpublished Changes Awareness (Priority: P2)

**Goal**: Move "New changes" badge to right slot next to status indicators for better visual grouping

**Independent Test**: Make a change, verify badge appears next to Publish button after save completes

### Implementation for User Story 3

- [ ] T050 [US3] Move unpublished changes badge to right slot in EventDesignerLayout.tsx (before Preview/Publish buttons)
- [ ] T051 [US3] Position badge after DesignerStatusIndicators component in right slot JSX in EventDesignerLayout.tsx
- [ ] T052 [US3] Remove unpublished changes badge from left slot in EventDesignerLayout.tsx
- [ ] T053 [US3] Verify badge styling (yellow background, rounded-full, text-xs) matches design system in EventDesignerLayout.tsx
- [ ] T054 [US3] Ensure badge conditional rendering (hasUnpublishedChanges) still works in EventDesignerLayout.tsx

**Checkpoint**: All P1 and P2 user stories should now be independently functional

---

## Phase 6: User Story 4 - Save Error Handling (Priority: P2)

**Goal**: Ensure save errors decrement counter correctly and don't show checkmark

**Independent Test**: Simulate network error, verify spinner disappears and toast shows error

### Implementation for User Story 4

- [ ] T055 [P] [US4] Write store test for completeSave does NOT set lastCompletedAt when counter > 0 in useEventDesignerStore.test.ts
- [ ] T056 [P] [US4] Write component test for shows nothing when idle in DesignerStatusIndicators.test.tsx
- [ ] T057 [US4] Verify useTrackedMutation calls completeSave on both success AND error transitions in useTrackedMutation.ts (already implemented, validate)
- [ ] T058 [US4] Verify completeSave logic only sets lastCompletedAt when pendingSaves reaches 0 in useEventDesignerStore.ts (already implemented, validate)
- [ ] T059 [US4] Manual test: Disconnect network, make change, verify spinner disappears without checkmark

**Checkpoint**: All user stories (P1 and P2) should now be independently functional with proper error handling

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T060 [P] Run pnpm app:check (format, lint, type-check) from apps/clementine-app/ directory
- [ ] T061 [P] Verify all tests pass with pnpm test from apps/clementine-app/ directory
- [ ] T062 [P] Test on mobile viewport (320px-768px) for responsive design
- [ ] T063 [P] Verify WCAG AA color contrast for checkmark (green-600/green-500) using browser DevTools
- [ ] T064 [P] Test keyboard navigation and screen reader announcements for status indicators
- [ ] T065 Manual QA: Single save operation (toggle → spinner → checkmark → hidden)
- [ ] T066 Manual QA: Multiple concurrent saves (3 rapid changes, spinner stays until all complete)
- [ ] T067 Manual QA: New save during checkmark (checkmark → spinner immediately)
- [ ] T068 Manual QA: Route change during save (store resets, no stale state)
- [ ] T069 Run validation steps from quickstart.md
- [ ] T070 [P] Update CLAUDE.md if any new patterns or decisions warrant documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Depends on User Story 1 (needs tracking hook and component)
  - User Story 3 (P2): Depends on User Story 2 (needs indicators in layout)
  - User Story 4 (P2): Depends on User Stories 1-2 (validates error handling)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only → Creates store, tracking hook, status component
- **User Story 2 (P1)**: User Story 1 → Integrates tracking into mutation hooks and layout
- **User Story 3 (P2)**: User Story 2 → Moves badge to right slot (requires indicators already in place)
- **User Story 4 (P2)**: User Stories 1-2 → Validates error handling works correctly

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Store → Hook → Component → Integration
- Unit tests can run in parallel (all marked [P])
- Integration happens after component is complete

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T004 can run in parallel

**Phase 2 (Foundational)**:
- Must run sequentially (store state, then actions, then export)

**Phase 3 (User Story 1)**:
- Tests: T012-T015 can run in parallel (different test cases)
- Implementation: T016-T021 (hook), T022-T024 (hook tests), T025-T036 (component), T037-T039 (component tests)
- Hook tests (T022-T024) can run in parallel
- Component tests (T037-T039) can run in parallel

**Phase 4 (User Story 2)**:
- T040-T042 (useUpdateOverlays) and T043-T045 (useUpdateShareOptions) can run in parallel
- T046-T049 (layout integration) must run after hooks updated

**Phase 5 (User Story 3)**:
- T050-T054 must run sequentially (all modify same file)

**Phase 6 (User Story 4)**:
- Tests T055-T056 can run in parallel
- T057-T059 are validation tasks

**Phase 7 (Polish)**:
- T060-T064 can run in parallel
- T065-T068 are manual QA (can be parallelized across team members)
- T069-T070 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all store tests together:
Task: "Write store test for startSave increments counter"
Task: "Write store test for completeSave decrements counter"
Task: "Write store test for completeSave sets lastCompletedAt when counter reaches 0"
Task: "Write store test for resetSaveState clears all state"

# Launch all hook tests together:
Task: "Write hook test for idle → pending transition calls startSave"
Task: "Write hook test for pending → idle transition calls completeSave"
Task: "Write hook test for no double-counting on re-renders"

# Launch all component tests together:
Task: "Write component test for shows spinner when pendingSaves > 0"
Task: "Write component test for shows checkmark for 3 seconds"
Task: "Write component test for timer cleanup on unmount"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup → Folder structure ready
2. Complete Phase 2: Foundational → Store created (CRITICAL)
3. Complete Phase 3: User Story 1 → Status indicators working
4. Complete Phase 4: User Story 2 → Multiple saves tracked
5. **STOP and VALIDATE**: Test concurrent saves independently
6. Deploy/demo if ready

**Rationale**: User Stories 1 and 2 are both P1 and deliver core value (save progress feedback + concurrent save handling). This is the minimum viable feature.

### Incremental Delivery

1. Complete Setup + Foundational → Store ready
2. Add User Story 1 → Test independently → Status indicators show/hide correctly
3. Add User Story 2 → Test independently → Multiple saves tracked (MVP!)
4. Add User Story 3 → Test independently → Badge repositioned
5. Add User Story 4 → Test independently → Error handling validated
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (store, hook, component, tests)
   - Developer B: Can start User Story 3 setup (layout exploration)
3. After User Story 1 complete:
   - Developer A: User Story 2 (integration)
   - Developer B: User Story 3 (badge move)
   - Developer C: User Story 4 (error validation)

---

## Task Summary

**Total Tasks**: 70
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 7 tasks (BLOCKING)
- Phase 3 (User Story 1 - P1): 28 tasks (14 tests + 14 implementation)
- Phase 4 (User Story 2 - P1): 10 tasks
- Phase 5 (User Story 3 - P2): 5 tasks
- Phase 6 (User Story 4 - P2): 5 tasks
- Phase 7 (Polish): 11 tasks

**Parallel Opportunities**: 35 tasks marked [P] can run in parallel
**Independent Tests**: Each user story has clear acceptance criteria and can be tested standalone
**MVP Scope**: Phase 1 + 2 + 3 + 4 (49 tasks) = Complete save tracking with concurrent saves
**Full Feature**: All 70 tasks = Complete with badge repositioning and error validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths are absolute from repository root
- Tests are collocated with implementation files (not in `__tests__/` folder)
