# Tasks: Camera Module Migration + Dev Tools

**Input**: Design documents from `/specs/007-camera-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Unit tests will be written for utility functions (capture, errors, image-utils, device-utils). Component testing is manual browser testing.

**Organization**: Tasks are grouped by feature part (Module Migration, Dev Tools) to enable independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Part]**: Which part this task belongs to (Module, DevTools)
- Include exact file paths in descriptions

## Path Conventions

- Base: `apps/clementine-app/src/`
- Camera module: `apps/clementine-app/src/shared/camera/`
- Dev tools: `apps/clementine-app/src/domains/dev-tools/camera/`
- Routes: `apps/clementine-app/src/routes/admin/dev-tools/`
- UI-kit: `apps/clementine-app/src/ui-kit/components/` (flat structure, no nested folders)

**Important**: Camera module components (CameraCapture, CameraView, etc.) are **feature components** and stay in `shared/camera/`. They do NOT go to ui-kit. Only generic, reusable UI components belong in ui-kit.

---

## Phase 1: Setup (Structure & Dependencies)

**Purpose**: Prepare camera module structure and verify dependencies

- [X] T001 Create containers/ folder in apps/clementine-app/src/shared/camera/
- [X] T002 [P] Verify shadcn/ui components installed (Switch, Select, Label) by importing from @/ui-kit/components/

---

## Phase 2: Module Migration - Structure Fixes

**Purpose**: Fix file structure, imports, and remove Next.js artifacts

**⚠️ CRITICAL**: Complete this phase before testing any functionality

### File Structure

- [X] T003 Move CameraCapture.tsx from components/ to containers/ folder
- [X] T004 [P] Update containers/index.ts to export CameraCapture
- [X] T005 [P] Update shared/camera/index.ts barrel export to include CameraCapture from containers/

### Remove Next.js Artifacts

- [X] T006 [P] [Module] Remove "use client" directive from containers/CameraCapture.tsx
- [X] T007 [P] [Module] Remove "use client" directive from components/CameraView.tsx
- [X] T008 [P] [Module] Remove "use client" directive from components/CameraControls.tsx
- [X] T009 [P] [Module] Remove "use client" directive from components/PhotoReview.tsx
- [X] T010 [P] [Module] Remove "use client" directive from components/PermissionPrompt.tsx
- [X] T011 [P] [Module] Remove "use client" directive from components/ErrorState.tsx
- [X] T012 [P] [Module] Remove "use client" directive from components/LibraryPicker.tsx
- [X] T013 [P] [Module] Remove "use client" directive from hooks/useCameraPermission.ts
- [X] T014 [P] [Module] Remove "use client" directive from hooks/useLibraryPicker.ts

### Fix Image Component

- [X] T015 [Module] Replace next/image Image component with standard <img> tag in components/PhotoReview.tsx

### Fix Import Paths

**Note**: ui-kit uses flat component structure (no nested folders). All imports from `@/components/ui/*` should go to `@/ui-kit/components/*` (single file, not folder).

- [X] T016 [P] [Module] Update imports from @/lib/utils to @/shared/utils across all camera module files
- [X] T017 [P] [Module] Update imports from @/components/ui/button to @/ui-kit/components/button across all camera module files (flat structure)
- [X] T018 [P] [Module] Update any other Next.js-specific imports to TanStack Start equivalents

**Checkpoint**: Module structure updated, ready for testing

---

## Phase 3: Module Migration - Test Collocation

**Purpose**: Move tests next to source files for better organization

### Move Utility Tests

- [X] T019 [P] [Module] Move tests/shared/camera/capture.test.ts to lib/capture.test.ts
- [X] T020 [P] [Module] Move tests/shared/camera/camera-reducer.test.ts to lib/camera-reducer.test.ts
- [X] T021 [P] [Module] Move tests/shared/camera/errors.test.ts to lib/errors.test.ts
- [X] T022 [P] [Module] Move tests/shared/camera/image-utils.test.ts to lib/image-utils.test.ts

### Create Component Tests (Collocated)

- [X] T023 [P] [Module] Create containers/CameraCapture.test.tsx for CameraCapture component tests
- [X] T024 [P] [Module] Create components/CameraView.test.tsx for CameraView component tests
- [X] T025 [P] [Module] Create components/CameraControls.test.tsx for CameraControls component tests
- [X] T026 [P] [Module] Create components/PhotoReview.test.tsx for PhotoReview component tests
- [X] T027 [P] [Module] Create hooks/useCameraPermission.test.ts for useCameraPermission hook tests
- [X] T028 [P] [Module] Create hooks/useLibraryPicker.test.ts for useLibraryPicker hook tests
- [X] T029 [P] [Module] Create lib/device-utils.test.ts for device utility tests

### Update Test Imports

- [X] T030 [Module] Update all test files to use correct import paths for TanStack Start
- [X] T031 [Module] Remove old tests/shared/camera/ directory after verifying all tests moved

**Checkpoint**: Tests collocated, ready to run

---

## Phase 4: Module Migration - Validation

**Purpose**: Verify camera module works correctly in TanStack Start

### Technical Validation

- [X] T032 Run pnpm check (format + lint + auto-fix) on camera module files
- [X] T033 Run pnpm type-check and fix any TypeScript errors in camera module
- [X] T034 Run pnpm dev and verify dev server starts without errors
- [ ] T035 Run unit tests with pnpm test and verify all camera module tests pass

### Functional Verification (Manual Browser Testing)

- [ ] T036 [Module] Test camera permission flow (grant, deny, retry) in Chrome
- [ ] T037 [Module] Test camera stream starts and displays video in Chrome
- [ ] T038 [Module] Test photo capture works (Canvas-based) in Chrome
- [ ] T039 [Module] Test library picker works with file validation in Chrome
- [ ] T040 [Module] Test photo review (confirm/retake) in Chrome
- [ ] T041 [Module] Test error states display correctly in Chrome
- [ ] T042 [Module] Test camera flip (if device has multiple cameras) in Chrome
- [ ] T043 [Module] Test aspect ratio cropping (3:4, 1:1, 9:16) in Chrome
- [ ] T044 [Module] Test object URL cleanup (check for memory leaks) in Chrome
- [ ] T045 [Module] Repeat functional tests in Safari (desktop + iOS)
- [ ] T046 [Module] Repeat functional tests in Firefox (desktop)

### Standards Compliance Review

- [ ] T047 [Module] Review code against standards/global/project-structure.md (barrel exports, shared infrastructure)
- [ ] T048 [Module] Review code against standards/global/code-quality.md (clean code, simplicity)
- [ ] T049 [Module] Review code against standards/frontend/component-libraries.md (shadcn/ui usage)
- [ ] T050 [Module] Review code against standards/frontend/accessibility.md (ARIA labels, touch targets)
- [ ] T051 [Module] Review code against standards/global/security.md (file upload validation)

**Checkpoint**: Camera module fully migrated and validated

---

## Phase 5: Dev Tools - Route Setup

**Purpose**: Create dev-tools route and page structure

- [ ] T052 [DevTools] Create route file apps/clementine-app/src/routes/admin/dev-tools/camera.tsx
- [ ] T053 [DevTools] Create dev-tools camera module folder apps/clementine-app/src/domains/dev-tools/camera/
- [ ] T054 [DevTools] Create barrel export apps/clementine-app/src/domains/dev-tools/camera/index.ts

**Checkpoint**: Dev tools route structure ready

---

## Phase 6: Dev Tools - Components Implementation

**Purpose**: Build three-column dev-tools interface components

### Column 1: Prop Controls

- [ ] T055 [DevTools] Create PropControls.tsx component in domains/dev-tools/camera/ with Switch for enableLibrary
- [ ] T056 [DevTools] Add Select for cameraFacing prop (user, environment, both) in PropControls.tsx
- [ ] T057 [DevTools] Add Select for initialFacing prop (user, environment) in PropControls.tsx
- [ ] T058 [DevTools] Add Select for aspectRatio prop (none, 3:4, 1:1, 9:16) in PropControls.tsx
- [ ] T059 [DevTools] Add Reset & Remount button to PropControls.tsx
- [ ] T060 [DevTools] Implement prop state management and onChange handlers in PropControls.tsx

### Column 3: Callback Log

- [ ] T061 [P] [DevTools] Create CallbackLog.tsx component in domains/dev-tools/camera/
- [ ] T062 [DevTools] Implement timestamp formatting (HH:MM:SS.mmm) in CallbackLog.tsx
- [ ] T063 [DevTools] Implement payload formatting for CapturedPhoto (method, dimensions, fileName, fileSize) in CallbackLog.tsx
- [ ] T064 [DevTools] Implement payload formatting for CameraCaptureError (code, message) in CallbackLog.tsx
- [ ] T065 [DevTools] Add reverse chronological display (newest first) in CallbackLog.tsx
- [ ] T066 [DevTools] Add Clear log button to CallbackLog.tsx
- [ ] T067 [DevTools] Add scrollable container for long logs in CallbackLog.tsx

### Main Page Component

- [ ] T068 [DevTools] Create CameraDevTools.tsx main component in domains/dev-tools/camera/
- [ ] T069 [DevTools] Implement three-column layout in CameraDevTools.tsx (PropControls, Preview, CallbackLog)
- [ ] T070 [DevTools] Add mobile viewport container (375×667px) for camera preview in CameraDevTools.tsx
- [ ] T071 [DevTools] Implement CameraCapture with dynamic props from PropControls in CameraDevTools.tsx
- [ ] T072 [DevTools] Implement callback handlers (onPhoto, onSubmit, onError, onRetake, onCancel) that log to CallbackLog
- [ ] T073 [DevTools] Implement reset & remount functionality (key change) in CameraDevTools.tsx
- [ ] T074 [DevTools] Connect all components in route file routes/admin/dev-tools/camera.tsx

**Checkpoint**: Dev tools interface complete

---

## Phase 7: Dev Tools - Validation

**Purpose**: Verify dev-tools page works correctly

### Technical Validation

- [ ] T075 Run pnpm check (format + lint + auto-fix) on dev-tools files
- [ ] T076 Run pnpm type-check and fix any TypeScript errors in dev-tools
- [ ] T077 Verify /admin/dev-tools/camera route loads without errors

### Functional Verification (Manual Testing)

- [ ] T078 [DevTools] Test route /admin/dev-tools/camera loads correctly
- [ ] T079 [DevTools] Test three-column layout renders correctly
- [ ] T080 [DevTools] Test PropControls allows toggling enableLibrary (Switch component)
- [ ] T081 [DevTools] Test PropControls allows selecting cameraFacing options
- [ ] T082 [DevTools] Test PropControls allows selecting initialFacing options
- [ ] T083 [DevTools] Test PropControls allows selecting aspectRatio options
- [ ] T084 [DevTools] Test camera preview shows mobile viewport (375×667px)
- [ ] T085 [DevTools] Test CameraCapture is fully functional in preview (can capture photos)
- [ ] T086 [DevTools] Test CallbackLog captures onPhoto events with correct timestamps
- [ ] T087 [DevTools] Test CallbackLog captures onSubmit events
- [ ] T088 [DevTools] Test CallbackLog captures onError events
- [ ] T089 [DevTools] Test CallbackLog captures onRetake events
- [ ] T090 [DevTools] Test CallbackLog formats CapturedPhoto payloads correctly
- [ ] T091 [DevTools] Test CallbackLog formats CameraCaptureError payloads correctly
- [ ] T092 [DevTools] Test Clear log button works
- [ ] T093 [DevTools] Test Reset & Remount button forces component remount
- [ ] T094 [DevTools] Test Reset & Remount clears callback log
- [ ] T095 [DevTools] Test all prop changes update preview in real-time

**Checkpoint**: Dev tools fully functional

---

## Phase 8: Final Validation & Polish

**Purpose**: Complete end-to-end validation and documentation

### Cross-Browser Testing

- [ ] T096 Test complete camera module + dev-tools in Chrome (desktop)
- [ ] T097 Test complete camera module + dev-tools in Chrome (mobile)
- [ ] T098 Test complete camera module + dev-tools in Safari (desktop)
- [ ] T099 Test complete camera module + dev-tools in Safari (iOS)
- [ ] T100 Test complete camera module + dev-tools in Firefox (desktop)
- [ ] T101 Test complete camera module + dev-tools in Firefox (mobile)
- [ ] T102 Test with real device camera (not just emulator)

### Documentation & Cleanup

- [ ] T103 [P] Verify quickstart.md examples work correctly
- [ ] T104 [P] Update CLAUDE.md if needed (already updated by Phase 1 of plan)
- [ ] T105 [P] Add comments to complex code (Canvas capture, state machine)
- [ ] T106 Remove any unused files or commented-out code

### Final Technical Validation

- [ ] T107 Run full test suite (pnpm test) and verify 70%+ coverage
- [ ] T108 Run pnpm check one final time across entire module
- [ ] T109 Run pnpm type-check one final time
- [ ] T110 Build production bundle and verify no errors
- [ ] T111 Verify module can be imported from other domains (test import)

**Checkpoint**: Migration complete and production-ready

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Structure Fixes)**: Depends on Phase 1 completion
- **Phase 3 (Test Collocation)**: Depends on Phase 2 completion
- **Phase 4 (Module Validation)**: Depends on Phases 2 & 3 completion
- **Phase 5 (Dev Tools Route)**: Can start after Phase 2 (independent of Phase 3 & 4)
- **Phase 6 (Dev Tools Components)**: Depends on Phase 5 completion
- **Phase 7 (Dev Tools Validation)**: Depends on Phases 4 & 6 completion (both module and dev-tools ready)
- **Phase 8 (Final Validation)**: Depends on all previous phases

### Part Dependencies

- **Module Migration (Phases 2-4)**: Must complete before dev-tools can be fully functional
- **Dev Tools (Phases 5-7)**: Can start structure work early, but needs working camera module for testing

### Task Groups (Parallelizable)

**Phase 2 - Remove "use client" (T006-T014)**: All can run in parallel (different files)
**Phase 2 - Fix imports (T016-T018)**: All can run in parallel (different files)
**Phase 3 - Move tests (T019-T022)**: All can run in parallel (different files)
**Phase 3 - Create component tests (T023-T029)**: All can run in parallel (different files)
**Phase 4 - Functional verification (T036-T044)**: Sequential (manual testing workflow)
**Phase 4 - Standards review (T047-T051)**: All can run in parallel (different standards)
**Phase 6 - PropControls implementation (T055-T060)**: Sequential (building one component)
**Phase 6 - CallbackLog implementation (T061-T067)**: Sequential (building one component), but can run in parallel with PropControls
**Phase 7 - Dev tools testing (T078-T095)**: Sequential (manual testing workflow)

### Parallel Opportunities

```bash
# Phase 2: Remove "use client" from all files simultaneously
Task: T006 - Remove from CameraCapture.tsx
Task: T007 - Remove from CameraView.tsx
Task: T008 - Remove from CameraControls.tsx
Task: T009 - Remove from PhotoReview.tsx
Task: T010 - Remove from PermissionPrompt.tsx
Task: T011 - Remove from ErrorState.tsx
Task: T012 - Remove from LibraryPicker.tsx
Task: T013 - Remove from useCameraPermission.ts
Task: T014 - Remove from useLibraryPicker.ts

# Phase 2: Fix import paths across all files simultaneously
Task: T016 - Update @/lib/utils imports
Task: T017 - Update @/components/ui/button imports
Task: T018 - Update other imports

# Phase 3: Move all utility tests simultaneously
Task: T019 - Move capture.test.ts
Task: T020 - Move camera-reducer.test.ts
Task: T021 - Move errors.test.ts
Task: T022 - Move image-utils.test.ts

# Phase 3: Create all component tests simultaneously
Task: T023 - Create CameraCapture.test.tsx
Task: T024 - Create CameraView.test.tsx
Task: T025 - Create CameraControls.test.tsx
Task: T026 - Create PhotoReview.test.tsx
Task: T027 - Create useCameraPermission.test.ts
Task: T028 - Create useLibraryPicker.test.ts
Task: T029 - Create device-utils.test.ts

# Phase 4: Review all standards simultaneously
Task: T047 - Review project-structure.md
Task: T048 - Review code-quality.md
Task: T049 - Review component-libraries.md
Task: T050 - Review accessibility.md
Task: T051 - Review security.md

# Phase 6: Build PropControls and CallbackLog in parallel (different components)
Parallel Track A:
  Task: T055-T060 - PropControls component

Parallel Track B:
  Task: T061-T067 - CallbackLog component

# Phase 8: Documentation tasks in parallel
Task: T103 - Verify quickstart.md
Task: T104 - Update CLAUDE.md
Task: T105 - Add code comments
```

---

## Implementation Strategy

### MVP Approach (Module Migration First)

1. **Complete Phases 1-4**: Camera module migrated and validated
2. **STOP and VALIDATE**: Test camera module independently (import in existing features)
3. **Deploy camera module**: Can be used by guest photo submission, experiences
4. **Continue with Phases 5-7**: Add dev-tools testing interface
5. **Final validation (Phase 8)**: Complete end-to-end testing

### Incremental Delivery

**Milestone 1: Module Structure Fixed (Phase 2)**
- Camera module imports updated, Next.js artifacts removed
- Can proceed with testing (even if some tests fail initially)

**Milestone 2: Tests Organized (Phase 3)**
- All tests collocated with source files
- Project follows modern testing practices
- Can run full test suite

**Milestone 3: Module Validated (Phase 4)**
- Camera module fully functional in TanStack Start
- Ready for production use
- Can be imported by other domains

**Milestone 4: Dev Tools Ready (Phases 5-7)**
- Interactive testing playground available
- Can test all camera configurations easily
- Speeds up future camera feature development

**Milestone 5: Production Ready (Phase 8)**
- Cross-browser tested
- Documentation complete
- Full test coverage achieved

### Parallel Team Strategy

With 2 developers:

**Developer A**: Module Migration
1. Complete Phases 1-2 (Setup + Structure)
2. Complete Phase 3 (Test Collocation)
3. Complete Phase 4 (Module Validation)

**Developer B**: Dev Tools (can start after Phase 2 completes)
1. Complete Phase 5 (Route Setup)
2. Complete Phase 6 (Components)
3. Complete Phase 7 (Dev Tools Validation)

**Both**: Phase 8 (Final Validation)

---

## Validation Checkpoints

### After Phase 2 (Structure Fixes)
✓ No "use client" directives in any file
✓ All imports use TanStack Start paths
✓ PhotoReview uses <img> tag (not next/image)
✓ CameraCapture is in containers/ folder
✓ TypeScript compiles without errors

### After Phase 3 (Test Collocation)
✓ Tests are next to source files
✓ Old tests/ directory is removed
✓ All tests can be found in their respective folders

### After Phase 4 (Module Validation)
✓ Camera module imports successfully
✓ All unit tests pass
✓ Manual testing complete in Chrome, Safari, Firefox
✓ Standards compliance verified
✓ No memory leaks detected

### After Phase 7 (Dev Tools Validation)
✓ /admin/dev-tools/camera route loads
✓ Three-column layout renders correctly
✓ All prop controls work
✓ Callback log captures events
✓ Reset & remount works

### After Phase 8 (Final Validation)
✓ All acceptance criteria met
✓ Cross-browser testing complete
✓ Documentation up-to-date
✓ Production build succeeds
✓ 70%+ test coverage achieved

---

## Notes

- **[P] tasks**: Different files, no dependencies (can run in parallel)
- **[Module] label**: Camera module migration tasks
- **[DevTools] label**: Dev-tools interface tasks
- **Manual testing**: Required for camera APIs (cannot be fully unit tested)
- **Feature detection**: All browser APIs checked with typeof navigator !== "undefined"
- **Validation gates**: Must pass before marking complete
- **Commit strategy**: Commit after each phase or logical task group
- **Stop points**: Each checkpoint allows independent validation

---

## Task Summary

**Total Tasks**: 111
- Phase 1 (Setup): 2 tasks
- Phase 2 (Structure Fixes): 16 tasks
- Phase 3 (Test Collocation): 13 tasks
- Phase 4 (Module Validation): 20 tasks
- Phase 5 (Dev Tools Route): 3 tasks
- Phase 6 (Dev Tools Components): 20 tasks
- Phase 7 (Dev Tools Validation): 18 tasks
- Phase 8 (Final Validation): 16 tasks

**Parallel Opportunities**: ~40 tasks can run in parallel (marked with [P])

**Estimated Effort**:
- Module Migration (Phases 1-4): ~70% of work
- Dev Tools (Phases 5-7): ~25% of work
- Final Validation (Phase 8): ~5% of work

**Critical Path**: Phase 2 → Phase 4 → Phase 7 → Phase 8
- Cannot skip module validation before dev-tools testing
- Cannot skip dev-tools validation before final validation

**MVP Delivery**: Phases 1-4 (camera module functional, can be used by other features)
**Full Delivery**: All 8 phases (camera module + dev-tools testing interface)
