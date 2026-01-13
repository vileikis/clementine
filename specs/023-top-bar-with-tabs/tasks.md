# Tasks: Horizontal Tabs Navigation in Top Bar

**Input**: Design documents from `/specs/023-top-bar-with-tabs/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested - test tasks omitted.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths included in descriptions

## Path Conventions

- **Project**: `apps/clementine-app/src/` (monorepo structure)
- **Navigation domain**: `apps/clementine-app/src/domains/navigation/`
- **Event domain**: `apps/clementine-app/src/domains/event/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup required - working within existing project structure

This feature extends existing components. No new project setup needed.

**Checkpoint**: Existing codebase ready for modification

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the NavTabs component that enables all user stories

**⚠️ CRITICAL**: User Story 1 and 2 depend on NavTabs existing

- [ ] T001 Create TabItem interface and NavTabsProps types in apps/clementine-app/src/domains/navigation/components/NavTabs.tsx
- [ ] T002 Implement NavTabs component with horizontal tab rendering using TanStack Router Link in apps/clementine-app/src/domains/navigation/components/NavTabs.tsx
- [ ] T003 Add active state detection using useMatchRoute hook in apps/clementine-app/src/domains/navigation/components/NavTabs.tsx
- [ ] T004 Style NavTabs using design tokens (border-b-2 border-primary for active) in apps/clementine-app/src/domains/navigation/components/NavTabs.tsx
- [ ] T005 Export NavTabs and TabItem from apps/clementine-app/src/domains/navigation/components/index.ts
- [ ] T006 Re-export NavTabs types from apps/clementine-app/src/domains/navigation/index.ts

**Checkpoint**: NavTabs component available for use - user story implementation can begin

---

## Phase 3: User Story 1 & 2 - Horizontal Tabs Navigation (Priority: P1) 🎯 MVP

**Goal**: Display horizontal tabs in TopNavBar for event designer, making tabs a reusable feature

**Independent Test**: Navigate to any event designer page, verify tabs appear horizontally below breadcrumbs, click tabs to navigate between Welcome/Theme/Settings

### Implementation for User Stories 1 & 2

- [ ] T007 [US1] [US2] Add optional tabs prop (TabItem[]) to TopNavBarProps interface in apps/clementine-app/src/domains/navigation/components/TopNavBar.tsx
- [ ] T008 [US1] [US2] Import NavTabs component in apps/clementine-app/src/domains/navigation/components/TopNavBar.tsx
- [ ] T009 [US1] [US2] Modify TopNavBar to render two rows when tabs provided: Row 1 (breadcrumbs+left+right), Row 2 (NavTabs) in apps/clementine-app/src/domains/navigation/components/TopNavBar.tsx
- [ ] T010 [US1] [US2] Ensure TopNavBar renders single row when no tabs (backward compatibility) in apps/clementine-app/src/domains/navigation/components/TopNavBar.tsx
- [ ] T011 [US1] Define eventDesignerTabs configuration array (Welcome, Theme, Settings) in apps/clementine-app/src/domains/event/designer/containers/EventDesignerLayout.tsx
- [ ] T012 [US1] Pass tabs prop to TopNavBar in apps/clementine-app/src/domains/event/designer/containers/EventDesignerLayout.tsx
- [ ] T013 [US1] Remove EventDesignerSidebar import and usage from apps/clementine-app/src/domains/event/designer/containers/EventDesignerPage.tsx
- [ ] T014 [US1] Update EventDesignerPage layout to render only Outlet (no sidebar) in apps/clementine-app/src/domains/event/designer/containers/EventDesignerPage.tsx

**Checkpoint**: Horizontal tabs visible in event designer, navigation works between all three tabs. US1 and US2 complete.

---

## Phase 4: User Story 3 - Editor Controls on Left, Preview on Right (Priority: P2)

**Goal**: Swap layout in Welcome and Theme editor pages so controls are on left, preview on right. Includes component renames for consistency.

**Independent Test**: Navigate to Welcome or Theme editor, verify controls panel on left side, preview on right side

### Welcome Editor Changes

- [ ] T015 [P] [US3] Rename file from WelcomeControls.tsx to WelcomeConfigPanel.tsx in apps/clementine-app/src/domains/event/welcome/components/
- [ ] T016 [US3] Update component name from WelcomeControls to WelcomeConfigPanel in apps/clementine-app/src/domains/event/welcome/components/WelcomeConfigPanel.tsx
- [ ] T017 [US3] Update export in apps/clementine-app/src/domains/event/welcome/components/index.ts to export WelcomeConfigPanel
- [ ] T018 [US3] Update import in WelcomeEditorPage from WelcomeControls to WelcomeConfigPanel in apps/clementine-app/src/domains/event/welcome/containers/WelcomeEditorPage.tsx
- [ ] T019 [US3] Swap column order in WelcomeEditorPage: move controls aside to left, preview div to right in apps/clementine-app/src/domains/event/welcome/containers/WelcomeEditorPage.tsx
- [ ] T020 [US3] Change border-l to border-r on controls aside in apps/clementine-app/src/domains/event/welcome/containers/WelcomeEditorPage.tsx

### Theme Editor Changes

- [ ] T021 [P] [US3] Rename file from ThemeControls.tsx to ThemeConfigPanel.tsx in apps/clementine-app/src/domains/event/theme/components/
- [ ] T022 [US3] Update component name from ThemeControls to ThemeConfigPanel in apps/clementine-app/src/domains/event/theme/components/ThemeConfigPanel.tsx
- [ ] T023 [US3] Update export in apps/clementine-app/src/domains/event/theme/components/index.ts to export ThemeConfigPanel
- [ ] T024 [US3] Update import in ThemeEditorPage from ThemeControls to ThemeConfigPanel in apps/clementine-app/src/domains/event/theme/containers/ThemeEditorPage.tsx
- [ ] T025 [US3] Swap column order in ThemeEditorPage: move controls aside to left, preview div to right in apps/clementine-app/src/domains/event/theme/containers/ThemeEditorPage.tsx
- [ ] T026 [US3] Change border-l to border-r on controls aside in apps/clementine-app/src/domains/event/theme/containers/ThemeEditorPage.tsx

**Checkpoint**: Welcome and Theme editors show controls on left, preview on right. Components renamed for consistency. US3 complete.

---

## Phase 5: User Story 4 - Settings Page Centered Content (Priority: P2)

**Goal**: Center the settings page content for better readability

**Independent Test**: Navigate to Settings page, verify content is horizontally centered with max-width constraint

### Implementation for User Story 4

- [ ] T027 [US4] Wrap existing content in flex container with justify-center in apps/clementine-app/src/domains/event/settings/containers/EventSettingsPage.tsx
- [ ] T028 [US4] Add max-w-3xl constraint to content wrapper for readability in apps/clementine-app/src/domains/event/settings/containers/EventSettingsPage.tsx
- [ ] T029 [US4] Ensure padding and spacing are appropriate for centered layout in apps/clementine-app/src/domains/event/settings/containers/EventSettingsPage.tsx

**Checkpoint**: Settings page content centered with max-width. US4 complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and final verification

- [ ] T030 Run validation gates with pnpm app:check from apps/clementine-app/
- [ ] T031 Run type checking with pnpm app:type-check from apps/clementine-app/
- [ ] T032 [P] Review all changes against design-system.md (verify design tokens used)
- [ ] T033 [P] Test navigation flow: Welcome → Theme → Settings tabs
- [ ] T034 [P] Test active state highlighting on each tab
- [ ] T035 [P] Test editor layouts: verify controls-left/preview-right on Welcome and Theme
- [ ] T036 [P] Test Settings page centered layout
- [ ] T037 Evaluate if EventDesignerSidebar.tsx can be removed (now unused) from apps/clementine-app/src/domains/event/designer/components/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No setup needed - existing codebase
- **Foundational (Phase 2)**: Creates NavTabs - BLOCKS User Stories 1 & 2
- **User Stories 1 & 2 (Phase 3)**: Depends on Foundational (NavTabs component)
- **User Story 3 (Phase 4)**: Can start after Phase 2, independent of Phase 3
- **User Story 4 (Phase 5)**: Can start after Phase 2, independent of Phase 3 & 4
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 & 2 (P1)**: Depends on NavTabs component (Phase 2) - Combined because tightly coupled
- **User Story 3 (P2)**: Can start after Phase 2 - Independent of US1/US2
- **User Story 4 (P2)**: Can start after Phase 2 - Independent of all other stories

### Within Each Phase

- Foundational: Tasks T001-T004 sequential (building single file), T005-T006 parallel (different files)
- US1/US2: T007-T010 sequential (TopNavBar), T011-T014 sequential (EventDesigner)
- US3: Welcome tasks (T015-T020) and Theme tasks (T021-T026) can run in parallel
- US4: Tasks sequential (single file)

### Parallel Opportunities

- **Phase 2**: T005 and T006 can run in parallel (different index files)
- **Phase 4**: Welcome editor tasks and Theme editor tasks can run in parallel (different domains)
- **Phase 6**: All test/review tasks (T032-T036) can run in parallel

---

## Parallel Example: User Story 3

```bash
# Launch Welcome and Theme editor changes in parallel:
# Developer A - Welcome:
Task: "Rename WelcomeControls.tsx to WelcomeConfigPanel.tsx"
Task: "Update WelcomeEditorPage layout"

# Developer B - Theme:
Task: "Rename ThemeControls.tsx to ThemeConfigPanel.tsx"
Task: "Update ThemeEditorPage layout"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 2: Foundational (NavTabs component)
2. Complete Phase 3: User Stories 1 & 2 (Horizontal tabs in TopNavBar)
3. **STOP and VALIDATE**: Test tab navigation independently
4. Deploy/demo if ready - core navigation change complete

### Incremental Delivery

1. Complete Foundational → NavTabs ready
2. Add US1 & US2 → Test tab navigation → Deploy/Demo (MVP!)
3. Add US3 → Test editor layouts → Deploy/Demo
4. Add US4 → Test centered settings → Deploy/Demo
5. Each story adds value without breaking previous stories

### Single Developer Strategy

Execute phases sequentially in priority order:
1. Phase 2 (Foundational)
2. Phase 3 (US1 & US2 - MVP)
3. Phase 4 (US3)
4. Phase 5 (US4)
5. Phase 6 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 combined because NavTabs creation enables both simultaneously
- File renames (T015, T021) should use git mv to preserve history
- Commit after each phase completion
- Stop at any checkpoint to validate story independently
