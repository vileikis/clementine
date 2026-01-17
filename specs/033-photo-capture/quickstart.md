# Quickstart: Photo Capture (E5.2)

**Date**: 2026-01-17

## Overview

This guide provides a quick reference for implementing photo capture functionality. Follow these steps in order.

---

## Prerequisites

- Branch: `052-photo-capture`
- Dependencies: All existing (no new packages needed)
- Environment: HTTPS required for camera API (use local dev server)

---

## Implementation Order

### Phase 1: Create `usePhotoCapture` Hook

**File**: `apps/clementine-app/src/shared/camera/hooks/usePhotoCapture.ts`

```typescript
import { useCallback, useRef, useState } from 'react'
import type { CameraCaptureError, CapturedPhoto } from '../types'
import type { CameraViewRef } from '../components/CameraView'

export type PhotoCaptureStatus =
  | 'idle'
  | 'camera-active'
  | 'photo-preview'
  | 'uploading'
  | 'error'

export interface UsePhotoCaptureOptions {
  cameraRef: React.RefObject<CameraViewRef | null>
  onCapture?: (photo: CapturedPhoto) => void
}

export interface UsePhotoCaptureReturn {
  status: PhotoCaptureStatus
  photo: CapturedPhoto | null
  error: CameraCaptureError | null
  capture: () => Promise<void>
  retake: () => void
  confirm: () => Promise<CapturedPhoto>
  reset: () => void
  setStatus: (status: PhotoCaptureStatus) => void
}

export function usePhotoCapture({
  cameraRef,
  onCapture,
}: UsePhotoCaptureOptions): UsePhotoCaptureReturn {
  const [status, setStatus] = useState<PhotoCaptureStatus>('idle')
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [error, setError] = useState<CameraCaptureError | null>(null)

  const capture = useCallback(async () => {
    if (!cameraRef.current) return

    try {
      const capturedPhoto = await cameraRef.current.takePhoto()
      if (capturedPhoto) {
        setPhoto(capturedPhoto)
        setStatus('photo-preview')
        onCapture?.(capturedPhoto)
      }
    } catch (err) {
      setError({ code: 'CAPTURE_FAILED', message: 'Failed to capture photo' })
      setStatus('error')
    }
  }, [cameraRef, onCapture])

  const retake = useCallback(() => {
    // Revoke old preview URL
    if (photo?.previewUrl) {
      URL.revokeObjectURL(photo.previewUrl)
    }
    setPhoto(null)
    setError(null)
    setStatus('camera-active')
  }, [photo])

  const confirm = useCallback(async (): Promise<CapturedPhoto> => {
    if (!photo) {
      throw new Error('No photo to confirm')
    }
    return photo
  }, [photo])

  const reset = useCallback(() => {
    if (photo?.previewUrl) {
      URL.revokeObjectURL(photo.previewUrl)
    }
    setPhoto(null)
    setError(null)
    setStatus('idle')
  }, [photo])

  return {
    status,
    photo,
    error,
    capture,
    retake,
    confirm,
    reset,
    setStatus,
  }
}
```

### Phase 2: Update Type Exports

**File**: `apps/clementine-app/src/shared/camera/types/camera.types.ts`

Add the new types (already exported from hook file, update index.ts):

**File**: `apps/clementine-app/src/shared/camera/index.ts`

```typescript
// Add to exports
export { usePhotoCapture } from './hooks/usePhotoCapture'
export type {
  PhotoCaptureStatus,
  UsePhotoCaptureOptions,
  UsePhotoCaptureReturn,
} from './hooks/usePhotoCapture'
```

### Phase 3: Update `CapturePhotoRenderer`

**File**: `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx`

Key changes:
1. Import camera hooks and components
2. Handle permission states
3. Implement capture flow UI
4. Add storage upload on confirm
5. Update runtime store with captured media

```typescript
// Pseudocode structure
function CapturePhotoRenderer({ step, mode, onSubmit, onBack, canGoBack }) {
  // Edit mode: return placeholder (existing)
  if (mode === 'edit') {
    return <EditModePlaceholder config={config} />
  }

  // Run mode: camera integration
  const cameraRef = useRef<CameraViewRef>(null)
  const { status: permStatus, requestPermission } = useCameraPermission()
  const { status, photo, capture, retake, confirm, setStatus } = usePhotoCapture({ cameraRef })

  // Handle permission states
  if (permStatus === 'unknown') return <Loading />
  if (permStatus === 'denied' || permStatus === 'unavailable') {
    return <FallbackUpload />
  }
  if (permStatus === 'undetermined') {
    return <PermissionPrompt onRequest={requestPermission} />
  }

  // Handle capture states
  switch (status) {
    case 'camera-active':
      return <CameraActiveUI cameraRef={cameraRef} onCapture={capture} />
    case 'photo-preview':
      return <PhotoReviewUI photo={photo} onRetake={retake} onConfirm={handleConfirm} />
    case 'uploading':
      return <UploadingUI photo={photo} />
    case 'error':
      return <ErrorUI onRetry={retake} />
  }
}
```

### Phase 4: Storage Upload Function

Create upload utility in the renderer or extract to a hook:

```typescript
async function uploadCapturedPhoto({
  photo,
  projectId,
  sessionId,
  stepId,
}: {
  photo: CapturedPhoto
  projectId: string
  sessionId: string
  stepId: string
}): Promise<{ assetId: string; url: string }> {
  const assetId = nanoid()
  const path = `projects/${projectId}/sessions/${sessionId}/inputs/${assetId}.jpg`

  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, photo.file, {
    contentType: 'image/jpeg',
    customMetadata: {
      stepId,
      sessionId,
      captureMethod: photo.method,
      capturedAt: new Date().toISOString(),
    },
  })

  const url = await getDownloadURL(storageRef)
  return { assetId, url }
}
```

### Phase 5: Update Step Validation

**File**: `apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts`

Add capture step validation:

```typescript
// In the switch statement for step type validation
case 'capture.photo': {
  // For capture steps, validation is handled by the renderer
  // The renderer controls canProceed based on having captured media
  return { isValid: true } // Renderer manages this
}
```

---

## Testing Checklist

### Manual Testing

1. **Permission Flow**
   - [ ] Fresh browser: Shows permission prompt
   - [ ] Allow: Shows camera feed
   - [ ] Deny: Shows upload fallback
   - [ ] Block in settings: Shows denied message

2. **Capture Flow**
   - [ ] Take Photo: Captures from camera
   - [ ] Preview: Shows captured image
   - [ ] Retake: Returns to camera
   - [ ] Continue: Uploads and proceeds

3. **Upload Flow**
   - [ ] Photo uploads to Storage
   - [ ] URL is valid and accessible
   - [ ] Session document updated with capturedMedia

4. **Fallback Flow**
   - [ ] Upload Photo button works
   - [ ] File picker opens
   - [ ] Selected photo shows in preview
   - [ ] Can confirm and continue

5. **Edit Mode**
   - [ ] Shows placeholder (no camera)
   - [ ] Displays aspect ratio

### Unit Tests

Add tests to `apps/clementine-app/src/shared/camera/hooks/usePhotoCapture.test.ts`:

```typescript
describe('usePhotoCapture', () => {
  it('starts in idle status')
  it('transitions to photo-preview on capture')
  it('revokes preview URL on retake')
  it('returns photo on confirm')
  it('resets state on reset')
})
```

---

## Common Issues

### Camera not starting
- Ensure HTTPS (use `pnpm dev` which serves over localhost)
- Check browser permissions settings
- Verify no other app using camera

### Upload fails
- Check Firebase Storage rules allow upload path
- Verify authentication state
- Check file size (should be < 5MB after compression)

### Preview URL not displaying
- Blob URL may have been revoked
- Check for errors in console
- Verify CapturedPhoto.previewUrl is set

---

## Files Modified/Created

### New Files
- `apps/clementine-app/src/shared/camera/hooks/usePhotoCapture.ts`
- `apps/clementine-app/src/shared/camera/hooks/usePhotoCapture.test.ts`

### Modified Files
- `apps/clementine-app/src/shared/camera/index.ts` (exports)
- `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx`
- `apps/clementine-app/src/domains/experience/steps/registry/step-validation.ts`

---

## Validation

Before marking complete:

```bash
# Run from apps/clementine-app
pnpm check        # Format + lint
pnpm type-check   # TypeScript
pnpm test         # Unit tests
```

Then manually test camera flow on both desktop and mobile browsers.
