# Tasks: Experience-Level Aspect Ratio & Overlay System

**Input**: Design documents from `/specs/065-exp-aspect-ratio-overlays/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests NOT explicitly requested in spec. Manual verification via quickstart.md testing checklist.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Shared Package**: `packages/shared/src/schemas/`
- **Frontend App**: `apps/clementine-app/src/domains/`
- **Backend Functions**: `functions/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create canonical aspect ratio schema - single source of truth for all downstream work

- [ ] T001 Create canonical aspect ratio schema with `aspectRatioSchema`, `overlayKeySchema`, `imageAspectRatioSchema`, `videoAspectRatioSchema` in `packages/shared/src/schemas/media/aspect-ratio.schema.ts`
- [ ] T002 Update media barrel export to include aspect-ratio module in `packages/shared/src/schemas/media/index.ts`
- [ ] T003 Update root schemas barrel export in `packages/shared/src/schemas/index.ts`
- [ ] T004 Build shared package and verify no type errors: `pnpm --filter @clementine/shared build`

**Checkpoint**: Canonical aspect ratio types available for import by all packages

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema changes that ALL user stories depend on - must complete before any UI or backend work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Extend `overlaysConfigSchema` to support 5 keys (1:1, 3:2, 2:3, 9:16, default) in `packages/shared/src/schemas/project/project-config.schema.ts`
- [ ] T006 [P] Update `outcome.schema.ts`: add top-level `aspectRatio` field (import from canonical schema), keep `imageGeneration.aspectRatio` for backwards compatibility, remove 16:9 option in `packages/shared/src/schemas/experience/outcome.schema.ts`
- [ ] T007 [P] Update `capture-photo.schema.ts` to import from canonical aspect-ratio schema in `packages/shared/src/schemas/experience/steps/capture-photo.schema.ts`
- [ ] T008 Flatten job snapshot: add `overlayChoice` and `experienceRef` at top level, remove `projectContext` wrapper and deprecated exports in `packages/shared/src/schemas/job/job.schema.ts`
- [ ] T009 Rebuild shared package and run tests: `pnpm --filter @clementine/shared build && pnpm --filter @clementine/shared test`

**Checkpoint**: Foundation ready - all schema changes complete, user story implementation can now begin

---

## Phase 3: User Story 1 - Configure Experience Output Aspect Ratio (Priority: P1) 🎯 MVP

**Goal**: Experience Creators can select output aspect ratio as a top-level outcome setting (FR-001, FR-002, FR-004)

**Architecture Decision**: Aspect ratio is a fundamental output characteristic, not an AI-specific setting. It affects:
- Camera capture constraints (US3)
- Overlay resolution (US4)
- AI generation dimensions (US5)

**Independent Test**: Create an experience, select aspect ratio from top-level selector (alongside source media), verify dropdown shows correct options (1:1, 3:2, 2:3, 9:16 for image; 9:16, 1:1 for video)

### Implementation for User Story 1

- [ ] T010 [US1] Update `ASPECT_RATIOS` constant to import from canonical schema (remove 16:9) in `apps/clementine-app/src/domains/experience/create/lib/model-options.ts`
- [ ] T011 [US1] Create `AspectRatioSelector` component for top-level aspect ratio selection in `apps/clementine-app/src/domains/experience/create/components/CreateTabForm/AspectRatioSelector.tsx`
- [ ] T012 [US1] Add AspectRatioSelector to CreateTabForm alongside SourceImageSelector (top-level config), add handler for `outcome.aspectRatio` in `apps/clementine-app/src/domains/experience/create/components/CreateTabForm/CreateTabForm.tsx`
- [ ] T013 [US1] Hide aspect ratio control from PromptComposer (keep prop for future use, just don't render) in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/PromptComposer.tsx`
- [ ] T014 [US1] Run frontend type check to verify no breaking changes: `pnpm app:type-check`

**Checkpoint**: User Story 1 complete - Experience Creators see aspect ratio as top-level output setting alongside source media

---

## Phase 4: User Story 2 - Manage Project-Level Overlays by Aspect Ratio (Priority: P2)

**Goal**: Project Owners can configure overlays for all 5 aspect ratio slots including default fallback (FR-005, FR-006)

**Independent Test**: Navigate to Project Settings → Overlays, see 5 slots (1:1, 3:2, 2:3, 9:16, Default), upload overlay to each slot

### Implementation for User Story 2

- [ ] T015 [US2] Update OverlaySection to render 5 overlay slots in responsive grid (2 cols mobile, 3+ desktop) in `apps/clementine-app/src/domains/project-config/settings/components/OverlaySection.tsx`
- [ ] T016 [P] [US2] Update OverlayFrame to support "default" variant styling (different icon, dashed border) in `apps/clementine-app/src/domains/project-config/settings/components/OverlayFrame.tsx`
- [ ] T017 [US2] Update useUpdateOverlays hook to handle new aspect ratio keys (3:2, 2:3, default) in `apps/clementine-app/src/domains/project-config/settings/hooks/useUpdateOverlays.ts`
- [ ] T018 [US2] Verify upload/remove works for all 5 slots via manual testing

**Checkpoint**: User Story 2 complete - Project Owners can upload overlays for all aspect ratios plus default

---

## Phase 5: User Story 3 - Camera and Input Alignment (Priority: P3)

**Goal**: Camera capture and image crop interfaces constrain to experience's output aspect ratio (FR-013, FR-014, FR-015)

**Independent Test**: Open capture for experience with 3:2 aspect ratio, verify camera preview shows 3:2 frame; upload image, verify crop is locked to 3:2

### Implementation for User Story 3

- [ ] T019 [US3] Review CapturePhotoConfigPanel for aspect ratio sync with experience outcome in `apps/clementine-app/src/domains/experience/steps/config-panels/CapturePhotoConfigPanel.tsx`
- [ ] T020 [US3] Verify capture step reads aspect ratio from top-level `outcome.aspectRatio` (may already work after T006)
- [ ] T021 [US3] Manual test: create experience with each aspect ratio, verify camera preview matches

**Checkpoint**: User Story 3 complete - Guest capture UI respects experience aspect ratio

---

## Phase 6: User Story 4 - Automatic Overlay Resolution at Job Execution (Priority: P4)

**Goal**: System automatically selects and applies correct overlay with fallback behavior (FR-007, FR-008, FR-009, FR-010, FR-011)

**Architecture Note**: Overlay resolution uses top-level `outcome.aspectRatio` (not `imageGeneration.aspectRatio`)

**Independent Test**: Create jobs with various overlay configurations, verify correct overlay is applied (exact match → default → none)

### Implementation for User Story 4

- [ ] T022 [US4] Create fetchProject helper function to retrieve project with overlay config in `functions/src/repositories/project.ts`
- [ ] T023 [US4] Add resolveOverlayChoice function implementing fallback logic using `outcome.aspectRatio` (exact → default → null) in `functions/src/callable/startTransformPipeline.ts`
- [ ] T024 [US4] Update startTransformPipeline to fetch project, resolve overlay choice using top-level aspectRatio, and pass to buildJobSnapshot in `functions/src/callable/startTransformPipeline.ts`
- [ ] T025 [US4] Update buildJobSnapshot to accept overlayChoice and experienceRef parameters, remove projectContext building in `functions/src/repositories/job.ts`
- [ ] T026 [US4] Update imageOutcome to use `snapshot.overlayChoice` directly instead of resolution logic in `functions/src/services/transform/outcomes/imageOutcome.ts`
- [ ] T027 [US4] Remove `getOverlayForAspectRatio` helper function (no longer needed) from `functions/src/services/transform/operations/applyOverlay.ts`
- [ ] T028 [US4] Build functions and verify no type errors: `cd functions && pnpm build`

**Checkpoint**: User Story 4 complete - Overlay resolution happens at job creation using top-level aspectRatio, transform uses pre-resolved choice

---

## Phase 7: User Story 5 - AI Generation Aspect Ratio Enforcement (Priority: P5)

**Goal**: AI generation receives explicit aspect ratio parameter from experience config (FR-016, FR-017, FR-018)

**Architecture Note**: AI generation uses top-level `outcome.aspectRatio` (consistent with overlay resolution)

**Independent Test**: Trigger AI generation, verify output matches experience aspect ratio without post-processing

### Implementation for User Story 5

- [ ] T029 [US5] Update imageOutcome to read aspect ratio from top-level `snapshot.outcome.aspectRatio` instead of `imageGeneration.aspectRatio` in `functions/src/services/transform/outcomes/imageOutcome.ts`
- [ ] T030 [US5] Verify no post-generation cropping/resizing occurs in image pipeline
- [ ] T031 [US5] Manual test: create experience with 3:2, trigger generation, verify output dimensions

**Checkpoint**: User Story 5 complete - AI generation uses top-level aspectRatio, produces correct dimensions

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and final verification

- [ ] T032 [P] Run full lint and type check across monorepo: `pnpm app:check`
- [ ] T033 [P] Run shared package tests: `pnpm --filter @clementine/shared test`
- [ ] T034 [P] Run frontend tests: `pnpm app:test`
- [ ] T035 Execute quickstart.md testing checklist (overlay upload flow, experience config flow, overlay resolution flow)
- [ ] T036 Review code against `standards/frontend/design-system.md` for UI components
- [ ] T037 Review code against `standards/global/zod-validation.md` for schema definitions
- [ ] T038 Final build verification: `pnpm app:build && pnpm functions:build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 → US2 → US3 → US4 → US5 (recommended sequential order)
  - US1, US2, US3 can run in parallel (frontend only)
  - US4 depends on schema changes (Phase 2)
  - US5 depends on US4 (uses job snapshot changes)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational - May need US1 for aspect ratio sync
- **User Story 4 (P4)**: Can start after Foundational - Uses flattened job schema
- **User Story 5 (P5)**: Soft dependency on US4 (uses same snapshot structure)

### Within Each User Story

- Schema changes before UI changes
- UI changes before backend changes
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T006, T007 can run in parallel (different schema files)
- T015, T016 can run in parallel (different component files)
- T032, T033, T034 can run in parallel (independent validation)
- US1, US2, US3 frontend work can proceed in parallel if team capacity allows

---

## Parallel Example: Phase 2 (Foundational)

```bash
# After T005 completes, launch T006 and T007 in parallel:
Task: "Update outcome.schema.ts - add top-level aspectRatio"
Task: "Update capture-photo.schema.ts to import from canonical aspect-ratio"
```

## Parallel Example: User Story 2

```bash
# Launch overlay component updates in parallel:
Task: "Update OverlaySection to render 5 slots"
Task: "Update OverlayFrame for default variant styling"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (canonical schema)
2. Complete Phase 2: Foundational (all schema changes)
3. Complete Phase 3: User Story 1 (experience aspect ratio config)
4. Complete Phase 4: User Story 2 (overlay management UI)
5. **STOP and VALIDATE**: Test overlay upload, experience config
6. Deploy/demo if ready - creators can configure experiences and overlays

### Incremental Delivery

1. Complete Setup + Foundational → Schema foundation ready
2. Add User Story 1 → Experience aspect ratio selection works
3. Add User Story 2 → Overlay management UI complete → **MVP Demo!**
4. Add User Story 3 → Camera/crop aligned to experience
5. Add User Story 4 → Automatic overlay resolution backend → **Full Feature!**
6. Add User Story 5 → AI generation enforcement → **Complete**

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 → User Story 3 (frontend)
   - Developer B: User Story 2 → User Story 4 (backend prep)
3. Sync for US4 backend integration
4. Both review US5

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `pnpm app:check` frequently to catch issues early
- No tests explicitly requested - rely on manual testing via quickstart.md checklist
