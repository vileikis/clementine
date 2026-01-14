# Tasks: Step System & Experience Editor

**Input**: Design documents from `/specs/022-step-system-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Convention

All paths are relative to `apps/clementine-app/src/`:
- `domains/experience/steps/` - Step registry, schemas, renderers, config panels
- `domains/experience/designer/` - Editor layout, components, hooks
- `domains/experience/shared/` - Existing E1 foundation (types, queries)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create folder structure and barrel exports for the step system

- [X] T001 Create folder structure for `domains/experience/steps/` with subdirectories: `registry/`, `schemas/`, `renderers/`, `config-panels/`
- [X] T002 [P] Create barrel export `domains/experience/steps/index.ts`
- [X] T003 [P] Create barrel export `domains/experience/steps/registry/index.ts`
- [X] T004 [P] Create barrel export `domains/experience/steps/schemas/index.ts`
- [X] T005 [P] Create barrel export `domains/experience/steps/renderers/index.ts`
- [X] T006 [P] Create barrel export `domains/experience/steps/config-panels/index.ts`
- [X] T007 [P] Create barrel export `domains/experience/designer/components/index.ts`
- [X] T008 [P] Create barrel export `domains/experience/designer/hooks/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Step registry and schemas that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Step Config Schemas (all parallelizable)

> **Note**: All input steps include `title` (not `question`) and `required` (default false) fields.

- [X] T009 [P] Create info step config schema in `domains/experience/steps/schemas/info.schema.ts` with fields: title (optional, max 200), description (optional, max 1000), media (optional MediaAsset)
- [X] T010 [P] Create input-scale step config schema in `domains/experience/steps/schemas/input-scale.schema.ts` with fields: title (required, 1-200), required (default false), min (default 1), max (default 5), minLabel, maxLabel
- [X] T011 [P] Create input-yes-no step config schema in `domains/experience/steps/schemas/input-yes-no.schema.ts` with fields: title (required, 1-200), required (default false)
- [X] T012 [P] Create input-multi-select step config schema in `domains/experience/steps/schemas/input-multi-select.schema.ts` with fields: title (required), required (default false), options (2-10 items), multiSelect (default false)
- [X] T013 [P] Create input-short-text step config schema in `domains/experience/steps/schemas/input-short-text.schema.ts` with fields: title (required), required (default false), placeholder, maxLength (default 100)
- [X] T014 [P] Create input-long-text step config schema in `domains/experience/steps/schemas/input-long-text.schema.ts` with fields: title (required), required (default false), placeholder, maxLength (default 500)
- [X] T015 [P] Create capture-photo step config schema in `domains/experience/steps/schemas/capture-photo.schema.ts` with fields: aspectRatio (enum: '1:1' | '9:16', default '1:1')
- [X] T016 [P] Create transform-pipeline step config schema in `domains/experience/steps/schemas/transform-pipeline.schema.ts` (empty config for MVP)
- [X] T016.1 [P] Create step.schema.ts with Zod discriminated union combining all step schemas into unified Step type
- [X] T017 Update schemas barrel export in `domains/experience/steps/schemas/index.ts` to re-export all schemas

### Step Registry

> **Note**: Registry contains metadata only. Renderers and config panels are resolved via switch statements in consuming components (no lazy loading).

- [X] T018 Create step registry in `domains/experience/steps/registry/step-registry.ts` with StepDefinition interface, 8 step type entries (type, category, label, description, icon, configSchema, defaultConfig)
- [X] T019 Create step utilities in `domains/experience/steps/registry/step-utils.ts` with: getStepDefinition(), getStepTypesForProfile(), createStep(), getStepsByCategory()
- [X] T020 Update registry barrel export in `domains/experience/steps/registry/index.ts`

**Checkpoint**: Foundation ready - step registry and schemas complete, user story implementation can begin

---

## Phase 3: User Story 1 - Add and Configure Steps (Priority: P1) 🎯 MVP

**Goal**: Admin can open experience editor, add steps via dialog (filtered by profile), and configure them via type-specific panels with live preview updates

**Independent Test**: Create new experience, add multiple steps of different types, configure each step. Verify preview updates immediately.

### Edit-Mode Renderers for US1 (parallelizable)

> **Note**: All input renderers show `title` (or placeholder) and disabled input controls.

- [X] T021 [P] [US1] Create InfoStepRenderer in `domains/experience/steps/renderers/InfoStepRenderer.tsx` showing title (or "Add a title..."), description, media placeholder
- [X] T022 [P] [US1] Create InputScaleRenderer in `domains/experience/steps/renderers/InputScaleRenderer.tsx` showing title, disabled scale buttons with min/max labels
- [X] T023 [P] [US1] Create InputYesNoRenderer in `domains/experience/steps/renderers/InputYesNoRenderer.tsx` showing title with Yes/No buttons (disabled)
- [X] T024 [P] [US1] Create InputMultiSelectRenderer in `domains/experience/steps/renderers/InputMultiSelectRenderer.tsx` showing title with checkbox/radio options (disabled, based on multiSelect)
- [X] T025 [P] [US1] Create InputShortTextRenderer in `domains/experience/steps/renderers/InputShortTextRenderer.tsx` showing title with single-line input (disabled)
- [X] T026 [P] [US1] Create InputLongTextRenderer in `domains/experience/steps/renderers/InputLongTextRenderer.tsx` showing title with textarea (disabled)
- [X] T027 [P] [US1] Create CapturePhotoRenderer in `domains/experience/steps/renderers/CapturePhotoRenderer.tsx` showing camera placeholder with aspectRatio indicator
- [X] T028 [P] [US1] Create TransformPipelineRenderer in `domains/experience/steps/renderers/TransformPipelineRenderer.tsx` showing "AI Processing" title with "Coming soon" badge
- [X] T029 [US1] Update renderers barrel export in `domains/experience/steps/renderers/index.ts`

### Config Panels for US1 (parallelizable)

> **Note**: All input config panels include `title` field and `required` toggle.

- [X] T030 [P] [US1] Create InfoStepConfigPanel in `domains/experience/steps/config-panels/InfoStepConfigPanel.tsx` with TextField (title), TextareaField (description), MediaPickerField (media placeholder)
- [X] T031 [P] [US1] Create InputScaleConfigPanel in `domains/experience/steps/config-panels/InputScaleConfigPanel.tsx` with TextField (title), Switch (required), Slider (min/max), TextField (minLabel/maxLabel)
- [X] T032 [P] [US1] Create InputYesNoConfigPanel in `domains/experience/steps/config-panels/InputYesNoConfigPanel.tsx` with TextField (title), Switch (required)
- [X] T033 [P] [US1] Create InputMultiSelectConfigPanel in `domains/experience/steps/config-panels/InputMultiSelectConfigPanel.tsx` with TextField (title), Switch (required), editable options list, Switch (multiSelect)
- [X] T034 [P] [US1] Create InputShortTextConfigPanel in `domains/experience/steps/config-panels/InputShortTextConfigPanel.tsx` with TextField (title), Switch (required), TextField (placeholder), Slider (maxLength)
- [X] T035 [P] [US1] Create InputLongTextConfigPanel in `domains/experience/steps/config-panels/InputLongTextConfigPanel.tsx` with TextField (title), Switch (required), TextField (placeholder), Slider (maxLength)
- [X] T036 [P] [US1] Create CapturePhotoConfigPanel in `domains/experience/steps/config-panels/CapturePhotoConfigPanel.tsx` with Select (aspectRatio: '1:1' | '9:16')
- [X] T037 [P] [US1] Create TransformPipelineConfigPanel in `domains/experience/steps/config-panels/TransformPipelineConfigPanel.tsx` showing "Coming soon - no configuration available"
- [X] T038 [US1] Update config-panels barrel export in `domains/experience/steps/config-panels/index.ts`

### Editor Components for US1

- [X] T039 [US1] Create AddStepDialog in `domains/experience/designer/components/AddStepDialog.tsx` using Dialog from shadcn/ui, showing step types grouped by category, filtered by experience profile
- [X] T040 [US1] Create StepListItem in `domains/experience/designer/components/StepListItem.tsx` showing step icon, label, selected state indicator
- [X] T041 [US1] Create StepList in `domains/experience/designer/components/StepList.tsx` with "Add Step" button, step items, selection handling (no DnD yet)
- [X] T042 [US1] Create StepConfigPanel in `domains/experience/designer/components/StepConfigPanel.tsx` that routes to correct config panel based on selected step type, passes onConfigChange callback
- [X] T043 [US1] Create StepPreview in `domains/experience/designer/components/StepPreview.tsx` wrapping PreviewShell, rendering correct step renderer based on selected step, showing "No step selected" placeholder
- [X] T044 [US1] Create useStepSelection hook in `domains/experience/designer/hooks/useStepSelection.ts` syncing selected step ID with URL search param `?step=`

### Editor Layout for US1

- [X] T045 [US1] Implement 3-column layout in `domains/experience/designer/containers/ExperienceDesignerPage.tsx` with StepList (left), StepPreview (center), StepConfigPanel (right), responsive breakpoints
- [X] T046 [US1] Update designer barrel exports in `domains/experience/designer/components/index.ts` and `domains/experience/designer/hooks/index.ts`

**Checkpoint**: User Story 1 complete - admin can add and configure steps with live preview. Fully testable independently.

---

## Phase 4: User Story 2 - Reorder and Delete Steps (Priority: P2)

**Goal**: Admin can drag steps to reorder and delete steps via context menu

**Independent Test**: Add 3+ steps, drag to new positions, delete steps. Verify order changes persist and selection updates correctly.

### Implementation for US2

- [X] T047 [US2] Add @dnd-kit dependencies if not present: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [X] T048 [US2] Enhance StepListItem in `domains/experience/designer/components/StepListItem.tsx` with drag handle using useSortable from @dnd-kit, add delete action via DropdownMenu context menu
- [X] T049 [US2] Enhance StepList in `domains/experience/designer/components/StepList.tsx` with DndContext and SortableContext from @dnd-kit, implement onDragEnd handler to reorder steps
- [X] T050 [US2] Add selection handling for deleted step in `domains/experience/designer/containers/ExperienceDesignerPage.tsx`: select next step or clear selection if no steps remain

**Checkpoint**: User Story 2 complete - admin can reorder and delete steps. Works independently with US1.

---

## Phase 5: User Story 3 - Auto-Save Draft Changes (Priority: P3)

**Goal**: Changes auto-save to draft after 2 seconds of inactivity with visual save status indicator

**Independent Test**: Make changes, wait 2 seconds, verify "Saving..." then "Saved" indicator. Refresh page, verify changes persisted.

### Implementation for US3

> **Note**: `useExperienceDesignerStore` should be created using the shared editor store factory, following the same pattern as `useEventDesignerStore`:
> ```typescript
> // domains/experience/designer/stores/useExperienceDesignerStore.ts
> import { createEditorStore } from '@/shared/editor-status'
> export const useExperienceDesignerStore = createEditorStore()
> ```

- [X] T051 [US3] Create useUpdateExperienceDraft hook in `domains/experience/designer/hooks/useUpdateExperienceDraft.ts` wrapping useMutation to update experience.draft in Firestore with serverTimestamp()
- [X] T052 [US3] Integrate useAutoSave in `domains/experience/designer/containers/ExperienceDesignerPage.tsx` with 2000ms debounce, watching steps array changes, calling useUpdateExperienceDraft
- [X] T053 [US3] Wire useExperienceDesignerStore (startSave/completeSave) with useUpdateExperienceDraft mutation for save status tracking
- [X] T054 [US3] Add EditorSaveStatus indicator to ExperienceDesignerLayout header showing pendingSaves and lastCompletedAt from store

**Checkpoint**: User Story 3 complete - changes auto-save with visual feedback. Works with US1 and US2.

---

## Phase 6: User Story 4 - Publish Experience (Priority: P4)

**Goal**: Admin can publish experience after validation (at least one step, valid configs, profile constraints)

**Independent Test**: Create experience with valid steps, click Publish, verify success. Try with no steps or invalid config, verify validation errors.

### Implementation for US4

- [ ] T055 [US4] Create validateForPublish function in `domains/experience/designer/hooks/usePublishExperience.ts` checking: steps.length > 0, all configs valid per schema, step types allowed for profile
- [ ] T056 [US4] Create usePublishExperience hook in `domains/experience/designer/hooks/usePublishExperience.ts` that validates, then copies draft to published with publishedAt/publishedBy
- [ ] T057 [US4] Wire Publish button in `domains/experience/designer/containers/ExperienceDesignerLayout.tsx` to usePublishExperience, show loading state during publish
- [ ] T058 [US4] Display validation errors in UI when publish fails: use toast or inline error list showing specific field/step issues
- [ ] T059 [US4] Show success toast notification on publish completion using Sonner

**Checkpoint**: User Story 4 complete - admin can publish experiences with validation. Full editing workflow functional.

---

## Phase 7: User Story 5 - Preview Steps in Edit Mode (Priority: P5)

**Goal**: Preview accurately reflects configuration with placeholder text for unconfigured fields

**Independent Test**: Select different step types, verify preview shows correct placeholders and configured values.

### Implementation for US5

- [ ] T060 [US5] Enhance InfoStepRenderer to show "Add a title..." placeholder when title empty, "Add a description..." when description empty
- [ ] T061 [US5] Enhance InputScaleRenderer to show placeholder question text when empty, proper scale visualization
- [ ] T062 [US5] Enhance all input renderers (YesNo, MultiSelect, ShortText, LongText) with appropriate placeholder states
- [ ] T063 [US5] Enhance CapturePhotoRenderer to show countdown overlay if countdown > 0
- [ ] T064 [US5] Ensure preview updates synchronously (<100ms) when config changes by using local state before auto-save

**Checkpoint**: User Story 5 complete - all previews show accurate placeholders and live updates. Full feature complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories

- [ ] T065 [P] Add mobile responsive layout to ExperienceDesignerPage using Sheet for config panel on small screens
- [ ] T066 [P] Add keyboard navigation support to StepList (arrow keys to navigate, Enter to select, Delete to remove)
- [ ] T067 Validate all components follow design-system.md standards (theme tokens, no hard-coded colors)
- [ ] T068 Run `pnpm app:check` (lint + format) and fix any issues
- [ ] T069 Run `pnpm app:type-check` and fix any TypeScript errors
- [ ] T070 Manual test per quickstart.md validation scenarios
- [ ] T071 Verify standards compliance per constitution (mobile-first, type-safe, clean code)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (P1): No dependencies on other stories
  - US2 (P2): Builds on US1 components (StepList, StepListItem)
  - US3 (P3): Integrates with editor from US1
  - US4 (P4): Uses schemas from Foundational, integrates with editor
  - US5 (P5): Enhances renderers from US1
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 2 (Foundational) ─┬─▶ US1 (Add/Configure) ─┬─▶ US2 (Reorder/Delete)
                        │                        │
                        │                        └─▶ US5 (Preview Polish)
                        │
                        └─▶ US3 (Auto-Save) ────────▶ US4 (Publish)
```

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
- T009-T016: All 8 schemas can be written in parallel
- After schemas: T018-T020 (registry) depends on schemas

**Within US1**:
- T021-T028: All 8 renderers in parallel
- T030-T037: All 8 config panels in parallel
- After renderers/panels: Editor components T039-T046

**Across User Stories** (with team):
- US1 and US3 can proceed in parallel (different files)
- US2 depends on US1 StepList completion
- US4 can proceed independently after Foundational
- US5 enhances US1 renderers

---

## Parallel Example: Phase 2 Schemas

```bash
# Launch all schema tasks in parallel:
Task: "Create info step config schema in domains/experience/steps/schemas/info.schema.ts"
Task: "Create input-scale step config schema in domains/experience/steps/schemas/input-scale.schema.ts"
Task: "Create input-yes-no step config schema in domains/experience/steps/schemas/input-yes-no.schema.ts"
Task: "Create input-multi-select step config schema in domains/experience/steps/schemas/input-multi-select.schema.ts"
Task: "Create input-short-text step config schema in domains/experience/steps/schemas/input-short-text.schema.ts"
Task: "Create input-long-text step config schema in domains/experience/steps/schemas/input-long-text.schema.ts"
Task: "Create capture-photo step config schema in domains/experience/steps/schemas/capture-photo.schema.ts"
Task: "Create transform-pipeline step config schema in domains/experience/steps/schemas/transform-pipeline.schema.ts"
```

## Parallel Example: US1 Renderers

```bash
# After schemas complete, launch all renderer tasks in parallel:
Task: "Create InfoStepRenderer in domains/experience/steps/renderers/InfoStepRenderer.tsx"
Task: "Create InputScaleRenderer in domains/experience/steps/renderers/InputScaleRenderer.tsx"
Task: "Create InputYesNoRenderer in domains/experience/steps/renderers/InputYesNoRenderer.tsx"
Task: "Create InputMultiSelectRenderer in domains/experience/steps/renderers/InputMultiSelectRenderer.tsx"
Task: "Create InputShortTextRenderer in domains/experience/steps/renderers/InputShortTextRenderer.tsx"
Task: "Create InputLongTextRenderer in domains/experience/steps/renderers/InputLongTextRenderer.tsx"
Task: "Create CapturePhotoRenderer in domains/experience/steps/renderers/CapturePhotoRenderer.tsx"
Task: "Create TransformPipelineRenderer in domains/experience/steps/renderers/TransformPipelineRenderer.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (8 tasks)
2. Complete Phase 2: Foundational - schemas + registry (12 tasks)
3. Complete Phase 3: User Story 1 - add/configure steps (26 tasks)
4. **STOP and VALIDATE**: Test adding and configuring steps independently
5. Deploy/demo if ready - admin can build experiences!

### Incremental Delivery

1. **Setup + Foundational** → Foundation ready
2. **Add US1** → Admin can add/configure steps → Demo MVP
3. **Add US2** → Admin can reorder/delete steps → Enhanced editing
4. **Add US3** → Changes auto-save → Work is protected
5. **Add US4** → Admin can publish → Full workflow
6. **Add US5** → Better previews → Polished experience
7. Each story adds value without breaking previous stories

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | 8 | Folder structure, barrel exports |
| Phase 2: Foundational | 12 | 8 schemas + step registry |
| Phase 3: US1 (P1) | 26 | Add/configure steps - MVP |
| Phase 4: US2 (P2) | 4 | Reorder/delete steps |
| Phase 5: US3 (P3) | 4 | Auto-save draft |
| Phase 6: US4 (P4) | 5 | Publish with validation |
| Phase 7: US5 (P5) | 5 | Preview polish |
| Phase 8: Polish | 7 | Cross-cutting, compliance |
| **Total** | **71** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All paths relative to `apps/clementine-app/src/`
