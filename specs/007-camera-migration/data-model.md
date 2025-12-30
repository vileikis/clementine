# Data Model: Camera Module

**Feature**: 007-camera-migration
**Date**: 2025-12-30
**Status**: COMPLETE

## Overview

The camera module is **client-only infrastructure** with no server-side data persistence. All state is ephemeral and lives in React component state. This document defines the TypeScript types, interfaces, and state machines used by the camera module.

---

## Type Definitions

### Core Types

#### CapturedPhoto

Represents a photo captured from camera or selected from library.

```typescript
export interface CapturedPhoto {
  /**
   * Object URL for immediate preview display
   * Created via URL.createObjectURL(file)
   * MUST be revoked with URL.revokeObjectURL() after use
   */
  previewUrl: string;

  /**
   * Raw file object for upload to storage
   * Can be uploaded to Firebase Storage or other services
   */
  file: File;

  /**
   * Capture method (camera stream or library picker)
   */
  method: CaptureMethod;

  /**
   * Image width in pixels
   */
  width: number;

  /**
   * Image height in pixels
   */
  height: number;
}
```

**Usage Context**:
- Returned by `CameraCapture` component via `onPhoto` callback
- Passed to `PhotoReview` component for confirmation
- Submitted via `onSubmit` callback for upload by parent component

**Memory Management**:
- `previewUrl` must be revoked with `URL.revokeObjectURL()` after photo is submitted or discarded
- `file` object is managed by browser (garbage collected when no longer referenced)

---

#### CaptureMethod

```typescript
export type CaptureMethod = "camera" | "library";
```

**Values**:
- `"camera"` - Photo captured from camera stream using Canvas
- `"library"` - Photo selected from device library via file input

**Usage**: Distinguishes capture source for analytics or UI display

---

#### AspectRatio

```typescript
export type AspectRatio = "3:4" | "1:1" | "9:16" | undefined;
```

**Values**:
- `"3:4"` - Portrait orientation (e.g., 375×500px)
- `"1:1"` - Square (e.g., 500×500px)
- `"9:16"` - Stories/vertical (e.g., 375×667px)
- `undefined` - No cropping (full camera frame)

**Usage**: Passed to `CameraCapture` component to enable aspect ratio cropping

**Implementation**: Canvas-based cropping in `captureFromVideo()` utility

---

### Permission Management

#### PermissionState

Expo-style permission states for camera access.

```typescript
export type PermissionState =
  | "unknown"        // Initial state (checking availability)
  | "undetermined"   // Permission not yet requested
  | "granted"        // User granted camera permission
  | "denied"         // User denied camera permission
  | "unavailable";   // No camera hardware available
```

**State Transitions**:

```
unknown
  ├─→ unavailable (no MediaDevices API or camera hardware)
  └─→ undetermined (MediaDevices available, permission not requested)
        ├─→ granted (user allows camera access)
        └─→ denied (user blocks camera access)
```

**UI Implications**:
- `unknown` → Show loading spinner
- `undetermined` → Show "Allow Camera Access" button
- `granted` → Proceed to camera stream
- `denied` → Show error message with browser settings instructions
- `unavailable` → Show library picker only (no camera option)

---

### Camera Configuration

#### CameraFacing

```typescript
export type CameraFacing = "user" | "environment";
```

**Values**:
- `"user"` - Front-facing camera (selfie mode)
- `"environment"` - Rear-facing camera

**Usage**: Passed to `getUserMedia()` as `facingMode` constraint

---

#### CameraFacingConfig

```typescript
export type CameraFacingConfig = "user" | "environment" | "both";
```

**Values**:
- `"user"` - Only front camera (no flip button)
- `"environment"` - Only rear camera (no flip button)
- `"both"` - Allow switching between cameras (show flip button)

**Usage**: Configuration prop for `CameraCapture` component

---

### Error Handling

#### CameraCaptureError

```typescript
export interface CameraCaptureError {
  /**
   * Typed error code for programmatic handling
   */
  code: CameraCaptureErrorCode;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Original browser error (for debugging)
   */
  originalError?: Error;
}
```

**Usage**:
- Passed to `onError` callback in `CameraCapture`
- Displayed in `ErrorState` component
- Logged for debugging

---

#### CameraCaptureErrorCode

```typescript
export type CameraCaptureErrorCode =
  | "PERMISSION_DENIED"       // User denied camera permission
  | "CAMERA_IN_USE"           // Camera already in use by another app
  | "CAMERA_NOT_FOUND"        // No camera hardware detected
  | "CAMERA_NOT_SUPPORTED"    // Browser doesn't support getUserMedia
  | "CAMERA_TIMEOUT"          // Camera failed to start within timeout
  | "CAPTURE_FAILED"          // Failed to capture photo from stream
  | "LIBRARY_PICKER_FAILED"   // Library picker error
  | "INVALID_FILE_TYPE"       // Unsupported file type selected
  | "FILE_TOO_LARGE";         // File exceeds max size (50MB)
```

**Error Code Mapping** (from browser errors):

| Browser Error | Error Code | Recovery Action |
|--------------|------------|-----------------|
| `NotAllowedError` | `PERMISSION_DENIED` | Show permission instructions |
| `NotReadableError` | `CAMERA_IN_USE` | Ask user to close other apps |
| `NotFoundError` | `CAMERA_NOT_FOUND` | Offer library picker fallback |
| `NotSupportedError` | `CAMERA_NOT_SUPPORTED` | Offer library picker fallback |
| `TimeoutError` | `CAMERA_TIMEOUT` | Retry button |
| Canvas/Blob error | `CAPTURE_FAILED` | Retry capture |
| File validation | `INVALID_FILE_TYPE` | Show accepted formats |
| File validation | `FILE_TOO_LARGE` | Show max size (50MB) |

---

### UI Labels (i18n)

#### CameraCaptureLabels

```typescript
export interface CameraCaptureLabels {
  // Permission prompt
  permissionTitle: string;
  permissionMessage: string;
  permissionButton: string;
  permissionDeniedTitle: string;
  permissionDeniedMessage: string;
  permissionRetryButton: string;

  // Camera controls
  captureButton: string;
  flipCameraButton: string;
  libraryPickerButton: string;

  // Photo review
  confirmButton: string;
  retakeButton: string;
  cancelButton: string;

  // Error messages
  errorTitle: string;
  errorRetryButton: string;
  errorLibraryFallback: string;

  // Loading states
  loadingCamera: string;
  processingPhoto: string;
}
```

**Default Labels** (English):
```typescript
export const DEFAULT_LABELS: CameraCaptureLabels = {
  // Permission prompt
  permissionTitle: "Camera Access Required",
  permissionMessage: "To take a photo, please allow camera access.",
  permissionButton: "Allow Camera Access",
  permissionDeniedTitle: "Camera Access Denied",
  permissionDeniedMessage: "Please enable camera access in your browser settings.",
  permissionRetryButton: "Try Again",

  // Camera controls
  captureButton: "Take Photo",
  flipCameraButton: "Flip Camera",
  libraryPickerButton: "Choose from Library",

  // Photo review
  confirmButton: "Confirm",
  retakeButton: "Retake",
  cancelButton: "Cancel",

  // Error messages
  errorTitle: "Camera Error",
  errorRetryButton: "Retry",
  errorLibraryFallback: "Choose from Library Instead",

  // Loading states
  loadingCamera: "Loading camera...",
  processingPhoto: "Processing photo...",
};
```

**Usage**: Pass custom labels to `CameraCapture` for i18n support

---

## Component State

### CameraCapture State Machine

The `CameraCapture` component manages the overall capture workflow using a reducer.

#### Camera State

```typescript
type CameraState =
  | "requesting_permission"  // Checking/requesting camera permission
  | "active"                 // Camera stream is active
  | "reviewing"              // User is reviewing captured photo
  | "error";                 // Error state (shows ErrorState component)
```

#### State Machine Definition

```typescript
interface CameraStateData {
  state: CameraState;
  capturedPhoto: CapturedPhoto | null;
  error: CameraCaptureError | null;
  permissionState: PermissionState;
}

type CameraAction =
  | { type: "PERMISSION_UNKNOWN" }
  | { type: "PERMISSION_UNDETERMINED" }
  | { type: "PERMISSION_GRANTED" }
  | { type: "PERMISSION_DENIED" }
  | { type: "PERMISSION_UNAVAILABLE" }
  | { type: "PHOTO_CAPTURED"; photo: CapturedPhoto }
  | { type: "PHOTO_CONFIRMED" }
  | { type: "PHOTO_RETAKE" }
  | { type: "PHOTO_CANCELLED" }
  | { type: "ERROR"; error: CameraCaptureError }
  | { type: "RETRY" };

function cameraReducer(state: CameraStateData, action: CameraAction): CameraStateData {
  switch (action.type) {
    case "PERMISSION_UNKNOWN":
      return { ...state, permissionState: "unknown", state: "requesting_permission" };

    case "PERMISSION_UNDETERMINED":
      return { ...state, permissionState: "undetermined", state: "requesting_permission" };

    case "PERMISSION_GRANTED":
      return { ...state, permissionState: "granted", state: "active" };

    case "PERMISSION_DENIED":
      return { ...state, permissionState: "denied", state: "error", error: {
        code: "PERMISSION_DENIED",
        message: "Camera access denied",
      }};

    case "PERMISSION_UNAVAILABLE":
      return { ...state, permissionState: "unavailable", state: "error", error: {
        code: "CAMERA_NOT_FOUND",
        message: "No camera available",
      }};

    case "PHOTO_CAPTURED":
      return { ...state, state: "reviewing", capturedPhoto: action.photo };

    case "PHOTO_CONFIRMED":
      return { ...state, state: "active", capturedPhoto: null };

    case "PHOTO_RETAKE":
      return { ...state, state: "active", capturedPhoto: null };

    case "PHOTO_CANCELLED":
      return { ...state, state: "active", capturedPhoto: null };

    case "ERROR":
      return { ...state, state: "error", error: action.error };

    case "RETRY":
      return { ...state, state: "requesting_permission", error: null };

    default:
      return state;
  }
}
```

**State Flow Diagram**:

```
┌─────────────────────┐
│ requesting_permission│
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌───────┐    ┌───────┐
│granted│    │denied │
└───┬───┘    └───┬───┘
    │            │
    ▼            ▼
┌───────┐    ┌───────┐
│active │    │ error │
└───┬───┘    └───┬───┘
    │            │
    │ (capture)  │ (retry)
    ▼            │
┌──────────┐    │
│reviewing │    │
└────┬─────┘    │
     │          │
     │(confirm/ │
     │ retake)  │
     └──────────┘
```

---

### CameraView State

The `CameraView` component manages the camera stream lifecycle.

```typescript
interface CameraViewState {
  /** Current camera facing mode */
  facing: CameraFacing;

  /** MediaStream object (null when stopped) */
  stream: MediaStream | null;

  /** Whether device has multiple cameras */
  hasMultipleCameras: boolean;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: CameraCaptureError | null;
}
```

**Lifecycle**:
1. Component mounts → Start camera stream (`getUserMedia`)
2. Stream acquired → Display in video element
3. User captures photo → Canvas draws video frame
4. Component unmounts → Stop all tracks, revoke stream

---

### PhotoReview State

The `PhotoReview` component is stateless (receives photo as prop).

```typescript
interface PhotoReviewProps {
  photo: CapturedPhoto;
  onConfirm: () => void;
  onRetake: () => void;
  labels: Pick<CameraCaptureLabels, "confirmButton" | "retakeButton">;
}
```

**Responsibilities**:
- Display captured photo (blob URL)
- Provide confirm and retake actions
- Clean up object URL on unmount (handled by parent `CameraCapture`)

---

## Constants

### Camera Constraints

```typescript
export const CAMERA_CONSTRAINTS = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode: "user", // Default to front camera
  },
} as const;
```

**Usage**: Passed to `getUserMedia()` for optimal resolution

---

### Capture Quality

```typescript
export const CAPTURE_QUALITY = 0.92; // JPEG quality (0.0 - 1.0)
```

**Usage**: Passed to `canvas.toBlob()` for photo capture

**Rationale**: 0.92 balances quality and file size (higher than 0.8 default, lower than lossless 1.0)

---

### File Validation

```typescript
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
```

**Usage**:
- `ACCEPTED_IMAGE_TYPES` → File input `accept` attribute and validation
- `MAX_FILE_SIZE` → Client-side file size validation (prevents upload of huge files)

---

## Utility Functions (Internal)

### captureFromVideo

```typescript
interface CaptureOptions {
  aspectRatio?: AspectRatio;
  mirror?: boolean; // Mirror for front camera
}

export async function captureFromVideo(
  video: HTMLVideoElement,
  options: CaptureOptions = {}
): Promise<Blob>
```

**Purpose**: Capture photo from video stream using Canvas API

**Algorithm**:
1. Calculate crop dimensions based on aspect ratio
2. Create canvas element with target dimensions
3. Apply mirroring if front camera
4. Draw cropped video frame to canvas
5. Convert canvas to JPEG blob (quality 0.92)

**Returns**: Blob (JPEG image data)

---

### cameraReducer

```typescript
function cameraReducer(
  state: CameraStateData,
  action: CameraAction
): CameraStateData
```

**Purpose**: State machine reducer for `CameraCapture` component

**Usage**: `useReducer(cameraReducer, initialState)`

---

### parseMediaError

```typescript
export function parseMediaError(error: unknown): CameraCaptureError
```

**Purpose**: Convert browser MediaDevices errors to typed error codes

**Error Mapping**:
- `NotAllowedError` → `PERMISSION_DENIED`
- `NotReadableError` → `CAMERA_IN_USE`
- `NotFoundError` → `CAMERA_NOT_FOUND`
- `NotSupportedError` → `CAMERA_NOT_SUPPORTED`
- `TimeoutError` → `CAMERA_TIMEOUT`
- Unknown → `CAMERA_NOT_SUPPORTED`

---

### getImageDimensions

```typescript
interface ImageDimensions {
  width: number;
  height: number;
}

export async function getImageDimensions(file: File): Promise<ImageDimensions>
```

**Purpose**: Extract width and height from image file

**Algorithm**:
1. Create object URL from file
2. Load image into `<img>` element
3. Read `naturalWidth` and `naturalHeight`
4. Revoke object URL (cleanup)

**Usage**: Called when capturing photo or selecting from library

---

### isMediaDevicesAvailable

```typescript
export function isMediaDevicesAvailable(): boolean
```

**Purpose**: Feature detection for MediaDevices API

**Returns**: `true` if `navigator.mediaDevices.getUserMedia` exists

**Usage**: Early check to set permission state to "unavailable"

---

### isPermissionQueryAvailable

```typescript
export function isPermissionQueryAvailable(): boolean
```

**Purpose**: Feature detection for Permissions API

**Returns**: `true` if `navigator.permissions.query` exists

**Usage**: Determines whether to use permission query or fallback pattern

---

## Data Flow

### Photo Capture Flow

```
User clicks "Take Photo"
  ↓
CameraControls.onCapture()
  ↓
CameraView.takePhoto() (ref method)
  ↓
captureFromVideo(videoElement, { aspectRatio, mirror })
  ↓
Canvas creates Blob (JPEG)
  ↓
Create File from Blob
  ↓
getImageDimensions(file)
  ↓
Create CapturedPhoto object
  ↓
onPhoto(photo) callback
  ↓
CameraCapture state: "active" → "reviewing"
  ↓
PhotoReview displays photo.previewUrl
  ↓
User clicks "Confirm"
  ↓
onSubmit(photo) callback
  ↓
Parent component uploads to storage
  ↓
URL.revokeObjectURL(photo.previewUrl) (cleanup)
```

---

### Library Picker Flow

```
User clicks "Choose from Library"
  ↓
LibraryPicker file input opens
  ↓
User selects image file
  ↓
useLibraryPicker validates file (type + size)
  ↓
getImageDimensions(file)
  ↓
URL.createObjectURL(file) → previewUrl
  ↓
Create CapturedPhoto object
  ↓
onPhoto(photo) callback
  ↓
(Same as camera flow from here)
```

---

### Permission Flow

```
Component mounts
  ↓
useCameraPermission() checks availability
  ↓
isMediaDevicesAvailable()?
  ├─ No → state: "unavailable"
  └─ Yes ↓
     isPermissionQueryAvailable()?
       ├─ Yes → navigator.permissions.query()
       │         ├─ granted → state: "granted"
       │         ├─ denied → state: "denied"
       │         └─ prompt → state: "undetermined"
       └─ No → state: "undetermined"
  ↓
User clicks "Allow Camera Access"
  ↓
requestPermission() calls getUserMedia()
  ├─ Success → state: "granted" → stream starts
  └─ Failure → state: "denied" → show error
```

---

## No Server-Side Data Model

The camera module has **no server-side data persistence**. All data is ephemeral:

- **No database tables**: Camera module doesn't store photos
- **No API endpoints**: Upload happens in parent domain features
- **No Firestore documents**: Photos uploaded by guest/experience features
- **No Firebase Storage rules**: Handled by domain features

**Rationale**: Camera module is pure UI infrastructure. Domain features (guest photo submission, experience steps) handle storage and persistence.

---

## Summary

### Type Complexity

| Category | Types | Complexity |
|----------|-------|------------|
| Core | 6 types | Low (simple interfaces) |
| Permission | 1 type | Low (5 states) |
| Configuration | 3 types | Low (enums) |
| Errors | 2 types | Medium (9 error codes) |
| Labels | 1 interface | Medium (16 labels) |
| Internal | 8 utilities | Medium (Canvas, async) |

### State Management

- **CameraCapture**: Reducer pattern (7 states, 10 actions)
- **CameraView**: useState for stream lifecycle
- **PhotoReview**: Stateless (props only)
- **useCameraPermission**: useState for permission state
- **useLibraryPicker**: useState for file input

### Data Persistence

**None** - All state is ephemeral and lives in React component state. Photos are returned to parent components for upload.

---

**Data Model Status**: COMPLETE
**Next Phase**: Generate quickstart.md (usage examples)
**Last Updated**: 2025-12-30
