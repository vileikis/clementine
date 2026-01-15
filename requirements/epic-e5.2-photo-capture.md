# Epic E5.2: Photo Capture

> **Epic Series:** Experience System
> **Dependencies:** E5 (Session & Runtime Foundation)
> **Enables:** E7 (Guest Experience Execution), E9 (Transform Pipeline)

---

## 1. Goal

Implement photo capture functionality with camera integration, enabling guests to take photos during experience execution.

**This epic delivers:**

- Camera integration with `shared/camera` module
- Photo capture flow (preview → countdown → capture → confirm/retake)
- Storage upload integration
- Session media persistence
- Camera permissions handling

**This epic does NOT include:**

- Video/GIF capture (Future)
- Real-time filters/overlays (Future)
- Transform processing (E9)

---

## 2. Capture Flow

### 2.1 User Journey

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Camera    │ →  │  Countdown  │ →  │   Preview   │ →  │  Continue   │
│   Preview   │    │  (optional) │    │   Photo     │    │  to Next    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ↑                                     │
       └──────────── Retake ─────────────────┘
```

### 2.2 States

| State | Description |
|-------|-------------|
| `requesting-permission` | Requesting camera access |
| `permission-denied` | User denied camera access |
| `camera-preview` | Live camera feed showing |
| `countdown` | Countdown timer running |
| `capturing` | Photo being captured |
| `photo-preview` | Captured photo shown for review |
| `uploading` | Photo uploading to storage |
| `complete` | Photo saved, ready to continue |
| `error` | Error occurred (camera, upload, etc.) |

---

## 3. CapturePhotoRenderer (Full Implementation)

### 3.1 Component Structure

```typescript
interface CapturePhotoRendererProps {
  mode: 'edit' | 'run'
  step: Step
  config: CapturePhotoConfig

  // Run mode only
  onMedia?: (media: CapturedMedia) => void
  onNext?: () => void
  onBack?: () => void
  canGoBack?: boolean
}

interface CapturePhotoConfig {
  instructions: string | null
  countdown: {
    enabled: boolean
    seconds: number  // 3, 5, 10
  }
  camera: {
    facing: 'user' | 'environment'  // front or back camera
  }
}
```

### 3.2 Run Mode UI

**Camera Preview State**
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
│    "Smile and look at camera"  │
│                                 │
│    [🔄]           [📷 Capture] │
│                                 │
└─────────────────────────────────┘
```

**Countdown State**
```
┌─────────────────────────────────┐
│                                 │
│    ┌─────────────────────┐     │
│    │                     │     │
│    │   [Camera Feed]     │     │
│    │       ┌───┐         │     │
│    │       │ 3 │         │     │
│    │       └───┘         │     │
│    └─────────────────────┘     │
│                                 │
└─────────────────────────────────┘
```

**Photo Preview State**
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
│    [Retake]        [Continue]  │
│                                 │
└─────────────────────────────────┘
```

### 3.3 Edit Mode UI

In edit mode, show configuration options:
- Instructions text input
- Countdown toggle and duration selector
- Default camera facing selector
- Preview placeholder (no live camera in editor)

---

## 4. Integration with shared/camera

### 4.1 Camera Module Usage

Leverage existing `shared/camera` module capabilities:

```typescript
import {
  useCamera,
  CameraPreview,
  requestCameraPermission,
  capturePhoto
} from '@/shared/camera'
```

### 4.2 Required Camera Features

| Feature | Description |
|---------|-------------|
| Permission request | Request camera access with fallback messaging |
| Live preview | Display camera feed in component |
| Photo capture | Capture still image from stream |
| Camera switch | Toggle front/back camera |
| Stream cleanup | Properly release camera on unmount |

### 4.3 Fallback: File Upload

If camera is unavailable or permission denied, offer file upload as fallback:

```
┌─────────────────────────────────┐
│                                 │
│    Camera not available         │
│                                 │
│    [Upload a Photo Instead]     │
│                                 │
└─────────────────────────────────┘
```

---

## 5. Storage Integration

### 5.1 Upload Flow

On capture confirmation:

1. Convert captured image to blob
2. Upload to Firebase Storage via media asset system
3. Create MediaAsset record
4. Store reference in session.capturedMedia
5. Optionally set as session.result (if this is the final capture)

### 5.2 Storage Path

```
/workspaces/{workspaceId}/sessions/{sessionId}/captures/{assetId}.jpg
```

### 5.3 Media Asset Record

```typescript
interface CapturedMedia {
  stepId: string
  assetId: string
  url: string
  createdAt: number
}
```

---

## 6. Error Handling

### 6.1 Camera Errors

| Error | User Message | Recovery |
|-------|--------------|----------|
| Permission denied | "Camera access was denied. Please enable camera in your browser settings." | Show upload fallback |
| No camera found | "No camera detected on this device." | Show upload fallback |
| Camera in use | "Camera is being used by another app." | Retry button |
| Stream error | "Camera error occurred." | Retry button |

### 6.2 Upload Errors

| Error | User Message | Recovery |
|-------|--------------|----------|
| Network error | "Upload failed. Please check your connection." | Retry button |
| Storage error | "Unable to save photo." | Retry button |
| Timeout | "Upload taking too long." | Retry button |

---

## 7. Config Options

### 7.1 CapturePhotoConfig Schema

```typescript
const capturePhotoConfigSchema = z.object({
  instructions: z.string().max(200).nullable(),
  countdown: z.object({
    enabled: z.boolean().default(true),
    seconds: z.number().min(1).max(10).default(3),
  }),
  camera: z.object({
    facing: z.enum(['user', 'environment']).default('user'),
  }),
})
```

### 7.2 Default Config

```typescript
function createDefaultCapturePhotoConfig(): CapturePhotoConfig {
  return {
    instructions: null,
    countdown: {
      enabled: true,
      seconds: 3,
    },
    camera: {
      facing: 'user',
    },
  }
}
```

---

## 8. Implementation Phases

### Phase 1: Camera Integration

- Integrate `shared/camera` module with CapturePhotoRenderer
- Implement camera preview state
- Add camera permission handling
- Implement camera switch (front/back)

### Phase 2: Capture Flow

- Implement countdown timer
- Implement photo capture
- Implement photo preview state
- Add retake functionality

### Phase 3: Storage Upload

- Implement storage upload on confirm
- Create MediaAsset record
- Update session.capturedMedia
- Handle upload progress/errors

### Phase 4: Fallback & Polish

- Implement file upload fallback
- Polish error states and messaging
- Handle edge cases (camera switch during countdown, etc.)
- Test on various devices/browsers

---

## 9. Acceptance Criteria

### Must Have

- [ ] Camera permission requested and handled gracefully
- [ ] Live camera preview displays in capture step
- [ ] Countdown timer works when enabled
- [ ] Photo capture produces image from camera stream
- [ ] Captured photo preview shows for review
- [ ] Retake returns to camera preview
- [ ] Confirm uploads photo to storage
- [ ] Captured media stored in session document
- [ ] Camera switch toggles front/back
- [ ] File upload fallback when camera unavailable

### Nice to Have

- [ ] Retake limit (configurable max retakes)
- [ ] Upload progress indicator
- [ ] Photo quality/compression options
- [ ] Mirror mode toggle for selfie camera

---

## 10. Technical Notes

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
- Use appropriate image dimensions (max 1920x1080)
- Lazy load camera component

### Dependencies

- `shared/camera` - Camera capture functionality
- `integrations/firebase/storage` - Media upload
- Session hooks from E5

---

## 11. Out of Scope

| Item | Epic/Future |
|------|-------------|
| Video capture | Future |
| GIF capture | Future |
| Real-time filters | Future |
| AR overlays | Future |
| Multi-photo capture | Future |
| Transform processing | E9 |
