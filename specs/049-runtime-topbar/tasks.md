# Tasks: Experience Runtime TopBar with Progress Tracking

**Input**: Design documents from `/specs/049-runtime-topbar/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are included as this is a UI feature requiring validation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **TanStack Start monorepo**: `apps/clementine-app/src/` for source, tests collocated with source files
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites and prepare development environment

- [X] T001 Verify Radix UI Progress is installed (@radix-ui/react-progress@^1.1.8 in package.json)
- [X] T002 Verify Radix UI AlertDialog is available (@radix-ui/react-alert-dialog@^1.1.15 in package.json)
- [X] T003 Review existing themed components pattern (ThemedButton, ThemedText, ThemedIconButton)
- [X] T004 Review ExperienceRuntimeStore interface in apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create shared themed primitive that all user stories depend on

**⚠️ CRITICAL**: ThemedProgressBar must be complete before any user story implementation

- [X] T005 Create ThemedProgressBar component in apps/clementine-app/src/shared/theming/components/primitives/ThemedProgressBar.tsx
- [X] T006 Create ThemedProgressBar tests in apps/clementine-app/src/shared/theming/components/primitives/ThemedProgressBar.test.tsx
- [X] T007 Export ThemedProgressBar from apps/clementine-app/src/shared/theming/components/primitives/index.ts
- [X] T008 Export ThemedProgressBar from apps/clementine-app/src/shared/theming/index.ts
- [X] T009 Run tests to verify ThemedProgressBar works with different theme configurations

**Checkpoint**: ThemedProgressBar primitive complete - user story implementation can now begin

---

## Phase 3: User Story 1 - Guest Navigates Through Experience with Progress Awareness (Priority: P1) 🎯 MVP

**Goal**: Display experience name and progress tracking in topbar during experience execution. Guest can see current step position and total steps remaining.

**Independent Test**: Start any guest experience (pregate/main/preshare), navigate through steps, verify topbar displays experience name and progress bar updates with each step transition (e.g., step 1/5 → 20%, step 3/5 → 60%).

### Implementation for User Story 1

- [X] T010 [P] [US1] Create RuntimeTopBar component in apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.tsx
- [X] T011 [P] [US1] Create RuntimeTopBar tests in apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.test.tsx
- [X] T012 [US1] Export RuntimeTopBar from apps/clementine-app/src/domains/experience/runtime/components/index.ts
- [X] T013 [US1] Integrate RuntimeTopBar into ExperienceRuntime container in apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx
- [ ] T014 [US1] Update ExperiencePreviewModal to pass experience name and progress props in apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx
- [X] T015 [US1] Update PregatePage to pass experience name and progress props in apps/clementine-app/src/domains/guest/containers/PregatePage.tsx
- [X] T016 [US1] Update ExperiencePage to pass experience name and progress props in apps/clementine-app/src/domains/guest/containers/ExperiencePage.tsx
- [X] T017 [US1] Update PresharePage to pass experience name and progress props in apps/clementine-app/src/domains/guest/containers/PresharePage.tsx
- [ ] T018 [US1] Test topbar rendering in preview mode (verify experience name and progress display)
- [ ] T019 [US1] Test topbar rendering in guest pregate mode (verify experience name and progress display)
- [ ] T020 [US1] Test topbar rendering in guest main experience mode (verify experience name and progress display)
- [ ] T021 [US1] Test topbar rendering in guest preshare mode (verify experience name and progress display)
- [ ] T022 [US1] Test progress bar updates correctly when navigating between steps (forward and backward)

**Checkpoint**: User Story 1 complete - topbar displays name and progress in all contexts

---

## Phase 4: User Story 2 - Guest Exits Experience with Confirmation (Priority: P2)

**Goal**: Provide safe exit mechanism with confirmation dialog to prevent accidental navigation and data loss.

**Independent Test**: Start any guest experience, click home icon in topbar, verify confirmation dialog appears with "Exit Experience?" message, click "Cancel" (stays in experience) or "Exit" (navigates to welcome page).

### Implementation for User Story 2

- [X] T023 [P] [US2] Create useNavigateHome hook in apps/clementine-app/src/domains/guest/hooks/useNavigateHome.ts
- [X] T024 [US2] Add home button click handler to PregatePage in apps/clementine-app/src/domains/guest/containers/PregatePage.tsx
- [X] T025 [US2] Add exit confirmation AlertDialog to PregatePage in apps/clementine-app/src/domains/guest/containers/PregatePage.tsx
- [X] T026 [US2] Add home button click handler to ExperiencePage in apps/clementine-app/src/domains/guest/containers/ExperiencePage.tsx
- [X] T027 [US2] Add exit confirmation AlertDialog to ExperiencePage in apps/clementine-app/src/domains/guest/containers/ExperiencePage.tsx
- [X] T028 [US2] Add home button click handler to PresharePage in apps/clementine-app/src/domains/guest/containers/PresharePage.tsx
- [X] T029 [US2] Add exit confirmation AlertDialog to PresharePage in apps/clementine-app/src/domains/guest/containers/PresharePage.tsx
- [X] T030 [US2] Update RuntimeTopBar to accept onHomeClick prop in apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.tsx
- [ ] T031 [US2] Test home button opens confirmation dialog in pregate experience
- [ ] T032 [US2] Test home button opens confirmation dialog in main experience
- [ ] T033 [US2] Test home button opens confirmation dialog in preshare experience
- [ ] T034 [US2] Test "Cancel" button closes dialog and stays in experience
- [ ] T035 [US2] Test "Exit" button navigates to welcome page (/join/$projectId)
- [ ] T036 [US2] Test rapid clicking home button doesn't create duplicate dialogs

**Checkpoint**: User Story 2 complete - home navigation with confirmation works in all guest contexts

---

## Phase 5: User Story 3 - Admin Previews Experience with Visual Context (Priority: P3)

**Goal**: Experience creators see the same topbar in preview mode that guests will see, with home button visible but non-functional.

**Independent Test**: Open experience in preview mode (ExperiencePreviewModal), navigate through steps, verify topbar displays with progress tracking and home button is visible but disabled (no action on click).

### Implementation for User Story 3

- [ ] T037 [US3] Update ExperiencePreviewModal to pass onHomeClick={undefined} for preview mode in apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx
- [ ] T038 [US3] Update RuntimeTopBar to disable home button when onHomeClick is undefined in apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.tsx
- [ ] T039 [US3] Test home button is visible but disabled in preview mode
- [ ] T040 [US3] Test clicking home button in preview mode does nothing
- [ ] T041 [US3] Test topbar appearance matches guest mode (WYSIWYG preview)

**Checkpoint**: All user stories complete - topbar works across preview and guest contexts with appropriate behavior

---

## Phase 6: Edge Cases & Polish

**Purpose**: Handle edge cases and ensure robust behavior across all scenarios

- [ ] T042 [P] Test topbar with single-step experience (progress shows 100%)
- [ ] T043 [P] Test topbar with very long experience name (text truncates with ellipsis)
- [ ] T044 [P] Test topbar on mobile viewport (320px width)
- [ ] T045 [P] Test topbar on desktop viewport (1920px width)
- [ ] T046 [P] Test topbar with different theme configurations (light/dark, high contrast)
- [ ] T047 [P] Test topbar accessibility with screen reader (VoiceOver/NVDA)
- [ ] T048 Verify topbar doesn't overlap step content (proper z-index and spacing)
- [ ] T049 Verify progress bar animation is smooth (no flickering on step navigation)
- [ ] T050 Run validation workflow (pnpm app:check for lint/format)
- [ ] T051 Run type checking (pnpm type-check)
- [ ] T052 Run all tests (pnpm test)
- [ ] T053 Review code against design system standards (frontend/design-system.md)
- [ ] T054 Review code against component library standards (frontend/component-libraries.md)
- [ ] T055 Review code against accessibility standards (frontend/accessibility.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (ThemedProgressBar must exist)
- **User Story 2 (Phase 4)**: Depends on Foundational + US1 (RuntimeTopBar must exist)
- **User Story 3 (Phase 5)**: Depends on Foundational + US1 (RuntimeTopBar must exist)
- **Edge Cases & Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Foundational - creates RuntimeTopBar component
- **User Story 2 (P2)**: Depends on US1 (needs RuntimeTopBar) - adds home navigation
- **User Story 3 (P3)**: Depends on US1 (needs RuntimeTopBar) - adds preview mode behavior

### Within Each User Story

- Component creation before integration
- Integration before testing
- Manual testing before validation workflow

### Parallel Opportunities

**Phase 2 (Foundational)**:
- T006 (tests) can run parallel with T005 (component) - different concerns

**Phase 3 (US1)**:
- T010 (component) and T011 (tests) can run in parallel
- T014-T017 (page updates) can all run in parallel after T013 complete

**Phase 4 (US2)**:
- T023 (hook) can run parallel with T024-T029 (page updates)
- T024-T025, T026-T027, T028-T029 can run in parallel (different pages)
- T031-T036 (tests) can run in parallel

**Phase 5 (US3)**:
- T037-T038 can run in parallel with T039-T041 (tests)

**Phase 6 (Polish)**:
- T042-T047 (tests) can all run in parallel
- T053-T055 (standards review) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch component and tests together:
Task T010: "Create RuntimeTopBar component in apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.tsx"
Task T011: "Create RuntimeTopBar tests in apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.test.tsx"

# After T013 complete, launch all page integrations together:
Task T014: "Update ExperiencePreviewModal..."
Task T015: "Update PregatePage..."
Task T016: "Update ExperiencePage..."
Task T017: "Update PresharePage..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify prerequisites)
2. Complete Phase 2: Foundational (create ThemedProgressBar)
3. Complete Phase 3: User Story 1 (create RuntimeTopBar, integrate into all contexts)
4. **STOP and VALIDATE**: Test topbar displays name and progress in preview/guest modes
5. Deploy/demo if ready

**Result**: Guests can see their progress through experiences. No home button functionality yet.

### Incremental Delivery

1. Setup + Foundational → ThemedProgressBar ready
2. Add User Story 1 → Test independently → **Deploy (MVP!)** - Progress tracking works
3. Add User Story 2 → Test independently → **Deploy** - Home navigation with confirmation works
4. Add User Story 3 → Test independently → **Deploy** - Preview mode correctly shows topbar
5. Polish & Edge Cases → Final production-ready release

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together (T001-T009)
2. Once Foundational done:
   - **Developer A**: User Story 1 (T010-T022) - Creates topbar with progress
   - **Developer B**: Prepares User Story 2 materials (research confirmation patterns)
3. After US1 complete:
   - **Developer A**: User Story 3 (T037-T041) - Preview mode
   - **Developer B**: User Story 2 (T023-T036) - Home navigation
4. Both work on Polish together (T042-T055)

---

## Notes

- [P] tasks = different files, no dependencies, can run simultaneously
- [Story] label maps task to specific user story for traceability
- ThemedProgressBar is foundational - blocks all user stories
- User Story 1 blocks US2 and US3 (they need RuntimeTopBar)
- Each checkpoint validates story independence
- Commit after each task or logical group
- Run validation workflow (T050-T052) before considering feature complete
- Standards compliance review (T053-T055) is mandatory before merge

---

## Summary

- **Total Tasks**: 55 tasks
- **User Story 1 (P1)**: 13 implementation tasks (T010-T022)
- **User Story 2 (P2)**: 14 implementation tasks (T023-T036)
- **User Story 3 (P3)**: 5 implementation tasks (T037-T041)
- **Foundational**: 5 tasks (T005-T009) - BLOCKS all stories
- **Setup**: 4 tasks (T001-T004)
- **Polish**: 14 tasks (T042-T055)
- **Parallel Opportunities**: 28 tasks can run in parallel (marked with [P])
- **MVP Scope**: Phase 1 + Phase 2 + Phase 3 (19 tasks total for minimal viable topbar)
