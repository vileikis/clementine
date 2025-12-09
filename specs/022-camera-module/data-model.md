# Data Model: Camera Module

**Feature**: 022-camera-module
**Date**: 2025-12-08

## Overview

The Camera Module is **storage-agnostic** - it does not persist any data to Firestore or other storage. All entities defined here are **runtime/memory only**, passed through callbacks to consumers who handle persistence.

## Entities

### CapturedPhoto

Represents the result of a photo capture or library selection.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `previewUrl` | `string` | Yes | Object URL for immediate display (created via `URL.createObjectURL`) |
| `file` | `File` | Yes | Raw file object for upload to storage |
| `method` | `CaptureMethod` | Yes | How the photo was obtained |
| `width` | `number` | Yes | Image width in pixels |
| `height` | `number` | Yes | Image height in pixels |

**Lifecycle:**
- Created when photo is captured (camera) or selected (library)
- Passed to `onPhoto` callback when entering review state
- Passed to `onSubmit` callback when user confirms
- Consumer is responsible for cleanup (`URL.revokeObjectURL`) after upload

---

### CameraCaptureError

Represents error states with typed codes for exhaustive handling.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `CameraCaptureErrorCode` | Yes | Typed error code for programmatic handling |
| `message` | `string` | Yes | Human-readable error message |

---

### CaptureMethod

Discriminated type indicating how the photo was obtained.

| Value | Description |
|-------|-------------|
| `"camera"` | Photo captured via device camera |
| `"library"` | Photo selected from device gallery/file system |

---

### CameraCaptureErrorCode

Discriminated union of all possible error codes.

| Code | Trigger | User-Facing Action |
|------|---------|-------------------|
| `PERMISSION_DENIED` | User explicitly denied camera permission | Show library fallback |
| `PERMISSION_DISMISSED` | User closed permission prompt without action | Show retry option |
| `CAMERA_UNAVAILABLE` | No camera hardware detected | Show library-only mode |
| `CAMERA_IN_USE` | Camera is being used by another application | Show retry + library |
| `CAPTURE_FAILED` | Canvas/blob creation failed during capture | Show retry option |
| `INVALID_FILE_TYPE` | User selected non-image file from library | Show error, re-open picker |
| `UNKNOWN` | Unexpected error | Show generic error + library |

---

### CameraState (Internal)

Internal state machine state - not exposed to consumers.

| State | Description | Valid Transitions |
|-------|-------------|-------------------|
| `permission-prompt` | Initial state, awaiting user action | → `camera-active`, `error`, `library-only` |
| `camera-active` | Camera stream active, viewfinder visible | → `photo-review`, `error` |
| `photo-review` | Photo captured/selected, showing review | → `camera-active` (retake), `submitted` |
| `error` | Error occurred, showing error UI | → `permission-prompt` (retry), `library-only` |
| `library-only` | Camera unavailable, library picker mode | → `photo-review` |

---

### CameraCaptureProps (Component Interface)

Configuration props for the `CameraCapture` component.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onPhoto` | `(photo: CapturedPhoto) => void` | - | Called when photo taken/selected (enters review) |
| `onSubmit` | `(photo: CapturedPhoto) => void` | Required | Called when user confirms photo |
| `onRetake` | `() => void` | - | Optional: called when user taps retake |
| `onCancel` | `() => void` | - | Optional: called when user wants to exit |
| `onError` | `(error: CameraCaptureError) => void` | - | Optional: called on any error |
| `enableCamera` | `boolean` | `true` | Show camera capture option |
| `enableLibrary` | `boolean` | `true` | Show library selection option |
| `cameraFacing` | `"user" \| "environment" \| "both"` | `"both"` | Available camera(s) |
| `initialFacing` | `"user" \| "environment"` | `"user"` | Starting camera when `cameraFacing="both"` |
| `aspectRatio` | `"3:4" \| "1:1" \| "9:16"` | `"3:4"` | Aspect ratio guide overlay |
| `className` | `string` | - | Container CSS class |
| `labels` | `CameraCaptureLabels` | - | Custom labels for i18n |

**Validation Rules:**
- `enableCamera` and `enableLibrary` cannot both be `false`
- `initialFacing` must match one of the cameras when `cameraFacing` is not `"both"`

---

### CameraCaptureLabels (i18n)

Customizable labels for internationalization.

| Key | Default (en) | Description |
|-----|--------------|-------------|
| `permissionTitle` | "Camera Access" | Permission prompt title |
| `permissionDescription` | "We need camera access to take your photo" | Permission prompt description |
| `allowCamera` | "Allow Camera" | Permission button text |
| `capture` | "Take Photo" | Capture button aria-label |
| `flipCamera` | "Switch Camera" | Flip button aria-label |
| `openLibrary` | "Choose from Library" | Library button aria-label |
| `retake` | "Retake" | Retake button text |
| `confirm` | "Use Photo" | Confirm button text |
| `permissionDenied` | "Camera access denied" | Denied error title |
| `permissionDeniedHint` | "Please enable camera in your browser settings" | Denied error hint |
| `cameraUnavailable` | "Camera not available" | Unavailable error title |
| `cameraInUse` | "Camera is in use" | In-use error title |
| `captureError` | "Failed to capture photo" | Capture error message |

---

## State Transitions Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CAMERA CAPTURE FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────┐                                               │
│   │  PERMISSION_PROMPT  │◄──────────────────────────┐                   │
│   │                     │                           │                   │
│   │  [Allow Camera]     │                           │ retry             │
│   └──────────┬──────────┘                           │                   │
│              │                                      │                   │
│      ┌───────┴───────┐                              │                   │
│      │               │                              │                   │
│      ▼ granted       ▼ denied/unavailable           │                   │
│   ┌──────────┐    ┌──────────┐                      │                   │
│   │  CAMERA  │    │  ERROR   │──────────────────────┘                   │
│   │  ACTIVE  │    │          │                                          │
│   │          │    │  [Use Library] ─────┐                               │
│   │ [Capture]│    └──────────┘          │                               │
│   │ [Flip]   │                          │                               │
│   │ [Library]│──────────────────────────┤                               │
│   └────┬─────┘                          │                               │
│        │                                │                               │
│        ▼ photo taken/selected           │                               │
│   ┌──────────────┐                      │                               │
│   │ PHOTO_REVIEW │◄─────────────────────┘                               │
│   │              │                                                      │
│   │  [Retake]────┼──────────────────────────────┐                       │
│   │  [Confirm]   │                              │                       │
│   └──────┬───────┘                              │                       │
│          │                                      ▼                       │
│          ▼ confirmed                    ┌──────────────┐                │
│   ┌──────────────┐                      │ CAMERA_ACTIVE│                │
│   │   onSubmit   │                      │ (or library) │                │
│   │   callback   │                      └──────────────┘                │
│   └──────────────┘                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File Validation Schema

```typescript
// Zod schema for file validation
const imageFileSchema = z.object({
  type: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]),
  size: z.number().max(50 * 1024 * 1024), // 50MB max
});
```

---

## Memory Management

The camera module manages browser resources that require cleanup:

| Resource | Creation | Cleanup Responsibility |
|----------|----------|----------------------|
| `MediaStream` | `getUserMedia()` | Component unmount (internal) |
| Object URLs | `URL.createObjectURL()` | Consumer after upload |
| Canvas elements | Photo capture | Immediate (internal) |

**Consumer Cleanup Pattern:**
```typescript
const handleSubmit = async (photo: CapturedPhoto) => {
  try {
    await uploadToStorage(photo.file);
    // Cleanup after successful upload
    URL.revokeObjectURL(photo.previewUrl);
  } catch (error) {
    // Keep URL for retry
  }
};
```
