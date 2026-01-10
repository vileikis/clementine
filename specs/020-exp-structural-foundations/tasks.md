# Tasks: Experience System Structural Foundations

**Input**: Design documents from `/specs/020-exp-structural-foundations/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested for this phase (scaffolding only)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Base path**: `apps/clementine-app/src/domains/`
- All paths below are relative to repository root

---

## Phase 1: Setup (No Setup Required)

**Purpose**: This phase has no setup tasks - the project structure already exists. Proceed directly to Foundational.

**Note**: The experience and session domains already have `shared/` subdirectories with schemas and types. We are extending existing infrastructure, not creating new projects.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema changes that MUST be complete before user story-specific work

**⚠️ CRITICAL**: These tasks affect shared types that multiple stories depend on

- [X] T001 Update ExperienceProfile enum values from `(freeform, main_default, pregate_default, preshare_default)` to `(freeform, survey, informational)` in `apps/clementine-app/src/domains/experience/shared/schemas/experience.schema.ts`
- [X] T002 Add ExperienceSlot enum schema with values `(main, pregate, preshare)` in `apps/clementine-app/src/domains/experience/shared/schemas/experience.schema.ts`
- [X] T003 Export ExperienceSlot type from schema barrel file at `apps/clementine-app/src/domains/experience/shared/schemas/index.ts`
- [X] T004 Update profileValidators record keys to match new profile values `(freeform, survey, informational)` in `apps/clementine-app/src/domains/experience/shared/types/profile.types.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Experience Domain Structure (Priority: P1) 🎯 MVP

**Goal**: Create well-organized domain subdirectories for the Experience System with placeholder files

**Independent Test**: Verify directory structure exists with placeholder barrel exports. Application boots without import errors.

### Implementation for User Story 1

- [X] T005 [P] [US1] Create steps subdomain placeholder at `apps/clementine-app/src/domains/experience/steps/index.ts`
- [X] T006 [P] [US1] Create runtime subdomain placeholder at `apps/clementine-app/src/domains/experience/runtime/index.ts`
- [X] T007 [P] [US1] Create editor subdomain placeholder at `apps/clementine-app/src/domains/experience/editor/index.ts`
- [X] T008 [US1] Create validation subdomain with slot compatibility at `apps/clementine-app/src/domains/experience/validation/index.ts`
- [X] T009 [US1] Update experience domain barrel export to include all subdomains at `apps/clementine-app/src/domains/experience/index.ts`
- [X] T010 [US1] Add import boundary documentation comments to experience domain index

**Checkpoint**: User Story 1 complete - experience domain has all required subdirectories

---

## Phase 4: User Story 2 - Experience Profile Types (Priority: P1)

**Goal**: Define ExperienceProfile and ExperienceSlot types with slot-profile compatibility rules

**Independent Test**: Import ExperienceProfile and ExperienceSlot types. TypeScript accepts valid values and rejects invalid values.

### Implementation for User Story 2

- [X] T011 [US2] Add SLOT_ALLOWED_PROFILES constant mapping in `apps/clementine-app/src/domains/experience/validation/index.ts`
- [X] T012 [US2] Add isProfileAllowedInSlot helper function in `apps/clementine-app/src/domains/experience/validation/index.ts`
- [X] T013 [US2] Re-export profile validation types from validation index at `apps/clementine-app/src/domains/experience/validation/index.ts`

**Checkpoint**: User Story 2 complete - profile and slot types are fully functional

---

## Phase 5: User Story 3 - Active Event ID (Priority: P2)

**Goal**: Verify project schema has activeEventId field for linking projects to active events

**Independent Test**: Confirm project schema accepts activeEventId field. Existing projects without field remain valid.

### Implementation for User Story 3

- [X] T014 [US3] Verify activeEventId field exists in project schema at `packages/shared/src/entities/project/project.schema.ts`
- [X] T015 [US3] Document activeEventId usage in project types at `apps/clementine-app/src/domains/workspace/projects/types/project.types.ts` (add JSDoc if missing)

**Checkpoint**: User Story 3 complete - project schema verified

---

## Phase 6: User Story 4 - Renamed Configuration Panels (Priority: P2)

**Goal**: Rename WelcomeControls and ThemeControls to WelcomeConfigPanel and ThemeConfigPanel

**Independent Test**: Event designer renders Welcome and Theme tabs with renamed components functioning identically.

### Implementation for User Story 4

- [X] T016 [P] [US4] Rename WelcomeControls.tsx to WelcomeConfigPanel.tsx at `apps/clementine-app/src/domains/event/welcome/components/`
- [X] T017 [P] [US4] Rename ThemeControls.tsx to ThemeConfigPanel.tsx at `apps/clementine-app/src/domains/event/theme/components/`
- [X] T018 [US4] Update WelcomeConfigPanel component and interface names in `apps/clementine-app/src/domains/event/welcome/components/WelcomeConfigPanel.tsx`
- [X] T019 [US4] Update ThemeConfigPanel component and interface names in `apps/clementine-app/src/domains/event/theme/components/ThemeConfigPanel.tsx`
- [X] T020 [US4] Update barrel export for welcome components at `apps/clementine-app/src/domains/event/welcome/components/index.ts`
- [X] T021 [US4] Update barrel export for theme components at `apps/clementine-app/src/domains/event/theme/components/index.ts`
- [X] T022 [US4] Update WelcomeEditorPage.tsx imports at `apps/clementine-app/src/domains/event/welcome/containers/WelcomeEditorPage.tsx`
- [X] T023 [US4] Update ThemeEditorPage.tsx imports at `apps/clementine-app/src/domains/event/theme/containers/ThemeEditorPage.tsx`

**Checkpoint**: User Story 4 complete - components renamed with all imports updated

---

## Phase 7: Polish & Validation

**Purpose**: Final verification and cleanup

- [X] T024 Run TypeScript type-check with `pnpm type-check` in apps/clementine-app
- [X] T025 Run linting and formatting with `pnpm check` in apps/clementine-app
- [X] T026 Verify application boots with `pnpm dev` in apps/clementine-app
- [X] T027 Verify no circular dependency warnings in build output
- [X] T028 Update quickstart.md verification checklist (mark items complete)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped - existing infrastructure
- **Foundational (Phase 2)**: No dependencies - can start immediately
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (different files)
  - US3 is independent (verification only)
  - US4 is independent (component renames)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on T001-T004 (Foundational) - Creates domain structure
- **User Story 2 (P1)**: Depends on T001-T004 (Foundational) - Depends on US1 for validation subdomain
- **User Story 3 (P2)**: Can start after Foundational - Independent (verification task)
- **User Story 4 (P2)**: Can start after Foundational - Independent (pure refactoring)

### Within Each User Story

- Tasks marked [P] can run in parallel
- Non-[P] tasks have implicit dependencies on prior tasks in same story
- Barrel exports depend on implementation tasks completing first

### Parallel Opportunities

- T005, T006, T007 can run in parallel (different placeholder files)
- T016, T017 can run in parallel (different component renames)
- US3 and US4 can run in parallel (independent of each other)

---

## Parallel Example: User Story 1

```bash
# Launch all placeholder subdomain files together:
Task: "Create steps subdomain placeholder at apps/clementine-app/src/domains/experience/steps/index.ts"
Task: "Create runtime subdomain placeholder at apps/clementine-app/src/domains/experience/runtime/index.ts"
Task: "Create editor subdomain placeholder at apps/clementine-app/src/domains/experience/editor/index.ts"
```

## Parallel Example: User Story 4

```bash
# Rename both component files together:
Task: "Rename WelcomeControls.tsx to WelcomeConfigPanel.tsx"
Task: "Rename ThemeControls.tsx to ThemeConfigPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 2: Foundational (T001-T004)
2. Complete Phase 3: User Story 1 (T005-T010)
3. Complete Phase 4: User Story 2 (T011-T013)
4. **STOP and VALIDATE**: Test profile types and domain structure
5. Types are usable for future phases

### Full Implementation

1. Complete Foundational → Profile types updated
2. Add User Story 1 → Domain scaffolding complete
3. Add User Story 2 → Slot compatibility added
4. Add User Story 3 → Project schema verified
5. Add User Story 4 → Components renamed
6. Polish → Build passes, app boots

### Parallel Team Strategy

With multiple developers:

1. Everyone completes Foundational together (4 quick tasks)
2. Once Foundational is done:
   - Developer A: User Stories 1 + 2 (experience domain)
   - Developer B: User Stories 3 + 4 (verification + renames)
3. Polish together

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 28 |
| **Phase 2 (Foundational)** | 4 |
| **Phase 3 (US1)** | 6 |
| **Phase 4 (US2)** | 3 |
| **Phase 5 (US3)** | 2 |
| **Phase 6 (US4)** | 8 |
| **Phase 7 (Polish)** | 5 |
| **Parallelizable [P] Tasks** | 6 |

### Independent Test Criteria

| Story | Independent Test |
|-------|------------------|
| US1 | Directory structure exists, app boots without errors |
| US2 | TypeScript accepts valid profile/slot values, rejects invalid |
| US3 | Project schema has activeEventId field |
| US4 | Event designer renders with renamed components |

### Suggested MVP Scope

**Minimum Viable**: Foundational + US1 + US2 (13 tasks)
- Creates domain structure
- Defines profile and slot types
- Enables future phases to build on foundation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No tests required for this phase (scaffolding/placeholder files)
- Commit after each task or logical group
- Verify TypeScript compilation after each story completes
