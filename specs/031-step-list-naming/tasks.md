# Tasks: Step List Naming

**Input**: Design documents from `/specs/031-step-list-naming/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Included per Constitution Check (Principle IV - unit tests for display logic)

**Organization**: Tasks grouped by user story for independent testing, though US1 and US2 are co-dependent (same feature, both P1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths included in descriptions

## Path Conventions

- **Web app (monorepo)**: `apps/clementine-app/src/`
- **Tests**: `apps/clementine-app/src/domains/experience/steps/registry/`

---

## Phase 1: Setup

**Purpose**: No setup needed - modifying existing files only

✅ **SKIPPED** - No new project structure, dependencies, or configuration required.

---

## Phase 2: Foundational

**Purpose**: Add helper function that both user stories depend on

- [ ] T001 Add `getStepDisplayLabel` helper function in `apps/clementine-app/src/domains/experience/steps/registry/step-utils.ts`
- [ ] T002 Export `getStepDisplayLabel` from step-utils.ts barrel export (if applicable)

**Checkpoint**: Helper function ready for use by StepListItem component

---

## Phase 3: User Story 1 & 2 - Step Title Display (Priority: P1) 🎯 MVP

**Goal**: Display custom step titles when available, fallback to default labels when not

**Note**: US1 (Custom Title Display) and US2 (Fallback to Default Label) are implemented together as they are two aspects of the same display logic.

**Independent Test**:
- Create a step with custom title → verify title shows in step list
- Create a step without title → verify default label shows

### Tests for User Stories 1 & 2

> **NOTE: Write tests FIRST, ensure they FAIL before implementation**

- [ ] T003 [P] [US1] Add unit test: returns custom title when present and non-empty in `apps/clementine-app/src/domains/experience/steps/registry/step-utils.test.ts`
- [ ] T004 [P] [US1] Add unit test: returns default label when title is whitespace-only in `apps/clementine-app/src/domains/experience/steps/registry/step-utils.test.ts`
- [ ] T005 [P] [US2] Add unit test: returns default label when title is empty string in `apps/clementine-app/src/domains/experience/steps/registry/step-utils.test.ts`
- [ ] T006 [P] [US2] Add unit test: returns default label when step type has no title field in `apps/clementine-app/src/domains/experience/steps/registry/step-utils.test.ts`

### Implementation for User Stories 1 & 2

- [ ] T007 [US1] Update StepListItem import to include `getStepDisplayLabel` in `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`
- [ ] T008 [US1] Replace `definition.label` with `getStepDisplayLabel(step, definition)` call in `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`

**Checkpoint**: Custom titles display when set, default labels display as fallback

---

## Phase 4: Polish & Validation

**Purpose**: Ensure quality and no regressions

- [ ] T009 Run `pnpm app:check` to verify lint and format pass
- [ ] T010 Run `pnpm app:type-check` to verify TypeScript compilation
- [ ] T011 Run `pnpm app:test` to verify all tests pass
- [ ] T012 Manual verification: create info step with title, verify title shows in step list
- [ ] T013 Manual verification: create capture.photo step (no title field), verify "Photo Capture" label shows
- [ ] T014 Manual verification: verify drag-drop, selection, and deletion still work (no regressions)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: SKIPPED - no new setup required
- **Phase 2 (Foundational)**: No dependencies - can start immediately
- **Phase 3 (User Stories)**: Depends on T001-T002 completion
- **Phase 4 (Polish)**: Depends on Phase 3 completion

### Task Dependencies

```
T001 (helper function) ──┬──> T003, T004, T005, T006 (tests - parallel)
                         │
                         └──> T007 ──> T008 (component update - sequential)
                                              │
                                              v
                              T009-T014 (validation - sequential)
```

### Parallel Opportunities

- T003, T004, T005, T006 can all run in parallel (same test file, different test cases)
- T009, T010, T011 can run in parallel (different validation commands)

---

## Parallel Example: Test Tasks

```bash
# All test cases can be written in parallel (same file, independent test blocks):
Task: "Add unit test: returns custom title when present"
Task: "Add unit test: returns default label when whitespace-only"
Task: "Add unit test: returns default label when empty string"
Task: "Add unit test: returns default label when no title field"
```

---

## Implementation Strategy

### MVP Scope (Recommended)

This is a minimal feature - all tasks should be completed together:

1. T001-T002: Add helper function
2. T003-T006: Write tests (verify they fail)
3. T007-T008: Update component
4. T009-T014: Validate

**Total estimated time**: < 30 minutes for experienced developer

### Single Developer Flow

1. Start with T001 (helper function)
2. Write all tests T003-T006 (verify they fail)
3. Tests should now pass after T001
4. Update component T007-T008
5. Run all validations T009-T014

---

## Notes

- This is a minimal feature with only 14 tasks
- US1 and US2 are co-dependent (same display logic, both P1)
- No new files created - only modifications to existing files
- Existing CSS truncation handles long titles automatically
- No changes to step schemas, registry, or parent component (StepList.tsx)
