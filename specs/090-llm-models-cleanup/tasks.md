# Tasks: LLM Models Cleanup & UI Adjustments

**Input**: Design documents from `/specs/090-llm-models-cleanup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No tests requested for this cleanup task.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Rebuild shared package to ensure clean baseline before making changes

- [x] T001 Build shared package to verify clean baseline: `pnpm --filter @clementine/shared build`

---

## Phase 2: User Story 1 - Remove Deprecated AI Image Model (Priority: P1)

**Goal**: Completely remove `gemini-3-pro-image-preview` from all layers (shared schema, backend, frontend)

**Independent Test**: Run `grep -r "gemini-3-pro-image-preview" apps/ functions/ packages/shared/src/` and confirm zero results. Run `pnpm app:type-check` and `pnpm functions:build` with no errors.

### Implementation for User Story 1

- [x] T002 [US1] Remove `'gemini-3-pro-image-preview'` from the `aiImageModelSchema` Zod enum in `packages/shared/src/schemas/experience/experience-config.schema.ts`
- [x] T003 [US1] Rebuild shared package after schema change: `pnpm --filter @clementine/shared build`
- [x] T004 [P] [US1] Update `MOCKED_AI_CONFIG` to use a valid model (e.g., `gemini-2.5-flash-image`) in `functions/src/services/ai/config.ts`
- [x] T005 [P] [US1] Remove `gemini-3-pro-image-preview` from `getLocationForModel()` and associated comment in `functions/src/services/transform/operations/aiGenerateImage.ts`
- [x] T006 [P] [US1] Remove or update comment referencing `gemini-3-pro-image-preview` in `functions/src/services/ai/providers/types.ts`
- [x] T007 [P] [US1] Remove the `{ value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' }` entry from `AI_IMAGE_MODELS` array in `apps/clementine-app/src/domains/experience/create/lib/model-options.ts`
- [x] T008 [US1] Run type-check and build across all workspaces to verify no breakage: `pnpm app:type-check && pnpm functions:build`

**Checkpoint**: Zero references to `gemini-3-pro-image-preview` in source code. All builds and type-checks pass.

---

## Phase 3: User Story 2 - Hide Enhance Prompt Control (Priority: P2)

**Goal**: Hide the "Enhance Prompt" toggle in PromptComposer without deleting code

**Independent Test**: Open the PromptComposer in the dev server for a video experience and confirm the "Enhance" toggle is not visible. Confirm the source code for the enhance control still exists in `ControlRow.tsx`.

### Implementation for User Story 2

- [x] T009 [US2] Add `const ENABLE_ENHANCE_PROMPT = false` constant and wrap the enhance control render block with `{ENABLE_ENHANCE_PROMPT && (...)}` in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/ControlRow.tsx`

**Checkpoint**: Enhance toggle is hidden in UI. Code is preserved. Layout renders correctly.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all workspaces

- [x] T010 Run full lint and format check: `pnpm app:check`
- [x] T011 Run quickstart.md validation steps (grep for removed model, visual check of PromptComposer)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **User Story 1 (Phase 2)**: Depends on Setup (T001). T002-T003 must run first (schema change + rebuild), then T004-T007 can run in parallel
- **User Story 2 (Phase 3)**: Independent of User Story 1 - can run in parallel
- **Polish (Phase 4)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories. Internal order: T002 → T003 → T004/T005/T006/T007 (parallel) → T008
- **User Story 2 (P2)**: No dependencies on other stories. Single task (T009)

### Parallel Opportunities

- T004, T005, T006, T007 can all run in parallel (different files, no dependencies after T003)
- User Story 1 and User Story 2 can run in parallel (independent stories)

---

## Parallel Example: User Story 1

```bash
# After T003 (shared package rebuild), launch these in parallel:
Task: "T004 - Update MOCKED_AI_CONFIG in functions/src/services/ai/config.ts"
Task: "T005 - Remove from getLocationForModel() in functions/src/services/transform/operations/aiGenerateImage.ts"
Task: "T006 - Update comment in functions/src/services/ai/providers/types.ts"
Task: "T007 - Remove from AI_IMAGE_MODELS in apps/clementine-app/src/domains/experience/create/lib/model-options.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: User Story 1 (T002-T008)
3. **STOP and VALIDATE**: Grep confirms zero references, builds pass
4. Deploy/demo if ready

### Incremental Delivery

1. Setup → User Story 1 → Validate (model fully removed)
2. Add User Story 2 → Validate (enhance hidden, layout intact)
3. Polish → Final validation → Ready for PR

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each phase checkpoint
- This is a small cleanup task — total estimated: 11 tasks across 4 phases
