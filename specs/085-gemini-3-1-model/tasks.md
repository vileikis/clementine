# Tasks: Gemini 3.1 Flash Image Model Support

**Input**: Design documents from `/specs/085-gemini-3-1-model/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not requested. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared schema that both user stories depend on

**CRITICAL**: Both user stories require the shared model enum to include the new value before any frontend or backend work can proceed.

- [X] T001 Add `'gemini-3.1-flash-image-preview'` to the `aiImageModelSchema` Zod enum in `packages/shared/src/schemas/experience/experience-config.schema.ts`
- [X] T002 Build shared package to verify schema compiles: `pnpm --filter @clementine/shared build`

**Checkpoint**: Shared schema now accepts `gemini-3.1-flash-image-preview` as a valid model. `AIImageModel` type is updated.

---

## Phase 2: User Story 1 - Experience Creator Selects Gemini 3.1 Flash Model (Priority: P1)

**Goal**: Experience creators can select "Gemini 3.1 Flash" from the model dropdown in the experience builder.

**Independent Test**: Create a new AI image experience, open the model dropdown, verify "Gemini 3.1 Flash" appears, select it, save, reload, and confirm the selection persists.

### Implementation for User Story 1

- [X] T003 [US1] Add `{ value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash' }` to the `AI_IMAGE_MODELS` array in `apps/clementine-app/src/domains/experience/create/lib/model-options.ts`

**Checkpoint**: "Gemini 3.1 Flash" appears in the experience builder model dropdown and can be saved.

---

## Phase 3: User Story 2 - Guest Receives AI-Transformed Image Using Gemini 3.1 Flash (Priority: P1)

**Goal**: Backend routes Gemini 3.1 Flash requests to the global region for image generation.

**Independent Test**: Trigger an image generation job with model `gemini-3.1-flash-image-preview` and verify the Vertex AI client is initialized with `location: 'global'`.

### Implementation for User Story 2

- [X] T004 [US2] Update `getLocationForModel()` in `functions/src/services/transform/operations/aiGenerateImage.ts` to return `'global'` for `'gemini-3.1-flash-image-preview'` (add to the existing condition alongside `gemini-3-pro-image-preview`)

**Checkpoint**: Backend correctly routes Gemini 3.1 Flash requests to the global region.

---

## Phase 4: Polish & Validation

**Purpose**: Verify all changes compile, lint, and pass type checks across the monorepo

- [X] T005 [P] Build functions to verify backend compiles: `pnpm functions:build`
- [X] T006 [P] Run app type-check: `pnpm app:type-check`
- [X] T007 Run lint and format check: `pnpm app:check`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately. BLOCKS all user stories.
- **User Story 1 (Phase 2)**: Depends on Phase 1 (shared schema)
- **User Story 2 (Phase 3)**: Depends on Phase 1 (shared schema)
- **Polish (Phase 4)**: Depends on Phases 2 and 3

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependency on User Story 2
- **User Story 2 (P1)**: Can start after Foundational — no dependency on User Story 1
- **US1 and US2 can run in parallel** since they modify different files

### Parallel Opportunities

- T003 and T004 can run in parallel (different files, no dependencies on each other)
- T005 and T006 can run in parallel (independent build/check commands)

---

## Parallel Example: User Stories 1 & 2

```bash
# After Phase 1 (Foundational) completes, launch both stories in parallel:
Task T003: "Add model option to AI_IMAGE_MODELS in model-options.ts"
Task T004: "Update getLocationForModel() in aiGenerateImage.ts"
```

---

## Implementation Strategy

### MVP First (All-in-One)

Given the minimal scope (3 files, ~5 lines), the entire feature can be delivered as a single increment:

1. Complete Phase 1: Foundational (shared schema)
2. Complete Phase 2 & 3 in parallel: US1 (frontend) + US2 (backend)
3. Complete Phase 4: Validation
4. **VALIDATE**: Manual test — create experience with Gemini 3.1 Flash, verify dropdown and save

### Incremental Delivery (If Preferred)

1. Phase 1 → Schema ready
2. Phase 2 → Creators can select the model (frontend-only MVP)
3. Phase 3 → Backend processes the model (end-to-end complete)
4. Phase 4 → All validation gates pass

---

## Notes

- Total: 7 tasks across 4 phases
- No test tasks (not requested in spec)
- All changes are additive — no risk to existing model support
- T003 and T004 modify different files and can safely run in parallel
- The entire feature can be completed in a single commit given its minimal scope
