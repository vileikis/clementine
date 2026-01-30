# Tasks: Inline Prompt Architecture - Phase 1a & 1b Foundation

**Input**: Design documents from `/specs/048-inline-prompt-phase-1ab/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are included for schema validation only (critical for data integrity). UI component tests are optional/manual per project standards.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `packages/shared/`, `apps/clementine-app/`
- **Shared schemas**: `packages/shared/src/schemas/`
- **Frontend app**: `apps/clementine-app/src/domains/experience/`
- All paths are absolute from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and verification

- [X] T001 Verify branch `048-inline-prompt-phase-1ab` is checked out with latest changes
- [X] T002 Install dependencies with `pnpm install` from repository root
- [X] T003 [P] Verify baseline with `pnpm app:check && pnpm app:type-check` (no errors expected)

---

## Phase 2: Foundational (Blocking Prerequisites - User Story 3)

**Purpose**: Core schema infrastructure that MUST be complete before UI implementation

**⚠️ CRITICAL**: This is User Story 3 (P1 priority) - schema updates that block all other work

### User Story 3: Update Experience Schemas for AI Features (Priority: P1)

**Goal**: Update Zod schemas to support step names (required), AI-aware option fields (promptFragment, promptMedia), and AI image node configuration

**Independent Test**: Run schema unit tests to verify all validations pass: step names are required, regex validation works, promptFragment/promptMedia are optional, and TypeScript types are correctly generated

### Schema Tests (CRITICAL - Write FIRST, ensure FAIL before implementation)

- [X] T004 [P] [US3] Create test file `packages/shared/src/schemas/experience/step.schema.test.ts` with tests for step name validation (required, regex, max length, trim)
- [X] T005 [P] [US3] Create test file `packages/shared/src/schemas/experience/steps/input-multi-select.schema.test.ts` with tests for MultiSelectOption schema (promptFragment max 500 chars, promptMedia optional MediaReference)
- [X] T006 [P] [US3] Add test cases for AIImageNode schema in `packages/shared/src/schemas/experience/transform.schema.test.ts` (model validation, aspectRatio enum, refMedia array)

### Schema Implementation

- [X] T007 [P] [US3] Update `experienceStepNameSchema` in `packages/shared/src/schemas/experience/step.schema.ts` (remove `.optional()`, add regex `/^[a-zA-Z0-9 \-_]+$/`, add `.trim()`, set min 1 max 50)
- [X] T008 [P] [US3] Update `multiSelectOptionSchema` in `packages/shared/src/schemas/experience/steps/input-multi-select.schema.ts` (change from `z.string()` array to object schema with `value`, `promptFragment: z.string().max(500).optional()`, `promptMedia: mediaReferenceSchema.optional()`)
- [X] T009 [P] [US3] Create `refMediaEntrySchema` in `packages/shared/src/schemas/experience/transform.schema.ts` (extend mediaReferenceSchema with `displayName: z.string()`)
- [X] T010 [P] [US3] Create `aiImageNodeConfigSchema` in `packages/shared/src/schemas/experience/transform.schema.ts` (fields: model, aspectRatio enum, prompt string, refMedia array)
- [X] T011 [P] [US3] Update `transformNodeSchema` in `packages/shared/src/schemas/experience/transform.schema.ts` to include discriminated union for ai.imageGeneration type
- [X] T012 [P] [US3] Remove obsolete `variableMappings` field from `transformConfigSchema` in `packages/shared/src/schemas/experience/transform.schema.ts`
- [X] T013 [US3] Build shared package with `pnpm --filter @clementine/shared build` to generate TypeScript types
- [X] T014 [US3] Run schema tests with `pnpm --filter @clementine/shared test` and verify 100% pass rate (all T004-T006 tests should now PASS)

**Checkpoint**: Foundation ready - UI implementation (User Stories 1 & 2) can now begin in parallel

---

## Phase 3: User Story 1 - Configure AI-Aware Step Names (Priority: P1) 🎯 MVP

**Goal**: Enable experience creators to assign unique, human-readable names to experience steps with inline editing, uniqueness validation, and auto-save

**Independent Test**: Create an experience, add steps, edit step names with spaces (e.g., "Pet Choice"), validate uniqueness on blur, and verify the step list displays custom names. Test rename via context menu dialog.

### Implementation for User Story 1

#### Validation Hook

- [X] T015 [US1] Create `useValidateStepName` hook in `apps/clementine-app/src/domains/experience/designer/hooks/useValidateStepName.ts` (Zod validation + O(n) uniqueness check, returns `{ valid: boolean; error?: string }`)

#### Step Name Editor Components

- [~] T016 [P] [US1] ~~Create `StepNameEditor` component~~ **SKIPPED** - Context menu rename is sufficient, inline editor would add unnecessary clutter to config panels
- [X] T017 [P] [US1] Create `RenameStepDialog` component in `apps/clementine-app/src/domains/experience/designer/components/RenameStepDialog.tsx` (modal dialog with input field, validation, cursor positioned at end, Enter to save, Escape to cancel)

#### Update StepList

- [X] T018 [US1] Update `StepList.tsx` in `apps/clementine-app/src/domains/experience/designer/components/StepList.tsx` to display `step.name` with step type badge
- [X] T019 [US1] Update `StepList.tsx` context menu to add "Rename..." option before "Delete" option (opens RenameStepDialog)

#### Add to Config Panels

- [~] T020 [P] [US1] ~~Add StepNameEditor to top of `InputMultiSelectStepConfigPanel`~~ **SKIPPED** - Not needed, see T016
- [~] T021 [P] [US1] ~~Add StepNameEditor to top of `CapturePhotoStepConfigPanel`~~ **SKIPPED** - Not needed, see T016
- [~] T022 [P] [US1] ~~Add StepNameEditor to top of `InputShortTextStepConfigPanel`~~ **SKIPPED** - Not needed, see T016

#### Auto-Generate Names on Creation

- [X] T023 [US1] ~~Update step creation logic~~ **VERIFIED** - `createStep()` already auto-generates names, `ensureAllStepsHaveNames()` handles backward compatibility

**Checkpoint**: ✅ **Phase 3 Complete** - User Story 1 is fully functional: creators can rename steps via context menu, see custom names in step list, experience uniqueness validation, and auto-generated names on step creation

---

## Phase 4: User Story 2 - Add AI Context to Multiselect Options (Priority: P2)

**Goal**: Enable experience creators to add optional AI context (text fragments and reference media) to multiselect options with visual AI-enabled indicators

**Independent Test**: Edit a multiselect step, add promptFragment text and promptMedia to an option, save, and verify data persists. Check that AI-enabled badge appears in option list.

### Implementation for User Story 2

#### Prompt Fragment Input Component

- [X] T024 [US2] Create `PromptFragmentInput` component in `apps/clementine-app/src/domains/experience/steps/config-panels/components/PromptFragmentInput.tsx` (textarea with max 500 chars, character counter, debounced onChange callback, help text)

#### Prompt Media Picker Component

- [X] T025 [US2] Create `PromptMediaPicker` component in `apps/clementine-app/src/domains/experience/steps/config-panels/components/PromptMediaPicker.tsx` (upload button or media library picker, thumbnail display with remove button, uses Firebase Storage upload)
- [X] T026 [US2] Create `useUploadPromptMedia` hook in `apps/clementine-app/src/domains/experience/designer/hooks/useUploadPromptMedia.ts` (adapt existing useUploadExperienceCover pattern, upload to `prompt-media/{workspaceId}/{mediaAssetId}`, return MediaReference)

#### Update Option Editor

- [X] T027 [US2] Update `InputMultiSelectConfigPanel` component to add PromptFragmentInput and PromptMediaPicker fields with collapsible sections for each option (follows callback pattern from Decision 6 in plan.md)
- [X] T028 [US2] Update `InputMultiSelectConfigPanel` to implement `handleOptionChange(index, updates)` callback that flows to `onConfigChange({ options: [...] })` (see quickstart.md Step 8)

#### AI-Enabled Badge (OPTIONAL - LOWEST PRIORITY)

- [X] T029 [US2] Create `AIEnabledBadge` component in `apps/clementine-app/src/domains/experience/steps/components/AIEnabledBadge.tsx` (simple text indicator with sparkle emoji, shows when promptFragment OR promptMedia is set)
- [X] T030 [US2] Add AIEnabledBadge to OptionListItem display (conditional render when option has AI context)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - creators can configure step names and add AI context to options

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation, documentation, and final checks

- [X] T031 [P] Run `pnpm app:check` to verify formatting and linting pass
- [X] T032 [P] Run `pnpm app:type-check` to verify TypeScript has no errors
- [ ] T033 Run manual testing checklist from `specs/048-inline-prompt-phase-1ab/quickstart.md` (Testing & Validation section)
- [ ] T034 Verify all acceptance scenarios from spec.md are met for User Stories 1, 2, and 3
- [ ] T035 Test backward compatibility: create experience with old schema, open in designer, verify fallback displays, edit step to auto-generate name

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2 - US3)**: Depends on Setup completion - BLOCKS User Stories 1 & 2
- **User Story 1 (Phase 3 - P1)**: Depends on Foundational (US3) completion - Can run in parallel with US2
- **User Story 2 (Phase 4 - P2)**: Depends on Foundational (US3) completion - Can run in parallel with US1
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 3 (P1 - Schemas)**: Can start after Setup - No dependencies on other stories (foundational infrastructure)
- **User Story 1 (P1 - Step Names)**: Can start after US3 - No dependencies on US2 (independently testable)
- **User Story 2 (P2 - AI Options)**: Can start after US3 - No dependencies on US1 (independently testable, though UI coexists in same config panels)

### Within Each User Story

**User Story 3 (Schemas)**:
- Tests (T004-T006) MUST be written and FAIL before implementation
- Schema updates (T007-T012) can run in parallel (different files)
- Build (T013) must complete before tests (T014)

**User Story 1 (Step Names)**:
- Validation hook (T015) before editor components (T016-T017)
- Editor components (T016-T017) can run in parallel (different files)
- StepList updates (T018-T019) can run in parallel with config panel updates (T020-T022)
- Config panel updates (T020-T022) can run in parallel (different files)
- Auto-generate logic (T023) can run in parallel with other tasks

**User Story 2 (AI Options)**:
- Input components (T024-T025) can run in parallel (different files)
- Upload hook (T026) can run in parallel with components
- Option editor update (T027) depends on components (T024-T025)
- Config panel update (T028) can run in parallel with editor (T027)
- Badge component (T029-T030) is optional and can be last

### Parallel Opportunities

- All Setup tasks (T001-T003) can run in parallel if multiple terminals available
- All Schema tests (T004-T006) can run in parallel (different files)
- All Schema implementations (T007-T012) can run in parallel (different files)
- User Story 1 and User Story 2 can be worked on in parallel after US3 completes (if team capacity allows)
- Within US1: Tasks T016-T017, T018-T019, T020-T022 can run in parallel
- Within US2: Tasks T024-T026 can run in parallel, T027-T028 can run in parallel
- All Polish tasks (T031-T032) can run in parallel

---

## Parallel Example: User Story 3 (Schemas)

```bash
# Launch all schema tests together (write these FIRST, ensure FAIL):
Task T004: "Create step.schema.test.ts with step name validation tests"
Task T005: "Create input-multi-select.schema.test.ts with option AI field tests"
Task T006: "Add AIImageNode schema tests to transform.schema.test.ts"

# Launch all schema implementations together:
Task T007: "Update experienceStepNameSchema in step.schema.ts"
Task T008: "Update multiSelectOptionSchema in input-multi-select.schema.ts"
Task T009: "Create refMediaEntrySchema in transform.schema.ts"
Task T010: "Create aiImageNodeConfigSchema in transform.schema.ts"
Task T011: "Update transformNodeSchema discriminated union in transform.schema.ts"
Task T012: "Remove variableMappings from transformConfigSchema in transform.schema.ts"
```

## Parallel Example: User Story 1 (Step Names)

```bash
# Launch editor components together:
Task T016: "Create StepNameEditor component"
Task T017: "Create RenameStepDialog component"

# Launch StepList and config panel updates together:
Task T018: "Update StepList to display step names"
Task T019: "Add Rename to StepList context menu"
Task T020: "Add StepNameEditor to InputMultiSelectStepConfigPanel"
Task T021: "Add StepNameEditor to CapturePhotoStepConfigPanel"
Task T022: "Add StepNameEditor to InputShortTextStepConfigPanel"
```

## Parallel Example: User Story 2 (AI Options)

```bash
# Launch input components and hook together:
Task T024: "Create PromptFragmentInput component"
Task T025: "Create PromptMediaPicker component"
Task T026: "Create useUploadPromptMedia hook"

# Launch editor and config panel updates together:
Task T027: "Update MultiSelectOptionEditor to add AI fields"
Task T028: "Update InputMultiSelectConfigPanel callback handler"
```

---

## Implementation Strategy

### MVP First (User Story 3 + User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational / User Story 3 (T004-T014) - CRITICAL, blocks all UI
3. Complete Phase 3: User Story 1 (T015-T023)
4. **STOP and VALIDATE**: Test User Story 1 independently per quickstart.md
5. Deploy/demo if ready (creators can now configure step names)

### Incremental Delivery

1. Complete Setup + Foundational (US3) → Schema foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! - step names configured)
3. Add User Story 2 → Test independently → Deploy/Demo (AI context on options)
4. Polish (Phase 5) → Final validation and deployment
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational (US3) together
2. Once Foundational is done:
   - Developer A: User Story 1 (Step Names) - T015-T023
   - Developer B: User Story 2 (AI Options) - T024-T030
3. Stories complete independently, integrate seamlessly (coexist in config panels)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- User Story 3 is foundational infrastructure (schemas), not a user-facing story - must complete first
- User Stories 1 and 2 are independently completable and testable
- Schema tests (T004-T006) MUST fail before implementation (TDD for critical validation)
- Verify all schema tests pass (T014) before starting UI work
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow callback architecture pattern (Decision 6 in plan.md) for option editor updates
- AIEnabledBadge (T029-T030) is optional lowest priority - evaluate value after implementation

---

## Task Count Summary

- **Total Tasks**: 35
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (US3 - Schemas)**: 11 tasks (3 tests + 8 implementation)
- **Phase 3 (US1 - Step Names)**: 9 tasks
- **Phase 4 (US2 - AI Options)**: 7 tasks
- **Phase 5 (Polish)**: 5 tasks

**Parallel Opportunities**: 22 tasks marked [P] can run in parallel with other tasks

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 = 23 tasks (Setup + Schemas + Step Names)

**Independent Test Criteria**:
- US3: Run `pnpm --filter @clementine/shared test` → 100% schema tests pass
- US1: Create experience, rename steps via context menu and inline editor, see custom names in list
- US2: Add promptFragment and promptMedia to options, see AI badge, verify persistence
