# Tasks: AI Video Editor v2

**Input**: Design documents from `/specs/075-ai-video-editor-v2/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Foundational — Shared Schema & Constants

**Purpose**: Schema changes and constants that MUST be complete before any frontend or backend work. These changes also implement US4 (migration) via Zod transforms.

- [ ] T001 Update AI video schemas in `packages/shared/src/schemas/experience/outcome.schema.ts`:
  - Replace `aiVideoTaskSchema` enum with new values (`image-to-video`, `ref-images-to-video`, `transform`, `reimagine`) plus legacy `animate` value, and add `.transform()` to map `'animate'` → `'image-to-video'` (see data-model.md Section 1)
  - Create `videoDurationSchema` with `.transform()` that coerces any number to nearest valid value (4, 6, 8) and `.pipe()` to validate output (see data-model.md Section 2)
  - Update `videoGenerationConfigSchema`: replace inline duration with `videoDurationSchema.default(6)`, add `refMedia: z.array(mediaReferenceSchema).default([])` (import `mediaReferenceSchema` from `../media/media-reference.schema`)
  - Update `aiVideoOutcomeConfigSchema`: change default task from `'animate'` to `'image-to-video'`
  - Add `VideoDuration` type export: `export type VideoDuration = z.infer<typeof videoDurationSchema>`
  - Note: `AIVideoTask` type will change from enum literal to transformed output type — verify downstream TypeScript still compiles

- [ ] T002 [P] Add video-specific constants in `apps/clementine-app/src/domains/experience/create/lib/model-options.ts`:
  - Add `DURATION_OPTIONS` array: `[{ value: '4', label: '4s' }, { value: '6', label: '6s' }, { value: '8', label: '8s' }]` (string values for Select component compatibility)
  - Add `MAX_VIDEO_REF_MEDIA_COUNT = 2` constant

- [ ] T003 [P] Update default config factory in `apps/clementine-app/src/domains/experience/create/lib/outcome-operations.ts`:
  - In `createDefaultAIVideoConfig()`: change `task: 'animate'` to `task: 'image-to-video'`, change `duration: 5` to `duration: 6`, add `refMedia: []` to the `videoGeneration` object

- [ ] T004 Build shared package and verify: run `pnpm --filter @clementine/shared build` then `pnpm --filter @clementine/shared test` to confirm schema changes compile and existing tests pass

**Checkpoint**: Shared schemas updated. All downstream workspaces can now use new task identifiers and duration type. US4 (migration) is complete — legacy `'animate'` values and non-standard durations are handled by Zod transforms at parse time.

---

## Phase 2: US1 — Task Selection + Prompt Composer (Priority: P1)

**Goal**: Replace `VideoGenerationSection` with `PromptComposer` for `image-to-video` task. Add task selector with coming soon badges, @mention support, model picker with video models, and fixed duration picker (4s/6s/8s).

**Independent Test**: Open AI Video editor → see 4 task options (2 active, 2 coming soon) → select Animate → compose prompt with @mentions → pick model → pick duration → verify config saves via autosave.

- [ ] T005 [P] [US1] Add optional duration picker to ControlRow in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/ControlRow.tsx`:
  - Add props to `ControlRowProps`: `duration?: string`, `onDurationChange?: (duration: string) => void`, `durationOptions?: readonly SelectOption[]`
  - Render a third Select dropdown (between aspect ratio and the flex spacer) when `durationOptions` is provided
  - Follow the same Select pattern used for model and aspect ratio pickers
  - When `durationOptions` is not provided, render nothing (backward compatible)

- [ ] T006 [P] [US1] Add `modelOptions`, `duration`, and `hideRefMedia` props to PromptComposer in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/PromptComposer.tsx`:
  - Add to `PromptComposerProps`: `modelOptions?: readonly SelectOption[]` (default: `AI_IMAGE_MODELS`), `duration?: string`, `onDurationChange?: (duration: string) => void`, `durationOptions?: readonly SelectOption[]`, `hideRefMedia?: boolean` (default: `false`)
  - Pass `modelOptions` to ControlRow's `modelOptions` prop (currently hardcoded as `AI_IMAGE_MODELS`)
  - Pass `duration`, `onDurationChange`, `durationOptions` through to ControlRow
  - When `hideRefMedia` is true: hide `ReferenceMediaStrip` rendering, pass `isAddDisabled={true}` to ControlRow's AddMediaButton (or hide it), and disable drag-and-drop
  - Import `SelectOption` type from `./ControlRow` if not already imported

- [ ] T007 [P] [US1] Update AIVideoTaskSelector with new task options and coming soon state in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoTaskSelector.tsx`:
  - Replace current task options array with: `image-to-video` (label: "Animate", description: "Bring a photo to life as video"), `ref-images-to-video` (label: "Remix", description: "Create a new video using photo and reference images as creative input"), `transform` (label: "Transform", description: "Photo transitions into an AI-generated version", comingSoon: true), `reimagine` (label: "Reimagine", description: "Video between two AI-generated frames", comingSoon: true)
  - Update the type of `task` prop from old `AIVideoTask` enum to the new type (will be inferred from updated schema)
  - Render coming soon tasks as disabled options with a "Coming soon" badge (use `<span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">Coming soon</span>` — matches the pattern in `OutcomeTypePicker.tsx`)
  - Disabled options should not trigger `onTaskChange`

- [ ] T008 [US1] Refactor AIVideoConfigForm to replace VideoGenerationSection with PromptComposer in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx`:
  - Remove import of `VideoGenerationSection`
  - Add imports: `PromptComposer` from `../PromptComposer`, `AI_VIDEO_MODELS`, `DURATION_OPTIONS` from `../../lib/model-options`, `useRefMediaUpload` (will be wired for US2)
  - Replace `<VideoGenerationSection config={videoGeneration} onConfigChange={updateVideoGeneration} />` with `<PromptComposer>` configured for video generation:
    - `prompt={videoGeneration.prompt}`, `onPromptChange` handler updating `videoGeneration.prompt`
    - `model={videoGeneration.model}`, `onModelChange` handler updating `videoGeneration.model`
    - `modelOptions={AI_VIDEO_MODELS}`
    - `duration={String(videoGeneration.duration)}`, `onDurationChange` handler parsing to number and updating `videoGeneration.duration`
    - `durationOptions={DURATION_OPTIONS}`
    - `aspectRatio` / `onAspectRatioChange` — pass current value, but `hideAspectRatio={true}` (controlled at outcome level)
    - `hideRefMedia={true}` for `image-to-video` task (ref media wired in US2 for `ref-images-to-video`)
    - `refMedia={[]}`, `onRefMediaRemove={() => {}}`, `uploadingFiles={[]}`, `onFilesSelected={() => {}}`, `canAddMore={false}`, `isUploading={false}` — placeholder props (functional ref media in US2)
    - `steps={mentionableSteps}` — filter info steps from experience steps (follow AI image pattern)
    - `error={getFieldError(errors, 'aiVideo.videoGeneration.prompt')}`
  - Update task change handler: replace `'animate'` checks with `'image-to-video'`, add handling for `'ref-images-to-video'`
  - Update conditional rendering: replace `config.task === 'animate'` with `config.task === 'image-to-video'`, update transform/reimagine checks (these stay the same)
  - Compute `mentionableSteps` by filtering out info steps (follow pattern from `AIImageConfigForm.tsx`)

- [ ] T009 [US1] Delete VideoGenerationSection and update barrel export:
  - Delete `apps/clementine-app/src/domains/experience/create/components/ai-video-config/VideoGenerationSection.tsx`
  - Remove `export { VideoGenerationSection } from './VideoGenerationSection'` from `apps/clementine-app/src/domains/experience/create/components/ai-video-config/index.ts`

**Checkpoint**: US1 complete. AI Video editor shows 4 task options (2 active, 2 coming soon). Animate task uses PromptComposer with @mentions, video model picker, and fixed duration selector. VideoGenerationSection is removed.

---

## Phase 3: US2 — Reference Media for Remix (Priority: P2)

**Goal**: Enable reference media upload and display for the `ref-images-to-video` (Remix) task, with a limit of 2 additional images. Ref media is hidden for other tasks but data persists across task switches.

**Independent Test**: Select Remix → see ref media strip → upload 2 images → verify max enforced → switch to Animate → ref media hidden → switch back to Remix → ref media reappears.

- [ ] T010 [P] [US2] Add `maxCount` parameter to useRefMediaUpload hook in `apps/clementine-app/src/domains/experience/create/hooks/useRefMediaUpload.ts`:
  - Add `maxCount?: number` to `UseRefMediaUploadParams` interface (default: `MAX_REF_MEDIA_COUNT` which is 5)
  - Replace hardcoded `MAX_REF_MEDIA_COUNT` usage in `availableSlots` computation with `maxCount ?? MAX_REF_MEDIA_COUNT`
  - Existing callers (AIImageConfigForm, FrameGenerationSection) continue to work unchanged with the default

- [ ] T011 [US2] Wire reference media upload for `ref-images-to-video` task in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx`:
  - Add `useRefMediaUpload` hook call with `maxCount: MAX_VIDEO_REF_MEDIA_COUNT` (import from `model-options.ts`), `currentRefMedia: videoGeneration.refMedia`, and `onMediaUploaded` handler that appends to `videoGeneration.refMedia`
  - Add `handleRemoveRefMedia` handler that filters `videoGeneration.refMedia` by `mediaAssetId`
  - Update PromptComposer props conditionally based on task:
    - When `task === 'ref-images-to-video'`: set `hideRefMedia={false}`, pass `refMedia={videoGeneration.refMedia}`, `onRefMediaRemove={handleRemoveRefMedia}`, `uploadingFiles`, `onFilesSelected={uploadFiles}`, `canAddMore`, `isUploading` from the hook
    - When `task === 'image-to-video'`: keep `hideRefMedia={true}` and placeholder props (from T008)
  - Reference media data persists in `videoGeneration.refMedia` across task switches (no clearing on switch — follows existing pattern for frame generation configs)

**Checkpoint**: US2 complete. Remix task shows ref media strip with upload capability (max 2 images). Switching tasks preserves ref media silently. Combined with US1, both Animate and Remix are fully configurable.

---

## Phase 4: US3 — Backend Video Generation Routing (Priority: P1)

**Goal**: Backend executor correctly routes to the appropriate Veo API pattern based on task. `image-to-video` uses `params.image` path, `ref-images-to-video` uses `config.referenceImages` path. Prompts with @mentions are resolved.

**Independent Test**: Trigger video generation for Animate → verify `sourceMedia` passed as `GenerateVideoRequest.sourceMedia` (no `referenceMedia`). Trigger for Remix → verify `sourceMedia` + `refMedia` passed as `referenceMedia` (no direct `sourceMedia` image). Both produce valid videos.

- [ ] T012 [US3] Update aiVideoOutcome executor with task-based routing and refMedia support in `functions/src/services/transform/outcomes/aiVideoOutcome.ts`:
  - Pass `videoGeneration.refMedia` (instead of `[]`) to `resolvePromptMentions()` as the third argument, so @{ref:...} mentions in video prompts can resolve to reference media
  - Add task-based routing using a `switch` statement on `task`:
    - `'image-to-video'`: compose `GenerateVideoRequest` with `sourceMedia` only (existing behavior — no changes to current params)
    - `'ref-images-to-video'`: compose `GenerateVideoRequest` with `sourceMedia` + `referenceMedia: resolvedRefMedia` (combine user photo and resolved ref media references). Do NOT set `sourceMedia` in the request directly as the image field — instead pass it via `referenceMedia` array alongside any additional ref media
    - `'transform'` / `'reimagine'`: throw an error with message "Task not yet supported" (coming soon)
  - The `aiGenerateVideo.ts` operation already handles both patterns via `buildVeoParams()` — no changes needed there
  - Ensure `resolved.mediaRefs` from prompt resolution are included in the reference media if the prompt mentions any @{ref:...} media

**Checkpoint**: US3 complete. Backend correctly routes video generation by task type. Animate uses image-to-video API path, Remix uses reference-images-to-video API path with the user photo + additional refs as ASSET-type references.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation, regression testing, and cleanup

- [ ] T013 [P] Run validation gates: `pnpm --filter @clementine/shared build && pnpm --filter @clementine/shared test` then `pnpm app:check` (format + lint) then `pnpm app:type-check` then `pnpm functions:build`

- [ ] T014 Verify no regressions: manually confirm Photo and AI Image outcome types still work end-to-end (create/edit/save). Verify AI Image PromptComposer still renders correctly (no props broken by the extension). Run quickstart.md testing checklist.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately. BLOCKS all other phases.
- **US1 (Phase 2)**: Depends on Phase 1 completion (schema changes + constants)
- **US2 (Phase 3)**: Depends on Phase 2 completion (PromptComposer already integrated in AIVideoConfigForm)
- **US3 (Phase 4)**: Depends on Phase 1 completion only (schema changes). Can run in PARALLEL with Phase 2 and Phase 3.
- **Polish (Phase 5)**: Depends on all other phases being complete.

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only. No dependency on other stories.
- **US2 (P2)**: Depends on US1 (needs PromptComposer already integrated in AIVideoConfigForm).
- **US3 (P1)**: Depends on Foundational only. Independent of US1 and US2 (backend work).
- **US4 (P2)**: Fully implemented in Foundational phase (Zod transforms). No separate tasks needed.

### Within Each Phase

- Phase 1: T001 first (schemas), then T002/T003 in parallel, then T004 (build/verify)
- Phase 2: T005/T006/T007 in parallel, then T008 (depends on all three), then T009
- Phase 3: T010 can start immediately, T011 depends on T010
- Phase 4: T012 is a single task
- Phase 5: T013 then T014

### Parallel Opportunities

```
Phase 1:  T001 ──→ T002 ┐
                   T003 ┘──→ T004

Phase 2:  T005 ┐
          T006 ├──→ T008 ──→ T009
          T007 ┘

Phase 3:  T010 ──→ T011

Phase 4:  T012           ← Can run in parallel with Phase 2 & 3

Phase 5:  T013 ──→ T014
```

---

## Parallel Example: After Phase 1 Completes

```
# Frontend and backend can proceed simultaneously:

# Frontend developer:
Task T005: "Add duration picker to ControlRow in ControlRow.tsx"
Task T006: "Add modelOptions/duration/hideRefMedia to PromptComposer in PromptComposer.tsx"
Task T007: "Update AIVideoTaskSelector with new options in AIVideoTaskSelector.tsx"

# Backend developer (in parallel):
Task T012: "Update aiVideoOutcome executor with task routing in aiVideoOutcome.ts"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Foundational schemas and constants
2. Complete Phase 2: US1 — Task selection + PromptComposer for Animate
3. **STOP and VALIDATE**: Animate task works end-to-end with @mentions, video models, fixed duration
4. US4 (migration) is already working via Zod transforms

### Incremental Delivery

1. Phase 1 (Foundational) → Schemas ready, migration working
2. Phase 2 (US1) → Animate task configurable with PromptComposer (MVP)
3. Phase 3 (US2) → Remix task gains ref media support
4. Phase 4 (US3) → Backend routes correctly for both tasks
5. Phase 5 (Polish) → Validation and regression check
6. Each phase adds value without breaking previous work

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US4 (Migration) has no dedicated phase — fully implemented by Zod transforms in Phase 1 (T001)
- `aiGenerateVideo.ts` already supports both Veo API patterns (`params.image` and `config.referenceImages`) — no changes needed there
- VideoGenerationSection.tsx is DELETED (replaced by PromptComposer)
- All PromptComposer changes are backward-compatible — existing usages in AIImageConfigForm and FrameGenerationSection require zero changes
