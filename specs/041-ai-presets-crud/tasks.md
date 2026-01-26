# Tasks: AI Presets Foundation and List Page

**Input**: Design documents from `/specs/041-ai-presets-crud/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested - test tasks omitted per specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Shared schemas**: `packages/shared/src/schemas/ai-preset/`
- **App domain**: `apps/clementine-app/src/domains/ai-presets/`
- **Routes**: `apps/clementine-app/src/app/routes/workspace/$workspaceSlug.ai-presets/`
- **Firebase rules**: `firebase/firestore.rules`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and schema creation in shared package

- [ ] T001 [P] Create preset media entry schema in `packages/shared/src/schemas/ai-preset/preset-media.schema.ts`
- [ ] T002 [P] Create preset variable schemas (text, image, discriminated union) in `packages/shared/src/schemas/ai-preset/preset-variable.schema.ts`
- [ ] T003 Create main AI Preset entity schema in `packages/shared/src/schemas/ai-preset/ai-preset.schema.ts` (depends on T001, T002)
- [ ] T004 Create barrel export in `packages/shared/src/schemas/ai-preset/index.ts`
- [ ] T005 Add ai-preset export to `packages/shared/src/schemas/index.ts`
- [ ] T006 Build shared package with `pnpm --filter @clementine/shared build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain structure, security rules, and data layer that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create domain directory structure at `apps/clementine-app/src/domains/ai-presets/` with subdirectories: components/, containers/, hooks/, schemas/
- [ ] T008 Create input schemas for mutations in `apps/clementine-app/src/domains/ai-presets/schemas/ai-preset.input.schemas.ts`
- [ ] T009 Add Firestore security rules for aiPresets collection in `firebase/firestore.rules` (workspace member read, admin write)
- [ ] T010 Create useWorkspaceAIPresets hook (real-time list query) in `apps/clementine-app/src/domains/ai-presets/hooks/useWorkspaceAIPresets.ts`
- [ ] T011 Create domain barrel export in `apps/clementine-app/src/domains/ai-presets/index.ts`

**Checkpoint**: Foundation ready - Schemas validated, security rules in place, list query hook available

---

## Phase 3: User Story 1 - View AI Presets List (Priority: P1) 🎯 MVP

**Goal**: Users can navigate to AI Presets page and see a list of all presets with loading/empty states

**Independent Test**: Navigate to `/workspace/:workspaceSlug/ai-presets`, verify list displays preset cards with name, description, model, aspect ratio, variable count, media count, and last updated

### Implementation for User Story 1

- [ ] T012 [US1] Add AI Presets navigation item to `apps/clementine-app/src/domains/navigation/components/workspace/workspaceNavItems.ts` with Wand2 icon
- [ ] T013 [US1] Create list route file at `apps/clementine-app/src/app/routes/workspace/$workspaceSlug.ai-presets/index.tsx`
- [ ] T014 [P] [US1] Create AIPresetItem component in `apps/clementine-app/src/domains/ai-presets/components/AIPresetItem.tsx` (card display, click to navigate)
- [ ] T015 [P] [US1] Create AIPresetsList component in `apps/clementine-app/src/domains/ai-presets/components/AIPresetsList.tsx` (loading/empty/list states)
- [ ] T016 [US1] Create AIPresetsPage container in `apps/clementine-app/src/domains/ai-presets/containers/AIPresetsPage.tsx` (integrates list with header)
- [ ] T017 [US1] Update domain barrel export with new components in `apps/clementine-app/src/domains/ai-presets/index.ts`

**Checkpoint**: User Story 1 complete - Users can navigate via sidebar, see loading state, empty state, or list of presets

---

## Phase 4: User Story 2 - Create New AI Preset (Priority: P1)

**Goal**: Workspace admins can create new presets with default values

**Independent Test**: As admin, click "Create Preset" button, verify new preset appears in list and navigates to editor placeholder

### Implementation for User Story 2

- [ ] T018 [US2] Create useCreateAIPreset mutation hook in `apps/clementine-app/src/domains/ai-presets/hooks/useCreateAIPreset.ts`
- [ ] T019 [US2] Create CreateAIPresetButton component in `apps/clementine-app/src/domains/ai-presets/components/CreateAIPresetButton.tsx` (admin-only visibility)
- [ ] T020 [US2] Integrate CreateAIPresetButton into AIPresetsPage header in `apps/clementine-app/src/domains/ai-presets/containers/AIPresetsPage.tsx`
- [ ] T021 [US2] Update domain barrel export in `apps/clementine-app/src/domains/ai-presets/index.ts`

**Checkpoint**: User Story 2 complete - Admins can create presets, non-admins don't see create button

---

## Phase 5: User Story 3 - Navigate to Preset Editor (Priority: P1)

**Goal**: Users can click a preset card to navigate to the preset editor page (placeholder)

**Independent Test**: Click a preset card, verify navigation to `/workspace/:workspaceSlug/ai-presets/:presetId`

### Implementation for User Story 3

- [ ] T022 [US3] Create editor placeholder route at `apps/clementine-app/src/app/routes/workspace/$workspaceSlug.ai-presets/$presetId.tsx`
- [ ] T023 [US3] Add click handler to AIPresetItem for navigation in `apps/clementine-app/src/domains/ai-presets/components/AIPresetItem.tsx`

**Checkpoint**: User Story 3 complete - Clicking preset navigates to editor placeholder page

---

## Phase 6: User Story 4 - Duplicate AI Preset (Priority: P2)

**Goal**: Workspace admins can duplicate presets to create variations

**Independent Test**: As admin, select "Duplicate" from preset actions, verify new preset "Copy of [name]" appears in list

### Implementation for User Story 4

- [ ] T024 [US4] Create useDuplicateAIPreset mutation hook in `apps/clementine-app/src/domains/ai-presets/hooks/useDuplicateAIPreset.ts`
- [ ] T025 [US4] Add Duplicate action to AIPresetItem context menu in `apps/clementine-app/src/domains/ai-presets/components/AIPresetItem.tsx`
- [ ] T026 [US4] Update domain barrel export in `apps/clementine-app/src/domains/ai-presets/index.ts`

**Checkpoint**: User Story 4 complete - Admins can duplicate presets

---

## Phase 7: User Story 5 - Rename AI Preset (Priority: P2)

**Goal**: Workspace admins can rename presets via dialog

**Independent Test**: As admin, select "Rename" from preset actions, enter new name, verify name updates in list

### Implementation for User Story 5

- [ ] T027 [US5] Create useRenameAIPreset mutation hook in `apps/clementine-app/src/domains/ai-presets/hooks/useRenameAIPreset.ts`
- [ ] T028 [US5] Create RenameAIPresetDialog component in `apps/clementine-app/src/domains/ai-presets/components/RenameAIPresetDialog.tsx`
- [ ] T029 [US5] Add Rename action to AIPresetItem context menu, integrate dialog in `apps/clementine-app/src/domains/ai-presets/components/AIPresetItem.tsx`
- [ ] T030 [US5] Update domain barrel export in `apps/clementine-app/src/domains/ai-presets/index.ts`

**Checkpoint**: User Story 5 complete - Admins can rename presets via dialog

---

## Phase 8: User Story 6 - Delete AI Preset (Priority: P2)

**Goal**: Workspace admins can delete presets with confirmation

**Independent Test**: As admin, select "Delete" from preset actions, confirm in dialog, verify preset removed from list

### Implementation for User Story 6

- [ ] T031 [US6] Create useDeleteAIPreset mutation hook in `apps/clementine-app/src/domains/ai-presets/hooks/useDeleteAIPreset.ts`
- [ ] T032 [US6] Create DeleteAIPresetDialog component in `apps/clementine-app/src/domains/ai-presets/components/DeleteAIPresetDialog.tsx`
- [ ] T033 [US6] Add Delete action to AIPresetItem context menu, integrate dialog in `apps/clementine-app/src/domains/ai-presets/components/AIPresetItem.tsx`
- [ ] T034 [US6] Update domain barrel export in `apps/clementine-app/src/domains/ai-presets/index.ts`

**Checkpoint**: User Story 6 complete - Admins can delete presets with confirmation

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T035 Run validation gates: `pnpm app:check` and `pnpm app:type-check`
- [ ] T036 Verify all CRUD operations work end-to-end per quickstart.md checklist
- [ ] T037 [P] Verify mobile responsiveness (44x44px touch targets, mobile-first layout)
- [ ] T038 [P] Verify admin/member permission enforcement across all actions
- [ ] T039 Deploy Firestore security rules with `pnpm fb:deploy:rules`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1, US2, US3 are all P1 priority and can proceed sequentially
  - US4, US5, US6 are P2 priority and depend on US1 being complete (need list page)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Parallel With |
|-------|----------|------------|-------------------|
| US1 - View List | P1 | Foundational | None (start first) |
| US2 - Create | P1 | US1 (needs list page) | US3 |
| US3 - Navigate | P1 | US1 (needs list item) | US2 |
| US4 - Duplicate | P2 | US1 (needs context menu) | US5, US6 |
| US5 - Rename | P2 | US1 (needs context menu) | US4, US6 |
| US6 - Delete | P2 | US1 (needs context menu) | US4, US5 |

### Within Each User Story

- Hooks before components
- Components before containers
- Container before route integration
- Export updates after all files created

### Parallel Opportunities

- **Phase 1**: T001, T002 can run in parallel (independent schema files)
- **Phase 3 (US1)**: T014, T015 can run in parallel (independent components)
- **Phase 4-8 (US2-6)**: Once US1 is complete, US4/US5/US6 can run in parallel (each adds independent action)
- **Phase 9**: T037, T038 can run in parallel (independent verification)

---

## Parallel Example: Phase 1 (Setup)

```bash
# Launch schema creation in parallel:
Task: "Create preset media entry schema in packages/shared/src/schemas/ai-preset/preset-media.schema.ts"
Task: "Create preset variable schemas in packages/shared/src/schemas/ai-preset/preset-variable.schema.ts"

# Then sequentially:
Task: "Create main AI Preset entity schema" (depends on above)
Task: "Create barrel export"
Task: "Build shared package"
```

## Parallel Example: P2 User Stories (US4, US5, US6)

```bash
# After US1 complete, launch all P2 stories in parallel:
Task: "Create useDuplicateAIPreset hook" [US4]
Task: "Create useRenameAIPreset hook" [US5]
Task: "Create useDeleteAIPreset hook" [US6]

# Each story's subsequent tasks are internal to that story
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup (shared schemas)
2. Complete Phase 2: Foundational (domain structure, security rules, list hook)
3. Complete Phase 3: User Story 1 (view list)
4. Complete Phase 4: User Story 2 (create)
5. Complete Phase 5: User Story 3 (navigate)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo if ready - this is a functional MVP!

### Incremental Delivery

1. Setup + Foundational → Schemas and security ready
2. Add US1 → Users can view presets list → Deploy (visibility MVP!)
3. Add US2 + US3 → Users can create and navigate → Deploy (creation MVP!)
4. Add US4, US5, US6 → Full CRUD capability → Deploy (complete feature!)

### Single Developer Strategy

1. Complete Setup + Foundational sequentially
2. Complete US1 → US2 → US3 (P1 stories in order)
3. Complete US4 → US5 → US6 (P2 stories in order)
4. Polish phase
5. Each checkpoint = deployable increment

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Reference implementations: ProjectEventsList.tsx, ProjectEventItem.tsx patterns
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `pnpm app:check` frequently to catch issues early
