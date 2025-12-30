# Implementation Plan: Camera Module Migration + Dev Tools

**Branch**: `007-camera-migration` | **Date**: 2025-12-30 | **Spec**: [007-camera-migration.md](./spec.md)
**Input**: Feature specification from `/specs/007-camera-migration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate the camera module from Next.js (`web/src/features/camera/`) to TanStack Start (`apps/clementine-app/src/shared/camera/`) and create an interactive dev-tools testing interface. The camera module provides live camera preview, photo capture from video streams using Canvas API, library picker fallback, permission management, and comprehensive error handling. Files have been copied; migration requires updating imports, replacing `next/image`, verifying browser API compatibility, and building a three-column dev-tools playground for testing all camera configurations.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**:
- React 19.2 (hooks: useState, useReducer, useCallback, useMemo, useEffect, useRef)
- TanStack Start 1.132 (SSR framework)
- lucide-react v0.561.0 (icons)
- shadcn/ui components from @/ui-kit/components (flat structure): button, switch, select, label
- Browser APIs: MediaDevices, Canvas, Blob/File, URL.createObjectURL

**Storage**: N/A (client-only module, no database integration)
**Testing**: Vitest (unit tests) + Manual browser testing (Chrome, Safari, Firefox)
**Target Platform**: Web browsers with MediaDevices API support (Chrome, Safari, Firefox)
**Project Type**: Web application (TanStack Start monorepo - `apps/clementine-app`)
**Performance Goals**:
- Camera stream start < 2 seconds
- Photo capture < 500ms
- Object URL cleanup on unmount (no memory leaks)

**Constraints**:
- Must work in SSR environment (client-only code with "use client")
- Must handle browsers without camera permission API
- Must support mobile and desktop browsers
- Touch targets ≥ 44x44px (mobile accessibility)

**Scale/Scope**:
- 7 components (CameraCapture, CameraView, CameraControls, PhotoReview, PermissionPrompt, ErrorState, LibraryPicker)
- 2 hooks (useCameraPermission, useLibraryPicker)
- 9 error codes (typed error handling)
- 1 dev-tools page with 3-column layout
- ~20 files total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅

**Status**: PASS

- Primary viewport: Camera module designed for mobile (320px-768px)
- Touch targets: CameraControls buttons are 44x44px minimum
- Mobile testing: Requires real device testing before completion (validation gate)
- Performance: Camera stream start < 2s, capture < 500ms

**Justification**: Camera module is core to guest experience (mobile photobooth). All requirements explicitly mobile-first.

### Principle II: Clean Code & Simplicity ⚠️

**Status**: REVIEW REQUIRED

**Potential Complexity**:
- Reducer pattern for camera state machine (7+ states: unknown, undetermined, requesting, granted, denied, unavailable, active, reviewing)
- Imperative ref API for CameraView (exposes methods: takePhoto, switchCamera)
- Canvas-based capture with aspect ratio cropping logic
- Permission state management separate from streaming state

**Justification**:
- State machine is necessary for proper permission flow (Expo-style pattern)
- Ref API is appropriate for imperative camera control (start/stop stream, capture)
- Canvas logic is required for aspect ratio support (cannot use native camera crop)
- Permission separation prevents re-requesting permissions on every render

**Simple alternatives rejected**:
- Single useState for all camera state → rejected because permission flow has distinct states that don't map to simple boolean flags
- Inline canvas logic → rejected because capture logic is reusable and testable when extracted
- Combined permission + streaming hook → rejected because permission state must persist across stream restarts

**Verdict**: Complexity is justified by requirements. No violations.

### Principle III: Type-Safe Development ✅

**Status**: PASS

- TypeScript strict mode enabled
- All types explicitly defined (CapturedPhoto, CameraCaptureError, PermissionState, etc.)
- Runtime validation with browser API type guards (isMediaDevicesAvailable)
- File upload validation (type + size checks)
- No `any` types

**Justification**: Module has comprehensive type coverage. Browser APIs are properly typed with feature detection.

### Principle IV: Minimal Testing Strategy ✅

**Status**: PASS

- Unit tests for utilities (captureFromVideo, parseMediaError, getImageDimensions)
- Manual browser testing for camera functionality (validation gate requirement)
- Focus on critical path: permission → camera → capture → review
- Coverage goal: 70%+ overall, 90%+ for capture/validation logic

**Justification**: Camera APIs cannot be fully unit tested (require real browser environment). Manual testing is appropriate and documented in validation gates.

### Principle V: Validation Gates ✅

**Status**: PASS

**Technical Validation**:
- `pnpm check` (format + lint + auto-fix)
- `pnpm type-check` (TypeScript strict mode)
- Dev server smoke test

**Standards Compliance**:
- `standards/global/project-structure.md` (barrel exports, shared infrastructure placement)
- `standards/global/code-quality.md` (clean code, simplicity)
- `standards/frontend/component-libraries.md` (shadcn/ui usage)
- `standards/frontend/accessibility.md` (ARIA labels, touch targets, keyboard support)
- `standards/global/security.md` (file upload validation)

**Browser Testing** (validation gate):
- Chrome/Edge (desktop + mobile)
- Safari (desktop + iOS)
- Firefox (desktop + mobile)
- Real device camera testing

**Justification**: All validation gates documented in spec. Standards compliance checklist complete.

### Principle VI: Frontend Architecture ✅

**Status**: PASS

- Client-first pattern: Module is 100% client-side (no server integration)
- Uses feature detection for browser API access (no "use client" needed - TanStack Start pattern)
- SSR-safe with `typeof navigator !== "undefined"` checks
- No Firestore integration (pure UI infrastructure)

**Justification**: Camera module is shared client infrastructure. Feature detection handles SSR gracefully without special directives.

### Principle VII: Backend & Firebase ✅

**Status**: N/A

**Justification**: Camera module has no backend integration. Photos are captured client-side and returned to parent components. Upload to Firebase Storage happens in domain features, not in shared camera infrastructure.

### Principle VIII: Project Structure ✅

**Status**: PASS

**Vertical Slice Architecture**:
- Module placed in `/shared/camera/` (shared technical infrastructure)
- Internal structure: `components/`, `hooks/`, `lib/`, `types/`, `schemas/`, `constants.ts`
- Barrel exports at module root (`index.ts`)
- Dev-tools placed in `/domains/dev-tools/camera/`

**Public API**:
- ✅ Export: Components (CameraCapture, CameraView, CameraControls, PhotoReview, etc.)
- ✅ Export: Hooks (useCameraPermission, useLibraryPicker)
- ✅ Export: Types (CapturedPhoto, CameraCaptureError, etc.)
- ✅ Export: Constants (DEFAULT_LABELS, CAMERA_CONSTRAINTS, etc.)
- ❌ Do NOT export: Internal utilities (captureFromVideo, cameraReducer, parseMediaError)

**Justification**: Structure follows vertical slice pattern. Shared infrastructure is correctly placed in `/shared/`. Dev-tools is correctly placed in `/domains/dev-tools/`.

### Standards Compliance ✅

**Applicable Standards**:
- ✅ `global/project-structure.md` - Barrel exports, shared infrastructure
- ✅ `global/code-quality.md` - Clean code, validation workflows
- ✅ `global/coding-style.md` - Naming conventions (components, hooks, types)
- ✅ `global/security.md` - File upload validation, XSS prevention
- ✅ `frontend/component-libraries.md` - shadcn/ui Button, Switch, Select
- ✅ `frontend/accessibility.md` - ARIA labels, touch targets, keyboard navigation
- ✅ `frontend/architecture.md` - Client-first, SSR handling

**Justification**: All applicable standards identified and will be reviewed during implementation.

### Constitution Summary

**Overall Status**: ✅ PASS

**Violations**: None

**Complexity Justifications**: State machine and ref API are justified by requirements (see Principle II section above).

**Next Steps**: Proceed to Phase 0 (Research).

## Project Structure

### Documentation (this feature)

```text
specs/007-camera-migration/
├── spec.md              # Feature requirements (symlink to requirements/007-camera-migration.md)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (image solution, shadcn components)
├── data-model.md        # Phase 1 output (component state, types)
├── quickstart.md        # Phase 1 output (import and usage examples)
└── contracts/           # N/A (no API contracts - client-only module)
```

### Source Code (repository root)

```text
apps/clementine-app/
├── src/
│   ├── shared/
│   │   └── camera/                    # Camera module (MIGRATION TARGET)
│   │       ├── index.ts               # Barrel export (public API)
│   │       ├── constants.ts           # DEFAULT_LABELS, CAMERA_CONSTRAINTS, etc.
│   │       ├── containers/
│   │       │   ├── index.ts           # Barrel export
│   │       │   ├── CameraCapture.tsx  # Main orchestrator component
│   │       │   └── CameraCapture.test.tsx # Collocated tests
│   │       ├── components/
│   │       │   ├── index.ts           # Barrel export
│   │       │   ├── CameraView.tsx     # Camera preview with ref API
│   │       │   ├── CameraView.test.tsx # Collocated tests
│   │       │   ├── CameraControls.tsx # Capture, flip, library buttons
│   │       │   ├── CameraControls.test.tsx # Collocated tests
│   │       │   ├── PhotoReview.tsx    # Confirm/retake screen
│   │       │   ├── PhotoReview.test.tsx # Collocated tests
│   │       │   ├── PermissionPrompt.tsx # Permission request UI
│   │       │   ├── PermissionPrompt.test.tsx # Collocated tests
│   │       │   ├── ErrorState.tsx     # Error display
│   │       │   ├── ErrorState.test.tsx # Collocated tests
│   │       │   ├── LibraryPicker.tsx  # Hidden file input
│   │       │   └── LibraryPicker.test.tsx # Collocated tests
│   │       ├── hooks/
│   │       │   ├── index.ts           # Barrel export
│   │       │   ├── useCameraPermission.ts # Permission state hook
│   │       │   ├── useCameraPermission.test.ts # Collocated tests
│   │       │   ├── useLibraryPicker.ts    # File input hook
│   │       │   └── useLibraryPicker.test.ts # Collocated tests
│   │       ├── lib/
│   │       │   ├── index.ts           # Barrel export (internal only)
│   │       │   ├── capture.ts         # captureFromVideo (Canvas logic)
│   │       │   ├── capture.test.ts    # Collocated tests
│   │       │   ├── camera-reducer.ts  # State machine reducer
│   │       │   ├── camera-reducer.test.ts # Collocated tests
│   │       │   ├── errors.ts          # parseMediaError
│   │       │   ├── errors.test.ts     # Collocated tests
│   │       │   ├── image-utils.ts     # getImageDimensions
│   │       │   ├── image-utils.test.ts # Collocated tests
│   │       │   ├── device-utils.ts    # isMediaDevicesAvailable
│   │       │   └── device-utils.test.ts # Collocated tests
│   │       ├── types/
│   │       │   ├── index.ts           # Barrel export
│   │       │   └── camera.types.ts    # All camera types
│   │       └── schemas/
│   │           ├── index.ts           # Barrel export
│   │           └── camera.schemas.ts  # Zod schemas (if needed)
│   │
│   ├── domains/
│   │   └── dev-tools/
│   │       └── camera/                # Dev-tools testing interface
│   │           ├── index.ts           # Barrel export
│   │           ├── CameraDevTools.tsx # Main page component
│   │           ├── PropControls.tsx   # Column 1: Prop configuration panel
│   │           └── CallbackLog.tsx    # Column 3: Event log
│   │
│   └── routes/
│       └── admin/
│           └── dev-tools/
│               └── camera.tsx          # Route: /admin/dev-tools/camera
```

**Structure Decision**: Monorepo web application structure (Option 2 variant). Camera module is shared infrastructure in `/shared/camera/` (not a domain feature). Dev-tools interface is in `/domains/dev-tools/camera/` following vertical slice architecture. This matches the project structure standard for TanStack Start app.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. Constitution Check passed.

## Phase 0: Research & Investigation

**Status**: PENDING

**Unknowns to Resolve**:
1. TanStack Start image solution (replace `next/image`)
2. shadcn/ui component availability (Switch, Select, Label)
3. SSR handling patterns for browser APIs in TanStack Start
4. Canvas API compatibility across target browsers
5. MediaDevices permission query API browser support
6. Test collocation strategy
7. Container vs component classification for CameraCapture

**Research Tasks**:
1. **Image rendering**: Investigate TanStack Start image patterns
   - Decision: Use standard `<img>` tag
   - Rationale: PhotoReview displays blob URLs (not static images)
   - Alternatives: next/image (not available), custom Image component (unnecessary)

2. **shadcn/ui components**: Verify availability
   - Result: All installed (Switch, Select, Label)
   - No installation needed

3. **SSR patterns**: Remove "use client" directives (Next.js artifact)
   - Decision: Use feature detection (`typeof navigator !== "undefined"`)
   - Rationale: TanStack Start doesn't use "use client" directive
   - Action: Remove all "use client" directives from migrated files

4. **Browser compatibility**: Test MediaDevices API across browsers
   - Chrome: Full support (getUserMedia, enumerateDevices)
   - Safari: Full support (iOS requires HTTPS)
   - Firefox: Full support

5. **Permission API**: Document fallback for browsers without navigator.permissions.query
   - Decision: Try query(), fall back to getUserMedia attempt
   - Rationale: Some browsers don't support permission query API

6. **Test collocation**: Follow project standards
   - Decision: Collocate tests with source files
   - Pattern: `Component.tsx` → `Component.test.tsx` (same directory)

7. **Container classification**: CameraCapture is orchestrator component
   - Decision: Place in `containers/` folder (not `components/`)
   - Rationale: Orchestrates state and child components

**Output**: `research.md` with all decisions documented

## Phase 1: Design & Implementation

**Status**: PENDING (Blocked by Phase 0)

### Data Model

**Component State Types**:

```typescript
// Permission states (Expo-style)
type PermissionState =
  | "unknown"        // Initial state
  | "undetermined"   // Permission not yet requested
  | "granted"        // Permission granted
  | "denied"         // Permission denied by user
  | "unavailable"    // No camera hardware

// Camera states
type CameraState =
  | "requesting_permission" // Requesting camera permission
  | "active"                // Camera stream active
  | "reviewing"             // Reviewing captured photo
  | "error"                 // Error state

// Captured photo result
interface CapturedPhoto {
  previewUrl: string       // Blob URL for preview
  file: File               // File object for upload
  method: "camera" | "library"
  dimensions: { width: number; height: number }
}

// Error types
interface CameraCaptureError {
  code: CameraCaptureErrorCode
  message: string
  originalError?: Error
}

type CameraCaptureErrorCode =
  | "PERMISSION_DENIED"
  | "CAMERA_IN_USE"
  | "CAMERA_NOT_FOUND"
  | "CAMERA_NOT_SUPPORTED"
  | "CAMERA_TIMEOUT"
  | "CAPTURE_FAILED"
  | "LIBRARY_PICKER_FAILED"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
```

**Output**: `data-model.md` with complete type definitions

### API Contracts

**Status**: N/A

**Justification**: Camera module is client-only infrastructure with no server API. All interactions are browser APIs (MediaDevices, Canvas, File). Domain features handle file uploads to Firebase Storage.

### Quickstart Guide

**Output**: `quickstart.md` with:
1. Installation instructions (already in /shared/camera/)
2. Basic usage example (CameraCapture component)
3. Configuration options (enableLibrary, cameraFacing, aspectRatio)
4. Event handlers (onPhoto, onSubmit, onError)
5. Dev-tools testing URL (/admin/dev-tools/camera)

### Agent Context Update

**Run**: `.specify/scripts/bash/update-agent-context.sh claude`

**New Technologies to Add**:
- TypeScript 5.7 (strict mode) + React 19.2, TanStack Start 1.132, shadcn/ui (Button, Switch, Select, Label), lucide-react 0.561.0, Browser APIs (MediaDevices, Canvas, Blob/File, URL)
- N/A (client-only module, no database)

## Phase 2: Implementation Tasks

**Status**: NOT STARTED (Handled by `/speckit.tasks` command)

**Note**: Task breakdown will be generated by the `/speckit.tasks` command after Phase 1 design is complete. Do not fill this section in the plan.

**Expected Task Categories**:
1. Module migration (update imports, replace next/image)
2. Component updates (fix SSR issues, verify browser APIs)
3. shadcn/ui installation (Switch, Select, Label if needed)
4. Dev-tools page creation (three-column layout)
5. Testing (unit tests, browser tests)
6. Validation (format, lint, type-check, standards compliance)

## Migration Strategy

### Step 1: Fix Imports and Structure (Priority 1)

**Problem**: Files already copied, but imports and structure need updating

**Changes Required**:
- `@/lib/utils` → `@/shared/utils`
- `@/components/ui/button` → `@/ui-kit/components/button` (ui-kit uses flat structure, no nested folders)
- `next/image` → `<img>` (for blob URL previews)
- Move `CameraCapture.tsx` → `containers/` folder
- Remove all `"use client"` directives (Next.js artifact)

**Note**: Camera module components stay in `shared/camera/components/` (feature components, NOT ui-kit components)

**Validation**: `pnpm type-check` passes

### Step 2: Collocate Tests (Priority 1)

**Problem**: Tests need to be moved next to source files

**Changes Required**:
- Move tests from `tests/shared/camera/` to respective source folders
- `capture.test.ts` → `lib/capture.test.ts`
- `camera-reducer.test.ts` → `lib/camera-reducer.test.ts`
- `errors.test.ts` → `lib/errors.test.ts`
- `image-utils.test.ts` → `lib/image-utils.test.ts`
- Create tests for components/hooks as needed

**Validation**: `pnpm test` passes

### Step 3: Verify Browser APIs (Priority 1)

**Problem**: Ensure MediaDevices, Canvas, and File APIs work in TanStack Start

**Changes Required**:
- Verify feature detection is correct (`typeof navigator !== "undefined"`)
- Test camera stream in dev server
- Test photo capture (Canvas-based)
- Test file picker validation
- Verify no SSR errors during build

**Validation**: Manual browser testing (Chrome, Safari), build succeeds

### Step 4: Verify shadcn/ui Components (Priority 2)

**Problem**: Dev-tools needs Switch, Select, Label components

**Changes Required**:
- ✅ All components already installed (no action needed)
- Verify imports work: `@/ui-kit/components/switch`, `@/ui-kit/components/select`, `@/ui-kit/components/label`

**Validation**: Components import without errors

### Step 5: Build Dev-Tools Page (Priority 2)

**Problem**: Need interactive testing interface

**Changes Required**:
1. Create route: `/admin/dev-tools/camera`
2. Build three-column layout:
   - Column 1: PropControls (enable library, camera facing, aspect ratio)
   - Column 2: Mobile preview (375×667px viewport with CameraCapture)
   - Column 3: CallbackLog (event timestamps and payloads)
3. Implement reset & remount functionality

**Validation**: Dev-tools page loads and functions correctly

### Step 6: Run Validation Gates (Priority 3)

**Technical Validation**:
- `pnpm check` (format + lint + auto-fix)
- `pnpm type-check` (TypeScript strict mode)
- `pnpm dev` (smoke test)

**Standards Compliance**:
- Review `standards/global/project-structure.md`
- Review `standards/global/code-quality.md`
- Review `standards/frontend/component-libraries.md`
- Review `standards/frontend/accessibility.md`
- Review `standards/global/security.md`

**Browser Testing**:
- Test in Chrome/Edge (desktop + mobile)
- Test in Safari (desktop + iOS)
- Test in Firefox (desktop + mobile)
- Test with real device camera

**Validation**: All gates pass, all acceptance criteria met

## Success Criteria

### Technical Validation ✅

- [ ] `pnpm check` passes (format + lint)
- [ ] `pnpm type-check` passes (zero TypeScript errors)
- [ ] Module builds without errors
- [ ] Dev server runs without warnings

### Standards Compliance ✅

- [ ] `standards/global/project-structure.md` reviewed (barrel exports, shared infrastructure)
- [ ] `standards/global/code-quality.md` reviewed (clean code, simplicity)
- [ ] `standards/frontend/component-libraries.md` reviewed (shadcn/ui usage)
- [ ] `standards/frontend/accessibility.md` reviewed (ARIA labels, touch targets)
- [ ] `standards/global/security.md` reviewed (file upload validation)

### Functional Verification ✅

- [ ] Permission request flow works (grant/deny)
- [ ] Camera stream starts and displays correctly
- [ ] Photo capture works (Canvas-based)
- [ ] Library picker works (file validation)
- [ ] Photo review works (confirm/retake)
- [ ] Error states display correctly
- [ ] Camera flip works (if multiple cameras)
- [ ] Aspect ratio cropping works (3:4, 1:1, 9:16)
- [ ] Object URL cleanup works (no memory leaks)
- [ ] Dev-tools page loads and functions correctly
- [ ] Prop controls update preview in real-time
- [ ] Callback log captures all events
- [ ] Reset & remount works correctly

### Browser Testing ✅

- [ ] Chrome/Edge (desktop + mobile)
- [ ] Safari (desktop + iOS)
- [ ] Firefox (desktop + mobile)
- [ ] Real device camera testing

## Next Steps

1. **Phase 0**: Generate `research.md` to resolve unknowns (image solution, shadcn components, SSR patterns)
2. **Phase 1**: Generate `data-model.md` and `quickstart.md` with component types and usage examples
3. **Phase 1**: Run agent context update script to add new technologies
4. **Phase 2**: Run `/speckit.tasks` command to generate detailed implementation tasks
5. **Implementation**: Execute tasks from `tasks.md`

---

**Plan Status**: Phase 0 Research (PENDING)
**Last Updated**: 2025-12-30
**Next Action**: Generate `research.md` with image solution, shadcn component verification, and SSR patterns
