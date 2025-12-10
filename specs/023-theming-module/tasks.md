# Tasks: Theming Module

**Input**: Design documents from `/specs/023-theming-module/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/theming-api.md, quickstart.md

**Tests**: Tests are NOT included in this task list (not explicitly requested in specification).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/src/` at repository root (Next.js monorepo structure)

---

## Phase 1: Setup (Module Structure)

**Purpose**: Create the theming module directory structure and barrel exports

- [ ] T001 Create theming module directory structure at web/src/features/theming/
- [ ] T002 [P] Create types barrel export at web/src/features/theming/types/index.ts
- [ ] T003 [P] Create constants barrel export at web/src/features/theming/constants/index.ts
- [ ] T004 [P] Create components barrel export at web/src/features/theming/components/index.ts
- [ ] T005 [P] Create hooks barrel export at web/src/features/theming/hooks/index.ts
- [ ] T006 [P] Create context barrel export at web/src/features/theming/context/index.ts
- [ ] T007 Create module root barrel export at web/src/features/theming/index.ts

---

## Phase 2: Foundational (Shared Types & Constants)

**Purpose**: Core types and constants that ALL user stories depend on - MUST complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Define Theme, ThemeText, ThemeButton, ThemeBackground, ButtonRadius types in web/src/features/theming/types/theme.types.ts
- [ ] T009 Define BUTTON_RADIUS_MAP constant in web/src/features/theming/constants/theme-defaults.ts
- [ ] T010 Export all types and constants from barrel files (update T002, T003)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Use Unified Theme Type Across Features (Priority: P1) 🎯 MVP

**Goal**: Provide a single, unified Theme type that can be imported from one location, replacing duplicate ProjectTheme and EventTheme definitions.

**Independent Test**: Import the Theme type in a Project or Event file and verify TypeScript compilation succeeds with the unified structure.

### Implementation for User Story 1

- [ ] T011 [US1] Add backward-compatible type alias export (ProjectTheme) in web/src/features/projects/types/project.types.ts importing Theme from @/features/theming
- [ ] T012 [US1] Add backward-compatible type alias export (EventTheme) in web/src/features/events/types/event.types.ts importing Theme from @/features/theming
- [ ] T013 [US1] Move logoUrl from nested theme to Project interface directly in web/src/features/projects/types/project.types.ts
- [ ] T014 [US1] Move logoUrl from nested theme to Event interface directly in web/src/features/events/types/event.types.ts
- [ ] T015 [US1] Update any Project type usages that reference theme.logoUrl to use Project.logoUrl directly
- [ ] T016 [US1] Update any Event type usages that reference theme.logoUrl to use Event.logoUrl directly

**Checkpoint**: User Story 1 complete - unified Theme type is available and backward compatible

---

## Phase 4: User Story 2 - Provide Theme Context to Components (Priority: P2)

**Goal**: Create ThemeProvider and useTheme hook so UI components can access theme values without prop drilling.

**Independent Test**: Wrap a component tree in ThemeProvider and verify child components can access theme values via useTheme hook.

### Implementation for User Story 2

- [ ] T017 [US2] Define ThemeContextValue interface in web/src/features/theming/context/ThemeContext.tsx
- [ ] T018 [US2] Create ThemeContext with createContext in web/src/features/theming/context/ThemeContext.tsx
- [ ] T019 [US2] Implement ThemeProvider component with computed conveniences (buttonBgColor, buttonRadius) in web/src/features/theming/components/ThemeProvider.tsx
- [ ] T020 [US2] Implement useTheme hook with provider-missing error in web/src/features/theming/hooks/useTheme.ts
- [ ] T021 [US2] Export ThemeProvider and useTheme from barrel files
- [ ] T022 [US2] Update ActionButton in web/src/components/step-primitives/ActionButton.tsx to import from @/features/theming
- [ ] T023 [US2] Update OptionButton in web/src/components/step-primitives/OptionButton.tsx to import from @/features/theming
- [ ] T024 [US2] Update StepLayout in web/src/components/step-primitives/StepLayout.tsx to import from @/features/theming

**Checkpoint**: User Story 2 complete - theme context is available to all consuming components

---

## Phase 5: User Story 3 - Render Themed Backgrounds Consistently (Priority: P3)

**Goal**: Create ThemedBackground component to consolidate duplicate background rendering code (~60 lines duplicated in 3 locations).

**Independent Test**: Render ThemedBackground with various configurations (color only, with image, with overlay) and verify visual output.

### Implementation for User Story 3

- [ ] T025 [US3] Implement ThemedBackground component in web/src/features/theming/components/ThemedBackground.tsx
- [ ] T026 [US3] Export ThemedBackground from barrel files
- [ ] T027 [US3] Replace duplicate background code in ThemeEditor with ThemedBackground at web/src/features/projects/components/designer/ThemeEditor.tsx (lines 471-526)
- [ ] T028 [US3] Replace duplicate background code in EventThemeEditor with ThemedBackground at web/src/features/events/components/designer/EventThemeEditor.tsx (lines 474-531)
- [ ] T029 [US3] Replace duplicate background code in DeviceFrame with ThemedBackground at web/src/features/steps/components/preview/DeviceFrame.tsx (lines 37-89)

**Checkpoint**: User Story 3 complete - background rendering is consolidated to one reusable component

---

## Phase 6: User Story 4 - Compute Inline Styles from Theme (Priority: P4)

**Goal**: Create useThemedStyles hook that computes inline CSS style objects from theme values for convenient application.

**Independent Test**: Call useThemedStyles and verify returned CSS property objects match expected theme mappings.

### Implementation for User Story 4

- [ ] T030 [US4] Implement useThemedStyles hook returning text, button, background style objects in web/src/features/theming/hooks/useThemedStyles.ts
- [ ] T031 [US4] Export useThemedStyles from barrel files

**Checkpoint**: User Story 4 complete - styled inline CSS is available via hook

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, fix inconsistencies, remove deprecated code

- [ ] T032 Fix button radius inconsistency - update ThemeEditor to use BUTTON_RADIUS_MAP from @/features/theming at web/src/features/projects/components/designer/ThemeEditor.tsx
- [ ] T033 Fix button radius inconsistency - update EventThemeEditor to use BUTTON_RADIUS_MAP from @/features/theming at web/src/features/events/components/designer/EventThemeEditor.tsx
- [ ] T034 Deprecate/remove EventThemeProvider from web/src/components/providers/EventThemeProvider.tsx (add deprecation comment or remove if no consumers)
- [ ] T035 Remove duplicate ProjectTheme type definition from web/src/features/projects/types/project.types.ts (keep only the alias)
- [ ] T036 Remove duplicate EventTheme type definition from web/src/features/events/types/event.types.ts (keep only the alias)

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T037 Run `pnpm lint` and fix all errors/warnings
- [ ] T038 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T039 Verify feature in local dev server (`pnpm dev`) - check themed previews render identically
- [ ] T040 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): No dependencies on other stories - START HERE
  - User Story 2 (P2): Depends on US1 types existing (can start after T008-T010)
  - User Story 3 (P3): Can start after Foundational, benefits from US2 context but not required
  - User Story 4 (P4): Depends on US2 (needs ThemeProvider/useTheme)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories ✓
- **User Story 2 (P2)**: Can start after Foundational - Creates context/hooks that US4 depends on
- **User Story 3 (P3)**: Can start after Foundational - Independent of other stories ✓
- **User Story 4 (P4)**: Depends on US2 (needs useTheme context hook to access theme)

### Within Each User Story

- Core implementation before integration with existing components
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005, T006 can all run in parallel
- **Phase 3 (US1)**: T011 and T012 can run in parallel; T013 and T014 can run in parallel
- **Phase 4 (US2)**: T022, T023, T024 can run in parallel (after T021)
- **Phase 5 (US3)**: T027, T028, T029 can run in parallel (after T026)
- **Different User Stories**: US1, US2, US3 can be worked on in parallel (US4 depends on US2)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all barrel file creation tasks together:
Task: "Create types barrel export at web/src/features/theming/types/index.ts"
Task: "Create constants barrel export at web/src/features/theming/constants/index.ts"
Task: "Create components barrel export at web/src/features/theming/components/index.ts"
Task: "Create hooks barrel export at web/src/features/theming/hooks/index.ts"
Task: "Create context barrel export at web/src/features/theming/context/index.ts"
```

## Parallel Example: User Story 3 Migration

```bash
# After ThemedBackground component is exported, migrate all consumers in parallel:
Task: "Replace duplicate background code in ThemeEditor with ThemedBackground"
Task: "Replace duplicate background code in EventThemeEditor with ThemedBackground"
Task: "Replace duplicate background code in DeviceFrame with ThemedBackground"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (unified types)
4. **STOP and VALIDATE**: Test type imports, ensure TypeScript compilation succeeds
5. Deploy/demo if ready - unified types are valuable alone

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test type imports → Deploy (MVP - unified types!)
3. Add User Story 2 → Test context provider → Deploy (theme context available!)
4. Add User Story 3 → Test background component → Deploy (duplicate code eliminated!)
5. Add User Story 4 → Test styled hook → Deploy (convenience hook available!)
6. Each story adds value without breaking previous stories

### Single Developer Strategy (Recommended)

1. Complete Setup + Foundational
2. User Story 1 (types) → User Story 2 (context) → User Story 3 (background) → User Story 4 (styles)
3. Polish phase to fix inconsistencies and cleanup
4. Validation loop before merge

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Backward compatibility: Type aliases (ProjectTheme, EventTheme) ensure zero breaking changes during migration
