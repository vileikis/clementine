# Tasks: Themed Primitives

**Input**: Design documents from `/specs/016-themed-primitives/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Unit tests included as requested in plan.md (Principle IV: Minimal Testing Strategy)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Base path: `apps/clementine-app/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare directory structure for reorganization

- [X] T001 Create providers directory in `apps/clementine-app/src/shared/theming/providers/`
- [X] T002 [P] Create primitives directory in `apps/clementine-app/src/shared/theming/components/primitives/`
- [X] T003 [P] Create inputs placeholder directory in `apps/clementine-app/src/shared/theming/components/inputs/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schemas and utilities that MUST be complete before component implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create MediaReference schema in `apps/clementine-app/src/shared/theming/schemas/media-reference.schema.ts`
- [X] T005 Add normalizeBackgroundImage helper function to `apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts`
- [X] T006 Update themeBackgroundSchema to use MediaReference with preprocess in `apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts`
- [X] T007 Update schemas barrel export in `apps/clementine-app/src/shared/theming/schemas/index.ts`
- [X] T008 Create useThemeWithOverride hook in `apps/clementine-app/src/shared/theming/hooks/useThemeWithOverride.ts`
- [X] T009 Update hooks barrel export in `apps/clementine-app/src/shared/theming/hooks/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Schema Tests & Validation (Priority: P1) 🎯 MVP

**Goal**: Ensure MediaReference schema and updated theme background schema work correctly with both new and legacy data

**Independent Test**: Run `pnpm test theme.schemas.test.ts` and verify all tests pass

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation changes are complete**

- [X] T010 [US1] Add MediaReference schema unit tests in `apps/clementine-app/src/shared/theming/schemas/theme.schemas.test.ts`
- [X] T011 [US1] Add themeBackgroundSchema migration tests (string→MediaReference) in `apps/clementine-app/src/shared/theming/schemas/theme.schemas.test.ts`
- [X] T012 [US1] Add useThemeWithOverride hook tests in `apps/clementine-app/src/shared/theming/hooks/useThemeWithOverride.test.ts`

**Checkpoint**: Schema foundation is validated and backward compatible

---

## Phase 4: User Story 2 - Directory Reorganization (Priority: P2)

**Goal**: Move ThemeProvider to providers/ and update all exports

**Independent Test**: Run `pnpm type-check` and verify no import errors; existing ThemeProvider imports still work

### Implementation for User Story 2

- [X] T013 [US2] Move ThemeProvider.tsx from `apps/clementine-app/src/shared/theming/components/ThemeProvider.tsx` to `apps/clementine-app/src/shared/theming/providers/ThemeProvider.tsx`
- [X] T014 [US2] Create providers barrel export in `apps/clementine-app/src/shared/theming/providers/index.ts`
- [X] T015 [US2] Update components barrel to remove ThemeProvider in `apps/clementine-app/src/shared/theming/components/index.ts`
- [X] T016 [US2] Create inputs placeholder barrel export in `apps/clementine-app/src/shared/theming/components/inputs/index.ts`
- [X] T017 [US2] Update main theming barrel export in `apps/clementine-app/src/shared/theming/index.ts`

**Checkpoint**: Directory structure reorganized, all imports still work

---

## Phase 5: User Story 3 - ThemedText Primitive (Priority: P3)

**Goal**: Create ThemedText component with variant support and context/override pattern

**Independent Test**: Preview ThemedText in ThemePreview by temporarily adding `<ThemedText variant="heading" theme={theme}>Test</ThemedText>`

### Implementation for User Story 3

- [X] T018 [US3] Create ThemedText component in `apps/clementine-app/src/shared/theming/components/primitives/ThemedText.tsx`
- [X] T019 [US3] Create primitives barrel export in `apps/clementine-app/src/shared/theming/components/primitives/index.ts`
- [X] T020 [US3] Update components barrel to export primitives in `apps/clementine-app/src/shared/theming/components/index.ts`
- [X] T021 [US3] Update main theming barrel to export ThemedText in `apps/clementine-app/src/shared/theming/index.ts`

**Checkpoint**: ThemedText component available and working with context or prop override

---

## Phase 6: User Story 4 - ThemedButton Primitive (Priority: P4)

**Goal**: Create ThemedButton component with size variants and context/override pattern

**Independent Test**: Preview ThemedButton in ThemePreview by temporarily adding `<ThemedButton theme={theme}>Test</ThemedButton>`

### Implementation for User Story 4

- [X] T022 [P] [US4] Create ThemedButton component in `apps/clementine-app/src/shared/theming/components/primitives/ThemedButton.tsx`
- [X] T023 [US4] Update primitives barrel to export ThemedButton in `apps/clementine-app/src/shared/theming/components/primitives/index.ts`
- [X] T024 [US4] Update main theming barrel to export ThemedButton in `apps/clementine-app/src/shared/theming/index.ts`

**Checkpoint**: ThemedButton component available and working with context or prop override

---

## Phase 7: User Story 5 - Update Existing Components (Priority: P5)

**Goal**: Update ThemedBackground to use MediaReference.url and refactor ThemePreview to use all primitives

**Independent Test**: Open Theme Editor (`/workspace/.../events/.../theme`), verify preview looks identical before/after, background images work

### Implementation for User Story 5

- [X] T025 [US5] Update ThemedBackground to access image.url from MediaReference in `apps/clementine-app/src/shared/theming/components/ThemedBackground.tsx`
- [X] T026 [US5] Update ThemedBackground props type to use MediaReference in `apps/clementine-app/src/shared/theming/components/ThemedBackground.tsx`
- [X] T027 [US5] Refactor ThemePreview to use ThemedText, ThemedButton, ThemedBackground primitives in `apps/clementine-app/src/domains/event/theme/components/ThemePreview.tsx`
- [X] T028 [US5] Remove duplicate getButtonRadius function from ThemePreview (use shared BUTTON_RADIUS_MAP)

**Checkpoint**: Existing components updated, visual appearance unchanged

---

## Phase 8: User Story 6 - Update Theme Editor Upload Hook (Priority: P6)

**Goal**: Update useUploadAndUpdateBackground to store full MediaReference object

**Independent Test**: Upload a background image in Theme Editor, verify it displays and persists correctly

### Implementation for User Story 6

- [X] T029 [US6] Update useUploadAndUpdateBackground to store MediaReference in `apps/clementine-app/src/domains/event/theme/hooks/useUploadAndUpdateBackground.ts`
- [X] T030 [US6] Update any form state handling to work with MediaReference structure in `apps/clementine-app/src/domains/event/theme/containers/ThemeEditorPage.tsx`

**Checkpoint**: Background image uploads work with full MediaReference structure

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, type updates, and cleanup

- [X] T031 [P] Update ThemeBackground type in `apps/clementine-app/src/shared/theming/types/theme.types.ts` to use MediaReference (implicit via schema infer)
- [X] T032 [P] Update MediaReference type export in `apps/clementine-app/src/shared/theming/types/index.ts` (exported via schemas)
- [X] T033 Run `pnpm type-check` to verify all types are correct
- [X] T034 Run `pnpm lint` to verify code style
- [X] T035 Run `pnpm test` to verify all tests pass
- [ ] T036 Manual verification: Test Theme Editor with new/existing events
- [ ] T037 Manual verification: Test legacy events with string background.image URLs (migration)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - validates schemas
- **User Story 2 (Phase 4)**: Depends on Foundational - can run parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational + US2 (needs providers/)
- **User Story 4 (Phase 6)**: Depends on US3 (needs primitives/ barrel)
- **User Story 5 (Phase 7)**: Depends on US3 + US4 (needs both primitives)
- **User Story 6 (Phase 8)**: Depends on Foundational (needs MediaReference schema)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies Graph

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ────────────────────┐
    │                                       │
    ├───────────────┬───────────────┐       │
    ▼               ▼               ▼       ▼
Phase 3 (US1)   Phase 4 (US2)   Phase 8 (US6)
Schema Tests    Reorganize      Upload Hook
    │               │
    │               ▼
    │           Phase 5 (US3)
    │           ThemedText
    │               │
    │               ▼
    │           Phase 6 (US4)
    │           ThemedButton
    │               │
    │               ▼
    │           Phase 7 (US5)
    │           Update Components
    │               │
    └───────────────┴───────────────┐
                                    ▼
                            Phase 9 (Polish)
```

### Parallel Opportunities

**Within Setup (Phase 1)**:
- T001, T002, T003 can all run in parallel

**Within Foundational (Phase 2)**:
- T004 → T005 → T006 → T007 (sequential - schema dependencies)
- T008 → T009 (sequential - hook export)
- But T004-T007 and T008-T009 can run in parallel

**Cross-Phase Parallelism**:
- US1 (Phase 3) and US2 (Phase 4) can run in parallel after Foundational
- US6 (Phase 8) can run in parallel with US3-US5 (only needs Foundational)

---

## Parallel Example: Post-Foundational Work

```bash
# After Foundational is complete, launch these in parallel:

# Stream 1: Schema validation
Task: "Add MediaReference schema unit tests"
Task: "Add themeBackgroundSchema migration tests"
Task: "Add useThemeWithOverride hook tests"

# Stream 2: Directory reorganization
Task: "Move ThemeProvider.tsx to providers/"
Task: "Create providers barrel export"
Task: "Update components barrel"

# Stream 3: Upload hook (independent)
Task: "Update useUploadAndUpdateBackground to store MediaReference"
```

---

## Implementation Strategy

### MVP First (User Stories 1-2 Only)

1. Complete Phase 1: Setup directories
2. Complete Phase 2: Foundational schemas and hooks
3. Complete Phase 3: Schema tests pass
4. Complete Phase 4: Directory reorganized
5. **STOP and VALIDATE**: Type-check passes, no import errors
6. All existing functionality preserved

### Incremental Delivery

1. Setup + Foundational → Schema foundation ready
2. Add US1 + US2 → Schema validated, directory clean → Checkpoint
3. Add US3 → ThemedText available → Checkpoint
4. Add US4 → ThemedButton available → Checkpoint
5. Add US5 → Components use primitives → Checkpoint
6. Add US6 → Upload hook updated → Checkpoint
7. Polish → All tests pass, manual verification → Complete

### Single Developer Strategy

Recommended execution order for one developer:
1. Phase 1 + 2 together (foundation)
2. Phase 3 (validate schemas work)
3. Phase 4 (reorganize safely)
4. Phase 5 + 6 together (both primitives)
5. Phase 7 (update existing)
6. Phase 8 (upload hook)
7. Phase 9 (polish)

---

## Task Summary

| Phase | Description | Task Count | Parallelizable |
|-------|-------------|------------|----------------|
| 1 | Setup | 3 | 3 |
| 2 | Foundational | 6 | 2 groups |
| 3 | US1 - Schema Tests | 3 | 0 |
| 4 | US2 - Reorganize | 5 | 0 |
| 5 | US3 - ThemedText | 4 | 0 |
| 6 | US4 - ThemedButton | 3 | 1 |
| 7 | US5 - Update Components | 4 | 0 |
| 8 | US6 - Upload Hook | 2 | 0 |
| 9 | Polish | 7 | 2 |
| **Total** | | **37** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each phase completion
- Run `pnpm type-check` after any barrel export changes to catch import errors early
- Visual verification in Theme Editor is the primary acceptance test
- Legacy data (string URLs) must continue working via read-time normalization
