# Tasks: Photo Capture (E5.2)

**Input**: Design documents from `/specs/033-photo-capture/`
**Prerequisites**: plan.md (required), epic requirements, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the feature specification. Test tasks are omitted per template rules.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `apps/clementine-app/src/` for frontend code
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extract utilities and create foundational types for photo capture

- [ ] T001 [P] Create permission utilities file in apps/clementine-app/src/shared/camera/lib/permission-utils.ts
- [ ] T002 [P] Add PhotoCaptureStatus and hook types to apps/clementine-app/src/shared/camera/types/camera.types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the core capture orchestration hook that all UI depends on

**⚠️ CRITICAL**: CapturePhotoRenderer implementation cannot begin until this phase is complete

- [ ] T003 Create usePhotoCapture hook in apps/clementine-app/src/shared/camera/hooks/usePhotoCapture.ts
- [ ] T004 Update shared/camera lib index to export permission utilities in apps/clementine-app/src/shared/camera/lib/index.ts
- [ ] T005 Update shared/camera main index to export usePhotoCapture hook and types in apps/clementine-app/src/shared/camera/index.ts
- [ ] T006 Update PermissionPrompt to import from permission-utils instead of inline functions in apps/clementine-app/src/shared/camera/components/PermissionPrompt.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Camera Permission Handling (Priority: P1) 🎯 MVP

**Goal**: Guest can grant camera permission and see the camera feed with themed UI

**Independent Test**: Open capture step → permission prompt appears → grant permission → camera feed displays

**From Epic Acceptance Criteria**:
- Camera permission requested and handled gracefully
- Live camera preview displays in capture step
- All UI uses themed components (ThemedButton, ThemedText)

### Implementation for User Story 1

- [ ] T007 [US1] Add permission state handling (unknown, undetermined, granted) to CapturePhotoRenderer in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T008 [US1] Implement themed permission prompt UI with ThemedButton/ThemedText in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T009 [US1] Implement camera-active state showing CameraView with Take Photo button in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx

**Checkpoint**: At this point, permission flow and camera preview should work with themed UI

---

## Phase 4: User Story 2 - Photo Capture and Review (Priority: P2)

**Goal**: Guest can capture a photo, review it, and retake if needed

**Independent Test**: Camera active → tap Take Photo → photo preview shows → tap Retake → returns to camera

**From Epic Acceptance Criteria**:
- Photo capture produces image from camera stream
- Captured photo preview shows for review
- Retake returns to camera preview

### Implementation for User Story 2

- [ ] T010 [US2] Implement photo-preview state with captured image display in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T011 [US2] Add Retake and Continue buttons with ThemedButton in photo-preview state in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T012 [US2] Wire capture() action to Take Photo button in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T013 [US2] Wire retake() action to Retake button in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx

**Checkpoint**: At this point, full capture/review/retake flow should work locally (no upload yet)

---

## Phase 5: User Story 3 - Storage Upload and Session Persistence (Priority: P3)

**Goal**: Captured photo is uploaded to Firebase Storage and persisted in session

**Independent Test**: Photo preview → tap Continue → uploading state shows → photo saved to Storage → session.capturedMedia updated → proceeds to next step

**From Epic Acceptance Criteria**:
- Confirm uploads photo to storage
- Captured media stored in session document

### Implementation for User Story 3

- [ ] T014 [US3] Create uploadCapturedPhoto helper function in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T015 [US3] Implement uploading state with loading indicator in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T016 [US3] Wire confirm flow to upload photo and update runtime store with captured media in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T017 [US3] Call onSubmit after successful upload to proceed to next step in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx

**Checkpoint**: At this point, full capture → upload → persist → continue flow should work

---

## Phase 6: User Story 4 - Permission Denied and Fallback (Priority: P4)

**Goal**: Guest can upload a photo when camera is unavailable or permission denied

**Independent Test**: Deny camera permission → shows blocked message with instructions → tap Upload Photo → file picker opens → select photo → shows in preview → can continue

**From Epic Acceptance Criteria**:
- File upload fallback when camera unavailable

### Implementation for User Story 4

- [ ] T018 [US4] Implement denied permission state with getDeniedInstructions() in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T019 [US4] Implement unavailable permission state (no camera hardware) in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T020 [US4] Wire useLibraryPicker hook for file upload fallback in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T021 [US4] Add hidden file input and wire to Upload Photo button in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx

**Checkpoint**: At this point, all camera permission scenarios should work with fallback to file upload

---

## Phase 7: User Story 5 - Edit Mode and Error Handling (Priority: P5)

**Goal**: Edit mode shows placeholder, errors are handled gracefully

**Independent Test**: Open step in edit mode → shows camera placeholder with aspect ratio. In run mode: trigger error → shows error state with retry option.

**From Epic Acceptance Criteria**:
- Edit mode shows placeholder with aspect ratio config

### Implementation for User Story 5

- [ ] T022 [US5] Verify edit mode placeholder shows camera icon and aspect ratio in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T023 [US5] Implement error state with retry and fallback options in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
- [ ] T024 [US5] Add blob URL cleanup in useEffect cleanup and retake flow in apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and verification

- [ ] T025 [P] Add capture.photo case to step validation in apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts
- [ ] T026 Run pnpm app:check to verify formatting and linting
- [ ] T027 Run pnpm app:type-check to verify TypeScript compilation
- [ ] T028 Run quickstart.md manual testing checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Permission) → US2 (Capture/Review) → US3 (Upload) → US4 (Fallback) → US5 (Edit/Error)
  - Stories should be implemented sequentially as they build on each other
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (needs permission granted to capture)
- **User Story 3 (P3)**: Depends on US2 (needs captured photo to upload)
- **User Story 4 (P4)**: Can start after Foundational - Independent (handles denied/unavailable states)
- **User Story 5 (P5)**: Can start after Foundational - Mostly independent (edit mode, errors)

### Within Each User Story

- Core state handling before UI refinements
- Wire actions after implementing state displays
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks (T001, T002) can run in parallel
- US4 (Fallback) and US5 (Edit/Error) could theoretically run in parallel with US1-3 if different developers work on them
- Polish task T025 is independent and can run anytime after Phase 2

---

## Parallel Example: Setup Phase

```bash
# Launch setup tasks together:
Task: "Create permission utilities file in apps/clementine-app/src/shared/camera/lib/permission-utils.ts"
Task: "Add PhotoCaptureStatus and hook types to apps/clementine-app/src/shared/camera/types/camera.types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 + 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Permission handling)
4. Complete Phase 4: User Story 2 (Capture/Review)
5. Complete Phase 5: User Story 3 (Upload/Persist)
6. **STOP and VALIDATE**: Core capture flow should work end-to-end
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Permission flow works → Test
3. Add User Story 2 → Capture/Review works → Test
4. Add User Story 3 → Upload works → Test (MVP complete!)
5. Add User Story 4 → Fallback works → Test
6. Add User Story 5 → Edit mode + errors → Test
7. Polish phase → Final validation

### Single Developer Strategy

With one developer (sequential execution):
1. Phase 1: Setup (T001-T002)
2. Phase 2: Foundational (T003-T006)
3. Phase 3-7: User Stories in order (T007-T024)
4. Phase 8: Polish (T025-T028)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- The renderer is the main file being modified - most tasks target CapturePhotoRenderer.tsx
- usePhotoCapture hook is foundational and must be complete before renderer work
- Permission utilities extraction enables code reuse without breaking existing PermissionPrompt
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

## Files Summary

### New Files
- `apps/clementine-app/src/shared/camera/lib/permission-utils.ts`
- `apps/clementine-app/src/shared/camera/hooks/usePhotoCapture.ts`

### Modified Files
- `apps/clementine-app/src/shared/camera/types/camera.types.ts` (add types)
- `apps/clementine-app/src/shared/camera/lib/index.ts` (add export)
- `apps/clementine-app/src/shared/camera/index.ts` (add exports)
- `apps/clementine-app/src/shared/camera/components/PermissionPrompt.tsx` (import from utils)
- `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx` (main implementation)
- `apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts` (add case)
