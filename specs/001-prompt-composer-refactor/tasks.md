# Tasks: PromptComposer Refactor

**Input**: Design documents from `/specs/001-prompt-composer-refactor/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not requested in feature specification. Manual regression validation included in Polish phase.

**Organization**: Tasks grouped by implementation dependency. US1 (modality extensibility), US3 (context/prop reduction), and US4 (modality-driven rendering) are architecturally inseparable and share Phase 3. US2 (zero regressions) is validated via consumer migration in Phase 4.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (New Types & Constants)

**Purpose**: Create the ModalityDefinition type system and predefined modality constants that all subsequent work depends on.

- [x] T001 Create ModalityDefinition interface with ModalitySupports and ModalityLimits nested types, plus IMAGE_MODALITY and VIDEO_MODALITY constants in `apps/clementine-app/src/domains/experience/create/lib/modality-definitions.ts`

  **Details**:
  - Define `ModalitySupports` interface: `negativePrompt`, `referenceMedia`, `sound`, `enhance`, `duration`, `aspectRatio` (all booleans)
  - Define `ModalityLimits` interface: `maxRefImages: number`, `maxPromptLength: number`
  - Define `ModalityDefinition` interface: `type: string`, `supports: ModalitySupports`, `limits: ModalityLimits`, `modelOptions: readonly SelectOption[]`, `durationOptions?: readonly SelectOption[]`
  - Import `SelectOption` from existing types, `AI_IMAGE_MODELS`, `AI_VIDEO_MODELS`, `DURATION_OPTIONS` from `model-options.ts`
  - Define `IMAGE_MODALITY`: type `'image'`, referenceMedia true, aspectRatio true, maxRefImages 5, maxPromptLength 2000, modelOptions AI_IMAGE_MODELS
  - Define `VIDEO_MODALITY`: type `'video'`, referenceMedia true, duration true, aspectRatio false, maxRefImages 2, maxPromptLength 2000, modelOptions AI_VIDEO_MODELS, durationOptions DURATION_OPTIONS
  - Export all types and constants
  - Reference: `data-model.md` §ModalityDefinition, §Predefined Modality Instances

---

## Phase 2: Foundational (Context Infrastructure)

**Purpose**: Create the React Context that distributes modality configuration to child components. MUST be complete before any component refactoring begins.

**⚠️ CRITICAL**: No component refactoring can begin until this phase is complete.

- [x] T002 Create PromptComposerContext with provider and hook in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/PromptComposerContext.tsx`

  **Details**:
  - Define `ModalityControlValues` interface: optional `aspectRatio: string`, `onAspectRatioChange: (value: string) => void`, `duration: string`, `onDurationChange: (value: string) => void`
  - Define `RefMediaState` interface: `items: MediaReference[]`, `onRemove: (mediaAssetId: string) => void`, `uploadingFiles: UploadingFile[]`, `onFilesSelected: (files: File[]) => void`, `canAddMore: boolean`, `isUploading: boolean`
  - Define `PromptComposerContextValue` interface per data-model.md: modality, prompt, onPromptChange, model, onModelChange, controls?, refMedia?, steps, disabled, error?
  - Create context: `createContext<PromptComposerContextValue | null>(null)`
  - Create `PromptComposerProvider` component that accepts `value: PromptComposerContextValue` and `children`
  - Create `usePromptComposerContext()` hook with error throw if context is null: `'usePromptComposerContext must be used within PromptComposer'`
  - Export `PromptComposerProvider`, `usePromptComposerContext`, and all type interfaces
  - Follow existing pattern from `ThemeContext.tsx` and `GuestContext.tsx`
  - Reference: `data-model.md` §PromptComposerContextValue, `research.md` §R-001, §R-005

**Checkpoint**: Context infrastructure ready — component refactoring can begin.

---

## Phase 3: US1 + US3 + US4 — PromptComposer Internal Refactor (P1 + P2)

**Goal**: Refactor PromptComposer and its child components to use context-based modality distribution. After this phase, PromptComposer accepts the new simplified props interface, creates a context provider, and child components read from context instead of receiving props. Controls auto-render based on `modality.supports.*`.

**Independent Test**: Render PromptComposer with IMAGE_MODALITY — aspect ratio and ref media controls appear, no duration picker. Render with VIDEO_MODALITY — duration picker appears, ref media appears, no aspect ratio. Verify prop count is ≤9 on PromptComposer.

### Implementation

- [x] T003 [US1][US3][US4] Refactor PromptComposer component with new props interface and context provider in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/PromptComposer.tsx`

  **Details**:
  - Replace `PromptComposerProps` with new interface (10 props max): `modality: ModalityDefinition`, `prompt: string`, `onPromptChange`, `model: string`, `onModelChange`, `controls?: ModalityControlValues`, `refMedia?: RefMediaState`, `steps: ExperienceStep[]`, `disabled?: boolean`, `error?: string`
  - Remove old props: `modelOptions`, `hideAspectRatio`, `hideRefMedia`, `durationOptions`, `aspectRatio`, `onAspectRatioChange`, `duration`, `onDurationChange`, `refMedia` (old shape), `onRefMediaRemove`, `uploadingFiles`, `onFilesSelected`, `canAddMore`, `isUploading`
  - Wrap component body in `<PromptComposerProvider value={contextValue}>` where contextValue is constructed from props
  - Build context value using `useMemo` to prevent unnecessary re-renders
  - Keep LexicalPromptInput with direct props (it's modality-agnostic — see plan D-005)
  - Conditionally render ReferenceMediaStrip based on `modality.supports.referenceMedia && refMedia` (replaces `hideRefMedia` boolean)
  - Keep drag-and-drop logic, update to read from `refMedia` prop group
  - Keep error/disabled rendering logic
  - Reference: `quickstart.md` §Before & After, `research.md` §R-003

- [x] T004 [P] [US3][US4] Refactor ControlRow to read from context and render modality-driven controls in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/ControlRow.tsx`

  **Details**:
  - Remove ALL props from ControlRow interface (it becomes a zero-prop component)
  - Call `usePromptComposerContext()` to get: modality, model, onModelChange, controls, refMedia, disabled
  - Render model select using `modality.modelOptions` (replaces `modelOptions` prop)
  - Conditionally render aspect ratio select: only when `modality.supports.aspectRatio && controls?.aspectRatio !== undefined`
  - Conditionally render duration select: only when `modality.supports.duration && modality.durationOptions && controls?.duration !== undefined`
  - Render AddMediaButton: only when `modality.supports.referenceMedia`
  - AddMediaButton disabled logic: `disabled || !refMedia?.canAddMore || refMedia?.isUploading`
  - Keep all shadcn/ui Select components and their existing styling
  - Reference: `quickstart.md` §Child Component Access Pattern

- [x] T005 [P] [US3] Refactor ReferenceMediaStrip to read from context in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/ReferenceMediaStrip.tsx`

  **Details**:
  - Remove props: `media`, `uploadingFiles`, `onRemove`, `disabled`
  - Call `usePromptComposerContext()` to get: refMedia, disabled
  - Read `refMedia.items` (replaces `media` prop), `refMedia.uploadingFiles`, `refMedia.onRemove`
  - Keep ReferenceMediaItem rendering unchanged (it receives props from ReferenceMediaStrip, not from context)
  - Keep UploadingMediaItem rendering unchanged
  - Guard: if `!refMedia` return null (graceful degradation per edge case spec)

- [x] T006 [P] [US3] Update AddMediaButton to read from context in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/AddMediaButton.tsx`

  **Details**:
  - Remove props: `onFilesSelected`, `disabled`
  - Call `usePromptComposerContext()` to get: refMedia, disabled
  - Read `refMedia.onFilesSelected` (replaces `onFilesSelected` prop)
  - Disabled logic: `disabled || !refMedia?.canAddMore || refMedia?.isUploading`
  - Keep file input ref and accept="image/*" behavior unchanged

- [x] T007 [US1] Update barrel exports in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/index.ts`

  **Details**:
  - Export `PromptComposer` component (existing, now with new props)
  - Export `usePromptComposerContext` from `./PromptComposerContext`
  - Export types: `PromptComposerProps`, `ModalityControlValues`, `RefMediaState` from `./PromptComposerContext`
  - Export `ModalityDefinition`, `IMAGE_MODALITY`, `VIDEO_MODALITY` from `../../lib/modality-definitions`
  - Verify no circular import issues

**Checkpoint**: PromptComposer accepts new 8-prop interface. Child components read from context. Controls auto-render based on modality. TypeScript will show errors in all 3 consumer files (expected — they still use old API).

---

## Phase 4: US2 — Consumer Migration (Zero Regressions)

**Goal**: Update all 3 consumer forms to use the new PromptComposer API. After this phase, all consumers compile and produce identical behavior to pre-refactor.

**Independent Test**: Exercise each consumer form — AIImageConfigForm, AIVideoConfigForm (both image-to-video and ref-images-to-video tasks), FrameGenerationSection — and verify identical behavior: model selection, aspect ratio changes, reference image upload/remove/drag-drop, @mention autocomplete, duration selection, validation errors, disabled states.

### Implementation

- [x] T008 [P] [US2] Migrate AIImageConfigForm to new PromptComposer API in `apps/clementine-app/src/domains/experience/create/components/ai-image-config/AIImageConfigForm.tsx`

  **Details**:
  - Import `IMAGE_MODALITY` from PromptComposer barrel export
  - Replace 19 individual props with new grouped interface:
    - `modality={IMAGE_MODALITY}`
    - `prompt={imageGeneration.prompt}`
    - `onPromptChange={handlePromptChange}`
    - `model={imageGeneration.model}`
    - `onModelChange={handleModelChange}`
    - `controls={{ aspectRatio: imageGeneration.aspectRatio ?? config.aspectRatio, onAspectRatioChange: handleGenAspectRatioChange }}`
    - `refMedia={{ items: imageGeneration.refMedia, onRemove: handleRemoveRefMedia, uploadingFiles, onFilesSelected: uploadFiles, canAddMore, isUploading }}`
    - `steps={mentionableSteps}`
    - `error={getFieldError(errors, 'aiImage.imageGeneration.prompt')}`
  - Remove: `modelOptions`, `hideAspectRatio`, `hideRefMedia`, `disabled={false}` (use default)
  - Keep all existing handlers (handlePromptChange, handleModelChange, etc.) unchanged
  - Keep `useRefMediaUpload` hook usage unchanged
  - Reference: `quickstart.md` §Before & After

- [x] T009 [P] [US2] Migrate AIVideoConfigForm to new PromptComposer API with task-specific modality variants in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx`

  **Details**:
  - Import `VIDEO_MODALITY` and `REMIX_DURATION_OPTIONS` (or use existing constant)
  - Create task-specific modality variants using `useMemo` + spread:
    - For `image-to-video` task: `{ ...VIDEO_MODALITY, supports: { ...VIDEO_MODALITY.supports, referenceMedia: false } }`
    - For `ref-images-to-video` task: `{ ...VIDEO_MODALITY, durationOptions: REMIX_DURATION_OPTIONS }` (maxRefImages is already 2 in VIDEO_MODALITY)
  - Replace PromptComposer props:
    - `modality={taskModality}` (computed variant)
    - `prompt={videoGeneration.prompt}`
    - `onPromptChange={(prompt) => updateVideoGeneration({ prompt })}`
    - `model={videoGeneration.model}`
    - `onModelChange={(model) => updateVideoGeneration({ model: model as AIVideoModel })}`
    - `controls={{ duration: String(videoGeneration.duration ?? 6), onDurationChange: handleDurationChange }}`
    - `refMedia={...}` (only for ref-images-to-video, omit for image-to-video since modality says referenceMedia: false)
    - `steps={mentionableSteps}`
    - `error={getFieldError(errors, 'aiVideo.videoGeneration.prompt')}`
  - Remove: `modelOptions`, `hideAspectRatio`, `hideRefMedia`, `durationOptions` individual props
  - Keep all existing handlers and useRefMediaUpload hook unchanged
  - Reference: `quickstart.md` §Creating Task-Specific Variants

- [x] T010 [P] [US2] Migrate FrameGenerationSection to new PromptComposer API in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/FrameGenerationSection.tsx`

  **Details**:
  - Import `IMAGE_MODALITY` from PromptComposer barrel export
  - Create frame-specific modality variant: `{ ...IMAGE_MODALITY, supports: { ...IMAGE_MODALITY.supports, aspectRatio: false } }` (frames always hide aspect ratio)
  - Replace PromptComposer props:
    - `modality={frameModality}`
    - `prompt={config.prompt}`
    - `onPromptChange={handlePromptChange}`
    - `model={config.model}`
    - `onModelChange={handleModelChange}`
    - `refMedia={{ items: config.refMedia, onRemove: handleRemoveRefMedia, uploadingFiles, onFilesSelected: uploadFiles, canAddMore, isUploading }}`
    - `steps={mentionableSteps}`
    - `error={getFieldError(errors, ...)}`
  - Remove: `hideAspectRatio={true}`, `aspectRatio`, `onAspectRatioChange` individual props
  - Keep all existing handlers and useRefMediaUpload hook unchanged

**Checkpoint**: All 3 consumers compile with new API. TypeScript reports zero errors. Application should be fully functional — identical behavior to pre-refactor.

---

## Phase 5: Polish & Validation

**Purpose**: Clean up dead code, run validation gates, verify edge cases and success criteria.

- [x] T011 Remove any unused imports and old type references across all modified files
- [x] T012 Run `pnpm app:type-check` to verify zero TypeScript errors across entire app
- [x] T013 Run `pnpm app:check` (lint + format) to verify code quality compliance
- [x] T014 Verify edge case: PromptComposer renders minimal composer (prompt + model only) when given a modality with all supports set to false and no refMedia/controls props
- [x] T015 Verify edge case: PromptComposer gracefully handles missing controls/refMedia when modality says the feature is supported (graceful degradation — hides control rather than crash)
- [x] T016 Manual regression: verify AIImageConfigForm — model selection, aspect ratio, reference images (upload/remove/drag-drop, max 5), @mention autocomplete, validation errors, disabled state
- [x] T017 Manual regression: verify AIVideoConfigForm image-to-video task — video model selection, duration (4s/6s/8s), no reference media shown, validation errors
- [x] T018 Manual regression: verify AIVideoConfigForm ref-images-to-video task — video model selection, duration locked to 8s, reference images (max 2), validation errors
- [x] T019 Manual regression: verify FrameGenerationSection — image model selection, no aspect ratio, reference images, @mention autocomplete
- [x] T020 Verify success criteria SC-002: count PromptComposer props (target ≤9, down from 19)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (context types reference ModalityDefinition)
- **US1+US3+US4 (Phase 3)**: Depends on Phase 2 (components use context)
- **US2 (Phase 4)**: Depends on Phase 3 (consumers use new PromptComposer API)
- **Polish (Phase 5)**: Depends on Phase 4 (all consumers migrated)

### Within Phase Parallelism

- **Phase 3**: T004 (ControlRow), T005 (ReferenceMediaStrip), T006 (AddMediaButton) can run in parallel — all are different files reading from context. T003 (PromptComposer) must complete first since it creates the provider. T007 (barrel exports) runs after all components.
- **Phase 4**: T008, T009, T010 can ALL run in parallel — each modifies a different consumer file with no dependencies between them.
- **Phase 5**: T012 and T013 can run in parallel. T016-T019 can run in parallel.

### User Story Traceability

| Story | Tasks | Validated By |
|-------|-------|-------------|
| US1: Modality Extensibility (P1) | T001, T003, T007 | Architecture: new modality = new constant + consumer form, zero PromptComposer changes |
| US2: Zero Regressions (P1) | T008, T009, T010 | T016, T017, T018, T019 (manual regression) |
| US3: Prop Drilling Reduction (P2) | T002, T003, T004, T005, T006 | T020 (prop count verification) |
| US4: Modality-Driven Rendering (P2) | T003, T004 | T014, T015 (edge case verification) |

---

## Parallel Example: Phase 3 (after T003 completes)

```
# These 3 tasks modify different files with no dependencies — run in parallel:
Task T004: "Refactor ControlRow to read from context in ControlRow.tsx"
Task T005: "Refactor ReferenceMediaStrip to read from context in ReferenceMediaStrip.tsx"
Task T006: "Update AddMediaButton to read from context in AddMediaButton.tsx"
```

## Parallel Example: Phase 4 (all consumers)

```
# These 3 tasks modify different consumer files — run in parallel:
Task T008: "Migrate AIImageConfigForm to new PromptComposer API"
Task T009: "Migrate AIVideoConfigForm with task-specific modality variants"
Task T010: "Migrate FrameGenerationSection to new PromptComposer API"
```

---

## Implementation Strategy

### MVP First (Phase 1 → Phase 4)

1. Complete Phase 1: Setup (T001) — ~15 min
2. Complete Phase 2: Foundational (T002) — ~20 min
3. Complete Phase 3: Core refactor (T003-T007) — ~45 min
4. Complete Phase 4: Consumer migration (T008-T010) — ~30 min
5. **STOP and VALIDATE**: Run type-check, lint, and manual regression
6. Application should be fully functional with zero regressions

### Incremental Delivery

1. T001-T002 → Types and context ready (compiles, no behavior change yet)
2. T003-T007 → PromptComposer refactored (consumers broken — expected)
3. T008-T010 → All consumers migrated (app functional again)
4. T011-T020 → Cleanup and validation (production ready)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1/US3/US4 share Phase 3 because they're architecturally inseparable — modality extensibility (US1) requires context (US3) and modality-driven rendering (US4)
- US2 is validated entirely through consumer migration + manual regression
- No test tasks generated (not requested in spec). Validation via type-checking + manual regression.
- LexicalPromptInput and ReferenceMediaItem are explicitly UNCHANGED — do not modify
- The `useRefMediaUpload` hook is UNCHANGED — consumers still call it the same way, just pass results differently
- Commit after each phase completes for easy rollback
