# Epic E5.2: Photo Capture

> **Epic Series:** Experience System
> **Dependencies:** E5 (Session & Runtime Foundation)
> **Enables:** E7 (Guest Experience Execution), E9 (Transform Pipeline)

---

## 1. Goal

Implement photo capture functionality with camera integration, enabling guests to take photos during experience execution.

**This epic delivers:**

- Hook-based camera integration via `shared/camera` module
- Photo capture flow (preview → capture → confirm/retake)
- Themed UI via `CapturePhotoRenderer` using `shared/theming`
- Storage upload integration
- Session media persistence
- Camera permissions handling

**This epic does NOT include:**

- Video/GIF capture (Future - see camera module architecture)
- Countdown timer (Future enhancement)
- Real-time filters/overlays (Future)
- Transform processing (E9)

---

## 2. Architecture

### 2.1 Layered Approach

The photo capture system uses a **hook-based architecture** (Option B) with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: CapturePhotoRenderer (themed UI)                      │
│  ─────────────────────────────────────────────────────────────  │
│  • Uses ThemedButton, ThemedText, StepLayout                    │
│  • Owns all user-facing UI and interactions                     │
│  • Handles step navigation (onSubmit, onBack)                   │
│  • Consumes hooks from Layer 2                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: usePhotoCapture hook (orchestration)                  │
│  ─────────────────────────────────────────────────────────────  │
│  • Photo capture state machine                                  │
│  • Capture, retake, confirm actions                             │
│  • Returns: status, photo, capture(), retake(), confirm()       │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Camera Primitives (shared/camera)                     │
│  ─────────────────────────────────────────────────────────────  │
│  • useCameraPermission - permission state management            │
│  • CameraView - renders video element only                      │
│  • takeSnapshot() - captures frame from stream                  │
│  • No UI chrome, no buttons                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Why This Architecture

- **Theming**: Renderers use `shared/theming` components (ThemedButton, ThemedText) for brand-consistent guest UI
- **Reusability**: Camera primitives are UI-agnostic, usable outside step renderers
- **Testability**: Hooks can be tested in isolation
- **Extensibility**: Future capture modes (GIF, video) add new hooks + renderers, share primitives

---

## 3. Capture Flow

### 3.1 User Journey

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Camera      │ →  │     Photo       │ →  │    Continue     │
│     Preview     │    │     Review      │    │    to Next      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ↓ Retake
                       ┌─────────────────┐
                       │     Camera      │
                       │     Preview     │
                       └─────────────────┘
```

### 3.2 States

| State | Description |
|-------|-------------|
| `idle` | Initial state, camera not started |
| `requesting-permission` | Requesting camera access |
| `permission-denied` | User denied camera access |
| `camera-active` | Live camera feed showing |
| `photo-preview` | Captured photo shown for review |
| `uploading` | Photo uploading to storage |
| `complete` | Photo saved, ready to continue |
| `error` | Error occurred (camera, upload, etc.) |

---

## 4. Config Schema

### 4.1 CapturePhotoStepConfig

The config is intentionally minimal:

```typescript
const capturePhotoStepConfigSchema = z.object({
  /** Aspect ratio for the captured photo */
  aspectRatio: z.enum(['1:1', '9:16']).default('1:1'),
})

type CapturePhotoStepConfig = z.infer<typeof capturePhotoStepConfigSchema>
```

### 4.2 Default Config

```typescript
function createDefaultCapturePhotoConfig(): CapturePhotoStepConfig {
  return {
    aspectRatio: '1:1',
  }
}
```

**Note**: Additional config options (countdown, camera facing, instructions) may be added in future iterations.

---

## 5. CapturePhotoRenderer

### 5.1 Component Structure

```typescript
interface CapturePhotoRendererProps extends StepRendererProps {
  // Inherited from StepRendererProps:
  // step: Step
  // mode: 'edit' | 'run'
  // onSubmit?: () => void
  // onBack?: () => void
  // canGoBack?: boolean
  // canProceed?: boolean
}
```

### 5.2 Implementation Pattern

```typescript
function CapturePhotoRenderer({ step, mode, onSubmit, onBack, canGoBack }: StepRendererProps) {
  const config = step.config as CapturePhotoStepConfig
  const cameraRef = useRef<CameraViewRef>(null)

  // Layer 1: Camera permission
  const { status: permStatus, requestPermission } = useCameraPermission()

  // Layer 2: Photo capture orchestration
  const {
    status,
    photo,
    capture,
    retake,
    confirm
  } = usePhotoCapture({ cameraRef })

  // Edit mode: show placeholder
  if (mode === 'edit') {
    return (
      <StepLayout>
        <div className="aspect-square bg-muted flex items-center justify-center">
          <ThemedText variant="muted">Camera preview</ThemedText>
        </div>
      </StepLayout>
    )
  }

  // Run mode: permission denied
  if (permStatus === 'denied') {
    return (
      <StepLayout>
        <ThemedText>Camera access is required</ThemedText>
        <ThemedButton onClick={requestPermission}>Allow Camera</ThemedButton>
        {/* Or show file upload fallback */}
      </StepLayout>
    )
  }

  // Run mode: camera active
  if (status === 'camera-active') {
    return (
      <StepLayout onBack={onBack} canGoBack={canGoBack}>
        <CameraView
          ref={cameraRef}
          aspectRatio={config.aspectRatio}
        />
        <ThemedButton onClick={capture}>Take Photo</ThemedButton>
      </StepLayout>
    )
  }

  // Run mode: photo review
  if (status === 'photo-preview' && photo) {
    return (
      <StepLayout>
        <img src={photo.previewUrl} alt="Captured photo" />
        <div className="flex gap-4">
          <ThemedButton variant="outline" onClick={retake}>Retake</ThemedButton>
          <ThemedButton onClick={() => confirm().then(onSubmit)}>Continue</ThemedButton>
        </div>
      </StepLayout>
    )
  }

  // ... uploading, error states
}
```

### 5.3 Run Mode UI

**Camera Active State**
```
┌─────────────────────────────────┐
│                                 │
│    ┌─────────────────────┐     │
│    │                     │     │
│    │   [Camera Feed]     │     │
│    │                     │     │
│    │                     │     │
│    └─────────────────────┘     │
│                                 │
│         [Take Photo]            │  ← ThemedButton
│                                 │
└─────────────────────────────────┘
```

**Photo Review State**
```
┌─────────────────────────────────┐
│                                 │
│    ┌─────────────────────┐     │
│    │                     │     │
│    │  [Captured Photo]   │     │
│    │                     │     │
│    │                     │     │
│    └─────────────────────┘     │
│                                 │
│    [Retake]        [Continue]  │  ← ThemedButtons
│                                 │
└─────────────────────────────────┘
```

### 5.4 Edit Mode UI

In edit mode, show a placeholder with configuration:

```
┌─────────────────────────────────┐
│                                 │
│    ┌─────────────────────┐     │
│    │                     │     │
│    │  [Camera Placeholder]│     │
│    │                     │     │
│    └─────────────────────┘     │
│                                 │
│    Aspect Ratio: [1:1 ▼]       │
│                                 │
└─────────────────────────────────┘
```

---

## 6. Camera Module Hooks

### 6.1 useCameraPermission

Manages camera permission state:

```typescript
interface UseCameraPermissionReturn {
  status: 'unknown' | 'undetermined' | 'granted' | 'denied' | 'unavailable'
  requestPermission: () => Promise<void>
  error: CameraCaptureError | null
}

const { status, requestPermission, error } = useCameraPermission()
```

### 6.2 usePhotoCapture

Orchestrates the photo capture flow:

```typescript
interface UsePhotoCaptureOptions {
  cameraRef: RefObject<CameraViewRef>
  onCapture?: (photo: CapturedPhoto) => void
}

interface UsePhotoCaptureReturn {
  status: 'idle' | 'camera-active' | 'photo-preview' | 'uploading' | 'error'
  photo: CapturedPhoto | null
  error: CameraCaptureError | null
  capture: () => Promise<void>
  retake: () => void
  confirm: () => Promise<void>
}

const { status, photo, capture, retake, confirm } = usePhotoCapture({ cameraRef })
```

### 6.3 CameraView Component

Renders only the video element:

```typescript
interface CameraViewProps {
  facing?: 'user' | 'environment'
  aspectRatio?: '1:1' | '9:16'
  onReady?: () => void
  onError?: (error: CameraCaptureError) => void
}

interface CameraViewRef {
  takePhoto: () => Promise<CapturedPhoto | null>
  switchCamera: () => Promise<void>
  hasMultipleCameras: boolean
}

<CameraView
  ref={cameraRef}
  aspectRatio="1:1"
  onReady={handleReady}
  onError={handleError}
/>
```

---

## 7. Storage Integration

### 7.1 Upload Flow

On capture confirmation:

1. Convert captured image to blob
2. Upload to Firebase Storage via media asset system
3. Create MediaAsset record
4. Store reference in session.capturedMedia
5. Call onSubmit to proceed to next step

### 7.2 Storage Path

```
/workspaces/{workspaceId}/sessions/{sessionId}/captures/{assetId}.jpg
```

### 7.3 CapturedPhoto Type

```typescript
interface CapturedPhoto {
  /** Blob for upload */
  file: File
  /** Local preview URL (blob URL) */
  previewUrl: string
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
}
```

### 7.4 Session Media Reference

```typescript
interface CapturedMedia {
  stepId: string
  assetId: string
  url: string
  createdAt: number
}
```

---

## 8. Error Handling

### 8.1 Camera Errors

| Error | User Message | Recovery |
|-------|--------------|----------|
| Permission denied | "Camera access was denied. Please enable camera in your browser settings." | Show upload fallback |
| No camera found | "No camera detected on this device." | Show upload fallback |
| Camera in use | "Camera is being used by another app." | Retry button |
| Stream error | "Camera error occurred." | Retry button |

### 8.2 Upload Errors

| Error | User Message | Recovery |
|-------|--------------|----------|
| Network error | "Upload failed. Please check your connection." | Retry button |
| Storage error | "Unable to save photo." | Retry button |
| Timeout | "Upload taking too long." | Retry button |

### 8.3 Fallback: File Upload

If camera is unavailable or permission denied, offer file upload as fallback:

```
┌─────────────────────────────────┐
│                                 │
│    Camera not available         │
│                                 │
│    [Upload a Photo Instead]     │  ← ThemedButton
│                                 │
└─────────────────────────────────┘
```

---

## 9. Implementation Phases

### Phase 1: Camera Hook Refactoring

- Extract `usePhotoCapture` hook from existing `CameraCapture` component
- Ensure `CameraView` is a pure video element component
- Verify `useCameraPermission` works standalone

### Phase 2: CapturePhotoRenderer

- Create `CapturePhotoRenderer` using hooks + themed components
- Implement edit mode (placeholder + config)
- Implement run mode (camera active, photo review states)
- Integrate with `StepLayout` for navigation

### Phase 3: Storage Upload

- Implement storage upload on confirm
- Create MediaAsset record
- Update session.capturedMedia via runtime
- Handle upload progress/errors

### Phase 4: Polish & Fallback

- Implement file upload fallback
- Polish error states with themed UI
- Handle edge cases (unmount during upload, etc.)
- Test on various devices/browsers

---

## 10. Acceptance Criteria

### Must Have

- [ ] Camera permission requested and handled gracefully
- [ ] Live camera preview displays in capture step
- [ ] Photo capture produces image from camera stream
- [ ] Captured photo preview shows for review
- [ ] Retake returns to camera preview
- [ ] Confirm uploads photo to storage
- [ ] Captured media stored in session document
- [ ] All UI uses themed components (ThemedButton, ThemedText)
- [ ] File upload fallback when camera unavailable
- [ ] Edit mode shows placeholder with aspect ratio config

### Nice to Have

- [ ] Camera switch (front/back) button
- [ ] Upload progress indicator
- [ ] Photo compression before upload

---

## 11. Technical Notes

### Browser Support

| Browser | Camera API Support |
|---------|-------------------|
| Chrome (desktop) | Full support |
| Chrome (mobile) | Full support |
| Safari (desktop) | Full support |
| Safari (iOS) | Full support (HTTPS required) |
| Firefox | Full support |

**Note**: Camera API requires HTTPS in production.

### Performance Considerations

- Release camera stream when not in use
- Compress images before upload (target: < 1MB)
- Use appropriate image dimensions based on aspect ratio
- Clean up blob URLs after upload

### Dependencies

- `shared/camera` - Camera hooks and CameraView component
- `shared/theming` - ThemedButton, ThemedText for branded UI
- `integrations/firebase/storage` - Media upload
- Session hooks from E5

---

## 12. Out of Scope

| Item | Notes |
|------|-------|
| Video capture | Future - will use `useVideoCapture` hook |
| GIF capture | Future - will use `useGifCapture` hook |
| Countdown timer | Future enhancement to hooks |
| Real-time filters | Future |
| AR overlays | Future |
| Multi-photo capture | Future |
| Transform processing | E9 |

### Future Capture Modes Architecture

The hook-based architecture supports future capture modes:

```
shared/camera/hooks/
├── useCameraPermission.ts   # Shared across all modes
├── usePhotoCapture.ts       # Single image capture
├── useGifCapture.ts         # Future: burst of 4 frames
└── useVideoCapture.ts       # Future: video recording

domains/experience/steps/renderers/
├── CapturePhotoRenderer.tsx # This epic
├── CaptureGifRenderer.tsx   # Future
└── CaptureVideoRenderer.tsx # Future
```

Each mode will have:
- Dedicated hook with mode-specific state machine
- Dedicated renderer with mode-specific UI
- Shared camera primitives (CameraView, permission handling)

See `shared/camera/README.md` for camera module architecture details.
