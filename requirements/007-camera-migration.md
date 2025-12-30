# Feature Requirements: Camera Module Migration + Dev Tools

## Goal

Migrate the **camera module** from the Next.js app (`web/src/features/camera/`) to the TanStack Start app (`apps/clementine-app/src/shared/camera/`) and create **dev-tools testing interface** to enable photo capture functionality across multiple domains (guest experiences, dev-tools, and future admin simulators).

---

## Overview

The camera module is **shared technical infrastructure** that provides:
- Live camera preview with browser MediaDevices API
- Photo capture from video stream using Canvas
- Library picker fallback when camera unavailable
- Photo review & confirmation workflow
- Permission management following Expo-style patterns
- Comprehensive error handling with typed error codes

**Migration Target:** `/apps/clementine-app/src/shared/camera/`

**Dev Tools Target:** `/apps/clementine-app/src/domains/dev-tools/camera/`

---

## Migration Status

✅ **Files Copied:** The camera module source files have been copied to `/apps/clementine-app/src/shared/camera/`

**Next Steps:**
- Update imports and dependencies
- Replace `next/image` with TanStack Start solution
- Verify functionality and run validation gates
- Create dev-tools testing interface

---

## Part 1: Module Migration

### Module Structure

The migrated module MUST maintain the following exports:

**Components:**
- `CameraCapture` - Main orchestrator (permissions → camera → review flow)
- `CameraView` - Self-contained camera preview (auto-start/stop, ref-based control)
- `CameraControls` - Button controls (capture, flip camera, library picker)
- `PhotoReview` - Photo confirmation screen (confirm/retake)
- `PermissionPrompt` - Permission request UI
- `ErrorState` - Error display with recovery options
- `LibraryPicker` - Hidden file input for library selection

**Hooks:**
- `useCameraPermission()` - Permission state management
- `useLibraryPicker()` - File input management with validation

**Types:**
- `CapturedPhoto` - Photo result (previewUrl, file, method, dimensions)
- `CameraCaptureError` - Error object with typed code
- `CameraCaptureErrorCode` - 9 error variants
- `CaptureMethod` - "camera" | "library"
- `CameraFacing` - "user" | "environment"
- `CameraFacingConfig` - "user" | "environment" | "both"
- `AspectRatio` - "3:4" | "1:1" | "9:16"
- `PermissionState` - "unknown" | "undetermined" | "granted" | "denied" | "unavailable"
- `CameraCaptureLabels` - i18n labels interface

**Constants:**
- `DEFAULT_LABELS` - English UI text
- `CAMERA_CONSTRAINTS` - Camera resolution targets
- `CAPTURE_QUALITY` - JPEG quality (0.92)
- `ACCEPTED_IMAGE_TYPES` - Supported MIME types
- `MAX_FILE_SIZE` - 50MB limit

**Utilities (Internal):**
- `captureFromVideo()` - Canvas-based capture with aspect ratio cropping
- `cameraReducer()` - UI state machine
- `parseMediaError()` - Error parsing
- `getImageDimensions()` - Dimension extraction
- `isMediaDevicesAvailable()` - API availability check

### Core Functionality

**CameraCapture Requirements:**
- MUST orchestrate full photo capture workflow
- MUST handle permission states (unknown → undetermined → granted/denied/unavailable)
- MUST switch between camera active ↔ photo review states
- MUST support camera and library capture methods
- MUST accept callbacks: `onSubmit`, `onPhoto`, `onError`, `onRetake`
- MUST support configuration: `enableLibrary`, `cameraFacing`, `initialFacing`, `aspectRatio`
- MUST support customizable i18n labels

**CameraView Requirements:**
- MUST auto-start/stop camera stream on mount/unmount
- MUST expose imperative API via ref:
  - `takePhoto()` - Capture from video stream
  - `switchCamera()` - Toggle between cameras
  - Properties: `facing`, `hasMultipleCameras`
- MUST handle getUserMedia errors gracefully
- MUST clean up video stream on unmount

**CameraControls Requirements:**
- MUST render capture button, flip camera button, library picker button
- MUST meet accessibility requirements (44x44px touch targets, ARIA labels)
- MUST disable buttons appropriately based on state
- MUST use lucide-react icons

**PhotoReview Requirements:**
- MUST display captured photo with preview URL
- MUST show confirm and retake actions
- MUST clean up object URL after confirmation
- MUST support custom labels

**PermissionPrompt Requirements:**
- MUST show permission request UI for undetermined state
- MUST show denied state with instructions
- MUST show unavailable state (no camera hardware)
- MUST support retry action

**useCameraPermission Requirements:**
- MUST manage permission state separately from streaming
- MUST follow Expo-style permission hook pattern
- MUST check navigator.permissions.query() if available
- MUST handle permission state transitions

**useLibraryPicker Requirements:**
- MUST manage hidden file input
- MUST validate file type and size
- MUST return error messages for validation failures
- MUST generate object URL for preview

### Photo Capture

**Canvas-Based Capture:**
- MUST capture from HTMLVideoElement using Canvas
- MUST apply aspect ratio cropping client-side
- MUST output JPEG with 0.92 quality
- MUST extract image dimensions
- MUST generate Blob and File objects

**Aspect Ratio Support:**
- "3:4" - Portrait (e.g., 375×500px)
- "1:1" - Square (e.g., 500×500px)
- "9:16" - Stories (e.g., 375×667px)
- undefined - No cropping (full camera frame)

**File Validation:**
- Accepted types: JPEG, PNG, GIF, WebP
- Max file size: 50MB
- Must provide error messages for validation failures

### Error Handling

**Error Codes:**
- `PERMISSION_DENIED` - User denied camera permission
- `CAMERA_IN_USE` - Camera already in use by another app
- `CAMERA_NOT_FOUND` - No camera hardware detected
- `CAMERA_NOT_SUPPORTED` - Browser doesn't support getUserMedia
- `CAMERA_TIMEOUT` - Camera failed to start within timeout
- `CAPTURE_FAILED` - Failed to capture photo from stream
- `LIBRARY_PICKER_FAILED` - Library picker error
- `INVALID_FILE_TYPE` - Unsupported file type
- `FILE_TOO_LARGE` - File exceeds max size

**Error Recovery:**
- MUST show error state with message
- MUST provide retry action
- MUST offer library picker fallback for camera errors
- MUST parse getUserMedia errors to typed codes

---

## Part 2: Dev Tools Interface

### Route

**Route:** `/admin/dev-tools/camera`

**Purpose:** Interactive playground for testing CameraCapture component with different configurations.

### Page Layout

The dev-tools page MUST replicate the Next.js dev-tools interface with **three columns**:

**Column 1: Prop Controls**
- Component configuration panel
- Props:
  - `enableLibrary` (boolean toggle)
  - `cameraFacing` (select: "user" | "environment" | "both")
  - `initialFacing` (select: "user" | "environment")
  - `aspectRatio` (select: "none" | "3:4" | "1:1" | "9:16")
- Actions:
  - Reset & Remount button (force component remount with key change)

**Column 2: Camera Preview**
- Mobile viewport container (375×667px)
- MUST render CameraCapture with current configuration
- MUST be fully interactive (allow testing capture, library, review)
- MUST show current state visually

**Column 3: Callback Log**
- Real-time event log showing all callback invocations
- MUST log timestamps (HH:MM:SS.mmm format)
- MUST log callback names (`onPhoto`, `onSubmit`, `onRetake`, `onCancel`, `onError`)
- MUST show payload summaries (not full object URLs)
- MUST provide "Clear" button
- MUST scroll to show most recent events

### Functionality Requirements

**Prop Controls Panel:**
- MUST allow toggling boolean props (Switch component)
- MUST allow selecting from enum values (Select component)
- MUST trigger component remount on "Reset & Remount"
- MUST apply changes immediately
- MUST reset log on remount

**Camera Preview:**
- MUST render in mobile viewport (375×667px fixed dimensions)
- MUST be fully functional (not a mock)
- MUST allow testing all camera features:
  - Permission request flow
  - Camera capture
  - Library picker
  - Photo review (confirm/retake)
  - Error states
  - Camera flip (if both cameras configured)

**Callback Log:**
- MUST log all callback invocations in real-time
- MUST show timestamps with milliseconds
- MUST format payloads clearly:
  - `CapturedPhoto` - Show method, dimensions, fileName, fileSize (not blob URL)
  - `CameraCaptureError` - Show code and message
  - undefined/null - Show as "undefined"/"null"
- MUST display in reverse chronological order (newest first)
- MUST be scrollable for long logs
- MUST clear log on button click

**Reset Functionality:**
- MUST clear component state
- MUST force component remount (key change)
- MUST reset all props to defaults
- MUST clear callback log

---

## Technical Requirements

### Image Component Migration

**Required:**
- MUST replace `next/image` with TanStack Start equivalent or standard `<img>`
- MUST verify image rendering works correctly
- MUST maintain responsive image behavior
- MUST handle preview URL display (object URLs)

### Import Path Updates

The following import paths MUST be updated:
- `@/lib/utils` → `@/shared/utils`
- `@/components/ui/button` → `@/ui-kit/components/button`
- `next/image` → TanStack Start image solution or `<img>`

### shadcn/ui Components

**May need to install:**
- Switch component (`pnpm dlx shadcn@latest add switch`)
- Select component (`pnpm dlx shadcn@latest add select`)
- Label component (`pnpm dlx shadcn@latest add label`)

### Browser API Compatibility

- MUST verify `navigator.mediaDevices.getUserMedia()` works in dev/build
- MUST verify `navigator.permissions.query()` works (may not be available in all browsers)
- MUST verify Canvas API works for photo capture
- MUST verify Blob/File APIs work
- MUST verify `URL.createObjectURL()` / `revokeObjectURL()` work

### Client Component Handling

- MUST verify "use client" directives are correct for TanStack Start
- MUST ensure all browser APIs are called client-side only
- MUST handle SSR gracefully (no camera on server)

### Barrel Exports

- MUST maintain barrel export pattern (`index.ts` re-exports)
- MUST export module from `/shared/index.ts`
- MUST export dev-tools components from `/domains/dev-tools/camera/index.ts`

---

## Validation Gates

Before marking migration complete:

**Technical Validation (Automated):**
- ✅ `pnpm check` (format + lint + auto-fix)
- ✅ `pnpm type-check` (zero TypeScript errors)
- ✅ Module builds without errors
- ✅ Dev server runs without warnings

**Standards Compliance (Manual):**
- ✅ Review `standards/global/project-structure.md` (barrel exports, shared infrastructure)
- ✅ Review `standards/global/code-quality.md` (clean code, simplicity)
- ✅ Review `standards/frontend/component-libraries.md` (shadcn/ui usage)
- ✅ Review `standards/frontend/accessibility.md` (ARIA labels, touch targets, keyboard support)
- ✅ Review `standards/global/security.md` (input validation, file uploads)

**Functional Verification:**
- ✅ Permission request flow works (grant/deny)
- ✅ Camera stream starts and displays correctly
- ✅ Photo capture works (Canvas-based)
- ✅ Library picker works (file validation)
- ✅ Photo review works (confirm/retake)
- ✅ Error states display correctly
- ✅ Camera flip works (if multiple cameras)
- ✅ Aspect ratio cropping works
- ✅ Object URL cleanup works (no memory leaks)
- ✅ Dev-tools page loads and functions correctly
- ✅ Prop controls update preview in real-time
- ✅ Callback log captures all events
- ✅ Reset & remount works correctly

**Browser Testing:**
- ✅ Test in Chrome/Edge (desktop + mobile)
- ✅ Test in Safari (desktop + iOS)
- ✅ Test in Firefox (desktop + mobile)
- ✅ Test with real device camera (not just emulator)
- ✅ Test library picker on mobile devices

---

## Acceptance Criteria

### Module Migration

- [x] All files copied to `/apps/clementine-app/src/shared/camera/`
- [ ] `next/image` replaced with TanStack Start solution
- [ ] Import paths updated to TanStack Start conventions
- [ ] All barrel exports maintain public API surface
- [ ] Module structure preserved (components/, hooks/, lib/, types/, schemas/, constants.ts)

### Component Functionality

- [ ] `CameraCapture` orchestrates full workflow correctly
- [ ] `CameraView` starts/stops camera stream
- [ ] `CameraControls` renders accessible buttons
- [ ] `PhotoReview` displays captured photo
- [ ] `PermissionPrompt` handles permission states
- [ ] `ErrorState` displays errors with recovery
- [ ] `useCameraPermission` manages permission state
- [ ] `useLibraryPicker` validates files correctly

### Photo Capture

- [ ] Canvas-based capture works
- [ ] Aspect ratio cropping works (3:4, 1:1, 9:16)
- [ ] JPEG quality is 0.92
- [ ] File validation works (type + size)
- [ ] Object URLs are cleaned up properly

### Dev Tools Page

- [ ] Route `/admin/dev-tools/camera` exists and loads
- [ ] Three-column layout renders correctly
- [ ] Prop controls panel allows toggling all props
- [ ] Camera preview area shows mobile viewport (375×667px)
- [ ] CameraCapture is fully functional in preview
- [ ] Callback log captures all events with timestamps
- [ ] Callback log formats payloads correctly
- [ ] Clear log button works
- [ ] Reset & remount triggers component remount
- [ ] All interactions work smoothly (no errors)

### Build & Type Safety

- [ ] TypeScript strict mode passes (zero errors)
- [ ] ESLint passes (zero errors)
- [ ] Prettier formatting applied
- [ ] No runtime errors in dev server
- [ ] Module can be imported from other domains

---

## Dependencies

### Available

- ✅ React 19.2 (hooks: useState, useReducer, useCallback, useMemo, useEffect, useRef)
- ✅ lucide-react v0.561.0 (icons: Camera, SwitchCamera, ImageIcon, CameraOff, AlertCircle, RefreshCw)
- ✅ Button component (`@/ui-kit/components/button`)
- ✅ `cn` utility (`@/shared/utils`)

### May Need to Install

- ⚠️ Switch component (shadcn/ui)
- ⚠️ Select component (shadcn/ui)
- ⚠️ Label component (shadcn/ui)

### Must Migrate

- ❌ `next/image` → TanStack Start image solution or `<img>`

---

## Migration Priority

**Priority:** 3 (Third)

**Rationale:**
- Independent module (no feature dependencies)
- Shared infrastructure used across multiple domains (guest, dev-tools, experiences)
- Requires next/image migration investigation
- Critical for photo capture functionality

---

## Explicit Non-Goals (Out of Scope)

- Video recording capabilities (photo only)
- Multiple photo capture/batch upload
- Built-in photo editing tools (filters, cropping UI)
- Cloud storage upload (handled by domain features)
- QR code scanning
- Barcode scanning
- Face detection or AR features
- Custom camera UI beyond basic controls
- Native mobile app camera integration (web only)

---

## References

### Source Module
- **Location:** `/web/src/features/camera/`
- **Files:** ~20 files (components, hooks, lib, types, schemas, constants)
- **Used by:** Guest photo submission flow, step capture experiences

### Target Module
- **Location:** `/apps/clementine-app/src/shared/camera/`
- **Classification:** Shared technical infrastructure
- **Exports:** Public API via barrel exports (CameraCapture + types + constants)

### Dev Tools Location
- **Location:** `/apps/clementine-app/src/domains/dev-tools/camera/`
- **Route:** `/admin/dev-tools/camera`
- **Purpose:** Interactive testing playground

### Existing Dev Tools (Reference)
- **Location:** `/web/src/app/(admin)/dev-tools/camera/`
- **Components:** page.tsx, PropControls.tsx, CallbackLog.tsx
- **Purpose:** Template for TanStack Start dev-tools implementation

---

## Success Metrics

- ✅ Module migrated with zero TypeScript errors
- ✅ All validation gates passed
- ✅ Photo capture works in real browsers (Chrome, Safari, Firefox)
- ✅ Camera permissions handled correctly
- ✅ Library picker validates files correctly
- ✅ Dev-tools page loads and functions without errors
- ✅ All component interactions work smoothly
- ✅ No memory leaks (object URLs cleaned up)
- ✅ No breaking changes to public API
- ✅ Module can be imported and used across all domains (guest, dev-tools, experiences)
