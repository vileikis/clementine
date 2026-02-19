# Tasks: Outcome Schema Redesign — Photo & AI Image

**Input**: Design documents from `/specs/072-outcome-schema-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested — manual E2E verification per constitution (Principle IV).

**Organization**: Tasks grouped by user story. US1+US7 and US2+US3 are bundled because they share the same components.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Foundational — Schema Rewrite

**Purpose**: Replace flat outcome schema with per-type config architecture. BLOCKS all frontend and backend work.

- [x] T001 Rewrite outcome schema with all 5 per-type configs using `z.looseObject()` in `packages/shared/src/schemas/experience/outcome.schema.ts` — define `outcomeTypeSchema` ('photo'|'gif'|'video'|'ai.image'|'ai.video'), `photoOutcomeConfigSchema`, `aiImageOutcomeConfigSchema`, `gifOutcomeConfigSchema`, `videoOutcomeConfigSchema`, `aiVideoOutcomeConfigSchema`, and new `outcomeSchema` with nullable config fields per `contracts/outcome-schema.md`. Remove old exports: `imageGenerationConfigSchema`, `outcomeOptionsSchema`, `imageOptionsSchema`, `gifOptionsSchema`, `videoOptionsSchema` and their types. Keep `imageGenerationConfigSchema` internally for `aiVideoOutcomeConfigSchema`.
- [x] T002 [P] Update `packages/shared/src/schemas/experience/experience.schema.ts` to use the new `outcomeSchema` — verify `experienceConfigSchema.outcome` references the rewritten schema correctly.
- [x] T003 [P] Update `packages/shared/src/schemas/job/job.schema.ts` — `jobSnapshotSchema.outcome` now uses the new `outcomeSchema`. No structural change to `JobSnapshot`, only the `Outcome` type changes.
- [x] T004 Update barrel exports in `packages/shared/src/schemas/experience/index.ts` — export all new schemas and types (`OutcomeType`, `PhotoOutcomeConfig`, `AIImageOutcomeConfig`, `GifOutcomeConfig`, `VideoOutcomeConfig`, `AIVideoOutcomeConfig`, `Outcome`). Remove old exports.
- [x] T005 Build shared package and verify — run `pnpm --filter @clementine/shared build` and `pnpm --filter @clementine/shared test`. Fix any type errors. Ensure all consumers can import the new types.

**Checkpoint**: Shared package builds clean with new schema. All consumers will show type errors until updated — that's expected.

---

## Phase 2: US1 + US7 — Photo Output Config + Type Picker (P1/P3)

**Goal**: Creator can select "Photo" from a grouped type picker, configure source step + aspect ratio, and guest receives passthrough result. GIF/Video/AI Video show as "Coming soon".

**Independent Test**: Create experience with photo capture step → select Photo output → configure source + aspect ratio → verify autosave → run transform pipeline → guest gets photo result.

### Frontend — Directory Reorganization

- [x] T006 [US1] Reorganize `apps/clementine-app/src/domains/experience/create/components/` — create new folders: `outcome-picker/`, `photo-config/`, `ai-image-config/`, `shared-controls/`. Move `SourceImageSelector.tsx` and `AspectRatioSelector.tsx` from `CreateTabForm/` to `shared-controls/`. Move `OutcomeTypePicker.tsx`, `OutcomeTypeSelector.tsx`, `RemoveOutcomeAction.tsx` from `CreateTabForm/` to `outcome-picker/`. Update all import paths across the codebase. Delete `AIGenerationToggle.tsx`.

### Frontend — Lib & Hooks

- [x] T007 [P] [US1] Rewrite `apps/clementine-app/src/domains/experience/create/lib/outcome-operations.ts` — replace flat-field update functions with per-type config operations: `createDefaultPhotoConfig()`, `createDefaultAIImageConfig()`, `updatePhotoConfig()`, `updateAIImageConfig()`, `initializeOutcomeType()` (sets type + initializes config with smart defaults — auto-select capture step if only one exists). Keep `addOutcomeRefMedia`, `removeOutcomeRefMedia`, `sanitizeDisplayName`, `canAddMoreRefMedia` but read from `aiImage.imageGeneration.refMedia` instead of `imageGeneration.refMedia`.
- [x] T008 [P] [US1] Update `apps/clementine-app/src/domains/experience/create/lib/model-options.ts` — add `OUTCOME_TYPES` array with all 5 types, add `ENABLED_OUTCOME_TYPES` (photo, ai.image), add `COMING_SOON_TYPES` (gif, video, ai.video). Keep existing `AI_IMAGE_MODELS` and `ASPECT_RATIOS`.
- [x] T009 [US1] Rewrite `apps/clementine-app/src/domains/experience/create/hooks/useOutcomeValidation.ts` — validate per-type configs: when type is 'photo', validate `photo.captureStepId` exists and references a valid step; when type is 'ai.image', validate `aiImage.imageGeneration.prompt` is non-empty, `aiImage.captureStepId` valid for i2i task, no duplicate `aiImage.imageGeneration.refMedia` displayNames. Return `FieldValidationError[]` with field paths like `photo.captureStepId`, `aiImage.imageGeneration.prompt`.
- [x] T010 [US1] Update `apps/clementine-app/src/domains/experience/create/hooks/useUpdateOutcome.ts` — change mutation payload to write per-type config structure. When saving, write `outcome.type` and the active type's config field. Ensure non-active type configs are NOT cleared (preserves switching). Aspect ratio cascade: when saving, also update `draft.steps[captureStepIndex].config.aspectRatio` if a capture step is referenced.
- [x] T011 [US1] Update app-level schema re-exports in `apps/clementine-app/src/domains/experience/shared/schemas/index.ts` — re-export new types from `@clementine/shared`: `outcomeSchema`, `outcomeTypeSchema`, `photoOutcomeConfigSchema`, `aiImageOutcomeConfigSchema`, `imageGenerationConfigSchema`, and all inferred types. Remove old re-exports (`outcomeOptionsSchema`, etc.).
- [x] T012 [US1] Update `apps/clementine-app/src/domains/experience/shared/lib/outcome-validation.ts` — update publish-time validation to check per-type configs with detailed field paths (e.g., `outcome.photo.captureStepId`).

### Frontend — Components

- [x] T013 [US1] Rewrite `apps/clementine-app/src/domains/experience/create/components/outcome-picker/OutcomeTypePicker.tsx` — render two groups: "Media" (Photo enabled, GIF disabled, Video disabled) and "AI Generated" (AI Image enabled, AI Video disabled). Disabled items show "Coming soon" badge and are non-interactive. On type select: call `initializeOutcomeType()` from outcome-operations to set type + initialize config with smart defaults. Covers US7 acceptance scenarios.
- [x] T014 [P] [US1] Update `apps/clementine-app/src/domains/experience/create/components/outcome-picker/OutcomeTypeSelector.tsx` — update dropdown options to use new `OutcomeType` values. Show only enabled types (photo, ai.image). Display user-facing labels: "Photo", "AI Image".
- [x] T015 [P] [US1] Update `apps/clementine-app/src/domains/experience/create/components/outcome-picker/RemoveOutcomeAction.tsx` — ensure "Remove output" button sets `outcome.type` to `null` without clearing per-type configs. Update any "outcome" terminology to "output".
- [x] T016 [US1] Create `apps/clementine-app/src/domains/experience/create/components/photo-config/PhotoConfigForm.tsx` — props: `config: PhotoOutcomeConfig`, `onConfigChange`, `steps`, `errors`. Render `SourceImageSelector` (from shared-controls/) for `captureStepId` and `AspectRatioSelector` (from shared-controls/) for `aspectRatio`. Wire changes to `onConfigChange`.
- [x] T017 [US1] Rewrite `apps/clementine-app/src/domains/experience/create/components/CreateTabForm.tsx` — promote to top-level file in `components/`. Thin orchestrator: if `outcome.type === null` render `OutcomeTypePicker`; if `type === 'photo'` render `OutcomeTypeSelector` + `PhotoConfigForm` + `RemoveOutcomeAction`; if `type === 'ai.image'` render `OutcomeTypeSelector` + `AIImageConfigForm` + `RemoveOutcomeAction`. Wire `useAutoSave` with 2s debounce to `useUpdateOutcome`. Pass validation errors from `useOutcomeValidation` to config forms.
- [x] T018 [US1] Delete old `apps/clementine-app/src/domains/experience/create/components/CreateTabForm/` folder — all contents have been reorganized into new locations. Verify no remaining imports reference the old path.

### Backend

- [x] T019 [P] [US1] Create `functions/src/services/transform/outcomes/photoOutcome.ts` — implement `photoOutcome: OutcomeExecutor`. Read `snapshot.outcome.photo` config. Validate config exists. Get source media from `sessionResponses` using `photo.captureStepId`. Download to tmpDir. Apply overlay if `overlayChoice` exists. Upload output. Return `JobOutput`. Extract passthrough logic from existing `imageOutcome.ts` (the `aiEnabled: false` branch).
- [x] T020 [US1] Update `functions/src/services/transform/engine/runOutcome.ts` — replace old registry with new 5-type registry per `contracts/outcome-executors.md`. Import `photoOutcome`. Set `gif`, `video`, `ai.video` to `null`. Update error messages: "Outcome type not implemented" for null executors. Log `outcome.type` instead of `aiEnabled`.
- [x] T021 [US1] Update `functions/src/callable/startTransformPipeline.ts` — read `outcome.type` instead of `outcome.type` + `outcome.aiEnabled`. Validate: reject `type: null`, reject types without executors. Read active config from `outcome[configKey]`. Update snapshot building to store full new outcome object. Update `pickOverlay` call to read aspect ratio from active type's config.
- [x] T022 [US1] Update `functions/src/repositories/job.ts` — if `buildJobSnapshot` or snapshot-building utilities reference old outcome fields (`aiEnabled`, `captureStepId`, `imageGeneration`), update to read from the new per-type config structure.

**Checkpoint**: Photo output works end-to-end. Type picker shows all types with coming soon badges. Backend processes photo passthrough correctly.

---

## Phase 3: US2 + US3 — AI Image (Text-to-Image + Image-to-Image) (P1/P2)

**Goal**: Creator can select "AI Image", choose t2i or i2i task, configure prompt/model/refs, and guest receives AI-generated result. For i2i, source step selector is visible and aspect ratio cascades.

**Independent Test**: Create experience → select AI Image → configure t2i prompt → verify guest gets AI result. Then switch to i2i → select source step → verify guest gets transformed photo.

### Frontend

- [x] T023 [P] [US2] Create `apps/clementine-app/src/domains/experience/create/components/ai-image-config/TaskSelector.tsx` — segmented control / toggle between "Text to Image" and "Image to Image". Props: `task: 'text-to-image' | 'image-to-image'`, `onTaskChange`. When switching to t2i, signal parent to set `captureStepId` to null.
- [x] T024 [US2] Create `apps/clementine-app/src/domains/experience/create/components/ai-image-config/AIImageConfigForm.tsx` — props: `config: AIImageOutcomeConfig`, `onConfigChange`, `steps`, `errors`, plus PromptComposer-related props (uploadingFiles, onFilesSelected, etc.). Render: `TaskSelector`, `SourceImageSelector` (visible only when task === 'image-to-image'), `AspectRatioSelector`, `PromptComposer` (reused as-is). Wire all field changes to `onConfigChange`. Read prompt/model/refMedia from `config.imageGeneration` (nested ImageGenerationConfig).
- [x] T025 [US2] Update `apps/clementine-app/src/domains/experience/create/hooks/useRefMediaUpload.ts` — change `outcome.imageGeneration.refMedia` reads to `outcome.aiImage.imageGeneration.refMedia`. Update `outcomeRef` usage to read from the new config path. Ensure `onMediaUploaded` callback adds to the correct field.
- [x] T026 [US2] Wire AIImageConfigForm into CreateTabForm — update the `type === 'ai.image'` branch in `CreateTabForm.tsx` to render `AIImageConfigForm` with all required props. Pass `useRefMediaUpload` hook results. Ensure autosave triggers on all AI image config changes.

### Backend

- [x] T027 [US2] Create `functions/src/services/transform/outcomes/aiImageOutcome.ts` — implement `aiImageOutcome: OutcomeExecutor`. Read `snapshot.outcome.aiImage` config. Validate config exists. Branch on `task`: for 'text-to-image' set `sourceMedia = null`; for 'image-to-image' get source media from `sessionResponses` using `aiImage.captureStepId`. Read generation params from `aiImage.imageGeneration`. Call `resolvePromptMentions(imageGeneration.prompt, sessionResponses, imageGeneration.refMedia)`. Call `aiGenerateImage({ prompt, model: imageGeneration.model, aspectRatio: imageGeneration.aspectRatio ?? aiImage.aspectRatio, sourceMedia, referenceMedia })`. Apply overlay if exists. Upload output. Return `JobOutput`. Extract AI generation logic from existing `imageOutcome.ts` (the `aiEnabled: true` branch).
- [x] T028 [US2] Register `aiImageOutcome` in `runOutcome.ts` dispatcher — import `aiImageOutcome` and set it as the executor for `'ai.image'` in the registry.
- [x] T029 [US2] Delete `functions/src/services/transform/outcomes/imageOutcome.ts` — all logic has been split into `photoOutcome.ts` and `aiImageOutcome.ts`. Verify no remaining imports reference the old file.

**Checkpoint**: AI Image works for both t2i and i2i. Task selector toggles source step visibility. Prompt mentions resolve correctly. Backend generates AI images via both paths.

---

## Phase 4: US6 — Data Migration (P1)

**Goal**: All existing Firestore experience documents migrated from old flat schema to new per-type config structure. Both draft and published outcomes handled. Idempotent.

**Independent Test**: Run migration with `--dry-run` against production data. Verify all 4 mapping cases produce correct output. Run again to verify idempotency.

- [ ] T030 [US6] Create migration script at `functions/scripts/migrations/072-outcome-schema-redesign.ts` — follow the `042-flatten-events.ts` pattern: support `--dry-run` and `--production` flags, Firebase Admin SDK init with emulator/production support, statistics tracking (scanned, migrated, skipped, errors). Read all experience documents. For each, transform both `draft.outcome` and `published.outcome`:
  - `type: 'image'` + `aiEnabled: false` → `type: 'photo'`, `photo: { captureStepId, aspectRatio }`
  - `type: 'image'` + `aiEnabled: true` + `captureStepId: null` → `type: 'ai.image'`, `aiImage: { task: 'text-to-image', captureStepId: null, aspectRatio, imageGeneration: { prompt, model, refMedia } }` (read from old `imageGeneration`)
  - `type: 'image'` + `aiEnabled: true` + `captureStepId: <id>` → `type: 'ai.image'`, `aiImage: { task: 'image-to-image', captureStepId, aspectRatio, imageGeneration: { prompt, model, refMedia } }` (read from old `imageGeneration`)
  - `type: null` → `type: null`, all config fields `null`
  - Already migrated (has `photo` or `aiImage` field) → skip (idempotent)
  Set non-active config fields to `null`. Print summary with counts per mapping case.

**Checkpoint**: Migration script runs successfully in dry-run mode. All mapping cases covered. Idempotent on re-run.

---

## Phase 5: US4 + US5 — Type Switching + Remove Output (P2/P3)

**Goal**: Switching between output types preserves previous config. Removing output returns to picker with configs intact for re-selection.

**Independent Test**: Configure Photo → switch to AI Image → switch back → verify Photo config preserved. Configure output → remove → re-select same type → verify config restored.

- [ ] T031 [US4] Verify and fix type switching in `apps/clementine-app/src/domains/experience/create/hooks/useUpdateOutcome.ts` — ensure the mutation payload for type switching writes ONLY `outcome.type` and the newly active type's config. It must NOT clear or overwrite other type config fields (e.g., switching from photo to ai.image must not set `photo: null`). Add explicit handling: on type change, merge only `{ type: newType, [activeConfigKey]: activeConfig }` without touching other fields.
- [ ] T032 [US5] Verify remove output behavior — ensure `RemoveOutcomeAction` writes `{ type: null }` to Firestore without modifying per-type config fields. Test: configure photo, remove output, re-select photo → config should be preserved from Firestore (not cleared client-side).

**Checkpoint**: Type switching preserves all configs. Remove + re-select restores previous settings.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and standards compliance.

- [ ] T033 [P] Add barrel exports (`index.ts`) for new component folders: `outcome-picker/index.ts`, `photo-config/index.ts`, `ai-image-config/index.ts`, `shared-controls/index.ts` in `apps/clementine-app/src/domains/experience/create/components/`
- [ ] T034 [P] Verify "output" terminology — audit all user-facing strings in the create domain for any remaining "outcome" references. Replace with "output" per FR-013.
- [ ] T035 Run validation gates — execute `pnpm --filter @clementine/shared build && pnpm --filter @clementine/shared test`, then `pnpm app:type-check && pnpm app:check`, then `pnpm functions:build`. Fix any errors.
- [ ] T036 Standards compliance review — verify against applicable standards: `frontend/design-system.md` (theme tokens, no hardcoded colors), `global/project-structure.md` (barrel exports, naming conventions), `backend/firestore.md` (nullable patterns, no undefined), `global/zod-validation.md` (looseObject, nullable defaults).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately
- **Phase 2 (US1+US7)**: Depends on Phase 1 completion
- **Phase 3 (US2+US3)**: Depends on Phase 2 (uses CreateTabForm orchestrator, outcome-operations, validation hooks)
- **Phase 4 (US6 Migration)**: Depends on Phase 1 only — can run in parallel with Phases 2-3
- **Phase 5 (US4+US5)**: Depends on Phases 2 and 3 (needs both config forms working)
- **Phase 6 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (Photo)**: Depends on foundational schema — no other story dependencies
- **US2 (AI Image T2I)**: Depends on US1 (needs CreateTabForm orchestrator, outcome-operations, validation hooks, type picker)
- **US3 (AI Image I2I)**: Bundled with US2 (same component and executor)
- **US4 (Type Switching)**: Depends on US1 + US2 (needs both config forms to switch between)
- **US5 (Remove Output)**: Depends on US1 (needs type picker + at least one config form)
- **US6 (Migration)**: Independent — only needs schema (Phase 1)
- **US7 (Coming Soon)**: Bundled with US1 (built into OutcomeTypePicker)

### Parallel Opportunities

**Within Phase 1**: T002 and T003 can run in parallel after T001 completes.

**Within Phase 2**: T007 and T008 (lib files) can run in parallel. T013 and T014 and T015 (picker components) can run in parallel. T019 (backend photoOutcome) can run in parallel with frontend tasks.

**Within Phase 3**: T023 (TaskSelector) can run in parallel with T027 (backend aiImageOutcome).

**Cross-phase**: Phase 4 (migration) can run in parallel with Phases 2-3.

---

## Parallel Example: Phase 2 (US1)

```
# After T006 (directory reorganization):

# Parallel batch 1 — lib files:
T007: "Rewrite outcome-operations.ts"
T008: "Update model-options.ts"

# Parallel batch 2 — components + backend:
T013: "Rewrite OutcomeTypePicker"
T014: "Update OutcomeTypeSelector"
T015: "Update RemoveOutcomeAction"
T019: "Create photoOutcome executor"

# Sequential — depends on above:
T016: "Create PhotoConfigForm"
T017: "Rewrite CreateTabForm orchestrator"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Schema rewrite
2. Complete Phase 2: Photo config form + type picker + backend
3. **STOP and VALIDATE**: Test photo output end-to-end
4. Deploy if ready — AI image can follow

### Incremental Delivery

1. Phase 1 → Schema ready
2. Phase 2 (US1+US7) → Photo output works, type picker shows all types
3. Phase 3 (US2+US3) → AI Image works (both t2i and i2i)
4. Phase 4 (US6) → Existing data migrated (can run anytime after Phase 1)
5. Phase 5 (US4+US5) → Type switching and removal verified
6. Phase 6 → Polish, validation gates, standards review

### Coordinated Deployment

All phases must deploy together as a single release:
- Schema (shared package) + Editor (frontend) + Cloud Functions (backend) + Migration script
- Migration runs immediately after deployment
- No partial deployment — schema mismatches between frontend and backend will cause errors

---

## Notes

- [P] tasks = different files, no dependencies within the phase
- [Story] label maps task to specific user story for traceability
- US7 (Coming Soon) is bundled with US1 since OutcomeTypePicker serves both
- US3 (I2I) is bundled with US2 since AIImageConfigForm handles both tasks
- PromptComposer and its Lexical editor require NO changes — reused as-is
- SharedControls (SourceImageSelector, AspectRatioSelector) require NO code changes — only moved to new directory
