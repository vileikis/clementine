# Tasks: Admin Create Tab UX

**Input**: Design documents from `/specs/061-admin-create-ux/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested - tests omitted per Minimal Testing Strategy (Constitution IV).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo app**: `apps/clementine-app/src/`
- **Shared package**: `packages/shared/src/`
- **Domain**: `domains/experience/create/`

---

## Phase 1: Setup (Schema Rename)

**Purpose**: Rename "create outcome" to "outcome" throughout the codebase before implementing UI

- [ ] T001 Rename schema file from `packages/shared/src/schemas/experience/create-outcome.schema.ts` to `outcome.schema.ts`
- [ ] T002 Update schema exports in `packages/shared/src/schemas/experience/outcome.schema.ts`: rename `createOutcomeSchema` → `outcomeSchema`, `CreateOutcome` → `Outcome`, `createOutcomeTypeSchema` → `outcomeTypeSchema`, `CreateOutcomeType` → `OutcomeType`
- [ ] T003 Update field name in `packages/shared/src/schemas/experience/experience.schema.ts`: rename `create` → `outcome`
- [ ] T004 Update barrel exports in `packages/shared/src/schemas/experience/index.ts` to use new names
- [ ] T005 Update all imports in `apps/clementine-app/src/` that reference `CreateOutcome` or `config.create`
- [ ] T006 Run `pnpm --filter @clementine/shared build` and verify no TypeScript errors

**Checkpoint**: Schema rename complete - all references use "outcome" terminology

---

## Phase 2: Foundational (Core Infrastructure)

**Purpose**: Create shared utilities and hooks that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 [P] Create model/aspect ratio constants in `apps/clementine-app/src/domains/experience/create/lib/model-options.ts`
- [ ] T008 [P] Create outcome operations (pure functions) in `apps/clementine-app/src/domains/experience/create/lib/outcome-operations.ts`
- [ ] T009 Create mutation hook in `apps/clementine-app/src/domains/experience/create/hooks/useUpdateOutcome.ts`
- [ ] T010 Refactor `apps/clementine-app/src/domains/experience/create/components/PromptComposer/ControlRow.tsx` to accept model/aspectRatio options via props
- [ ] T011 Refactor `apps/clementine-app/src/domains/experience/create/components/PromptComposer/PromptComposer.tsx` for composition pattern (decouple from AIImageNode)
- [ ] T012 Refactor `apps/clementine-app/src/domains/experience/create/hooks/useRefMediaUpload.ts` to work with `outcome.imageGeneration.refMedia` path
- [ ] T013 Update barrel exports in `apps/clementine-app/src/domains/experience/create/lib/index.ts`
- [ ] T014 Run `pnpm app:type-check` and verify no TypeScript errors

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1+2 - Configure AI Image Generation & Select Outcome Type (Priority: P1) 🎯 MVP

**Goal**: Admin can open Create tab, select Image outcome type, configure AI generation with prompt, model, and aspect ratio

**Independent Test**: Open Create tab → Select "Image" → Enable AI → Enter prompt with @mentions → Select model and aspect ratio → Navigate away and return → Verify all values persist

**Note**: US1 and US2 are both P1 and tightly coupled - implementing together as MVP

### Implementation for User Story 1+2

- [ ] T015 [P] [US1] Create `apps/clementine-app/src/domains/experience/create/components/CreateTabForm/OutcomeTypeSelector.tsx` with Image/GIF/Video toggle (GIF/Video disabled with "coming soon")
- [ ] T016 [P] [US1] Create `apps/clementine-app/src/domains/experience/create/components/CreateTabForm/index.ts` barrel export
- [ ] T017 [US1] Create `apps/clementine-app/src/domains/experience/create/components/CreateTabForm/CreateTabForm.tsx` composing OutcomeTypeSelector and PromptComposer
- [ ] T018 [US1] Update `apps/clementine-app/src/domains/experience/create/containers/ExperienceCreatePage.tsx` to render CreateTabForm instead of TransformPipelineEditor
- [ ] T019 [US1] Wire CreateTabForm to useUpdateOutcome mutation for saving outcome config
- [ ] T020 [US1] Implement local state with debounced saves for prompt changes (2-second debounce)
- [ ] T021 [US1] Implement immediate saves for discrete selections (model, aspect ratio, outcome type)
- [ ] T022 [US1] Update barrel exports in `apps/clementine-app/src/domains/experience/create/components/index.ts`

**Checkpoint**: US1+2 complete - Admin can configure AI image generation with outcome type, prompt, model, and aspect ratio

---

## Phase 4: User Story 3 - Configure Source Image (Priority: P2)

**Goal**: Admin can select a capture step as source image or choose "None (prompt only)"

**Independent Test**: Open source image dropdown → See "None (prompt only)" + capture steps → Select one → Verify selection persists

### Implementation for User Story 3

- [ ] T023 [US3] Create `apps/clementine-app/src/domains/experience/create/components/CreateTabForm/SourceImageSelector.tsx` with capture step dropdown
- [ ] T024 [US3] Add step filtering logic to show only capture steps (type === 'capture.photo')
- [ ] T025 [US3] Integrate SourceImageSelector into CreateTabForm.tsx
- [ ] T026 [US3] Wire captureStepId changes to useUpdateOutcome mutation

**Checkpoint**: US3 complete - Admin can select source image for transformation

---

## Phase 5: User Story 4 - Manage Reference Images (Priority: P2)

**Goal**: Admin can upload reference images and mention them in prompts

**Independent Test**: Click "Add" → Upload image → See thumbnail with display name → Type @ in prompt → See reference image in autocomplete

### Implementation for User Story 4

- [ ] T027 [US4] Verify refactored useRefMediaUpload works with outcome.imageGeneration.refMedia path
- [ ] T028 [US4] Verify ReferenceMediaStrip displays uploaded images with editable display names
- [ ] T029 [US4] Verify mention autocomplete shows reference images when typing @
- [ ] T030 [US4] Add display name validation (reject `}`, `:`, `{` characters) in PromptComposer or CreateTabForm

**Checkpoint**: US4 complete - Admin can upload and mention reference images

---

## Phase 6: User Story 5 - Toggle AI Generation (Priority: P2)

**Goal**: Admin can disable AI generation for passthrough mode

**Independent Test**: Toggle AI off → PromptComposer collapses → Toggle back on → Previous values restored

### Implementation for User Story 5

- [ ] T031 [US5] Create `apps/clementine-app/src/domains/experience/create/components/CreateTabForm/AIGenerationToggle.tsx` checkbox component
- [ ] T032 [US5] Integrate AIGenerationToggle into CreateTabForm.tsx
- [ ] T033 [US5] Implement conditional rendering: hide PromptComposer when aiEnabled=false
- [ ] T034 [US5] Ensure PromptComposer values are preserved when toggling (no reset on hide)
- [ ] T035 [US5] Wire aiEnabled changes to useUpdateOutcome mutation

**Checkpoint**: US5 complete - Admin can toggle AI generation on/off

---

## Phase 7: User Story 6 - Validate and Publish (Priority: P3)

**Goal**: Admin receives clear validation feedback when publishing

**Independent Test**: Leave prompt empty with AI enabled → Click publish → See "Prompt is required" error inline

### Implementation for User Story 6

- [ ] T036 [US6] Create validation hook in `apps/clementine-app/src/domains/experience/create/hooks/useOutcomeValidation.ts`
- [ ] T037 [US6] Create `apps/clementine-app/src/domains/experience/create/components/CreateTabForm/ValidationSummary.tsx` for error display
- [ ] T038 [US6] Integrate ValidationSummary into CreateTabForm.tsx (top of form)
- [ ] T039 [US6] Add inline error display next to invalid fields
- [ ] T040 [US6] Wire validation errors to publish button (disable when errors exist)
- [ ] T041 [US6] Update hooks barrel exports in `apps/clementine-app/src/domains/experience/create/hooks/index.ts`

**Checkpoint**: US6 complete - Admin sees validation errors before publishing

---

## Phase 8: Cleanup & Polish

**Purpose**: Remove legacy code and finalize

- [ ] T042 [P] Delete `apps/clementine-app/src/domains/experience/create/components/NodeListItem/` directory
- [ ] T043 [P] Delete `apps/clementine-app/src/domains/experience/create/components/EmptyState.tsx` (if node-specific)
- [ ] T044 [P] Delete `apps/clementine-app/src/domains/experience/create/components/AddNodeButton.tsx`
- [ ] T045 [P] Delete `apps/clementine-app/src/domains/experience/create/components/DeleteNodeDialog.tsx`
- [ ] T046 [P] Delete `apps/clementine-app/src/domains/experience/create/components/NodeEditorPanel.tsx`
- [ ] T047 [P] Delete `apps/clementine-app/src/domains/experience/create/containers/TransformPipelineEditor.tsx`
- [ ] T048 [P] Delete `apps/clementine-app/src/domains/experience/create/lib/transform-operations.ts`
- [ ] T049 [P] Delete `apps/clementine-app/src/domains/experience/create/hooks/useUpdateTransformNodes.ts`
- [ ] T050 Update all barrel exports to remove deleted components
- [ ] T051 Update domain exports in `apps/clementine-app/src/domains/experience/create/index.ts`
- [ ] T052 Run `pnpm app:check` (lint + format)
- [ ] T053 Run `pnpm app:type-check` and fix any errors
- [ ] T054 Manual testing: verify Create tab matches PRD wireframe
- [ ] T055 Manual testing: verify mobile viewport and 44px touch targets

**Checkpoint**: Feature complete - all legacy code removed, all tests passing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phases 3-7 (User Stories)**: All depend on Phase 2 completion
  - US1+2 (P1) → MVP, implement first
  - US3, US4, US5 (P2) → Can proceed in parallel after US1+2
  - US6 (P3) → Depends on form being complete
- **Phase 8 (Cleanup)**: Depends on all user stories being complete

### User Story Dependencies

- **US1+2 (P1)**: Can start after Foundational - No dependencies on other stories
- **US3 (P2)**: Can start after Foundational - Integrates with CreateTabForm from US1+2
- **US4 (P2)**: Can start after Foundational - Uses refactored PromptComposer from Phase 2
- **US5 (P2)**: Can start after Foundational - Integrates with CreateTabForm from US1+2
- **US6 (P3)**: Should start after US1-5 - Validates all form fields

### Within Each Phase

- Tasks marked [P] can run in parallel
- Sequential tasks depend on prior tasks in the list
- Complete phase before moving to next

### Parallel Opportunities

**Phase 2 (Foundational)**:
```bash
# Can run in parallel:
T007: Create model-options.ts
T008: Create outcome-operations.ts
```

**Phase 3 (US1+2)**:
```bash
# Can run in parallel:
T015: Create OutcomeTypeSelector.tsx
T016: Create barrel export index.ts
```

**Phase 8 (Cleanup)**:
```bash
# All deletions can run in parallel:
T042-T049: Delete all legacy files
```

---

## Implementation Strategy

### MVP First (User Stories 1+2 Only)

1. Complete Phase 1: Setup (schema rename)
2. Complete Phase 2: Foundational (hooks, refactoring)
3. Complete Phase 3: User Story 1+2 (outcome type + AI generation)
4. **STOP and VALIDATE**: Test MVP independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1+2 → Test independently → Deploy (MVP!)
3. Add US3 (source image) → Test → Deploy
4. Add US4 (reference images) → Test → Deploy
5. Add US5 (AI toggle) → Test → Deploy
6. Add US6 (validation) → Test → Deploy
7. Cleanup → Final deploy

### Suggested MVP Scope

**Tasks T001-T022** = Complete MVP with:
- Schema rename
- Core infrastructure
- Outcome type selector
- AI generation configuration (prompt, model, aspect ratio)
- Persistence to Firestore

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `pnpm app:check` frequently to catch issues early
