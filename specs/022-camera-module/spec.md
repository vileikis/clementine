# Feature Specification: Camera Module

**Feature Branch**: `022-camera-module`
**Created**: 2025-12-08
**Status**: Draft
**Input**: A self-contained, reusable camera feature module that handles the complete photo capture flow: permission requests, live camera preview, photo capture, and review/confirmation. Exposes a single container component with lifecycle callbacks for easy integration.

## Problem Statement

The current camera implementation is tightly coupled to the guest flow step renderers. This creates duplication when camera functionality is needed elsewhere (e.g., admin preview, future features) and makes the CaptureStep renderer unnecessarily complex.

## Goals

1. **Encapsulation** - All camera logic (permissions, stream, capture, review) in one module
2. **Simple API** - Single container component with callbacks, no state management required by consumer
3. **Reusability** - Works in Experience Engine, standalone pages, or any future context
4. **Mobile-first** - Optimized for mobile browsers with proper permission handling
5. **Graceful degradation** - Fallback to file upload when camera unavailable

## Non-Goals

- Video recording (future consideration)
- Photo editing/filters (out of scope)
- Cloud upload (handled by consumer via callbacks)
- Firestore/storage integration (module is storage-agnostic)

## User Scenarios & Testing

### User Story 1 - Basic Photo Capture (Priority: P1)

A guest visits a photo experience and needs to take a photo using their device camera. They grant camera permission, see the live preview, capture their photo, review it, and confirm submission.

**Why this priority**: This is the core functionality - without photo capture, the entire product cannot function. It represents the happy path that 80%+ of users will follow.

**Independent Test**: Can be fully tested by loading the camera component, granting permission, taking a photo, and confirming - delivers a captured photo ready for processing.

**Acceptance Scenarios**:

1. **Given** a user on a device with a camera and browser permission not yet granted, **When** they load the camera component, **Then** they see a permission prompt screen with an explanation and "Allow Camera" button.

2. **Given** a user who taps "Allow Camera", **When** the browser permission is granted, **Then** the live camera viewfinder appears with capture, flip camera, and photo library buttons.

3. **Given** a user viewing the live camera preview, **When** they tap the capture button, **Then** a photo is taken and the review screen appears showing the captured photo with "Retake" and "Confirm" buttons.

4. **Given** a user on the review screen, **When** they tap "Confirm", **Then** the `onSubmit` callback fires with the photo data (file, preview URL, dimensions, capture method).

---

### User Story 2 - Photo Library Selection (Priority: P1)

A guest prefers to upload an existing photo from their device gallery instead of taking a new one. They access the photo library, select a photo, review it, and confirm submission.

**Why this priority**: Equal priority to camera capture as it serves users who prefer existing photos, users with camera permission denied, and provides essential fallback functionality.

**Independent Test**: Can be fully tested by tapping the library button, selecting a photo, reviewing, and confirming - delivers a selected photo ready for processing.

**Acceptance Scenarios**:

1. **Given** a user on the camera screen, **When** they tap the photo library button, **Then** the device file picker opens filtered to images.

2. **Given** a user in the file picker, **When** they select a photo, **Then** the review screen appears showing the selected photo with "Retake" and "Confirm" buttons.

3. **Given** a user on the review screen with a library photo, **When** they tap "Confirm", **Then** the `onSubmit` callback fires with photo data where `method` equals "library".

---

### User Story 3 - Retake Photo (Priority: P2)

A guest captures or selects a photo but is not satisfied with it. They want to return to the camera or library to get a different photo.

**Why this priority**: Important for user satisfaction but not critical for basic functionality. A user could technically confirm any photo.

**Independent Test**: Can be tested by capturing a photo, tapping "Retake", verifying return to camera, then capturing a new photo.

**Acceptance Scenarios**:

1. **Given** a user on the review screen after capturing with camera, **When** they tap "Retake", **Then** they return to the live camera viewfinder (not the permission screen).

2. **Given** a user on the review screen after selecting from library, **When** they tap "Retake", **Then** they return to the camera viewfinder (if available) or file picker opens again.

3. **Given** a retake action, **When** `onRetake` callback is configured, **Then** it fires for analytics purposes.

---

### User Story 4 - Camera Flip (Priority: P2)

A guest wants to switch between front and back cameras during a photo session (e.g., taking a selfie vs capturing surroundings).

**Why this priority**: Enhances user experience significantly but the feature works without it. Default camera selection covers most use cases.

**Independent Test**: Can be tested by loading camera with `cameraFacing="both"`, tapping flip button, verifying viewfinder switches cameras.

**Acceptance Scenarios**:

1. **Given** a user with `cameraFacing` set to "both" and device has multiple cameras, **When** viewing the camera viewfinder, **Then** a flip camera button is visible.

2. **Given** a user viewing through front camera, **When** they tap the flip button, **Then** the viewfinder switches to back camera (and vice versa).

3. **Given** a user with `cameraFacing` set to "user" or "environment", **When** viewing the camera viewfinder, **Then** the flip button is not visible.

---

### User Story 5 - Permission Denied Handling (Priority: P2)

A guest denies camera permission or has previously blocked it. They should still be able to complete the photo experience via the photo library.

**Why this priority**: Critical for accessibility and conversion but represents a minority of users. Library fallback ensures no user is completely blocked.

**Independent Test**: Can be tested by denying camera permission, verifying error UI appears with library option, completing flow via library.

**Acceptance Scenarios**:

1. **Given** a user who denies the camera permission prompt, **When** the denial is detected, **Then** an error message appears explaining camera access was denied, with a hint to check settings and a prominent photo library button.

2. **Given** a user with previously denied permission, **When** the component loads, **Then** it detects the blocked state and immediately shows the denied state UI with library fallback.

3. **Given** a permission denial, **When** `enableLibrary` is true, **Then** the user can still complete the photo flow via file picker.

4. **Given** a permission denial, **When** `onError` callback is configured, **Then** it fires with error code "PERMISSION_DENIED".

---

### User Story 6 - Camera Unavailable Device (Priority: P3)

A guest accesses the experience from a device without a camera (e.g., older desktop). They should be gracefully redirected to photo library upload.

**Why this priority**: Edge case affecting small percentage of users, but important for complete coverage and graceful degradation.

**Independent Test**: Can be tested on a device without camera or by simulating unavailability, verifying library-only mode activates.

**Acceptance Scenarios**:

1. **Given** a device without camera hardware, **When** the component loads with `enableCamera=true` and `enableLibrary=true`, **Then** camera viewfinder is skipped and "Camera not available" message appears with library button.

2. **Given** camera unavailable, **When** `onError` callback is configured, **Then** it fires with error code "CAMERA_UNAVAILABLE".

3. **Given** `enableCamera=false` and `enableLibrary=true`, **When** the component loads, **Then** the file picker interface is shown directly without any camera viewfinder.

---

### User Story 7 - Dev Tools Testing (Priority: P3)

A developer needs to test all camera component configurations and verify callback behavior during development.

**Why this priority**: Supports development workflow but not end-user functionality. Can be deferred without affecting core product.

**Independent Test**: Can be tested by accessing `/dev-tools/camera`, manipulating prop controls, capturing photos, and reviewing callback logs.

**Acceptance Scenarios**:

1. **Given** a developer in development environment, **When** they navigate to `/dev-tools/camera`, **Then** they see a testing interface with prop controls, camera preview, and callback log panels.

2. **Given** the dev tools interface, **When** the developer changes prop values (enableCamera, enableLibrary, cameraFacing, aspectRatio), **Then** the camera component re-renders with new configuration.

3. **Given** the developer interacts with the camera component, **When** callbacks fire (onPhoto, onSubmit, onRetake, onError), **Then** they appear in the callback log with timestamp and payload.

---

### Edge Cases

- What happens when the user dismisses the browser permission prompt without choosing allow/deny? Show dismissed state with option to retry permission request.
- How does system handle camera being used by another application? Show "Camera in use" error with retry option and library fallback.
- What happens when a user selects an invalid file type from library? Validate file type (images only) and show error if invalid.
- How does system handle very large image files? Process and resize on capture to reasonable dimensions before returning.
- What happens if the user switches tabs/apps while camera is active? Pause the camera stream and resume when tab regains focus.
- What happens when photo capture fails mid-process? Show error message with retry option.

## Requirements

### Functional Requirements

- **FR-001**: System MUST request camera permission only when user initiates (tap "Allow Camera" button), not on component mount.
- **FR-002**: System MUST display live camera preview using device's camera hardware after permission granted.
- **FR-003**: System MUST capture a photo when user taps the capture button and transition to review state.
- **FR-004**: System MUST display the captured/selected photo in review state with options to retake or confirm.
- **FR-005**: System MUST fire `onSubmit` callback with photo data (file, previewUrl, dimensions, method) when user confirms.
- **FR-006**: System MUST support switching between front and back cameras when both are available and configured.
- **FR-007**: System MUST provide photo library/gallery access as an alternative to camera capture.
- **FR-008**: System MUST gracefully degrade to library-only mode when camera is unavailable or permission denied.
- **FR-009**: System MUST fire appropriate error callbacks with typed error codes for all failure scenarios.
- **FR-010**: System MUST expose a single container component (`CameraCapture`) with configuration props and lifecycle callbacks.
- **FR-011**: System MUST NOT upload photos to any storage, write to databases, or know about domain concepts (storage-agnostic).
- **FR-012**: System MUST return `File` object and `previewUrl` (object URL) via callbacks for consumer handling.
- **FR-013**: System MUST support configurable aspect ratio guides (3:4, 1:1, 9:16).
- **FR-014**: System MUST support internationalization via configurable labels prop.
- **FR-015**: Dev tools MUST provide interactive testing interface at `/dev-tools/camera` with prop controls and callback logging.

### Mobile-First Requirements (Constitution Principle I)

- **MFR-001**: Feature MUST work on mobile viewport (320px-768px) as primary experience.
- **MFR-002**: Capture button MUST be large, centered, and meet minimum touch target size (44x44px minimum, 64x64px recommended).
- **MFR-003**: All interactive elements (flip, library, retake, confirm buttons) MUST meet 44x44px minimum touch target.
- **MFR-004**: Camera viewfinder MUST fill available screen space on mobile for optimal photo framing.
- **MFR-005**: UI controls MUST be positioned for easy thumb access on mobile (bottom of screen).
- **MFR-006**: System MUST handle iOS Safari permission flow (single chance) with clear pre-permission explanation.
- **MFR-007**: System MUST handle Android Chrome permission flow with appropriate re-prompting behavior.
- **MFR-008**: File input fallback MUST use `capture` attribute for native mobile camera integration.

### Type-Safety & Validation Requirements (Constitution Principle III)

- **TSR-001**: All callback payloads MUST be typed with TypeScript interfaces (`CapturedPhoto`, `CameraCaptureError`).
- **TSR-002**: Component props MUST use TypeScript types with no `any` escapes.
- **TSR-003**: Error codes MUST be a discriminated union type for exhaustive handling.
- **TSR-004**: File type validation MUST accept only image MIME types (image/jpeg, image/png, image/gif, image/webp).

### Firebase Architecture Requirements (Constitution Principle VI)

- **FAR-001**: This feature has NO direct Firebase requirements - it is storage-agnostic by design.
- **FAR-002**: Consumers of this component (e.g., CaptureStep) are responsible for storage operations.

### Key Entities

- **CapturedPhoto**: Represents the captured/selected photo data containing file (raw File object), previewUrl (object URL for display), method (camera/library), and dimensions (width/height).
- **CameraCaptureError**: Represents error states containing code (typed error code) and message (human-readable description).
- **CaptureMethod**: Discriminated type indicating how photo was obtained ("camera" | "library").

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can complete photo capture flow (permission → capture → confirm) in under 30 seconds on mobile devices.
- **SC-002**: Permission grant rate: 80%+ of users who see the permission prompt grant camera access.
- **SC-003**: Capture success rate: 95%+ of users who grant permission successfully capture and confirm a photo.
- **SC-004**: Fallback success: 100% of users with denied/unavailable camera can still complete flow via photo library.
- **SC-005**: Retake rate below 20% indicates satisfactory photo quality and clear UI (high retake rate signals UX issues).
- **SC-006**: Component reusability: Camera module can be integrated into any new feature with under 10 lines of consumer code.
- **SC-007**: Dev tools allow testing all 12 configuration combinations (enableCamera × enableLibrary × cameraFacing variations).

## Assumptions

- Users have devices with cameras for the primary flow (desktop/laptop webcam or mobile camera).
- Modern browsers with getUserMedia API support (Chrome, Safari, Firefox, Edge - all versions from past 2 years).
- HTTPS connection is available (required for camera access on iOS Safari).
- Consumers will handle photo upload to storage and any domain-specific logic.
- Step primitives from existing codebase will be used for consistent styling.
