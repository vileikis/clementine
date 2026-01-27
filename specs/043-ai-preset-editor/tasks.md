# Tasks: AI Preset Editor - Configuration

**Input**: Design documents from `/specs/043-ai-preset-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `apps/clementine-app/src/` for TanStack Start app
- **Editor domain**: `apps/clementine-app/src/domains/ai-presets/editor/`
- **Shared**: `apps/clementine-app/src/shared/`
- **Route**: `apps/clementine-app/src/app/workspace/$workspaceSlug.ai-presets/`

---

## Phase 1: Setup (Editor Subdomain Structure)

**Purpose**: Create the editor subdomain folder structure and barrel exports

- [x] T001 Create editor subdomain folder structure: `mkdir -p apps/clementine-app/src/domains/ai-presets/editor/{components,containers,hooks,stores,schemas}`
- [x] T002 [P] Create barrel export in `apps/clementine-app/src/domains/ai-presets/editor/components/index.ts`
- [x] T003 [P] Create barrel export in `apps/clementine-app/src/domains/ai-presets/editor/containers/index.ts`
- [x] T004 [P] Create barrel export in `apps/clementine-app/src/domains/ai-presets/editor/hooks/index.ts`
- [x] T005 [P] Create barrel export in `apps/clementine-app/src/domains/ai-presets/editor/stores/index.ts`
- [x] T006 [P] Create barrel export in `apps/clementine-app/src/domains/ai-presets/editor/schemas/index.ts`
- [x] T007 Create main barrel export in `apps/clementine-app/src/domains/ai-presets/editor/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create editor store using createEditorStore factory in `apps/clementine-app/src/domains/ai-presets/editor/stores/useAIPresetEditorStore.ts`
- [x] T009 Create useAIPreset hook with real-time Firestore subscription in `apps/clementine-app/src/domains/ai-presets/editor/hooks/useAIPreset.ts`
- [x] T010 Create useUpdateAIPreset mutation hook with partial updates in `apps/clementine-app/src/domains/ai-presets/editor/hooks/useUpdateAIPreset.ts`
- [x] T011 [P] Create UpdateAIPresetInput schema in `apps/clementine-app/src/domains/ai-presets/editor/schemas/ai-preset-editor.schemas.ts`
- [x] T012 Update barrel exports to include new hooks, store, and schemas

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Navigate to Editor and Edit Preset Name (Priority: P1) 🎯 MVP

**Goal**: Users can navigate from the presets list to the editor, see the two-column layout, and edit the preset name inline in the breadcrumb with save status feedback.

**Independent Test**: Click a preset card from the list, verify the editor loads with the correct name displayed, edit the name inline, and confirm the change persists after page reload.

### Implementation for User Story 1

- [x] T013 [P] [US1] Create AIPresetNameBadge component (editable name in breadcrumb) in `apps/clementine-app/src/domains/ai-presets/editor/components/AIPresetNameBadge.tsx`
- [x] T014 [P] [US1] Create AIPresetEditorLayout container (TopNavBar with breadcrumbs, save status, two-column layout) in `apps/clementine-app/src/domains/ai-presets/editor/containers/AIPresetEditorLayout.tsx`
- [x] T015 [US1] Create AIPresetEditorPage container (main page with data fetching) in `apps/clementine-app/src/domains/ai-presets/editor/containers/AIPresetEditorPage.tsx`
- [x] T016 [US1] Update route file to use AIPresetEditorPage in `apps/clementine-app/src/app/workspace/$workspaceSlug.ai-presets/$presetId.tsx`
- [x] T017 [US1] Update barrel exports for US1 components and containers

**Checkpoint**: At this point, User Story 1 should be fully functional - users can navigate to the editor and edit the preset name.

---

## Phase 4: User Story 2 - Configure Model Settings (Priority: P2)

**Goal**: Users can configure the AI model and aspect ratio for their preset using dropdown selects.

**Independent Test**: Open the editor, select different model and aspect ratio options, verify selections persist after page reload.

### Implementation for User Story 2

- [x] T018 [US2] Create ModelSettingsSection component (model + aspect ratio dropdowns using SelectField) in `apps/clementine-app/src/domains/ai-presets/editor/components/ModelSettingsSection.tsx`
- [x] T019 [US2] Integrate ModelSettingsSection into AIPresetEditorLayout left panel
- [x] T020 [US2] Update barrel exports for US2 component

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Manage Media Registry (Priority: P3)

**Goal**: Users can add reference images to their preset using a simplified upload dialog, and remove media from the registry.

**Independent Test**: Open the editor, click "Add Media", upload an image and provide a reference name, verify media appears in the registry, delete it and verify removal.

### Implementation for User Story 3

- [x] T021 [P] [US3] Create MediaRegistryItem component (thumbnail with name and delete on hover) in `apps/clementine-app/src/domains/ai-presets/editor/components/MediaRegistryItem.tsx`
- [x] T022 [P] [US3] Create AddMediaDialog component (dialog with MediaPickerField + name input) in `apps/clementine-app/src/domains/ai-presets/editor/components/AddMediaDialog.tsx`
- [x] T023 [US3] Create MediaRegistrySection component (thumbnail grid + add button) in `apps/clementine-app/src/domains/ai-presets/editor/components/MediaRegistrySection.tsx`
- [x] T024 [US3] Integrate MediaRegistrySection into AIPresetEditorLayout left panel
- [x] T025 [US3] Update barrel exports for US3 components

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently.

---

## Phase 5.5: Draft/Published Model & Layout Refactor

**Purpose**: Implement draft/published workflow (consistent with Experience pattern) and separate layout concerns for maintainability.

**⚠️ CRITICAL**: This phase refactors the save model. After this phase:
- All edits auto-save to `draft` field (no data loss)
- "Publish" button copies draft → published
- Experiences reference the `published` version
- Save button is replaced with Publish button

### Part A: Schema Changes

- [ ] T050 Create `aiPresetConfigSchema` in `packages/shared/src/schemas/ai-preset/ai-preset-config.schema.ts` containing: `model`, `aspectRatio`, `mediaRegistry`, `variables`, `promptTemplate`
- [ ] T051 Update `aiPresetSchema` in `packages/shared/src/schemas/ai-preset/ai-preset.schema.ts`:
  - Add `draft: aiPresetConfigSchema` field
  - Add `published: aiPresetConfigSchema.nullable().default(null)` field
  - Add `draftVersion: z.number().default(1)` field
  - Add `publishedVersion: z.number().nullable().default(null)` field
  - Add `publishedAt: z.number().nullable().default(null)` field
  - Add `publishedBy: z.string().nullable().default(null)` field
  - Remove top-level `model`, `aspectRatio`, `mediaRegistry`, `variables`, `promptTemplate` (moved to config)
- [ ] T052 Update barrel exports in `packages/shared/src/schemas/ai-preset/index.ts`
- [ ] T053 Run `pnpm --filter @clementine/shared build` to verify schema compiles

### Part B: Hook Updates

- [ ] T054 Update `useUpdateAIPreset` hook to write to `draft` field and increment `draftVersion`
- [ ] T055 Create `usePublishAIPreset` hook in `apps/clementine-app/src/domains/ai-presets/editor/hooks/usePublishAIPreset.ts`:
  - Copies `draft` → `published`
  - Sets `publishedVersion` = `draftVersion`
  - Sets `publishedAt` = serverTimestamp
  - Sets `publishedBy` = current user UID
- [ ] T056 Update `useAIPreset` hook to return both draft and published data
- [ ] T057 Update barrel exports for new hooks

### Part C: Layout Refactor (Follow Experience Pattern)

- [ ] T058 Create `AIPresetEditorContent` container in `apps/clementine-app/src/domains/ai-presets/editor/containers/AIPresetEditorContent.tsx`:
  - Move two-column layout from AIPresetEditorLayout
  - Move all section handlers (model, aspect ratio, media, variables, prompt)
  - Receives `draft` config as prop, calls update handlers
- [ ] T059 Refactor `AIPresetEditorLayout` container:
  - Keep TopNavBar with breadcrumbs
  - Add `EditorChangesBadge` (draftVersion vs publishedVersion)
  - Replace Save button with Publish button
  - Add publish handler with validation
  - Render `AIPresetEditorContent` as child
- [ ] T060 Update `AIPresetEditorPage` to pass draft/published data to layout
- [ ] T061 Update barrel exports for refactored containers

### Part D: UI Updates

- [ ] T062 Update all editor sections to read from `preset.draft.*` instead of `preset.*`
- [ ] T063 Add unpublished changes detection (draftVersion > publishedVersion)
- [ ] T064 Add publish confirmation toast on success
- [ ] T065 Add validation error display on publish failure (if draft is invalid)

**Checkpoint**: After this phase:
- Editor auto-saves to draft (no data loss on browser close)
- Publish button makes changes live
- Clear separation of WIP vs published state
- Layout follows Experience pattern

---

## Phase 6: User Story 4 - Define Variables (Priority: P4)

**Goal**: Users can create, edit, and delete variables (text and image types) with collapsible cards.

**Independent Test**: Create a text variable with name/label/required, create an image variable, verify both appear in the list with correct configuration, edit and delete them.

### Implementation for User Story 4

- [ ] T026 [P] [US4] Add CreateVariableInput and UpdateVariableInput schemas in `apps/clementine-app/src/domains/ai-presets/editor/schemas/ai-preset-editor.schemas.ts`
- [ ] T027 [P] [US4] Create VariableEditor component (form for editing variable properties) in `apps/clementine-app/src/domains/ai-presets/editor/components/VariableEditor.tsx`
- [ ] T028 [US4] Create VariableCard component (collapsible card showing @name, type badge, label) in `apps/clementine-app/src/domains/ai-presets/editor/components/VariableCard.tsx`
- [ ] T029 [US4] Create VariablesSection component (list of VariableCards + add button) in `apps/clementine-app/src/domains/ai-presets/editor/components/VariablesSection.tsx`
- [ ] T030 [US4] Integrate VariablesSection into AIPresetEditorLayout left panel
- [ ] T031 [US4] Update barrel exports for US4 components

**Checkpoint**: At this point, User Stories 1-4 should all work independently.

---

## Phase 7: User Story 5 - Configure Value Mappings for Text Variables (Priority: P5)

**Goal**: Users can set up value mappings for text variables with value→text pairs.

**Independent Test**: Create a text variable, add value mappings, verify mappings appear with input values and output text, delete a mapping.

### Implementation for User Story 5

- [ ] T032 [P] [US5] Add AddValueMappingInput schema in `apps/clementine-app/src/domains/ai-presets/editor/schemas/ai-preset-editor.schemas.ts`
- [ ] T033 [US5] Create ValueMappingsEditor component (table of mappings with add/remove) in `apps/clementine-app/src/domains/ai-presets/editor/components/ValueMappingsEditor.tsx`
- [ ] T034 [US5] Integrate ValueMappingsEditor into VariableEditor for text type variables
- [ ] T035 [US5] Update barrel exports for US5 component

**Checkpoint**: At this point, User Stories 1-5 should all work independently.

---

## Phase 8: User Story 6 - Write Prompt Template with @mentions (Priority: P6)

**Goal**: Users can write prompt templates with @mention autocomplete for variables and media, displayed as colored pills.

**Independent Test**: Write a prompt, type @ to trigger autocomplete, select variables/media, verify mentions appear as visual pills (blue for variables, green for media).

### Implementation for User Story 6

- [ ] T036 [P] [US6] Create MentionAutocomplete component (dropdown with filtered suggestions, keyboard navigation) in `apps/clementine-app/src/domains/ai-presets/editor/components/MentionAutocomplete.tsx`
- [ ] T037 [US6] Create PromptTemplateEditor component (contentEditable with @mention support, pill rendering) in `apps/clementine-app/src/domains/ai-presets/editor/components/PromptTemplateEditor.tsx`
- [ ] T038 [US6] Integrate PromptTemplateEditor into AIPresetEditorLayout left panel
- [ ] T039 [US6] Update barrel exports for US6 components

**Checkpoint**: At this point, User Stories 1-6 should all work independently.

---

## Phase 9: User Story 7 - Publish and Navigate Away (Priority: P7)

**Goal**: Users can publish their draft changes via Publish button and navigate back to the presets list.

**Independent Test**: Make changes, verify EditorChangesBadge shows unpublished changes, click Publish, verify badge updates, click breadcrumb icon and confirm navigation to the list.

**Note**: This phase depends on Phase 5.5 (Draft/Published Model). The Save button has been replaced with Publish button.

### Implementation for User Story 7

- [ ] T040 [US7] Verify Publish button is disabled when no unpublished changes (draftVersion === publishedVersion)
- [ ] T041 [US7] Ensure breadcrumb icon correctly links back to AI Presets list page
- [ ] T042 [US7] Verify EditorChangesBadge shows correct states (unpublished changes indicator)

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T043 [P] Add error state handling for preset load failure with retry option
- [ ] T044 [P] Add toast notifications for save failures with retry option
- [ ] T045 [P] Add validation for empty preset name with error message
- [ ] T046 [P] Add validation for duplicate variable names with error message
- [ ] T047 [P] Add invalid @mention pill highlighting when referenced variable/media is deleted
- [ ] T048 Run quickstart.md testing checklist validation
- [ ] T049 Run standards compliance checklist from quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: Depend on Foundational phase completion
- **Draft/Published Refactor (Phase 5.5)**: Depends on Phase 5 completion - BLOCKS remaining phases
  - Schema changes in shared package
  - Hook updates for draft/publish workflow
  - Layout refactor following Experience pattern
- **User Stories (Phase 6-9)**: Depend on Phase 5.5 completion
  - Must work with new draft/published model
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates into layout from US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates into layout from US1
- **Phase 5.5 (Refactor)**: Must complete after US3, before US4 - Schema and layout changes
- **User Story 4 (P4)**: Can start after Phase 5.5 - Works with draft model
- **User Story 5 (P5)**: Depends on US4 completion (variables must exist for value mappings)
- **User Story 6 (P6)**: Depends on US3 and US4 (needs media and variables for @mention autocomplete)
- **User Story 7 (P7)**: Depends on Phase 5.5 (Publish button replaces Save button)

### Within Each User Story

- Components can often be built in parallel [P]
- Integration tasks must wait for components
- Barrel export updates are last in each story

### Parallel Opportunities

- All Setup tasks (T002-T006) can run in parallel
- Foundational tasks T009-T011 can run in parallel
- Within US1: T013 and T014 can run in parallel
- Within US3: T021 and T022 can run in parallel
- Within US4: T026 and T027 can run in parallel
- Within US6: T036 can run in parallel with earlier work
- All Polish tasks (T043-T047) can run in parallel

---

## Parallel Example: User Story 3

```bash
# Launch model tasks for User Story 3 together:
Task: "Create MediaRegistryItem component in .../components/MediaRegistryItem.tsx"
Task: "Create AddMediaDialog component in .../components/AddMediaDialog.tsx"

# Then sequentially:
Task: "Create MediaRegistrySection component..." (depends on above)
Task: "Integrate MediaRegistrySection into layout..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - users can navigate and rename presets

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Model settings work
4. Add User Story 3 → Test independently → Media registry works
5. **Complete Phase 5.5 → Draft/Published refactor → Schema + Layout changes**
6. Add User Story 4 → Test independently → Variables work (with draft model)
7. Add User Story 5 → Test independently → Value mappings work
8. Add User Story 6 → Test independently → Prompt editor works
9. Add User Story 7 → Test independently → Publish workflow works
10. Polish phase for production readiness

### Suggested MVP Scope

**User Story 1 only** (navigate + edit preset name) provides immediate value:
- Users can access the editor
- Users can rename presets
- Foundation for all other features

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MediaPickerField is used for simplified upload (full library picker is deferred to separate feature)
- Editor follows ExperienceDesignerLayout pattern from existing codebase
- **Draft/Published Model** (Phase 5.5):
  - All edits auto-save to `draft` field (no data loss)
  - `Publish` button copies draft → published
  - Experiences reference the `published` field
  - Schema uses nested `AIPresetConfig` (consistent with `ExperienceConfig`)
  - Layout split: `AIPresetEditorLayout` (TopNavBar + publish) → `AIPresetEditorContent` (editor sections)
