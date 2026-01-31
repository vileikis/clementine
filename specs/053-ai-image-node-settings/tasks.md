# Tasks: AI Image Node Settings

**Input**: Design documents from `/specs/053-ai-image-node-settings/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Convention

All paths relative to `apps/clementine-app/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create component directory structure and barrel exports

- [ ] T001 Create PromptComposer directory at `domains/experience/generate/components/PromptComposer/`
- [ ] T002 Create barrel export in `domains/experience/generate/components/PromptComposer/index.ts`
- [ ] T003 Update barrel export in `domains/experience/generate/components/index.ts` to re-export PromptComposer

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure functions for transform config mutations needed by multiple user stories

**⚠️ CRITICAL**: US3 and US4 depend on these refMedia operations

- [ ] T004 Add `updateNodePrompt` function to `domains/experience/generate/lib/transform-operations.ts`
- [ ] T005 [P] Add `updateNodeModel` function to `domains/experience/generate/lib/transform-operations.ts`
- [ ] T006 [P] Add `updateNodeAspectRatio` function to `domains/experience/generate/lib/transform-operations.ts`
- [ ] T007 Add `addNodeRefMedia` function (with dedupe and max 10 limit) to `domains/experience/generate/lib/transform-operations.ts`
- [ ] T008 [P] Add `removeNodeRefMedia` function to `domains/experience/generate/lib/transform-operations.ts`
- [ ] T009 Export all new functions from `domains/experience/generate/lib/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Configure AI Image Node with Prompt (Priority: P1) 🎯 MVP

**Goal**: Admin can edit a multiline prompt with placeholder syntax support and see validation feedback

**Independent Test**: Open AI Image node settings, enter prompt text, verify it persists after save. Clear prompt to see validation error.

### Implementation for User Story 1

- [ ] T010 [US1] Create `PromptInput.tsx` component with multiline textarea in `domains/experience/generate/components/PromptComposer/PromptInput.tsx`
- [ ] T011 [US1] Add prompt validation display ("Prompt is required") to PromptInput when empty
- [ ] T012 [US1] Create skeleton `PromptComposer.tsx` container with bordered layout in `domains/experience/generate/components/PromptComposer/PromptComposer.tsx`
- [ ] T013 [US1] Wire PromptInput into PromptComposer with debounced (300ms) onChange handler
- [ ] T014 [US1] Connect PromptComposer to `useUpdateTransformConfig` hook for prompt mutations
- [ ] T015 [US1] Export PromptInput from barrel in `domains/experience/generate/components/PromptComposer/index.ts`

**Checkpoint**: Prompt editing works independently - admin can write and save prompts

---

## Phase 4: User Story 2 - Select AI Model and Aspect Ratio (Priority: P1)

**Goal**: Admin can select AI model and output aspect ratio from unlabeled dropdowns in the control row

**Independent Test**: Open AI Image node settings, change model and aspect ratio, verify selections persist after save.

### Implementation for User Story 2

- [ ] T016 [P] [US2] Create `ControlRow.tsx` skeleton with flex layout in `domains/experience/generate/components/PromptComposer/ControlRow.tsx`
- [ ] T017 [US2] Add unlabeled model Select dropdown to ControlRow using shadcn/ui Select component
- [ ] T018 [US2] Add unlabeled aspect ratio Select dropdown to ControlRow using shadcn/ui Select component
- [ ] T019 [US2] Connect model select onChange to `updateNodeModel` transform operation
- [ ] T020 [US2] Connect aspect ratio select onChange to `updateNodeAspectRatio` transform operation
- [ ] T021 [US2] Wire ControlRow into PromptComposer at bottom of container
- [ ] T022 [US2] Export ControlRow from barrel in `domains/experience/generate/components/PromptComposer/index.ts`

**Checkpoint**: Model and aspect ratio selectors work - admin can configure output settings

---

## Phase 5: User Story 3 - Add Reference Images via File Picker (Priority: P2)

**Goal**: Admin can click plus button to select multiple images, upload them, and see thumbnails with remove controls

**Independent Test**: Click plus button, select images from file picker, verify uploads complete and thumbnails appear. Click remove to delete.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Create `ReferenceMediaItem.tsx` for single thumbnail with remove button in `domains/experience/generate/components/PromptComposer/ReferenceMediaItem.tsx`
- [ ] T024 [P] [US3] Create `ReferenceMediaStrip.tsx` for horizontal thumbnail list in `domains/experience/generate/components/PromptComposer/ReferenceMediaStrip.tsx`
- [ ] T025 [US3] Add uploading state display (spinner/progress) to ReferenceMediaItem
- [ ] T026 [US3] Create `AddMediaButton.tsx` with native `<input type="file" multiple accept="image/*">` in `domains/experience/generate/components/PromptComposer/AddMediaButton.tsx`
- [ ] T027 [US3] Wire AddMediaButton onChange to upload flow using `useUploadMediaAsset` from media-library domain
- [ ] T028 [US3] Implement sequential file upload with progress tracking in PromptComposer
- [ ] T029 [US3] Connect successful uploads to `addNodeRefMedia` transform operation
- [ ] T030 [US3] Wire remove button onClick to `removeNodeRefMedia` transform operation
- [ ] T031 [US3] Add limit check: disable AddMediaButton when `refMedia.length >= 10`
- [ ] T032 [US3] Wire ReferenceMediaStrip into PromptComposer above PromptInput (conditionally hidden when empty)
- [ ] T033 [US3] Wire AddMediaButton into ControlRow at far right
- [ ] T034 [US3] Export ReferenceMediaItem, ReferenceMediaStrip, AddMediaButton from barrel

**Checkpoint**: File picker upload works - admin can add/remove reference images via button

---

## Phase 6: User Story 4 - Add Reference Images via Drag and Drop (Priority: P2)

**Goal**: Admin can drag image files onto PromptComposer to upload them, with visual drop zone feedback

**Independent Test**: Drag image files over composer, verify highlight appears. Drop files, verify uploads. Drag non-images, verify rejection.

### Implementation for User Story 4

- [ ] T035 [US4] Add `isDragOver` state to PromptComposer for drop zone highlight
- [ ] T036 [US4] Implement `onDragOver` handler with `e.preventDefault()` and highlight activation
- [ ] T037 [US4] Implement `onDragLeave` handler to clear highlight state
- [ ] T038 [US4] Implement `onDrop` handler with image MIME type filtering
- [ ] T039 [US4] Apply highlight/active border styles to PromptComposer when isDragOver is true
- [ ] T040 [US4] Connect dropped files to same upload flow as AddMediaButton (reuse T028)
- [ ] T041 [US4] Prevent drop when `refMedia.length >= 10` (show feedback or silently reject extras)

**Checkpoint**: Drag and drop works - admin has two methods to add reference images

---

## Phase 7: Polish & Integration

**Purpose**: Final wiring into existing components and validation

- [ ] T042 Update `AIImageNodeSettings` in `domains/experience/generate/components/NodeListItem/AIImageNode.tsx` to use PromptComposer
- [ ] T043 Remove placeholder sections (Model Settings, Prompt, Reference Media) from AIImageNodeSettings
- [ ] T044 Add ARIA labels to unlabeled model and aspect ratio selects for accessibility
- [ ] T045 Verify 44px minimum touch targets on all interactive elements
- [ ] T046 Run `pnpm app:check` to validate linting, formatting, and types
- [ ] T047 Manual test: Run through quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS US3/US4 (ref media operations)
- **User Story 1 (Phase 3)**: Depends on Setup only (uses T004 for prompt)
- **User Story 2 (Phase 4)**: Depends on Setup only (uses T005, T006)
- **User Story 3 (Phase 5)**: Depends on Foundational (T007, T008 for refMedia)
- **User Story 4 (Phase 6)**: Depends on US3 (reuses upload flow)
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

```
Setup (T001-T003)
    │
    ├── Foundational (T004-T009)
    │       │
    │       ├── US1 (T010-T015) ─── MVP! ───┐
    │       │                                │
    │       ├── US2 (T016-T022) ────────────┤
    │       │                                │
    │       └── US3 (T023-T034) ────────────┤
    │               │                        │
    │               └── US4 (T035-T041) ────┤
    │                                        │
    └────────────────────────────────────────┴── Polish (T042-T047)
```

### Parallel Opportunities

**Within Phase 2 (Foundational):**
```
T004 updateNodePrompt
T005 [P] updateNodeModel      ← can run parallel
T006 [P] updateNodeAspectRatio ← can run parallel
T007 addNodeRefMedia (depends on T004-T006 complete)
T008 [P] removeNodeRefMedia   ← can run parallel with T007
```

**Within Phase 4 (US2):**
```
T016 [P] ControlRow skeleton  ← start immediately
T017-T018 selects (after T016)
```

**Within Phase 5 (US3):**
```
T023 [P] ReferenceMediaItem   ← can run parallel
T024 [P] ReferenceMediaStrip  ← can run parallel
T025 (after T023)
T026+ (after T024)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational - only T004-T006 needed for MVP
3. Complete Phase 3: User Story 1 - Prompt editing
4. Complete Phase 4: User Story 2 - Model and aspect ratio
5. **STOP and VALIDATE**: Wire into AIImageNode, test prompt/model/aspectRatio
6. Deploy/demo if ready

### Full Feature

1. Complete remaining Foundational (T007-T009)
2. Complete Phase 5: User Story 3 - File picker
3. Complete Phase 6: User Story 4 - Drag and drop
4. Complete Phase 7: Polish
5. Final validation with quickstart.md checklist

---

## Summary

| Phase | Tasks | Stories | Parallel Opportunities |
|-------|-------|---------|------------------------|
| Setup | T001-T003 | - | Sequential (3 tasks) |
| Foundational | T004-T009 | - | T005, T006, T008 parallel |
| US1 (P1) | T010-T015 | US1 | Sequential (6 tasks) |
| US2 (P1) | T016-T022 | US2 | T016 can start early |
| US3 (P2) | T023-T034 | US3 | T023, T024 parallel |
| US4 (P2) | T035-T041 | US4 | Sequential (7 tasks) |
| Polish | T042-T047 | - | T044, T045 parallel |

**Total Tasks**: 47
**MVP Scope**: T001-T022 (22 tasks for prompt + model + aspect ratio)
**Full Scope**: All 47 tasks
