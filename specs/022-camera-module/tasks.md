# Tasks: Camera Module

**Input**: Design documents from `/specs/022-camera-module/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-api.md

**Tests**: Not explicitly requested in spec. Tests are OPTIONAL for this feature.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md project structure:
- Feature module: `web/src/features/camera/`
- Components: `web/src/features/camera/components/`
- Hooks: `web/src/features/camera/hooks/`
- Types: `web/src/features/camera/types/`
- Schemas: `web/src/features/camera/schemas/`
- Lib utilities: `web/src/features/camera/lib/`
- Dev tools: `web/src/app/(admin)/dev-tools/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create feature module structure and foundational types

- [ ] T001 Create feature module directory structure at `web/src/features/camera/` with subdirectories: components/, hooks/, lib/, schemas/, types/
- [ ] T002 [P] Create TypeScript types for CapturedPhoto, CaptureMethod, CameraCaptureError, CameraCaptureErrorCode in `web/src/features/camera/types/camera.types.ts`
- [ ] T003 [P] Create TypeScript types for CameraCaptureProps and CameraCaptureLabels in `web/src/features/camera/types/camera.types.ts`
- [ ] T004 [P] Create error codes and default labels constants in `web/src/features/camera/constants.ts`
- [ ] T005 [P] Create Zod schema for file validation (image MIME types, max size) in `web/src/features/camera/schemas/camera.schemas.ts`
- [ ] T006 Create barrel exports for types in `web/src/features/camera/types/index.ts`
- [ ] T007 Create barrel exports for schemas in `web/src/features/camera/schemas/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Implement canvas capture utility function in `web/src/features/camera/lib/capture.ts` (extracts from existing `web/src/features/guest/lib/capture.ts`)
- [ ] T009 [P] Implement image dimension extraction utility in `web/src/features/camera/lib/image-utils.ts`
- [ ] T010 Create barrel exports for lib utilities in `web/src/features/camera/lib/index.ts`
- [ ] T011 Implement useCameraPermission hook with permission state machine in `web/src/features/camera/hooks/useCameraPermission.ts`
- [ ] T012 Implement useCamera hook for MediaStream management in `web/src/features/camera/hooks/useCamera.ts` (extracts/enhances from existing `web/src/features/guest/hooks/useCamera.ts`)
- [ ] T013 Implement usePhotoCapture hook that combines camera/library capture in `web/src/features/camera/hooks/usePhotoCapture.ts`
- [ ] T014 Create barrel exports for hooks in `web/src/features/camera/hooks/index.ts`

**Checkpoint**: Foundation ready - hooks and utilities available for component implementation

---

## Phase 3: User Story 1 - Basic Photo Capture (Priority: P1) 🎯 MVP

**Goal**: Guest can grant camera permission, see live preview, capture a photo, review it, and confirm submission

**Independent Test**: Load CameraCapture component → tap "Allow Camera" → grant permission → see viewfinder → tap capture → see review screen → tap "Use Photo" → onSubmit callback fires with CapturedPhoto data

### Implementation for User Story 1

- [ ] T015 [US1] Create PermissionPrompt component with explanation text and "Allow Camera" button in `web/src/features/camera/components/PermissionPrompt.tsx`
- [ ] T016 [US1] Create CameraViewfinder component with live video preview in `web/src/features/camera/components/CameraViewfinder.tsx`
- [ ] T017 [US1] Create CameraControls component with capture button (64x64px touch target) in `web/src/features/camera/components/CameraControls.tsx`
- [ ] T018 [US1] Create PhotoReview component with image preview and Confirm button in `web/src/features/camera/components/PhotoReview.tsx`
- [ ] T019 [US1] Create CameraCapture container component with state machine (permission-prompt → camera-active → photo-review) in `web/src/features/camera/components/CameraCapture.tsx`
- [ ] T020 [US1] Wire onSubmit callback to fire when user confirms photo in CameraCapture
- [ ] T021 [US1] Add mobile-first responsive styles: viewfinder fills screen, controls at bottom, touch targets ≥44px
- [ ] T022 Create barrel exports for components in `web/src/features/camera/components/index.ts`
- [ ] T023 Create public API barrel export (CameraCapture + types only) in `web/src/features/camera/index.ts`

**Checkpoint**: User Story 1 complete - basic camera capture flow works end-to-end

---

## Phase 4: User Story 2 - Photo Library Selection (Priority: P1)

**Goal**: Guest can select a photo from device gallery instead of taking a new one

**Independent Test**: Load CameraCapture component → tap "Choose from Library" → select photo → see review screen → tap "Use Photo" → onSubmit callback fires with method="library"

### Implementation for User Story 2

- [ ] T024 [US2] Create LibraryPicker component with hidden file input (accept="image/*") in `web/src/features/camera/components/LibraryPicker.tsx`
- [ ] T025 [US2] Add library button to CameraControls component in `web/src/features/camera/components/CameraControls.tsx`
- [ ] T026 [US2] Add file validation using Zod schema (reject non-images) in LibraryPicker
- [ ] T027 [US2] Wire library selection to photo-review state in CameraCapture
- [ ] T028 [US2] Add file input with capture="environment" attribute for mobile fallback in `web/src/features/camera/components/LibraryPicker.tsx`

**Checkpoint**: User Stories 1 AND 2 complete - both camera and library flows work

---

## Phase 5: User Story 3 - Retake Photo (Priority: P2)

**Goal**: Guest can return to camera/library to capture a different photo

**Independent Test**: Capture photo → see review screen → tap "Retake" → return to camera viewfinder (not permission prompt) → onRetake callback fires

### Implementation for User Story 3

- [ ] T029 [US3] Add Retake button to PhotoReview component in `web/src/features/camera/components/PhotoReview.tsx`
- [ ] T030 [US3] Implement RETAKE action in CameraCapture state machine (photo-review → camera-active)
- [ ] T031 [US3] Wire onRetake callback to fire when user taps Retake in CameraCapture
- [ ] T032 [US3] Ensure camera stream resumes without re-requesting permission on retake

**Checkpoint**: Retake flow works - user can try again without losing camera permission

---

## Phase 6: User Story 4 - Camera Flip (Priority: P2)

**Goal**: Guest can switch between front and back cameras

**Independent Test**: Load with cameraFacing="both" → see flip button → tap flip → viewfinder switches to other camera

### Implementation for User Story 4

- [ ] T033 [US4] Add flip camera button to CameraControls (only when cameraFacing="both" and device has multiple cameras) in `web/src/features/camera/components/CameraControls.tsx`
- [ ] T034 [US4] Implement camera switching in useCamera hook (stop stream, restart with new facingMode) in `web/src/features/camera/hooks/useCamera.ts`
- [ ] T035 [US4] Add FLIP_CAMERA action to CameraCapture state machine
- [ ] T036 [US4] Detect available cameras on mount and conditionally show flip button

**Checkpoint**: Camera flip works - users can toggle between front/back cameras

---

## Phase 7: User Story 5 - Permission Denied Handling (Priority: P2)

**Goal**: Guest with denied permission can still complete flow via photo library

**Independent Test**: Deny camera permission → see error UI with settings hint → see library button → tap library → complete flow via file picker

### Implementation for User Story 5

- [ ] T037 [US5] Create ErrorState component with error message, settings hint, and library fallback button in `web/src/features/camera/components/ErrorState.tsx`
- [ ] T038 [US5] Handle NotAllowedError in useCameraPermission and transition to error state
- [ ] T039 [US5] Wire onError callback with PERMISSION_DENIED code when permission denied
- [ ] T040 [US5] Add "Use Library" button in ErrorState that transitions to library picker
- [ ] T041 [US5] Update component barrel exports to include ErrorState in `web/src/features/camera/components/index.ts`

**Checkpoint**: Permission denied gracefully handled - library fallback always available

---

## Phase 8: User Story 6 - Camera Unavailable Device (Priority: P3)

**Goal**: Guest on device without camera is redirected to library-only mode

**Independent Test**: Simulate no camera → component shows "Camera not available" → library button visible → complete flow via library

### Implementation for User Story 6

- [ ] T042 [US6] Detect camera hardware availability in useCamera hook (catch NotFoundError)
- [ ] T043 [US6] Auto-transition to library-only mode when camera unavailable
- [ ] T044 [US6] Wire onError callback with CAMERA_UNAVAILABLE code
- [ ] T045 [US6] Support enableCamera=false prop for explicit library-only mode
- [ ] T046 [US6] Handle CAMERA_IN_USE error (NotReadableError) with retry option

**Checkpoint**: Graceful degradation complete - all error scenarios handled

---

## Phase 9: User Story 7 - Dev Tools Testing (Priority: P3)

**Goal**: Developer can test all camera configurations in interactive playground

**Independent Test**: Navigate to /dev-tools/camera → see prop controls → change cameraFacing → component re-renders → fire callbacks → see them in log

### Implementation for User Story 7

- [ ] T047 [US7] Create dev-tools route layout in `web/src/app/(admin)/dev-tools/layout.tsx`
- [ ] T048 [US7] Create dev-tools landing page with redirect to /dev-tools/camera in `web/src/app/(admin)/dev-tools/page.tsx`
- [ ] T049 [US7] Create PropControls component with form controls for all CameraCapture props in `web/src/app/(admin)/dev-tools/camera/PropControls.tsx`
- [ ] T050 [US7] Create CallbackLog component with timestamped callback payloads in `web/src/app/(admin)/dev-tools/camera/CallbackLog.tsx`
- [ ] T051 [US7] Create camera dev tools page with PropControls, CameraCapture preview, and CallbackLog in `web/src/app/(admin)/dev-tools/camera/page.tsx`
- [ ] T052 [US7] Add mobile-sized container for CameraCapture preview (simulate phone viewport)
- [ ] T053 [US7] Add "Reset" button to remount CameraCapture component

**Checkpoint**: Dev tools complete - all configurations testable

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T054 [P] Add aspect ratio guide overlay (3:4, 1:1, 9:16) to CameraViewfinder in `web/src/features/camera/components/CameraViewfinder.tsx`
- [ ] T055 [P] Add i18n support via labels prop throughout all components
- [ ] T056 [P] Add aria-label attributes to all interactive elements for accessibility
- [ ] T057 [P] Add aria-live region for error announcements in ErrorState
- [ ] T058 [P] Add keyboard navigation support (Tab, Enter, Space) to all buttons
- [ ] T059 Handle tab visibility change (pause/resume camera stream when tab loses/gains focus) in useCamera hook
- [ ] T060 Add object URL cleanup documentation in component JSDoc comments
- [ ] T061 Mirror front camera preview (scaleX(-1)) in CameraViewfinder for natural selfie experience

### Validation Loop (REQUIRED - Constitution Principle V)

**Purpose**: Ensure code quality and correctness before merge

- [ ] T062 Run `pnpm lint` and fix all errors/warnings
- [ ] T063 Run `pnpm type-check` and resolve all TypeScript errors
- [ ] T064 Verify feature in local dev server (`pnpm dev`) - test all 7 user story flows
- [ ] T065 Test on mobile device (iOS Safari and/or Android Chrome) via HTTPS
- [ ] T066 Commit only after validation loop passes cleanly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3)
  - US1 and US2 are both P1 and share components, recommended sequential
- **Polish (Phase 10)**: Depends on core user stories (US1-US5) being complete

### User Story Dependencies

| Story | Priority | Can Start After | Dependencies on Other Stories |
|-------|----------|-----------------|------------------------------|
| US1 - Basic Capture | P1 | Phase 2 | None |
| US2 - Library Selection | P1 | Phase 2 | Shares PhotoReview with US1 |
| US3 - Retake Photo | P2 | US1 complete | Uses PhotoReview from US1 |
| US4 - Camera Flip | P2 | US1 complete | Extends CameraControls from US1 |
| US5 - Permission Denied | P2 | US2 complete | Uses LibraryPicker from US2 |
| US6 - Camera Unavailable | P3 | US5 complete | Uses ErrorState from US5 |
| US7 - Dev Tools | P3 | US1 complete | Tests CameraCapture from US1 |

### Within Each User Story

- Components/hooks can be developed in parallel if marked [P]
- State machine updates depend on relevant components being ready
- Callback wiring depends on state machine being implemented

### Parallel Opportunities

**Phase 1 (Setup):**
```bash
# These can all run in parallel:
Task: T002 - Create TypeScript types
Task: T003 - Create props/labels types
Task: T004 - Create constants
Task: T005 - Create Zod schemas
```

**Phase 2 (Foundational):**
```bash
# These can run in parallel after T008:
Task: T009 - Image dimension utility
Task: T011 - Permission hook (depends on T008)
Task: T012 - Camera hook (depends on T008)
```

---

## Parallel Example: User Story 1

```bash
# After Foundational phase, launch component creation in parallel:
Task: T015 - PermissionPrompt component
Task: T016 - CameraViewfinder component
Task: T017 - CameraControls component
Task: T018 - PhotoReview component

# Then sequentially:
Task: T019 - CameraCapture container (depends on T015-T018)
Task: T020 - Wire onSubmit callback
Task: T021 - Mobile-first styles
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Basic Capture)
4. Complete Phase 4: User Story 2 (Library Selection)
5. **STOP and VALIDATE**: Test both camera and library flows
6. Deploy/demo if ready - this is a functional MVP!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Basic Capture) → Test → MVP v1
3. Add US2 (Library Selection) → Test → MVP v2 (full P1 scope)
4. Add US3 (Retake) → Test → Enhanced UX
5. Add US4 (Camera Flip) → Test → Multi-camera support
6. Add US5 (Permission Denied) → Test → Error handling
7. Add US6 (Camera Unavailable) → Test → Full graceful degradation
8. Add US7 (Dev Tools) → Test → Developer experience complete

---

## Summary

| Phase | Story | Tasks | MVP? |
|-------|-------|-------|------|
| 1 - Setup | - | 7 | Required |
| 2 - Foundational | - | 7 | Required |
| 3 - US1 Basic Capture | P1 | 9 | ✅ MVP |
| 4 - US2 Library Selection | P1 | 5 | ✅ MVP |
| 5 - US3 Retake | P2 | 4 | |
| 6 - US4 Camera Flip | P2 | 4 | |
| 7 - US5 Permission Denied | P2 | 5 | |
| 8 - US6 Camera Unavailable | P3 | 5 | |
| 9 - US7 Dev Tools | P3 | 7 | |
| 10 - Polish | - | 13 | |
| **Total** | | **66** | |

**Suggested MVP Scope**: Phases 1-4 (28 tasks) delivers complete camera + library capture flow.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Mobile testing (T065) requires HTTPS - use ngrok or mkcert for local dev
