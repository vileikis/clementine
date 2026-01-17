# Research: Photo Capture (E5.2)

**Date**: 2026-01-17 | **Status**: Complete

## Research Summary

This document captures research findings and decisions for implementing photo capture functionality in the guest experience.

---

## 1. Camera Hook Architecture

### Decision: Create `usePhotoCapture` orchestration hook

**Rationale**: The epic specifies a hook-based architecture (Option B) with clear separation:
- Layer 1: Camera primitives (`useCameraPermission`, `CameraView`)
- Layer 2: Capture orchestration (`usePhotoCapture`)
- Layer 3: Themed renderer (`CapturePhotoRenderer`)

**Alternatives Considered**:
- **Stateful container component**: Rejected because hooks enable better testing and reuse
- **Inline state in renderer**: Rejected because it couples UI to capture logic

**Implementation**:
```typescript
interface UsePhotoCaptureOptions {
  cameraRef: RefObject<CameraViewRef>
  onCapture?: (photo: CapturedPhoto) => void
}

interface UsePhotoCaptureReturn {
  status: PhotoCaptureStatus
  photo: CapturedPhoto | null
  error: CameraCaptureError | null
  capture: () => Promise<void>
  retake: () => void
  confirm: () => Promise<void>
}

type PhotoCaptureStatus = 'idle' | 'camera-active' | 'photo-preview' | 'uploading' | 'error'
```

---

## 2. Storage Upload Integration

### Decision: Direct client SDK upload with session media persistence

**Rationale**:
- Existing `useUploadMediaAsset` pattern uses Firebase Storage client SDK directly
- Session schema already has `capturedMedia` array for storing capture references
- Runtime store has `setCapturedMedia` action for immediate state updates

**Alternatives Considered**:
- **Server function upload**: Rejected - adds latency, not needed for guest uploads
- **Separate asset collection**: Rejected - session owns captured media lifecycle

**Storage Path Pattern**:
```
/projects/{projectId}/sessions/{sessionId}/inputs/{assetId}.jpg
```

Note: This differs from workspace media assets (`/workspaces/{wsId}/media/`) because captured photos are session-scoped, not workspace assets.

**Upload Flow**:
1. Capture photo via `CameraView.takePhoto()`
2. Show preview for review (previewUrl from blob)
3. On confirm: Upload to Storage with session path
4. Create CapturedMedia entry: `{ stepId, assetId, url, createdAt }`
5. Update runtime store via `setCapturedMedia`
6. Call `onSubmit` to proceed to next step

---

## 3. Permission Handling Patterns

### Decision: Use existing `useCameraPermission` hook with fallback UI

**Rationale**: The existing hook follows Expo pattern and handles:
- Permission states: `unknown`, `undetermined`, `granted`, `denied`, `unavailable`
- Browser compatibility (Permissions API fallback)
- Stream cleanup after permission check

**Implementation in Renderer**:
```tsx
const { status: permStatus, requestPermission } = useCameraPermission()

// Initial check
if (permStatus === 'unknown') return <Loading />

// Not granted - show prompt or denied message
if (permStatus !== 'granted') {
  return permStatus === 'denied'
    ? <PermissionDeniedUI onFallback={showFilePicker} />
    : <PermissionPromptUI onRequest={requestPermission} />
}

// Permission granted - show camera
return <CameraView ... />
```

---

## 4. Aspect Ratio Handling

### Decision: Map step config aspect ratio to camera module's AspectRatio type

**Rationale**:
- Step config uses `'1:1' | '9:16'` (from capture-photo.schema.ts)
- Camera module uses `'3:4' | '1:1' | '9:16'` (from camera.types.ts)
- Direct mapping works for the supported ratios

**Mapping**:
```typescript
// Step config → Camera module (identity mapping for supported values)
const cameraAspectRatio: AspectRatio = config.aspectRatio // '1:1' or '9:16'
```

Note: The `3:4` ratio is not used for photo capture steps currently.

---

## 5. File Upload Fallback

### Decision: Use existing `useLibraryPicker` hook when camera unavailable

**Rationale**:
- Existing hook handles file validation (type, size)
- Returns same `CapturedPhoto` interface
- Spec requires fallback for camera-denied or unavailable scenarios

**Trigger Conditions**:
1. `permStatus === 'denied'` - User blocked camera
2. `permStatus === 'unavailable'` - No camera hardware
3. User clicks "Upload Photo" option

**UI Pattern**:
```
┌─────────────────────────────────────┐
│    Camera not available             │
│                                     │
│    [Upload a Photo Instead]         │
└─────────────────────────────────────┘
```

---

## 6. Edit Mode vs Run Mode Behavior

### Decision: Maintain existing placeholder pattern for edit mode

**Rationale**:
- Edit mode shows preview-only UI in experience designer
- Current placeholder (camera icon + aspect ratio indicator) is appropriate
- Full camera functionality only needed in run mode

**Edit Mode UI** (unchanged):
```
┌─────────────────────────────────────┐
│    ┌─────────────────────┐          │
│    │      📷 Camera      │          │
│    └─────────────────────┘          │
│    Aspect Ratio: 1:1                │
└─────────────────────────────────────┘
```

---

## 7. Step Validation for Capture Steps

### Decision: Capture steps require media to proceed

**Rationale**:
- Step validation (`step-validation.ts`) determines `canProceed`
- For capture steps, validation should check if media was captured
- Use `capturedMedia` from runtime store to validate

**Validation Logic**:
```typescript
case 'capture.photo':
  // Valid if media captured for this step
  return {
    isValid: capturedMedia?.some(m => m.stepId === step.id) ?? false,
    error: capturedMedia?.some(m => m.stepId === step.id) ? undefined : 'Photo required'
  }
```

---

## 8. Error Handling Patterns

### Decision: Use themed error states with retry and fallback options

**Rationale**:
- Match existing camera module error patterns
- Provide actionable recovery options
- Use ThemedText/ThemedButton for consistent styling

**Error States**:

| Error | Message | Actions |
|-------|---------|---------|
| Permission denied | "Camera access was denied" | [Upload Photo] |
| No camera | "No camera detected" | [Upload Photo] |
| Camera in use | "Camera is in use" | [Retry] |
| Stream error | "Camera error" | [Retry] [Upload Photo] |
| Upload failed | "Upload failed" | [Retry] |

---

## 9. Memory Management

### Decision: Clean up blob URLs and camera stream on unmount

**Rationale**:
- `CameraView` already handles stream cleanup on unmount
- Captured photo previewUrl (blob URL) must be revoked after upload
- Prevent memory leaks during repeated capture/retake cycles

**Cleanup Points**:
1. `CameraView` unmount → stream stopped (existing)
2. After successful upload → revoke previewUrl
3. On retake → revoke current previewUrl before new capture
4. Component unmount → revoke any pending previewUrl

---

## 10. Session Context Requirements

### Decision: Require session context for uploads, allow local-only for dev tools

**Rationale**:
- Spec mentions optional upload scenario for dev tools
- Runtime provides session context via store
- Renderer should gracefully handle missing context

**Context Check**:
```typescript
const { sessionId, projectId } = useExperienceRuntimeStore()

// If no session context, skip upload (dev tools scenario)
const confirm = async () => {
  if (sessionId && projectId) {
    await uploadToStorage(...)
  }
  // Always call onSubmit regardless
  onSubmit?.()
}
```

---

## Dependencies Summary

| Dependency | Purpose | Status |
|------------|---------|--------|
| `useCameraPermission` | Permission state | Existing |
| `CameraView` | Video element + capture | Existing |
| `useLibraryPicker` | File fallback | Existing |
| `Firebase Storage SDK` | Photo upload | Existing |
| `useExperienceRuntimeStore` | Session state | Existing |
| `ThemedButton/ThemedText` | Themed UI | Existing |
| `StepLayout` | Renderer layout | Existing |

---

## Open Items

None - all unknowns resolved.
