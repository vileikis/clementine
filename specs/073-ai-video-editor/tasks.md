# Tasks: AI Video Editor

**Input**: Design documents from `/specs/073-ai-video-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-contracts.md

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Shared package**: `packages/shared/src/schemas/experience/`
- **Frontend app**: `apps/clementine-app/src/domains/experience/create/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema changes in shared package and frontend constants that all user stories depend on

- [x] T001 Export `aiVideoTaskSchema` and add `AIVideoTask` type export in `packages/shared/src/schemas/experience/outcome.schema.ts` — change `const aiVideoTaskSchema` to `export const aiVideoTaskSchema` and add `export type AIVideoTask = z.infer<typeof aiVideoTaskSchema>`
- [x] T002 Add `aiVideoModelSchema` enum (`veo-3.1-generate-001`, `veo-3.1-fast-generate-001`) and `AIVideoModel` type export in `packages/shared/src/schemas/experience/outcome.schema.ts` — also update `videoGenerationConfigSchema.model` from `z.string().default('')` to `aiVideoModelSchema.default('veo-3.1-fast-generate-001')`
- [x] T003 Rebuild shared package after schema changes — run `pnpm --filter @clementine/shared build` and verify no type errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Frontend utility changes that MUST be complete before any UI component work can begin

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Update `ENABLED_OUTCOME_TYPES` and `COMING_SOON_TYPES` in `apps/clementine-app/src/domains/experience/create/lib/model-options.ts` — move `'ai.video'` from `COMING_SOON_TYPES` to `ENABLED_OUTCOME_TYPES`, add `AI_VIDEO_MODELS` constant with `[{ value: 'veo-3.1-generate-001', label: 'Veo 3.1' }, { value: 'veo-3.1-fast-generate-001', label: 'Veo 3.1 Fast' }]`
- [x] T005 Add `createDefaultAIVideoConfig` function and update `initializeOutcomeType` in `apps/clementine-app/src/domains/experience/create/lib/outcome-operations.ts` — new function returns default config (animate task, 9:16, 5s duration, `veo-3.1-fast-generate-001` model, null frame gens); update `initializeOutcomeType` to handle `'ai.video'` type with auto-step detection (same pattern as photo/ai.image)
- [x] T006 Refactor `useRefMediaUpload` hook in `apps/clementine-app/src/domains/experience/create/hooks/useRefMediaUpload.ts` — replace `outcome: Outcome | null` param with `currentRefMedia: MediaReference[]` param so the hook is decoupled from outcome shape; compute `currentRefMediaCount` from `currentRefMedia.length` instead of `outcome?.aiImage?.imageGeneration.refMedia.length`; update the existing call site in `AIImageConfigForm.tsx` to pass `currentRefMedia: config.imageGeneration.refMedia` instead of `outcome: outcomeForUpload`
- [x] T007 Update `useOutcomeValidation` in `apps/clementine-app/src/domains/experience/create/hooks/useOutcomeValidation.ts` — remove `'ai.video'` from "coming soon" check; add `ai.video` validation branch: captureStepId required + must reference existing capture.photo step, duplicate displayNames check for startFrameImageGen.refMedia and endFrameImageGen.refMedia (when not null)

**Checkpoint**: Foundation ready — shared schemas exported, constants updated, operations/hooks generalized. UI component work can now begin.

---

## Phase 3: User Story 1 — Select AI Video Output Type (Priority: P1) MVP

**Goal**: Enable AI Video in the output type picker and show a minimal config form with smart defaults when selected.

**Independent Test**: Open experience designer → select AI Video from output type picker → verify config form appears with smart defaults (animate task, 9:16, 5s duration, auto-selected capture step if only one exists).

### Implementation for User Story 1

- [x] T008 [P] [US1] Enable AI Video card in `apps/clementine-app/src/domains/experience/create/components/outcome-picker/OutcomeTypePicker.tsx` — change `enabled: false` to `enabled: true` in the `AI_OPTIONS` array entry for `'ai.video'`
- [x] T009 [P] [US1] Add AI Video toggle to `apps/clementine-app/src/domains/experience/create/components/outcome-picker/OutcomeTypeSelector.tsx` — add a third `ToggleGroupItem` with value `"ai.video"`, Video icon from lucide-react, and label from `OUTCOME_TYPE_LABELS['ai.video']`; import `Video` from lucide-react
- [x] T010 [P] [US1] Create barrel export file `apps/clementine-app/src/domains/experience/create/components/ai-video-config/index.ts` — export `AIVideoConfigForm` from `./AIVideoConfigForm`
- [x] T011 [US1] Create `AIVideoConfigForm` component in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx` — implement props interface per contracts (config, onConfigChange, steps, errors, workspaceId, userId); for this story, render only the shared fields: AIVideoTaskSelector, SourceImageSelector (from shared-controls), AspectRatioSelector (from shared-controls, using VIDEO_ASPECT_RATIOS for options), and a placeholder div for video generation section; follow the same pattern as AIImageConfigForm
- [x] T012 [US1] Create `AIVideoTaskSelector` component in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoTaskSelector.tsx` — Select dropdown with 3 options: Animate ("Bring a photo to life as video"), Transform ("Photo transitions into AI-generated version"), Reimagine ("Video between two AI-generated frames"); follow the same pattern as `ai-image-config/TaskSelector.tsx`; import `AIVideoTask` type from `@clementine/shared`
- [x] T013 [US1] Add AI Video render branch and handler to `apps/clementine-app/src/domains/experience/create/components/CreateTabForm.tsx` — add `handleAIVideoConfigChange` callback (same pattern as `handleAIImageConfigChange` but for `'aiVideo'` form field); add render branch for `outcome.type === 'ai.video' && outcome.aiVideo` showing OutcomeTypeSelector + AIVideoConfigForm + RemoveOutcomeAction; import `AIVideoConfigForm` and `AIVideoOutcomeConfig` type
- [x] T014 [US1] Run `pnpm app:type-check` and `pnpm app:check` to verify no type errors or lint issues

**Checkpoint**: AI Video can be selected from the picker. Smart defaults applied. Animate task shows shared fields (source step, aspect ratio, task selector). Config auto-saves via existing autosave. Switching to/from AI Video preserves config.

---

## Phase 4: User Story 2 — Configure Animate Task (Priority: P1) MVP

**Goal**: Full animate task configuration with video generation fields (prompt, model selector, duration).

**Independent Test**: Select AI Video → animate task → fill in video generation prompt, select model (Veo 3.1 / Veo 3.1 Fast), set duration → verify all fields save correctly.

### Implementation for User Story 2

- [x] T015 [US2] Create `VideoGenerationSection` component in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/VideoGenerationSection.tsx` — render section with label "Video Generation"; include: Textarea for prompt, Select dropdown for model (using `AI_VIDEO_MODELS` from model-options), number Input for duration (1-60 seconds, step 1); import `VideoGenerationConfig` type from `@clementine/shared`; callback pattern: `onConfigChange(updates: Partial<VideoGenerationConfig>)`
- [x] T016 [US2] Integrate `VideoGenerationSection` into `AIVideoConfigForm` in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx` — add `updateVideoGeneration` helper (same pattern as `updateImageGeneration` in AIImageConfigForm); render VideoGenerationSection below shared fields, passing `config.videoGeneration` and the update handler
- [x] T017 [US2] Update barrel exports in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/index.ts` — add exports for `AIVideoTaskSelector`, `VideoGenerationSection`
- [x] T018 [US2] Run `pnpm app:type-check` and `pnpm app:check` to verify no type errors or lint issues

**Checkpoint**: Animate task is fully configurable — source step, aspect ratio, task selector, video prompt, video model, and duration. All fields auto-save. This is the MVP.

---

## Phase 5: User Story 3 — Configure Transform Task (Priority: P2)

**Goal**: Transform task shows end frame image generation section with prompt (mentions), model, and reference media.

**Independent Test**: Select AI Video → transform task → configure end frame image generation (prompt with @mentions, model, upload reference images) → verify config saves correctly with frame gen data.

### Implementation for User Story 3

- [ ] T019 [US3] Create `FrameGenerationSection` component in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/FrameGenerationSection.tsx` — reusable section accepting props per contracts (label, config: ImageGenerationConfig, onConfigChange, steps, errors, errorFieldPrefix, workspaceId, userId); render section header with label; internally use `useRefMediaUpload` hook (passing `currentRefMedia: config.refMedia`) for upload state; render `PromptComposer` with: prompt/model/refMedia from config, `hideAspectRatio=true`, `modelOptions={AI_IMAGE_MODELS}`, mention support via steps, error from `getFieldError(errors, errorFieldPrefix + '.prompt')`; handle all nested field updates (prompt, model, refMedia add/remove) via `onConfigChange`
- [ ] T020 [US3] Integrate end frame `FrameGenerationSection` into `AIVideoConfigForm` — add `updateEndFrameImageGen` helper; conditionally render FrameGenerationSection with label "End Frame Image Generation" when `config.task === 'transform' || config.task === 'reimagine'`; pass `config.endFrameImageGen` (initialize with defaults if null when task requires it); pass `errorFieldPrefix="aiVideo.endFrameImageGen"`
- [ ] T021 [US3] Update barrel exports in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/index.ts` — add export for `FrameGenerationSection`
- [ ] T022 [US3] Run `pnpm app:type-check` and `pnpm app:check` to verify no type errors or lint issues

**Checkpoint**: Transform task shows shared fields + end frame image generation with full PromptComposer (mentions, model, ref media). Config saves correctly.

---

## Phase 6: User Story 4 — Configure Reimagine Task (Priority: P2)

**Goal**: Reimagine task shows both start frame and end frame image generation sections independently.

**Independent Test**: Select AI Video → reimagine task → configure both start and end frame image generation independently → verify each has separate prompt, model, and reference media that save correctly.

### Implementation for User Story 4

- [ ] T023 [US4] Add start frame `FrameGenerationSection` to `AIVideoConfigForm` in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx` — add `updateStartFrameImageGen` helper; conditionally render FrameGenerationSection with label "Start Frame Image Generation" when `config.task === 'reimagine'`; pass `config.startFrameImageGen` (initialize with defaults if null); pass `errorFieldPrefix="aiVideo.startFrameImageGen"`; render start frame section ABOVE end frame section
- [ ] T024 [US4] Run `pnpm app:type-check` and `pnpm app:check` to verify no type errors or lint issues

**Checkpoint**: Reimagine task shows shared fields + start frame + end frame image generation sections. Each frame section has independent prompt, model, and reference media.

---

## Phase 7: User Story 5 — Switch Tasks While Preserving Config (Priority: P2)

**Goal**: Switching between animate/transform/reimagine preserves all frame generation configs.

**Independent Test**: Configure transform with end frame data → switch to reimagine (end frame preserved, start frame appears) → switch to animate (both hidden) → switch back to reimagine (both restored).

### Implementation for User Story 5

- [ ] T025 [US5] Implement task switching logic with config initialization in `AIVideoConfigForm` in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx` — add `handleTaskChange` handler that: (1) updates task field via `onConfigChange({ task })`, (2) when switching TO transform and `endFrameImageGen` is null, initializes it with default ImageGenerationConfig, (3) when switching TO reimagine and either frame gen is null, initializes the null one(s) with defaults, (4) NEVER clears existing frame gen configs (preserves data when hiding sections)
- [ ] T026 [US5] Run `pnpm app:type-check` and `pnpm app:check` to verify no type errors or lint issues

**Checkpoint**: Task switching preserves all frame gen configs. Switching animate→transform→reimagine→animate→reimagine shows configs restored at each step.

---

## Phase 8: User Story 6 — Switch Between Output Types While Preserving AI Video Config (Priority: P2)

**Goal**: Switching from AI Video to Photo/AI Image and back preserves the complete AI Video config.

**Independent Test**: Fully configure AI Video with reimagine task and frame data → switch to Photo → switch back to AI Video → verify all config restored.

### Implementation for User Story 6

- [ ] T027 [US6] Verify output type switching preserves AI Video config — this should already work via the existing per-type config persistence pattern in `CreateTabForm.tsx` (`initializeOutcomeType` only initializes if config is null, never clears existing configs). Manually verify by: (1) configuring AI Video fully, (2) switching to Photo, (3) switching back — all AI Video config should be restored. If any issue found, fix in `outcome-operations.ts`
- [ ] T028 [US6] Run `pnpm app:type-check` and `pnpm app:check` to verify no type errors or lint issues

**Checkpoint**: All output type switching works — Photo, AI Image, AI Video all preserve their configs independently.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and regression checking

- [ ] T029 Verify no regressions in Photo outcome — open experience designer, configure Photo output, verify source step and aspect ratio work correctly
- [ ] T030 Verify no regressions in AI Image outcome — open experience designer, configure AI Image output with image-to-image task, prompt with @mentions, reference media; verify all works correctly
- [ ] T031 Run full validation: `pnpm app:type-check && pnpm app:check && pnpm app:test`
- [ ] T032 Run quickstart.md manual testing checklist against dev server

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (shared package build) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on US1 (needs AIVideoConfigForm to exist)
- **US3 (Phase 5)**: Depends on US2 (needs VideoGenerationSection integrated)
- **US4 (Phase 6)**: Depends on US3 (reuses FrameGenerationSection)
- **US5 (Phase 7)**: Depends on US4 (needs all frame sections rendered to test switching)
- **US6 (Phase 8)**: Can start after US1 (type switching is independent of task complexity), but best done after US5
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation → US1. Entry point for all AI Video features.
- **US2 (P1)**: US1 → US2. Adds video generation section to the form created in US1.
- **US3 (P2)**: US2 → US3. Adds FrameGenerationSection component + end frame integration.
- **US4 (P2)**: US3 → US4. Adds start frame using the same FrameGenerationSection from US3.
- **US5 (P2)**: US4 → US5. Requires all frame sections to exist to verify task switching.
- **US6 (P2)**: US1 → US6. Config persistence pattern is inherited; verification pass.

### Within Each User Story

- Utility/helper functions before components that use them
- Components before orchestrator integration
- Integration before validation checks

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different sections of same file, but sequential is safer)
- **Phase 3**: T008, T009, T010 can run in parallel (different files)
- **Phase 5-6**: FrameGenerationSection is created once (T019) then reused (T023)

---

## Parallel Example: User Story 1

```bash
# Launch these in parallel (different files, no dependencies):
Task: T008 "Enable AI Video card in OutcomeTypePicker.tsx"
Task: T009 "Add AI Video toggle to OutcomeTypeSelector.tsx"
Task: T010 "Create barrel export file for ai-video-config/"

# Then sequentially:
Task: T011 "Create AIVideoConfigForm" (needs barrel export)
Task: T012 "Create AIVideoTaskSelector" (can parallel with T011 technically, but same directory)
Task: T013 "Add AI Video branch to CreateTabForm" (needs T011)
Task: T014 "Run type-check and lint"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Schema exports (T001-T003)
2. Complete Phase 2: Foundation — constants, operations, hooks (T004-T007)
3. Complete Phase 3: US1 — Select AI Video, minimal form (T008-T014)
4. Complete Phase 4: US2 — Full animate task with video gen (T015-T018)
5. **STOP and VALIDATE**: Test animate task end-to-end with auto-save
6. Deploy/demo if ready — creators can configure animate AI Video outcomes

### Incremental Delivery

1. Setup + Foundation → Schemas and utilities ready
2. US1 + US2 → Animate task fully working (MVP!)
3. US3 → Transform task with end frame image gen
4. US4 → Reimagine task with both frame sections
5. US5 → Task switching with config preservation verified
6. US6 → Output type switching verified
7. Polish → Regression checks, full validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User stories are sequential in this feature (each builds on the previous)
- This is frontend-only — no backend changes needed
- The existing autosave, mentions, and ref media patterns are reused, not reimplemented
- The `useRefMediaUpload` refactor (T006) updates the existing AIImageConfigForm call site too
- Commit after each phase checkpoint to maintain a clean git history
