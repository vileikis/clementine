# Tasks: AI Video Advanced Controls

**Input**: Design documents from `/specs/086-video-advanced-controls/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Foundational (Schema + Frontend Infrastructure)

**Purpose**: Extend shared schema and frontend modality/control infrastructure — MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Add `videoResolutionSchema` enum (`'720p' | '1080p' | '4k'`) and extend `videoGenerationConfigSchema` with four new fields (`resolution`, `negativePrompt`, `sound`, `enhance`) with Zod defaults in `packages/shared/src/schemas/experience/experience-config.schema.ts`. Export `VideoResolution` type.
- [x] T002 Build shared package to make new types available to frontend and backend: run `pnpm --filter @clementine/shared build`
- [x] T003 [P] Add `resolution: boolean` to `ModalitySupports` interface. Set `resolution: true`, `sound: true`, `enhance: true` on `VIDEO_MODALITY` in `apps/clementine-app/src/domains/experience/create/lib/modality-definitions.ts`. Add `resolution: false` to all other modality definitions for type safety.
- [x] T004 [P] Add `RESOLUTION_OPTIONS` constant (720p, 1080p, 4K) and `MODEL_RESOLUTION_MAP` mapping each `AIVideoModel` to its allowed resolutions in `apps/clementine-app/src/domains/experience/create/lib/model-options.ts`
- [x] T005 [P] Extend `ModalityControlValues` with `resolution`, `onResolutionChange`, `sound`, `onSoundChange`, `enhance`, `onEnhanceChange` fields in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/PromptComposerContext.tsx`
- [x] T006 [P] Update `createDefaultAIVideoConfig()` to include `resolution: '1080p'`, `negativePrompt: ''`, `sound: false`, `enhance: false` in `apps/clementine-app/src/domains/experience/create/lib/experience-config-operations.ts`

**Checkpoint**: Schema extended, modality system ready, control infrastructure in place. User story implementation can begin.

---

## Phase 2: User Story 1 — Sound Toggle (Priority: P1) 🎯 MVP

**Goal**: Creators can toggle AI-generated audio on/off for video generation. Backend passes all 4 new parameters to Veo API.

**Independent Test**: Toggle Sound on in the PromptComposer control row, generate a video, and verify the output includes audio. Toggle off and verify silence.

### Implementation for User Story 1

- [x] T007 [P] [US1] Render a Sound toggle in `ControlRow` when `modality.supports.sound` is `true`. Use a compact toggle/switch component (shadcn/ui Switch or similar) with "Sound" label. Read value from `controls.sound` and call `controls.onSoundChange` on toggle in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/ControlRow.tsx`
- [x] T008 [P] [US1] Wire `sound` state from `videoGeneration.sound` to PromptComposer's `controls` prop. Add `onSoundChange` callback that calls `updateVideoGeneration({ sound })` in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx`
- [x] T009 [P] [US1] Extend `GenerateVideoRequest` interface with `resolution: VideoResolution`, `negativePrompt: string`, `sound: boolean`, `enhance: boolean`. Update `buildVeoParams` to include `resolution: request.resolution`, conditionally add `negativePrompt` (if non-empty), `generateAudio` (if sound true), `enhancePrompt` (if enhance true) to `baseConfig` in `functions/src/services/transform/operations/aiGenerateVideo.ts`
- [x] T010 [P] [US1] Pass `resolution`, `negativePrompt`, `sound`, `enhance` from `videoGeneration` config to `GenerateVideoRequest` when building the request in `functions/src/services/transform/outcomes/aiVideoOutcome.ts`

**Checkpoint**: Sound toggle visible in ControlRow, backend passes all 4 advanced params to Veo API. MVP complete.

---

## Phase 3: User Story 2 — Resolution Selector (Priority: P2)

**Goal**: Creators can select video resolution (720p/1080p/4K) with model-aware option filtering and 4K cost indicator.

**Independent Test**: Select standard model → verify 720p/1080p/4K options. Select fast model → verify only 720p/1080p. Select 4K → verify cost indicator. Switch to fast model with 4K selected → verify auto-downgrade to 1080p with notice.

### Implementation for User Story 2

- [x] T011 [P] [US2] Render a Resolution selector in `ControlRow` when `modality.supports.resolution` is `true`. Use `Select` component matching existing model/duration selectors. Filter options from `RESOLUTION_OPTIONS` using `MODEL_RESOLUTION_MAP` based on current `model` value. Show a cost indicator (e.g., small badge or tooltip) when `4k` is selected in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/ControlRow.tsx`
- [x] T012 [US2] Wire `resolution` state from `videoGeneration.resolution` to PromptComposer's `controls` prop. Add `onResolutionChange` callback. Add model-switch auto-downgrade logic to the existing `onModelChange` handler: when switching to a model that doesn't support the current resolution, reset to `'1080p'` and show an inline toast/notice in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx`

**Checkpoint**: Resolution selector visible in ControlRow with model-aware filtering. Auto-downgrade works on model switch.

---

## Phase 4: User Story 3 — Negative Prompt (Priority: P3)

**Goal**: Creators can enter an optional negative prompt to specify what to avoid in generated videos.

**Independent Test**: Enter a negative prompt (e.g., "no blurry faces"), verify it persists in the experience config, and verify it's included in the Veo API request.

### Implementation for User Story 3

- [x] T013 [US3] Add a Negative Prompt textarea below the PromptComposer in `AIVideoConfigForm`. Use a `Textarea` component with placeholder "Describe what to avoid in the generated video", `maxLength={500}`, and a character counter. Bind to `videoGeneration.negativePrompt` via `updateVideoGeneration({ negativePrompt })` in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx`

**Checkpoint**: Negative prompt textarea visible below PromptComposer with 500-char limit. Value persists and flows to backend.

---

## Phase 5: User Story 4 — Enhance Toggle (Priority: P4)

**Goal**: Creators can toggle prompt enhancement on/off for improved video quality.

**Independent Test**: Toggle Enhance on, generate a video, verify the `enhancePrompt: true` parameter is sent to Veo API.

### Implementation for User Story 4

- [x] T014 [P] [US4] Render an Enhance toggle in `ControlRow` when `modality.supports.enhance` is `true`. Use the same toggle pattern as Sound (T007). Add a brief description/tooltip explaining what enhancement does (e.g., "Improves prompt for better results") in `apps/clementine-app/src/domains/experience/create/components/PromptComposer/ControlRow.tsx`
- [x] T015 [P] [US4] Wire `enhance` state from `videoGeneration.enhance` to PromptComposer's `controls` prop. Add `onEnhanceChange` callback that calls `updateVideoGeneration({ enhance })` in `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx`

**Checkpoint**: Enhance toggle visible in ControlRow with description. Value persists and flows to backend.

---

## Phase 6: Polish & Validation

**Purpose**: Ensure everything works together, passes validation gates, and maintains backward compatibility

- [x] T016 Run `pnpm app:check` (format + lint) and `pnpm app:type-check` to verify no type errors across the frontend
- [x] T017 Run `pnpm functions:build` to verify backend compiles with the extended GenerateVideoRequest
- [x] T018 Verify backward compatibility: confirm existing experience configs without new fields parse correctly with Zod defaults (manually test or check schema parsing)
- [x] T019 Run standards compliance review per constitution Principle V: check design-system.md compliance (theme tokens, no hardcoded colors), component-libraries.md (shadcn/ui usage), code-quality.md (clean code, no dead code)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US1 Sound (Phase 2)**: Depends on Foundational completion — includes backend for all 4 params
- **US2 Resolution (Phase 3)**: Depends on Foundational completion — can run parallel with US1 frontend tasks
- **US3 Negative Prompt (Phase 4)**: Depends on Foundational completion — can run parallel with US1/US2
- **US4 Enhance (Phase 5)**: Depends on Foundational completion — can run parallel with US1/US2/US3
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Sound)**: Foundational only. Includes full backend passthrough for all 4 params — other stories get backend support "for free".
- **US2 (Resolution)**: Foundational only. Independent of US1 frontend, but benefits from US1's backend work being done.
- **US3 (Negative Prompt)**: Foundational only. Completely independent — different UI location (AIVideoConfigForm, not ControlRow).
- **US4 (Enhance)**: Foundational only. Independent, same pattern as US1 (toggle in ControlRow).

### Within Each User Story

- ControlRow changes and AIVideoConfigForm changes can run in parallel (different files)
- Backend changes (T009, T010) can run in parallel with frontend changes (different workspaces)

### Parallel Opportunities

- T003, T004, T005, T006 can all run in parallel (different files, after T002)
- T007, T008, T009, T010 can all run in parallel (different files across workspaces)
- US2, US3, US4 can all start as soon as Foundational is complete (and US1 backend is done for full passthrough)
- T014 and T015 can run in parallel (different files)

---

## Parallel Example: Foundational Phase

```
# After T002 (shared build), launch all infrastructure tasks together:
T003: modality-definitions.ts (ModalitySupports + VIDEO_MODALITY flags)
T004: model-options.ts (RESOLUTION_OPTIONS + MODEL_RESOLUTION_MAP)
T005: PromptComposerContext.tsx (ModalityControlValues extension)
T006: experience-config-operations.ts (default config update)
```

## Parallel Example: User Story 1

```
# All US1 tasks can run in parallel (different files):
T007: ControlRow.tsx (sound toggle rendering)
T008: AIVideoConfigForm.tsx (sound wiring)
T009: aiGenerateVideo.ts (backend interface + buildVeoParams)
T010: aiVideoOutcome.ts (pass fields to request)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (schema + infrastructure)
2. Complete Phase 2: User Story 1 — Sound Toggle
3. **STOP and VALIDATE**: Sound toggle works end-to-end, backend passes all 4 params
4. Deploy/demo if ready

### Incremental Delivery

1. Foundational → Infrastructure ready
2. US1 Sound → Backend complete + Sound toggle → Deploy (MVP!)
3. US2 Resolution → Model-aware resolution picker → Deploy
4. US3 Negative Prompt → Textarea below composer → Deploy
5. US4 Enhance → Enhance toggle → Deploy
6. Polish → Validation, standards compliance → Final

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Backend passthrough for ALL 4 params is bundled into US1 since they share the same function (`buildVeoParams`)
- Each user story is independently testable after Foundational phase
- All new schema fields use `.default()` for backward compatibility — no migration needed
- ControlRow tasks (T007, T011, T014) all modify the same file but are in different phases — execute sequentially
- AIVideoConfigForm tasks (T008, T012, T013, T015) all modify the same file but are in different phases — execute sequentially
