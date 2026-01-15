# Tasks: Fix Event Rename Dialog Stale Name

**Input**: Design documents from `/specs/026-event-rename/`
**Prerequisites**: plan.md, spec.md, research.md

**Tests**: Not requested - manual testing per quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (monorepo)**: `apps/clementine-app/src/`
- **Target file**: `apps/clementine-app/src/domains/project/events/components/RenameProjectEventDialog.tsx`

---

## Phase 1: Setup

**Purpose**: No setup needed - working in existing codebase

- [ ] T001 Verify branch `026-event-rename` is checked out and up to date with main

**Checkpoint**: Ready to implement

---

## Phase 2: User Story 1 - Event Creator Renames Event Multiple Times (Priority: P1) 🎯 MVP

**Goal**: Fix the stale name bug so rename dialog always shows current event name after a rename

**Independent Test**: Rename an event, close dialog, reopen - input should show the NEW name

### Implementation for User Story 1

- [ ] T002 [US1] Add `useEffect` import to React import statement in `apps/clementine-app/src/domains/project/events/components/RenameProjectEventDialog.tsx`
- [ ] T003 [US1] Add state synchronization effect after useState declaration in `apps/clementine-app/src/domains/project/events/components/RenameProjectEventDialog.tsx`
- [ ] T004 [US1] Remove redundant `setName(initialName)` from handleRename success path in `apps/clementine-app/src/domains/project/events/components/RenameProjectEventDialog.tsx`

**Checkpoint**: User Story 1 complete - dialog shows current name after rename

---

## Phase 3: User Story 2 - Dialog Reflects External Changes (Priority: P2)

**Goal**: Ensure dialog reflects name changes from external sources (other tabs, users)

**Independent Test**: Open dialog, externally update event name, refresh cache - dialog should show updated name

### Implementation for User Story 2

> No additional code changes needed - the `useEffect` from US1 handles this case automatically by including `initialName` in the dependency array. When the parent component's data updates (via TanStack Query cache invalidation), the `initialName` prop changes, triggering the effect.

- [ ] T005 [US2] Verify external update scenario works with US1 implementation (manual test only)

**Checkpoint**: User Story 2 complete - dialog reflects external changes

---

## Phase 4: Polish & Validation

**Purpose**: Final validation and code quality checks

- [ ] T006 Run `pnpm app:check` to fix formatting and lint issues
- [ ] T007 Run `pnpm app:type-check` to verify TypeScript compliance
- [ ] T008 Manual test: Complete all scenarios from quickstart.md
- [ ] T009 Verify existing functionality preserved (keyboard shortcuts, validation, error handling)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (US1)**: Depends on Phase 1
- **Phase 3 (US2)**: Depends on Phase 2 (uses same fix)
- **Phase 4 (Polish)**: Depends on Phase 2 and 3

### Task Dependencies within User Story 1

```
T002 (add import) → T003 (add effect) → T004 (remove redundant code)
```

These must be sequential as they modify the same file.

### Parallel Opportunities

Limited parallelism due to single-file fix:
- T006 and T007 can run in parallel (different validation tools)

---

## Parallel Example

```bash
# After implementation complete, run validation in parallel:
Task: "Run pnpm app:check"
Task: "Run pnpm app:type-check"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: User Story 1 (T002-T004)
3. **STOP and VALIDATE**: Test rename → close → reopen scenario
4. If working, proceed to validation

### Full Implementation

1. Setup (T001)
2. User Story 1 - Core fix (T002-T004)
3. User Story 2 - Verify external updates (T005)
4. Polish - Validation gates (T006-T009)

---

## Notes

- Single file modification: `RenameProjectEventDialog.tsx`
- ~5-7 lines changed total
- No new files created
- No schema/API changes
- Manual testing per quickstart.md acceptance scenarios
