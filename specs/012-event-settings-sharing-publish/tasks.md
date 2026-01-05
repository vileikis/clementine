# Tasks: Event Settings - Sharing Configuration & Draft/Publish

**Input**: Design documents from `/specs/012-event-settings-sharing-publish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not included - feature spec does not require tests for this iteration (manual testing sufficient)

**Organization**: Tasks organized by implementation phase following the spec's architecture-first approach

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **TanStack Start App**: `apps/clementine-app/src/`
- **Event Domain**: `apps/clementine-app/src/domains/event/`
- **Route Files**: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Validate prerequisites and prepare development environment

- [X] T001 Verify feature branch 012-event-settings-sharing-publish exists and is checked out
- [X] T002 Verify existing event domain structure matches plan.md expectations
- [X] T003 Verify existing schemas (projectEventConfigSchema, sharingConfigSchema) are complete
- [X] T004 Verify existing hooks (useProjectEvent, useAutoSave) are available

---

## Phase 2: Foundational (Core Mutation Infrastructure)

**Purpose**: Shared transaction helper and mutation hooks that ALL UI components will depend on

**⚠️ CRITICAL**: No UI work can begin until this phase is complete

- [X] T005 Create shared transaction helper in apps/clementine-app/src/domains/event/shared/lib/updateEventConfigField.ts
- [X] T006 [P] Create useUpdateShareOptions mutation hook in apps/clementine-app/src/domains/event/settings/hooks/useUpdateShareOptions.ts
- [X] T007 [P] Create usePublishEvent mutation hook in apps/clementine-app/src/domains/event/designer/hooks/usePublishEvent.ts
- [X] T008 Update event/shared barrel export to include updateEventConfigField in apps/clementine-app/src/domains/event/shared/index.ts
- [X] T009 [P] Update designer barrel export to include usePublishEvent in apps/clementine-app/src/domains/event/designer/index.ts
- [X] T010 [P] Update settings barrel export to include useUpdateShareOptions in apps/clementine-app/src/domains/event/settings/index.ts

**Checkpoint**: Foundation ready - UI implementation can now begin in parallel

---

## Phase 3: User Story 1 - Architecture Refactor (Priority: P1) 🎯 MVP Foundation

**Goal**: Move UI ownership from route file to event domain, enabling domain-owned publish workflow

**Independent Test**: Navigate to event designer, verify top bar shows breadcrumbs, badge (if unpublished changes), and publish button

### Implementation for User Story 1

- [X] T011 [P] [US1] Create EventDesignerTopBar component in apps/clementine-app/src/domains/event/designer/components/EventDesignerTopBar.tsx
- [X] T012 [US1] Create EventDesignerLayout container in apps/clementine-app/src/domains/event/designer/containers/EventDesignerLayout.tsx (depends on T011)
- [X] T013 [US1] Update designer barrel export to include EventDesignerTopBar and EventDesignerLayout in apps/clementine-app/src/domains/event/designer/index.ts
- [X] T014 [US1] Refactor route file to use EventDesignerLayout in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx

**Checkpoint**: Event designer now has domain-owned layout with publish button (disabled until sharing UI implemented)

---

## Phase 4: User Story 2 - Sharing Settings UI (Priority: P2)

**Goal**: Enable event creators to configure sharing options with auto-save

**Independent Test**: Navigate to Settings tab, toggle sharing cards, blur form, verify auto-save updates draftConfig in Firestore

### Implementation for User Story 2

- [X] T015 [P] [US2] Create SharingOptionCard component in apps/clementine-app/src/domains/event/settings/components/SharingOptionCard.tsx
- [X] T016 [P] [US2] Create SharingSection component in apps/clementine-app/src/domains/event/settings/components/SharingSection.tsx
- [X] T017 [US2] Create SettingsSharingPage container in apps/clementine-app/src/domains/event/settings/containers/SettingsSharingPage.tsx (depends on T016)
- [X] T018 [US2] Update settings barrel export to include SharingSection and SettingsSharingPage in apps/clementine-app/src/domains/event/settings/index.ts
- [X] T019 [US2] Update settings route to use SettingsSharingPage in apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.settings.tsx

**Checkpoint**: Settings tab renders, sharing cards toggle correctly, auto-save works, draftVersion increments

---

## Phase 5: User Story 3 - Draft/Publish Workflow (Priority: P3)

**Goal**: Show "New changes" badge when draft differs from published, enable publish button to copy draft → published

**Independent Test**: Toggle sharing option, verify badge appears, click Publish, verify badge disappears and publishedConfig matches draftConfig

### Implementation for User Story 3

- [X] T020 [US3] Verify EventDesignerLayout hasUnpublishedChanges logic detects never-published state (publishedVersion === null)
- [X] T021 [US3] Verify EventDesignerLayout hasUnpublishedChanges logic detects new changes (draftVersion > publishedVersion)
- [X] T022 [US3] Verify EventDesignerTopBar shows "New changes" badge when hasUnpublishedChanges is true
- [X] T023 [US3] Verify EventDesignerTopBar hides badge when hasUnpublishedChanges is false
- [X] T024 [US3] Verify publish button calls usePublishEvent mutation and shows loading state
- [X] T025 [US3] Verify publish success shows toast notification "Event published successfully"
- [X] T026 [US3] Verify publish failure shows error toast with error message

**Checkpoint**: Complete draft/publish workflow functional - edit → auto-save → publish → sync

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, accessibility, mobile testing, code quality

- [ ] T027 [P] Manual test: Complete flow (edit → auto-save → publish) on desktop
- [ ] T028 [P] Manual test: Complete flow (edit → auto-save → publish) on mobile (320px viewport)
- [ ] T029 [P] Accessibility test: Keyboard navigation (Tab, Enter, Space) works for all interactive elements
- [ ] T030 [P] Accessibility test: All buttons have >= 44x44px touch targets
- [ ] T031 [P] Accessibility test: Cards have correct aria-pressed state when toggled
- [ ] T032 Manual test: Auto-save debouncing (toggle multiple cards quickly, verify only 1 Firestore write after 300ms)
- [ ] T033 Manual test: Deep merge preserves existing social flags (toggle Instagram, verify Facebook flag unchanged)
- [ ] T034 Manual test: Lazy initialization creates draftConfig on first edit (start with null draftConfig)
- [ ] T035 Manual test: Edge case - publish button disabled when no draftConfig exists
- [ ] T036 Manual test: Edge case - publish button disabled when draftVersion === publishedVersion
- [ ] T037 [P] Code quality: Run pnpm check (format + lint) in apps/clementine-app/
- [ ] T038 [P] Code quality: Run pnpm type-check in apps/clementine-app/
- [ ] T039 [P] Standards compliance: Verify using theme tokens (no hard-coded colors) in all new components
- [ ] T040 [P] Standards compliance: Verify paired background/foreground colors (bg-blue-50 + text-blue-600)
- [ ] T041 [P] Standards compliance: Verify all components follow shadcn/ui patterns (Button, cn() utility)
- [ ] T042 [P] Standards compliance: Verify domain structure follows DDD (event domain owns UI)
- [ ] T043 [P] Standards compliance: Verify barrel exports correct (only public API exported)
- [ ] T044 Verify Firestore security rules allow draftConfig and publishedConfig updates (if not already present)
- [ ] T045 Run quickstart.md validation - execute all manual test scenarios from quickstart guide

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - Architecture refactor
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) and User Story 1 (Phase 3) - Sharing UI needs layout
- **User Story 3 (Phase 5)**: Depends on User Story 1 and 2 - Draft/publish needs both layout and sharing UI
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (Architecture Refactor)**: Foundation for publish workflow - MUST complete first
- **User Story 2 (Sharing Settings UI)**: Depends on US1 (needs EventDesignerLayout for context)
- **User Story 3 (Draft/Publish Workflow)**: Depends on US1 and US2 (needs layout + sharing UI to test publish)

### Within Each User Story

**User Story 1**:
- T011 (EventDesignerTopBar) can run in parallel with nothing
- T012 (EventDesignerLayout) depends on T011 (imports EventDesignerTopBar)
- T013 (barrel export) depends on T011 and T012
- T014 (route refactor) depends on T013

**User Story 2**:
- T015 (SharingOptionCard) and T016 (SharingSection) can run in parallel
- T017 (SettingsSharingPage) depends on T016 (imports SharingSection)
- T018 (barrel export) depends on T015, T016, T017
- T019 (route update) depends on T018

**User Story 3**:
- All tasks are verification tasks (no new code)
- Can run sequentially for systematic testing

### Parallel Opportunities

- **Phase 2**: T006 (useUpdateShareOptions) and T007 (usePublishEvent) can run in parallel
- **Phase 2**: T009 (designer export) and T010 (settings export) can run in parallel
- **Phase 4**: T015 (SharingOptionCard) and T016 (SharingSection) can run in parallel
- **Phase 6**: All code quality tasks (T037-T043) can run in parallel
- **Phase 6**: All manual tests (T027-T036) can run in parallel if multiple testers

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch both mutation hooks together (different files, no dependencies):
Task: "Create useUpdateShareOptions mutation hook in apps/clementine-app/src/domains/event/settings/hooks/useUpdateShareOptions.ts"
Task: "Create usePublishEvent mutation hook in apps/clementine-app/src/domains/event/designer/hooks/usePublishEvent.ts"

# After both hooks complete, update barrel exports together:
Task: "Update designer barrel export in apps/clementine-app/src/domains/event/designer/index.ts"
Task: "Update settings barrel export in apps/clementine-app/src/domains/event/settings/index.ts"
```

---

## Parallel Example: Phase 4 (Sharing Settings UI)

```bash
# Launch card and section components together (different files):
Task: "Create SharingOptionCard component in apps/clementine-app/src/domains/event/settings/components/SharingOptionCard.tsx"
Task: "Create SharingSection component in apps/clementine-app/src/domains/event/settings/components/SharingSection.tsx"

# After both complete, create container that uses them:
Task: "Create SettingsSharingPage container in apps/clementine-app/src/domains/event/settings/containers/SettingsSharingPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3, Skip Polish Initially)

1. Complete Phase 1: Setup (validate prerequisites)
2. Complete Phase 2: Foundational (mutation hooks CRITICAL - blocks all UI)
3. Complete Phase 3: User Story 1 (architecture refactor)
4. **STOP and VALIDATE**: Verify layout renders, publish button exists (disabled)
5. Complete Phase 4: User Story 2 (sharing settings UI)
6. **STOP and VALIDATE**: Toggle sharing cards, verify auto-save works
7. Complete Phase 5: User Story 3 (draft/publish workflow)
8. **STOP and VALIDATE**: Full flow (edit → auto-save → publish) works
9. **DEPLOY**: Feature ready for production (skip Phase 6 if time-constrained)
10. Complete Phase 6: Polish (after deployment, as time permits)

### Incremental Delivery

1. **Setup + Foundational** → Mutation hooks ready
2. **+ User Story 1** → Domain-owned layout with publish button (foundation)
3. **+ User Story 2** → Sharing UI works, auto-save functional (usable feature!)
4. **+ User Story 3** → Complete draft/publish workflow (full feature!)
5. **+ Polish** → Production-ready quality

Each increment adds value and is independently testable.

### Parallel Team Strategy

With 2-3 developers:

1. **Team completes Setup + Foundational together** (critical path)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (architecture refactor) - T011-T014
   - **Developer B**: Waits for US1, then User Story 2 (sharing UI) - T015-T019
   - **Developer C**: Waits for US1+US2, then User Story 3 (draft/publish) - T020-T026
3. **Team completes Polish together** (Phase 6)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story builds on previous (sequential dependencies)
- Mutation hooks (Phase 2) are critical path - blocks all UI work
- All verification tasks (T020-T026) validate existing code, not new implementations
- Stop at any checkpoint to validate story independently
- Firestore security rules check (T044) may require coordination with backend team
- Design system compliance (T039-T043) should be checked continuously, not just at end

---

## Task Count Summary

- **Total Tasks**: 45
- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 6 tasks (critical path)
- **Phase 3 (User Story 1)**: 4 tasks
- **Phase 4 (User Story 2)**: 5 tasks
- **Phase 5 (User Story 3)**: 7 tasks (verification only)
- **Phase 6 (Polish)**: 19 tasks

**Parallel Opportunities Identified**: 15 tasks can run in parallel (marked with [P])

**MVP Scope**: Phases 1-5 (User Stories 1-3) = 26 tasks
**Production Ready**: All phases (1-6) = 45 tasks

---

## Independent Test Criteria

### User Story 1 (Architecture Refactor)
✅ Navigate to `/workspace/:slug/projects/:pid/events/:eid`
✅ Top bar shows breadcrumbs: "Project Name / Event Name"
✅ Top bar shows "New changes" badge if draftVersion > publishedVersion
✅ Top bar shows disabled Publish button (until sharing UI exists)
✅ Layout renders EventDesignerPage (tabs navigation)

### User Story 2 (Sharing Settings UI)
✅ Navigate to Settings tab
✅ Page shows "Settings" header and "Sharing Options" section
✅ 9 sharing option cards render (Download, Copy Link, Email, Instagram, Facebook, LinkedIn, Twitter, TikTok, Telegram)
✅ Clicking card toggles background color (muted ↔ blue)
✅ Blur form → wait 300ms → draftConfig updated in Firestore
✅ draftVersion increments after auto-save

### User Story 3 (Draft/Publish Workflow)
✅ Edit sharing option → Badge appears ("New changes")
✅ Badge shows yellow circle + "New changes" text
✅ Publish button enables when hasUnpublishedChanges is true
✅ Click Publish → Loading spinner shows
✅ Publish success → Toast "Event published successfully"
✅ After publish → Badge disappears, button disables
✅ publishedConfig === draftConfig in Firestore
✅ publishedVersion === draftVersion in Firestore
