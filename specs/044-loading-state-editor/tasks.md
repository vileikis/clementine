# Tasks: Loading State Editor for Share Screen

**Input**: Design documents from `/specs/044-loading-state-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No explicit test requirements in specification. Testing will be manual via acceptance scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `apps/clementine-app/`, `packages/shared/`
- App source: `apps/clementine-app/src/`
- Shared schemas: `packages/shared/src/`

---

## Phase 1: Setup (Schema & Data Layer)

**Purpose**: Add schema definitions and data persistence infrastructure that all user stories depend on

- [X] T001 [P] Add ShareLoadingConfig schema in packages/shared/src/schemas/project/project-config.schema.ts
- [X] T002 [P] Rename shareConfigSchema to shareReadyConfigSchema (keep deprecated alias) in packages/shared/src/schemas/project/project-config.schema.ts
- [X] T003 Update projectConfigSchema with shareReady and shareLoading fields in packages/shared/src/schemas/project/project-config.schema.ts
- [X] T004 Export ShareLoadingConfig and ShareReadyConfig types in packages/shared/src/index.ts
- [X] T005 Build shared package after schema changes: `pnpm --filter @clementine/shared build`
- [X] T006 [P] Add DEFAULT_SHARE_LOADING constant in apps/clementine-app/src/domains/project-config/share/constants/defaults.ts
- [X] T007 [P] Rename DEFAULT_SHARE to DEFAULT_SHARE_READY (keep deprecated alias) in apps/clementine-app/src/domains/project-config/share/constants/defaults.ts
- [X] T008 Create useUpdateShareLoading hook in apps/clementine-app/src/domains/project-config/share/hooks/useUpdateShareLoading.ts
- [X] T009 Rename useUpdateShare.ts to useUpdateShareReady.ts (keep deprecated export) in apps/clementine-app/src/domains/project-config/share/hooks/
- [X] T010 Update barrel export to export new hooks in apps/clementine-app/src/domains/project-config/share/hooks/index.ts

**Checkpoint**: Schema and data layer complete. Shared package built. All subsequent tasks can now import new types.

---

## Phase 2: Foundational (Shared UI Infrastructure)

**Purpose**: Core UI components that enable both configuration and preview user stories

**⚠️ CRITICAL**: User story implementation depends on these foundational components

- [X] T011 Add headerSlot prop to PreviewShell component in apps/clementine-app/src/shared/preview-shell/containers/PreviewShell.tsx
- [X] T012 Render headerSlot in PreviewShell header before viewport switcher in apps/clementine-app/src/shared/preview-shell/containers/PreviewShell.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Configure Loading State Content (Priority: P1) 🎯 MVP

**Goal**: Enable admins to customize loading screen title and description with auto-save persistence

**Independent Test**: Navigate to share screen editor, click "Loading" tab, enter custom loading title "Hang tight!", wait 2 seconds for auto-save, reload page, verify title persists

### Implementation for User Story 1

- [X] T013 [US1] Create ShareLoadingConfigPanel component in apps/clementine-app/src/domains/project-config/share/components/ShareLoadingConfigPanel.tsx
- [X] T014 [US1] Add title field (Textarea, 2 rows) to ShareLoadingConfigPanel
- [X] T015 [US1] Add description field (Textarea, 4 rows) to ShareLoadingConfigPanel
- [X] T016 [US1] Add help text for each field in ShareLoadingConfigPanel
- [X] T017 [US1] Update ShareEditorPage to add previewState state variable in apps/clementine-app/src/domains/project-config/share/containers/ShareEditorPage.tsx
- [X] T018 [US1] Create shareLoadingForm with React Hook Form in ShareEditorPage
- [X] T019 [US1] Add useUpdateShareLoading mutation in ShareEditorPage
- [X] T020 [US1] Add useAutoSave hook for loading form (2000ms debounce, fields: title, description) in ShareEditorPage
- [X] T021 [US1] Add handleShareLoadingUpdate function in ShareEditorPage
- [X] T022 [US1] Add conditional rendering to show ShareLoadingConfigPanel when previewState is 'loading' in ShareEditorPage
- [X] T023 [US1] Update config panel header to show current state ("Share Screen · Loading") in ShareEditorPage

**Checkpoint**: User Story 1 complete - admins can configure loading state content and it persists via auto-save

---

## Phase 4: User Story 2 - Preview Loading State Appearance (Priority: P1) 🎯 MVP

**Goal**: Enable admins to preview how the loading screen will look to guests with real-time updates

**Independent Test**: Click "Loading" tab in preview panel, verify skeleton loader appears with configured title/description, type in loading title field, verify preview updates in real-time

### Implementation for User Story 2

- [X] T024 [P] [US2] Create ShareLoadingPreview component in apps/clementine-app/src/domains/project-config/share/components/ShareLoadingPreview.tsx
- [X] T025 [P] [US2] Rename SharePreview.tsx to ShareReadyPreview.tsx in apps/clementine-app/src/domains/project-config/share/components/
- [X] T026 [US2] Add Skeleton component for image placeholder in ShareLoadingPreview
- [X] T027 [US2] Add loading title rendering (with default fallback) in ShareLoadingPreview
- [X] T028 [US2] Add loading description rendering (with default fallback) in ShareLoadingPreview
- [X] T029 [US2] Update ShareReadyPreview props to use shareReady (renamed from share)
- [X] T030 [US2] Add useWatch for shareLoadingForm to watch real-time changes in ShareEditorPage
- [X] T031 [US2] Add conditional preview rendering (ShareLoadingPreview vs ShareReadyPreview) based on previewState in ShareEditorPage
- [X] T032 [US2] Pass shareLoading, shareReady, and shareOptions to respective preview components in ShareEditorPage

**Checkpoint**: User Story 2 complete - admins can preview loading state with real-time updates as they type

---

## Phase 5: User Story 3 - Switch Between Ready and Loading Configuration (Priority: P2)

**Goal**: Enable admins to easily switch between configuring ready state and loading state via tabs

**Independent Test**: Click "Ready" tab, verify preview shows ready state and config panel shows ready fields, click "Loading" tab, verify both preview and config panel switch to loading state

### Implementation for User Story 3

- [X] T033 [US3] Rename ShareConfigPanel.tsx to ShareReadyConfigPanel.tsx in apps/clementine-app/src/domains/project-config/share/components/
- [X] T034 [US3] Update ShareReadyConfigPanel component name and props to use ShareReadyConfig type
- [X] T035 [US3] Rename shareReadyForm (if not already done) and update all references in ShareEditorPage
- [X] T036 [US3] Add Tabs component from shadcn/ui to ShareEditorPage imports
- [X] T037 [US3] Create state tabs UI (TabsList with "Ready" and "Loading" TabsTriggers) in ShareEditorPage
- [X] T038 [US3] Connect tabs to previewState state variable (value and onValueChange) in ShareEditorPage
- [X] T039 [US3] Pass state tabs to PreviewShell via headerSlot prop in ShareEditorPage
- [X] T040 [US3] Verify tab switching updates both preview and config panel synchronously

**Checkpoint**: All user stories complete - admins can configure, preview, and switch between both states seamlessly

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, validation, and documentation

- [X] T041 [P] Update barrel export to include ShareLoadingConfigPanel and ShareLoadingPreview in apps/clementine-app/src/domains/project-config/share/index.ts
- [X] T042 [P] Add JSDoc comments to new components and hooks
- [X] T043 Run validation gates: `pnpm app:check` (format + lint + type-check)
- [ ] T044 Manual standards review: design-system.md (no hard-coded colors, theme tokens)
- [ ] T045 Manual standards review: component-libraries.md (using shadcn/ui Tabs, Skeleton)
- [ ] T046 Manual standards review: project-structure.md (domain organization, file naming)
- [ ] T047 Manual acceptance test: Edit loading title → auto-saves after 2 seconds
- [ ] T048 Manual acceptance test: Edit loading description → auto-saves after 2 seconds
- [ ] T049 Manual acceptance test: Switch between Ready/Loading tabs → preview updates
- [ ] T050 Manual acceptance test: Reload page → loading config persists
- [ ] T051 Manual acceptance test: Clear loading fields → stores null, shows defaults
- [ ] T052 Manual acceptance test: Rapid tab switching → no errors, saves complete
- [ ] T053 Manual acceptance test: Viewport switcher works with loading state
- [ ] T054 Accessibility check: Tab keyboard navigation works
- [ ] T055 Accessibility check: Screen reader announces state changes
- [ ] T056 Remove any console.log statements and commented code
- [ ] T057 Verify Firestore security rules allow draftConfig.shareLoading writes
- [ ] T058 Git commit with descriptive message and co-author attribution

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational (Phase 2) completion
  - User Story 1 (P1): Can start after Foundational - implements configuration functionality
  - User Story 2 (P1): Can start after Foundational - implements preview functionality (can be parallel with US1 if different developers)
  - User Story 3 (P2): Depends on US1 and US2 completion (needs both panels and previews to switch between)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on Foundational (Phase 2) - No dependencies on other stories (can be parallel with US1)
- **User Story 3 (P2)**: Depends on User Story 1 AND User Story 2 completion (requires both components to exist for switching)

### Within Each User Story

**User Story 1**:
- Tasks T013-T016 (component creation) can be done in sequence
- Tasks T017-T023 (container integration) must be done sequentially

**User Story 2**:
- Tasks T024-T025 (preview components) marked [P] can be done in parallel
- Tasks T026-T028 (ShareLoadingPreview implementation) can be done sequentially
- Task T029 (ShareReadyPreview update) can be done in parallel with T026-T028
- Tasks T030-T032 (container integration) must be done sequentially after components

**User Story 3**:
- Tasks T033-T034 (rename component) must be done first
- Task T035 (update references) must be done sequentially
- Tasks T036-T040 (tabs implementation) must be done sequentially

### Parallel Opportunities

- **Phase 1**: Tasks T001-T002, T006-T007 marked [P] can run in parallel
- **Phase 2**: Tasks T011-T012 can run in parallel (same file, small changes)
- **US1 & US2**: If team has 2+ developers, User Story 1 and User Story 2 can be implemented in parallel after Foundational phase
- **US2**: Tasks T024-T025, T026-T028 and T029 can run in parallel (different files)
- **Phase 6**: Tasks T041-T042 marked [P] can run in parallel

---

## Parallel Example: User Stories 1 & 2

```bash
# With 2 developers, after Phase 2 completes:

Developer A: User Story 1 (Configure Loading State Content)
- Task: "Create ShareLoadingConfigPanel component"
- Task: "Update ShareEditorPage to add previewState state"
- Task: "Add shareLoadingForm with React Hook Form"
- Task: "Add useAutoSave hook for loading form"

Developer B: User Story 2 (Preview Loading State Appearance)
- Task: "Create ShareLoadingPreview component"
- Task: "Rename SharePreview to ShareReadyPreview"
- Task: "Add Skeleton component for image placeholder"
- Task: "Add loading title and description rendering"

# Once both complete, Developer A or B can do User Story 3 (tabs)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (schema & data layer)
2. Complete Phase 2: Foundational (PreviewShell updates)
3. Complete Phase 3: User Story 1 (configuration functionality)
4. Complete Phase 4: User Story 2 (preview functionality)
5. **STOP and VALIDATE**: Test loading state configuration and preview independently
6. Deploy/demo if ready (admins can configure and preview, but switching between states is manual)

### Full Feature (All User Stories)

1. Complete MVP (Phases 1-4)
2. Complete Phase 5: User Story 3 (tab switching)
3. Complete Phase 6: Polish & validation
4. **FINAL VALIDATION**: Run all acceptance tests
5. Deploy to production

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (admins can configure loading state)
3. Add User Story 2 → Test independently → Deploy (admins can configure AND preview loading state)
4. Add User Story 3 → Test independently → Deploy (admins get seamless tab switching UX)
5. Each story adds value without breaking previous functionality

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup (Phase 1) together
2. Both complete Foundational (Phase 2) together
3. Once Foundational done:
   - Developer A: User Story 1 (T013-T023)
   - Developer B: User Story 2 (T024-T032)
4. Once both US1 and US2 complete:
   - Either developer: User Story 3 (T033-T040)
5. Both: Polish & validation (Phase 6)

---

## File Modification Summary

| File | Action | User Story | Lines Changed (Est.) |
|------|--------|-----------|----------------------|
| `packages/shared/src/schemas/project/project-config.schema.ts` | Update | Setup | +15 |
| `packages/shared/src/index.ts` | Update | Setup | +2 |
| `apps/.../share/constants/defaults.ts` | Update | Setup | +5 |
| `apps/.../share/hooks/useUpdateShareLoading.ts` | Create | Setup | +25 |
| `apps/.../share/hooks/useUpdateShareReady.ts` | Rename | Setup | +5 |
| `apps/.../share/index.ts` | Update | Setup, Polish | +5 |
| `apps/.../shared/preview-shell/containers/PreviewShell.tsx` | Update | Foundational | +5 |
| `apps/.../share/components/ShareLoadingConfigPanel.tsx` | Create | US1 | +50 |
| `apps/.../share/components/ShareLoadingPreview.tsx` | Create | US2 | +35 |
| `apps/.../share/components/ShareReadyPreview.tsx` | Rename | US2, US3 | +10 |
| `apps/.../share/components/ShareReadyConfigPanel.tsx` | Rename | US3 | +10 |
| `apps/.../share/containers/ShareEditorPage.tsx` | Update | US1, US2, US3 | +100 |

**Total Estimated LOC**: ~267 lines (new code + modifications)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- User Story 1 + 2 together form a complete MVP (configure + preview)
- User Story 3 adds workflow polish (easy switching via tabs)
- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- No explicit test tasks (manual testing via acceptance scenarios)
- Validation gates (format, lint, type-check) run in Polish phase before commit

---

## Summary

**Total Tasks**: 58
- Setup (Phase 1): 10 tasks
- Foundational (Phase 2): 2 tasks
- User Story 1 (Phase 3): 11 tasks
- User Story 2 (Phase 4): 9 tasks
- User Story 3 (Phase 5): 8 tasks
- Polish (Phase 6): 18 tasks

**Parallel Opportunities**: 8 tasks marked [P] can run in parallel within their phases

**Independent Test Criteria**:
- US1: Configure loading title → auto-saves → persists on reload
- US2: Switch to "Loading" tab → skeleton + title/description appear → typing updates preview in real-time
- US3: Click "Ready"/"Loading" tabs → both preview and config panel switch states synchronously

**Suggested MVP Scope**: User Stories 1 & 2 (configure + preview loading state)

**Format Validation**: ✅ All 58 tasks follow required checklist format with checkboxes, IDs, labels, and file paths
