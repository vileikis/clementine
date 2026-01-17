# Data Model: Photo Capture (E5.2)

**Date**: 2026-01-17 | **Status**: Complete

## Overview

This document defines the data structures and types for the photo capture feature. Most types already exist in the codebase; this document clarifies their usage and documents the new `usePhotoCapture` hook types.

---

## 1. Existing Types (Reference)

### 1.1 CapturedPhoto (from `shared/camera`)

```typescript
// Location: apps/clementine-app/src/shared/camera/types/camera.types.ts

interface CapturedPhoto {
  /** Blob URL for immediate display */
  previewUrl: string
  /** File object for upload */
  file: File
  /** How the photo was obtained */
  method: CaptureMethod
  /** Image width in pixels */
  width: number
  /** Image height in pixels */
  height: number
}

type CaptureMethod = 'camera' | 'library'
```

### 1.2 CapturedMedia (from `session`)

```typescript
// Location: apps/clementine-app/src/domains/session/shared/schemas/session.schema.ts

interface CapturedMedia {
  /** Step that captured this media */
  stepId: string
  /** Media asset ID in storage */
  assetId: string
  /** Public URL to the asset */
  url: string
  /** Capture timestamp (Unix ms) */
  createdAt: number
}
```

### 1.3 CapturePhotoStepConfig

```typescript
// Location: apps/clementine-app/src/domains/experience/steps/schemas/capture-photo.schema.ts

interface CapturePhotoStepConfig {
  /** Aspect ratio for the captured photo */
  aspectRatio: '1:1' | '9:16'
}
```

### 1.4 Permission States

```typescript
// Location: apps/clementine-app/src/shared/camera/types/camera.types.ts

type PermissionState =
  | 'unknown'       // Initial, checking
  | 'undetermined'  // User hasn't been asked
  | 'granted'       // Permission granted
  | 'denied'        // User blocked
  | 'unavailable'   // No hardware

type CameraCaptureErrorCode =
  | 'PERMISSION_DENIED'
  | 'PERMISSION_DISMISSED'
  | 'CAMERA_UNAVAILABLE'
  | 'CAMERA_IN_USE'
  | 'CAPTURE_FAILED'
  | 'INVALID_FILE_TYPE'
  | 'UNKNOWN'

interface CameraCaptureError {
  code: CameraCaptureErrorCode
  message: string
}
```

---

## 2. New Types

### 2.1 PhotoCaptureStatus

```typescript
// Location: apps/clementine-app/src/shared/camera/types/camera.types.ts (add to existing)

/**
 * Status states for the photo capture flow.
 * Used by usePhotoCapture hook to track capture state machine.
 */
type PhotoCaptureStatus =
  | 'idle'           // Initial state, camera not started
  | 'camera-active'  // Live camera feed showing
  | 'photo-preview'  // Captured photo shown for review
  | 'uploading'      // Photo uploading to storage
  | 'error'          // Error occurred
```

### 2.2 UsePhotoCaptureOptions

```typescript
// Location: apps/clementine-app/src/shared/camera/types/camera.types.ts (add to existing)

/**
 * Options for the usePhotoCapture hook.
 */
interface UsePhotoCaptureOptions {
  /** Ref to the CameraView component for taking photos */
  cameraRef: RefObject<CameraViewRef>
  /** Optional callback when photo is captured (before confirmation) */
  onCapture?: (photo: CapturedPhoto) => void
}
```

### 2.3 UsePhotoCaptureReturn

```typescript
// Location: apps/clementine-app/src/shared/camera/types/camera.types.ts (add to existing)

/**
 * Return value of the usePhotoCapture hook.
 * Provides state and actions for the capture flow.
 */
interface UsePhotoCaptureReturn {
  /** Current status of the capture flow */
  status: PhotoCaptureStatus
  /** Captured photo (available in 'photo-preview' status) */
  photo: CapturedPhoto | null
  /** Error details (available in 'error' status) */
  error: CameraCaptureError | null
  /** Trigger photo capture from camera */
  capture: () => Promise<void>
  /** Discard captured photo and return to camera */
  retake: () => void
  /** Confirm photo and trigger onCapture callback */
  confirm: () => Promise<void>
  /** Reset to idle state */
  reset: () => void
}
```

---

## 3. State Transitions

### 3.1 Photo Capture State Machine

```
                              ┌──────────┐
                              │   idle   │
                              └────┬─────┘
                                   │ camera starts (automatic)
                                   ▼
                            ┌──────────────┐
                  ┌─────────│ camera-active │◄─────────┐
                  │         └──────┬───────┘          │
                  │                │ capture()        │ retake()
                  │                ▼                  │
                  │         ┌──────────────┐         │
                  │         │ photo-preview ├─────────┘
                  │         └──────┬───────┘
                  │                │ confirm()
                  │                ▼
                  │         ┌──────────────┐
                  │         │  uploading   │
                  │         └──────┬───────┘
                  │                │ success / no upload needed
                  │                ▼
                  │         ┌──────────────┐
                  │         │   complete   │ (exits hook, calls onSubmit)
                  │         └──────────────┘
                  │
    error at any  │         ┌──────────────┐
         point    └────────►│    error     │
                            └──────────────┘
```

### 3.2 Valid Transitions

| From | To | Trigger |
|------|----|---------|
| `idle` | `camera-active` | Camera stream starts |
| `camera-active` | `photo-preview` | `capture()` |
| `camera-active` | `error` | Camera error |
| `photo-preview` | `camera-active` | `retake()` |
| `photo-preview` | `uploading` | `confirm()` |
| `uploading` | complete | Upload success |
| `uploading` | `error` | Upload failure |
| `error` | `camera-active` | `retake()` or retry |

---

## 4. Storage Schema

### 4.1 Storage Path

```
projects/{projectId}/sessions/{sessionId}/inputs/{assetId}.jpg
```

**Fields**:
- `projectId`: Parent project ID (from session)
- `sessionId`: Session document ID (from runtime store)
- `assetId`: Generated unique ID (nanoid)
- Extension: Always `.jpg` (JPEG compression used)

### 4.2 Storage Metadata

```typescript
// Applied via uploadBytes metadata option
{
  contentType: 'image/jpeg',
  customMetadata: {
    stepId: string,       // Capture step ID
    sessionId: string,    // Session ID
    captureMethod: 'camera' | 'library',
    aspectRatio: '1:1' | '9:16',
    capturedAt: string    // ISO timestamp
  }
}
```

---

## 5. Firestore Updates

### 5.1 Session Document Update

When photo is confirmed, update session document:

```typescript
// Path: /projects/{projectId}/sessions/{sessionId}

// Add to capturedMedia array
{
  capturedMedia: arrayUnion({
    stepId: 'capture_step_id',
    assetId: 'generated_asset_id',
    url: 'https://storage.googleapis.com/...',
    createdAt: Date.now()
  })
}
```

### 5.2 Validation Rules

Existing Firestore rules allow session updates by the session creator:
```
match /projects/{projectId}/sessions/{sessionId} {
  allow update: if isAdmin()
             || (isAnyUser() && resource.data.createdBy == request.auth.uid)
}
```

---

## 6. Validation Rules

### 6.1 Step Input Validation

```typescript
// Location: apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts

function validateCapturePhotoStep(
  step: Step,
  capturedMedia: CapturedMedia[]
): ValidationResult {
  const hasMedia = capturedMedia.some(m => m.stepId === step.id)

  return {
    isValid: hasMedia,
    error: hasMedia ? undefined : 'Photo is required to continue'
  }
}
```

### 6.2 File Validation (Library Upload)

```typescript
// Existing validation from useLibraryPicker
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_SIZE = 50 * 1024 * 1024 // 50MB for library uploads
```

---

## 7. Entity Relationships

```
┌─────────────────────┐
│     Experience      │
│  (contains steps)   │
└─────────┬───────────┘
          │ has many
          ▼
┌─────────────────────┐
│    Step (capture)   │
│  config: {...}      │
└─────────┬───────────┘
          │ 1:1 per session
          ▼
┌─────────────────────┐
│   CapturedMedia     │
│  stepId, assetId    │
│  url, createdAt     │
└─────────┬───────────┘
          │ stored in
          ▼
┌─────────────────────┐       ┌─────────────────────┐
│      Session        │◄──────│   Firebase Storage  │
│  capturedMedia[]    │       │   (actual file)     │
└─────────────────────┘       └─────────────────────┘
```

---

## 8. Type Exports

### 8.1 New Exports from `shared/camera`

```typescript
// apps/clementine-app/src/shared/camera/index.ts

// Existing exports
export type { CapturedPhoto, CameraCaptureError, ... }

// New exports
export type {
  PhotoCaptureStatus,
  UsePhotoCaptureOptions,
  UsePhotoCaptureReturn
}

export { usePhotoCapture } from './hooks/usePhotoCapture'
```
