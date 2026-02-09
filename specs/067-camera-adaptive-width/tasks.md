# Tasks: Camera Adaptive Width

**Input**: Design documents from `/specs/067-camera-adaptive-width/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: No tests requested - this is a layout refactoring task with manual visual testing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Base path**: `apps/clementine-app/src/`
- **Components**: `domains/experience/steps/renderers/CapturePhotoRenderer/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Review existing code and prepare for layout changes

- [x] T001 Review current CameraView component to verify aspect-ratio support in `apps/clementine-app/src/shared/camera/components/CameraView.tsx`
- [x] T002 Review CapturePhotoRunMode to understand component orchestration in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/CapturePhotoRunMode.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: N/A - No foundational work needed. Existing components and patterns are sufficient.

**⚠️ NOTE**: This feature modifies existing components only. No new infrastructure required.

**Checkpoint**: Proceed directly to User Story implementation.

---

## Phase 3: User Story 1 - Camera Active Responsive Layout (Priority: P1) 🎯 MVP

**Goal**: Implement two-zone layout for camera active state with contain behavior, safe-area support, and letterboxing.

**Independent Test**: Open camera capture on various devices (mobile portrait/landscape, tablet, desktop) and verify:
- Camera preview fits within preview zone with letterboxing as needed
- Controls remain pinned at bottom and never overlap preview
- Safe-area padding works on iOS devices

### Implementation for User Story 1

- [x] T003 [US1] Refactor CameraActive to two-zone layout structure in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/CameraActive.tsx`
  - Change outer container to `flex flex-col h-full w-full`
  - Add Preview Zone with `flex-1 min-h-0 flex items-center justify-center`
  - Add Camera Container with `bg-black rounded-2xl overflow-hidden`
  - Update CameraView styling for contain behavior (`max-w-full max-h-full`)

- [x] T004 [US1] Add safe-area padding to controls zone in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/CameraActive.tsx`
  - Update controls div to use `pb-[env(safe-area-inset-bottom,1.5rem)]`
  - Ensure controls never overlap preview zone

- [x] T005 [US1] Remove `max-h-[70vh]` constraint from camera container in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/CameraActive.tsx`
  - Allow preview zone to use full available space
  - Letterboxing handled by flexbox centering + aspect-ratio

- [ ] T006 [US1] Manual test: Verify CameraActive layout on multiple devices and aspect ratios
  - Test 1:1 ratio on tall phone (should show letterboxing top/bottom)
  - Test 9:16 ratio on wide screen (should show pillarboxing left/right)
  - Test controls accessibility on small screens

**Checkpoint**: CameraActive should now show proper two-zone layout with letterboxing. This is the MVP.

---

## Phase 4: User Story 2 - Photo Review Consistent Framing (Priority: P2)

**Goal**: Implement clean two-zone layout for photo review without black container styling.

**Independent Test**: Capture a photo and verify:
- Photo preview framing matches camera active framing
- No black rounded container visible (cleaner appearance)
- Retake/Continue buttons pinned at bottom with safe-area padding

### Implementation for User Story 2

- [x] T007 [US2] Refactor PhotoPreview to two-zone layout in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx`
  - Change outer container to `flex flex-col h-full w-full`
  - Add Preview Zone with `flex-1 min-h-0 flex items-center justify-center p-4`
  - Remove black container wrapper (`bg-black rounded-2xl`)

- [x] T008 [US2] Update image styling for contain behavior in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx`
  - Use `max-w-full max-h-full object-contain` on img element
  - Maintain aspect-ratio via inline style

- [x] T009 [US2] Add safe-area padding to controls zone in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx`
  - Update controls div to use `pb-[env(safe-area-inset-bottom,1.5rem)]`
  - Ensure consistent controls height with CameraActive

- [ ] T010 [US2] Manual test: Verify PhotoPreview layout consistency
  - Compare framing between camera active and photo review
  - Verify no black container visible
  - Test Retake/Continue buttons accessibility

**Checkpoint**: PhotoPreview should now show clean layout matching CameraActive framing without container styling.

---

## Phase 5: User Story 3 - Upload Progress Feedback (Priority: P3)

**Goal**: Align UploadProgress with two-zone layout pattern for consistency.

**Independent Test**: Confirm a photo and verify:
- Photo displayed with overlay and spinner during upload
- Layout maintains aspect ratio and responsive sizing
- Consistent visual appearance with other states

### Implementation for User Story 3

- [x] T011 [US3] Refactor UploadProgress to two-zone layout in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/UploadProgress.tsx`
  - Change outer container to `flex flex-col h-full w-full`
  - Add Preview Zone with `flex-1 min-h-0 flex items-center justify-center`
  - Move photo preview into preview zone

- [x] T012 [US3] Update image styling for contain behavior in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/UploadProgress.tsx`
  - Use `max-w-full max-h-full object-contain` on img element
  - Maintain aspect-ratio via inline style
  - Keep overlay with spinner positioned correctly

- [x] T013 [US3] Add status message zone (replaces controls) in `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/UploadProgress.tsx`
  - Position "Saving your photo..." message in consistent location
  - Apply safe-area padding if needed

- [ ] T014 [US3] Manual test: Verify UploadProgress layout
  - Confirm photo maintains aspect ratio with overlay
  - Verify spinner and message display correctly
  - Test on different device sizes

**Checkpoint**: UploadProgress should now match two-zone layout pattern.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T015 Run validation: `cd apps/clementine-app && pnpm check` (format + lint)
- [x] T016 Run type check: `cd apps/clementine-app && pnpm type-check`
- [ ] T017 Cross-device validation per quickstart.md testing checklist
  - [ ] iPhone (with notch/dynamic island)
  - [ ] Android phone
  - [ ] iPad
  - [ ] Desktop browser
- [ ] T018 Verify orientation change handling (portrait ↔ landscape)
- [ ] T019 Review design-system.md compliance (no hard-coded colors except bg-black for camera container)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - review existing code
- **Foundational (Phase 2)**: N/A - skipped for this feature
- **User Stories (Phase 3-5)**: Can be implemented sequentially (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - can start after Setup
- **User Story 2 (P2)**: No dependencies on US1 (different file) - can run in parallel
- **User Story 3 (P3)**: No dependencies on US1/US2 (different file) - can run in parallel

### Within Each User Story

- Layout structure changes first
- Styling updates second
- Manual testing last

### Parallel Opportunities

Since all three components are separate files with no shared code changes:

- **T003-T006 (US1)** can run in parallel with **T007-T010 (US2)** and **T011-T014 (US3)**
- Within each story, tasks are sequential (layout → styling → testing)

---

## Parallel Example: All User Stories

```bash
# All three user stories can be implemented in parallel:

# Developer A: User Story 1
Task: "Refactor CameraActive to two-zone layout in CameraActive.tsx"

# Developer B: User Story 2
Task: "Refactor PhotoPreview to two-zone layout in PhotoPreview.tsx"

# Developer C: User Story 3
Task: "Refactor UploadProgress to two-zone layout in UploadProgress.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 3: User Story 1 (T003-T006)
3. **STOP and VALIDATE**: Test CameraActive on multiple devices
4. If MVP acceptable, can ship and iterate

### Incremental Delivery

1. Add User Story 1 → Test → Deploy (MVP - camera capture works)
2. Add User Story 2 → Test → Deploy (photo review improved)
3. Add User Story 3 → Test → Deploy (upload progress aligned)
4. Each story adds value without breaking previous stories

### Sequential Implementation (Recommended)

For a single developer:
1. T001-T002 (Setup)
2. T003-T006 (US1 - CameraActive)
3. T007-T010 (US2 - PhotoPreview)
4. T011-T014 (US3 - UploadProgress)
5. T015-T019 (Polish)

---

## Notes

- No new files created - all modifications to existing components
- All [P] marked tasks within different user stories can run in parallel
- Manual testing replaces automated tests for layout changes
- Each checkpoint verifies story works independently
- Commit after each user story completion
- `bg-black` is acceptable for camera container per design system compliance
