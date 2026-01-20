# Tasks: Capture Photo Extend

**Input**: Design documents from `/specs/035-capture-photo-extend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No test tasks included (not explicitly requested in specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `apps/clementine-app/`:
- **Shared camera module**: `src/shared/camera/`
- **Steps domain**: `src/domains/experience/steps/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup required - this is an extension of existing features

This feature modifies existing files only. No new project structure or dependencies needed.

**Checkpoint**: Ready to proceed to Foundational phase

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend core types and constants that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 [P] Extend AspectRatio type union to add '3:2' and '2:3' in `src/shared/camera/types/camera.types.ts`
- [ ] T002 [P] Add numeric values for 3:2 (1.5) and 2:3 (0.667) to ASPECT_RATIO_VALUES in `src/shared/camera/lib/capture.ts`
- [ ] T003 [P] Add CSS values for 3:2 and 2:3 to ASPECT_RATIO_CSS in `src/shared/camera/components/CameraView.tsx`
- [ ] T004 Extend aspectRatioSchema Zod enum to include '3:2' and '2:3' in `src/domains/experience/steps/schemas/capture-photo.schema.ts`
- [ ] T005 Run type-check to verify no type errors: `pnpm type-check`

**Checkpoint**: Foundation ready - all aspect ratio types and constants extended. User story implementation can now begin.

---

## Phase 3: User Story 1 - Experience Creator Selects New Aspect Ratio (Priority: P1) 🎯 MVP

**Goal**: Experience creators can select 3:2 (Landscape) and 2:3 (Tall Portrait) aspect ratios in the configuration panel

**Independent Test**: Open experience designer → Add capture photo step → Verify dropdown shows all 4 options → Select 3:2 → Save → Reload → Verify 3:2 persists

### Implementation for User Story 1

- [ ] T006 [US1] Add Landscape (3:2) and Tall Portrait (2:3) options to ASPECT_RATIO_OPTIONS array in `src/domains/experience/steps/config-panels/CapturePhotoConfigPanel.tsx`
- [ ] T007 [US1] Update help text logic to include descriptions for new aspect ratios in `src/domains/experience/steps/config-panels/CapturePhotoConfigPanel.tsx`
- [ ] T008 [US1] Verify config panel renders correctly with all 4 options in dev server

**Checkpoint**: User Story 1 complete - creators can now select and save any of the 4 aspect ratios

---

## Phase 4: User Story 2 - Guest Captures Photo in 3:2 Landscape Ratio (Priority: P1)

**Goal**: Guests can capture photos in 3:2 landscape format with proper camera view rendering

**Independent Test**: Create experience with 3:2 aspect ratio → Run as guest → Verify camera shows landscape orientation → Capture photo → Verify photo dimensions match 3:2 ratio

### Implementation for User Story 2

- [ ] T009 [US2] Verify CameraView renders correctly with 3:2 aspect ratio (CSS aspect-ratio property)
- [ ] T010 [US2] Verify captureFromVideo correctly crops to 3:2 ratio using calculateCropRegion in `src/shared/camera/lib/capture.ts`
- [ ] T011 [US2] Test 3:2 capture end-to-end in dev server

**Checkpoint**: User Story 2 complete - guests can capture landscape photos in 3:2 format

---

## Phase 5: User Story 3 - Guest Captures Photo in 2:3 Tall Portrait Ratio (Priority: P1)

**Goal**: Guests can capture photos in 2:3 tall portrait format with proper camera view rendering

**Independent Test**: Create experience with 2:3 aspect ratio → Run as guest → Verify camera shows tall portrait orientation → Capture photo → Verify photo dimensions match 2:3 ratio

### Implementation for User Story 3

- [ ] T012 [US3] Verify CameraView renders correctly with 2:3 aspect ratio (CSS aspect-ratio property)
- [ ] T013 [US3] Verify captureFromVideo correctly crops to 2:3 ratio using calculateCropRegion in `src/shared/camera/lib/capture.ts`
- [ ] T014 [US3] Test 2:3 capture end-to-end in dev server

**Checkpoint**: User Story 3 complete - guests can capture tall portrait photos in 2:3 format

---

## Phase 6: User Story 4 - Photo Preview Uses Available Space (Priority: P2)

**Goal**: Photo preview displays at responsive size filling available space rather than fixed small dimensions

**Independent Test**: Capture photo in any aspect ratio → Verify preview fills available container space while maintaining aspect ratio (not fixed 256x256 or 176x320)

### Implementation for User Story 4

- [ ] T015 [US4] Update PhotoPreview props interface: replace `isSquare: boolean` with `aspectRatio: string` in `src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx`
- [ ] T016 [US4] Add ASPECT_RATIO_CSS constant to PhotoPreview component in `src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx`
- [ ] T017 [US4] Replace fixed dimension classes with responsive CSS using aspect-ratio property in `src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx`
- [ ] T018 [US4] Update CapturePhotoRunMode to pass aspectRatio prop instead of isSquare to PhotoPreview in `src/domains/experience/steps/renderers/CapturePhotoRenderer/CapturePhotoRunMode.tsx`
- [ ] T019 [US4] Update CapturePhotoRunMode props interface to use extended AspectRatio type in `src/domains/experience/steps/renderers/CapturePhotoRenderer/CapturePhotoRunMode.tsx`
- [ ] T020 [US4] Test responsive preview sizing across all 4 aspect ratios in dev server

**Checkpoint**: User Story 4 complete - photo preview now uses responsive sizing for all aspect ratios

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T021 Run full validation suite: `pnpm app:check` (format + lint)
- [ ] T022 Run type-check: `pnpm type-check`
- [ ] T023 Test all 4 aspect ratios end-to-end on mobile viewport (320px-428px)
- [ ] T024 Verify existing 1:1 and 9:16 functionality unchanged (regression test)
- [ ] T025 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)     → Phase 2 (Foundational) → User Stories (Phases 3-6) → Phase 7 (Polish)
     │                        │                         │
     └── No setup needed      └── BLOCKS all stories    └── Can run in parallel
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) - Config panel options
- **User Story 2 (P1)**: Depends on Foundational (Phase 2) - 3:2 camera/capture
- **User Story 3 (P1)**: Depends on Foundational (Phase 2) - 2:3 camera/capture
- **User Story 4 (P2)**: Depends on Foundational (Phase 2) - Responsive preview

**Note**: User Stories 2 and 3 are verification tasks (the Foundational phase does the actual type/constant work). User Story 4 requires implementation changes.

### Parallel Opportunities

**Foundational Phase (T001-T004)**:
```
T001, T002, T003 can run in parallel (different files)
T004 depends on T001 (type import), run after T001
T005 depends on T001-T004 completion
```

**User Stories 1-4 (after Foundational)**:
```
US1 (T006-T008) - Independent, can start immediately
US2 (T009-T011) - Independent, can start immediately
US3 (T012-T014) - Independent, can start immediately
US4 (T015-T020) - Independent, can start immediately

All 4 user stories can be worked on in parallel!
```

---

## Parallel Example: Foundational Phase

```bash
# Launch these 3 tasks in parallel (different files):
Task: "Extend AspectRatio type in src/shared/camera/types/camera.types.ts"
Task: "Add ASPECT_RATIO_VALUES in src/shared/camera/lib/capture.ts"
Task: "Add ASPECT_RATIO_CSS in src/shared/camera/components/CameraView.tsx"

# Then run sequentially:
Task: "Extend aspectRatioSchema in capture-photo.schema.ts" (after T001)
Task: "Run type-check" (after T001-T004)
```

---

## Parallel Example: User Story 4

```bash
# Launch these 2 tasks in parallel (different files):
Task: "Update PhotoPreview component in components/PhotoPreview.tsx"
Task: "Update CapturePhotoRunMode in CapturePhotoRunMode.tsx"

# Note: Both files need to be updated together for the prop change,
# but the edits are independent and can be done in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T005)
2. Complete Phase 3: User Story 1 (T006-T008)
3. **STOP and VALIDATE**: Test config panel independently
4. Deploy/demo if ready - creators can now select new aspect ratios

### Incremental Delivery

1. Add Foundational → Types ready
2. Add User Story 1 → Config panel complete (MVP!)
3. Add User Story 2 → 3:2 capture works
4. Add User Story 3 → 2:3 capture works
5. Add User Story 4 → Responsive preview
6. Each story adds value without breaking previous stories

### Recommended Execution Order

For a single developer working sequentially:

```
T001 → T002 → T003 → T004 → T005 (Foundational)
  ↓
T006 → T007 → T008 (US1 - Config Panel) ✓ MVP
  ↓
T009 → T010 → T011 (US2 - 3:2 Capture)
  ↓
T012 → T013 → T014 (US3 - 2:3 Capture)
  ↓
T015 → T016 → T017 → T018 → T019 → T020 (US4 - Responsive Preview)
  ↓
T021 → T022 → T023 → T024 → T025 (Polish)
```

---

## Notes

- Total tasks: 25
- Tasks per story: US1 (3), US2 (3), US3 (3), US4 (6), Foundation (5), Polish (5)
- All user stories can run in parallel after Foundational phase
- No test tasks included (not requested in spec)
- Suggested MVP: Complete through User Story 1 (T001-T008) for functional aspect ratio selection
