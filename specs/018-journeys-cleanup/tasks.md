# Tasks: Journeys Module Cleanup

**Input**: Design documents from `/specs/018-journeys-cleanup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Not requested for this cleanup task.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` (Next.js monorepo)
- **Specs**: `specs/` at repository root

---

## Phase 1: Setup

**Purpose**: Verify current state before cleanup

- [ ] T001 Verify build passes before starting cleanup with `pnpm build`
- [ ] T002 Run `grep -r "features/journeys" web/src/ --include="*.ts" --include="*.tsx"` to document current journey imports

**Checkpoint**: Baseline established - cleanup can begin

---

## Phase 2: User Story 1 - Clean Codebase After Migration (Priority: P1) 🎯 MVP

**Goal**: Remove journey imports from sessions module and delete the journeys feature module

**Independent Test**: Build passes (`pnpm build`), type-check passes (`pnpm type-check`), and grep for journey imports (excluding guest module) returns zero results

### Implementation for User Story 1

- [ ] T003 [US1] Remove journey imports from `web/src/features/sessions/actions/sessions.actions.ts`:
  - Delete: `import { getJourney, listStepsLegacy } from "@/features/journeys/repositories";`
  - Delete: `import type { Journey } from "@/features/journeys";`

- [ ] T004 [US1] Remove `getJourneyForGuestAction` function from `web/src/features/sessions/actions/sessions.actions.ts` (lines 373-387)

- [ ] T005 [US1] Verify `startJourneySessionAction` in `web/src/features/sessions/actions/sessions.actions.ts` uses only local repository function (no journey imports needed)

- [ ] T006 [US1] Delete entire journeys module directory: `rm -rf web/src/features/journeys/`

- [ ] T007 [US1] Verify type-check passes with `pnpm type-check` (guest module errors expected and acceptable)

**Checkpoint**: User Story 1 complete - journeys module deleted, sessions module updated

---

## Phase 3: User Story 2 - Remove Outdated Specifications (Priority: P2)

**Goal**: Delete legacy spec directories that reference deprecated journey patterns

**Independent Test**: `specs/005-journey-init/` and `specs/008-preview-runtime/` directories no longer exist

### Implementation for User Story 2

- [ ] T008 [P] [US2] Delete legacy spec directory: `rm -rf specs/005-journey-init/`

- [ ] T009 [P] [US2] Delete legacy spec directory: `rm -rf specs/008-preview-runtime/`

**Checkpoint**: User Story 2 complete - legacy specs removed

---

## Phase 4: User Story 3 - Preserve Guest Module for Phase 7 (Priority: P3)

**Goal**: Verify guest module is intentionally left with broken imports (Phase 7 scope)

**Independent Test**: Grep for journey imports shows ONLY files in `features/guest/`

### Implementation for User Story 3

- [ ] T010 [US3] Verify guest module files have expected broken imports:
  - `web/src/features/guest/hooks/useJourneyRuntime.ts`
  - `web/src/features/guest/components/JourneyGuestContainer.tsx`

- [ ] T011 [US3] Run verification: `grep -r "features/journeys" web/src/ --include="*.ts" --include="*.tsx" | grep -v "features/guest"` should return zero results

**Checkpoint**: User Story 3 complete - confirmed only guest module has journey references

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T012 Run `pnpm lint` and fix all errors/warnings
- [ ] T013 Run `pnpm type-check` and resolve all TypeScript errors (guest module errors expected)
- [ ] T014 Run `pnpm build` and verify successful completion
- [ ] T015 Run final verification: `grep -r "features/journeys" web/src/ --include="*.ts" --include="*.tsx" | grep -v "features/guest"` returns zero results

**Checkpoint**: All validation passes - ready for commit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify baseline first
- **User Story 1 (Phase 2)**: Depends on Setup - code changes
- **User Story 2 (Phase 3)**: Can run in parallel with User Story 1 (different directories)
- **User Story 3 (Phase 4)**: Depends on User Story 1 (verification after deletions)
- **Polish (Phase 5)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - PRIMARY cleanup work
- **User Story 2 (P2)**: Can start in parallel with US1 (deletes spec directories, not source code)
- **User Story 3 (P3)**: Depends on US1 (verification after journeys module deleted)

### Within Each User Story

- T003 → T004 → T005 → T006 → T007 (sequential for US1)
- T008, T009 can run in parallel (US2)
- T010 → T011 (sequential for US3)

### Parallel Opportunities

- T008 and T009 can run in parallel (different directories)
- US1 (Phase 2) and US2 (Phase 3) can start in parallel
- Validation tasks T012-T015 should run sequentially

---

## Parallel Example: User Story 2

```bash
# Launch both spec deletions in parallel:
Task: "Delete legacy spec directory: rm -rf specs/005-journey-init/"
Task: "Delete legacy spec directory: rm -rf specs/008-preview-runtime/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify baseline)
2. Complete Phase 2: User Story 1 (delete journeys module, update sessions)
3. **STOP and VALIDATE**: Verify build/type-check pass
4. This is the core cleanup - can deploy here

### Complete Cleanup

1. Complete Setup → Baseline verified
2. Complete User Story 1 → Core cleanup done
3. Complete User Story 2 → Legacy specs removed
4. Complete User Story 3 → Verification complete
5. Complete Polish → Validation loop passes

---

## Notes

- Guest module (`features/guest/`) is intentionally left broken - Phase 7 scope
- `startJourneySessionAction` is kept for backwards compatibility (guest module uses it)
- `startJourneySession` in sessions repository is kept (self-contained, no journey imports)
- Existing tests for `startJourneySession` should continue to pass
- Commit after each phase for easy rollback if needed
