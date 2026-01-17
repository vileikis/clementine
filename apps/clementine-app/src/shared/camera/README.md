# Camera Module

Provides camera capture functionality for the Clementine application. Designed with a layered architecture to support multiple capture modes (photo, GIF, video) while maintaining reusability and testability.

## Architecture

### Layered Design

The camera module follows a three-layer architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: Consumers (Step Renderers, Dev Tools)                 │
│  ─────────────────────────────────────────────────────────────  │
│  • CapturePhotoRenderer, CaptureGifRenderer, CaptureVideoRenderer
│  • Owns all user-facing UI                                      │
│  • Uses themed components from shared/theming                   │
│  • Consumes hooks from Layer 2                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: Capture Hooks (mode-specific orchestration)           │
│  ─────────────────────────────────────────────────────────────  │
│  • usePhotoCapture - single image capture                       │
│  • useGifCapture - burst capture (future)                       │
│  • useVideoCapture - video recording (future)                   │
│  • Mode-specific state machines                                 │
│  • Returns status, actions, captured media                      │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Camera Primitives (UI-agnostic)                       │
│  ─────────────────────────────────────────────────────────────  │
│  • useCameraPermission - permission state                       │
│  • CameraView - video element only                              │
│  • takeSnapshot() - capture frame                               │
│  • Stream management utilities                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

- **Theming Flexibility**: Layer 3 consumers can use any UI system (themed components, custom styles)
- **Reusability**: Camera primitives work anywhere, not tied to specific UI
- **Testability**: Each layer can be tested in isolation
- **Extensibility**: New capture modes add hooks + consumers, share primitives

## Module Structure

```
shared/camera/
├── components/
│   ├── CameraView.tsx          # Pure video element component
│   ├── CameraControls.tsx      # Generic camera controls (internal)
│   ├── PhotoReview.tsx         # Photo review UI (internal)
│   ├── PermissionPrompt.tsx    # Permission request UI (internal)
│   ├── ErrorState.tsx          # Error display (internal)
│   └── LibraryPicker.tsx       # File picker fallback (internal)
├── containers/
│   └── CameraCapture.tsx       # Full camera flow (legacy, for dev tools)
├── hooks/
│   ├── useCameraPermission.ts  # Permission state management
│   ├── useLibraryPicker.ts     # File input management
│   └── usePhotoCapture.ts      # Photo capture orchestration (TODO)
├── lib/
│   ├── cameraReducer.ts        # State machine for camera UI
│   ├── capture.ts              # Capture utilities
│   ├── image-utils.ts          # Image processing
│   ├── errors.ts               # Error types and helpers
│   └── utils.ts                # General utilities
├── schemas/
│   └── camera.schemas.ts       # Zod schemas
├── types/
│   └── camera.types.ts         # TypeScript types
├── constants.ts                # Default labels, config
└── index.ts                    # Public API
```

## Current API

### CameraCapture (Container Component)

Full camera capture flow with built-in UI. Used by dev tools and non-themed contexts.

```typescript
import { CameraCapture } from '@/shared/camera'

<CameraCapture
  onSubmit={(photo) => handlePhoto(photo)}
  aspectRatio="1:1"
  cameraFacing="both"
  enableLibrary={true}
/>
```

**Note**: This component has built-in UI that doesn't use themed components. For guest-facing UI that requires branding, use the hook-based approach instead.

### useCameraPermission (Hook)

Manages camera permission state:

```typescript
import { useCameraPermission } from '@/shared/camera/hooks'

const { status, requestPermission, error } = useCameraPermission()

// status: 'unknown' | 'undetermined' | 'granted' | 'denied' | 'unavailable'
```

### CameraView (Component)

Pure video element for camera preview:

```typescript
import { CameraView } from '@/shared/camera/components'

const cameraRef = useRef<CameraViewRef>(null)

<CameraView
  ref={cameraRef}
  facing="user"
  aspectRatio="1:1"
  onReady={() => console.log('Camera ready')}
  onError={(error) => console.error(error)}
/>

// Take photo via ref
const photo = await cameraRef.current?.takePhoto()
```

## Types

```typescript
interface CapturedPhoto {
  file: File           // Blob for upload
  previewUrl: string   // Local blob URL for preview
  width: number        // Image width in pixels
  height: number       // Image height in pixels
}

interface CameraCaptureError {
  code: CameraCaptureErrorCode
  message: string
}

type CameraCaptureErrorCode =
  | 'PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'CAPTURE_FAILED'
  | 'STREAM_ERROR'

type AspectRatio = '1:1' | '9:16' | '3:4' | '4:3' | '16:9'
type CameraFacing = 'user' | 'environment'
type CameraFacingConfig = CameraFacing | 'both'
```

## Integration with Step Renderers

For guest-facing experiences, step renderers should use hooks + themed components:

```typescript
// domains/experience/steps/renderers/CapturePhotoRenderer.tsx

import { useCameraPermission } from '@/shared/camera/hooks'
import { CameraView } from '@/shared/camera/components'
import { ThemedButton, ThemedText } from '@/shared/theming'

function CapturePhotoRenderer({ step, mode, onSubmit }) {
  const cameraRef = useRef<CameraViewRef>(null)
  const { status: permStatus } = useCameraPermission()

  // Build themed UI using camera primitives
  return (
    <StepLayout>
      <CameraView ref={cameraRef} aspectRatio={config.aspectRatio} />
      <ThemedButton onClick={() => cameraRef.current?.takePhoto()}>
        Take Photo
      </ThemedButton>
    </StepLayout>
  )
}
```

---

## Future: Multiple Capture Modes

The architecture is designed to support additional capture modes:

### Photo Capture (Current)

Single image capture with review.

```typescript
// hooks/usePhotoCapture.ts (to be extracted)
const {
  status,     // 'idle' | 'camera-active' | 'photo-preview' | 'uploading' | 'error'
  photo,      // CapturedPhoto | null
  capture,    // () => Promise<void>
  retake,     // () => void
  confirm,    // () => Promise<void>
} = usePhotoCapture({ cameraRef })
```

### GIF Capture (Future)

Burst capture of multiple frames assembled into a GIF.

```typescript
// hooks/useGifCapture.ts (future)
const {
  status,        // 'idle' | 'countdown' | 'capturing' | 'preview' | 'uploading' | 'error'
  frames,        // CapturedFrame[] (0-4 during capture)
  currentFrame,  // number (0-3 during capture)
  gif,           // CapturedMedia | null (assembled GIF)
  progress,      // number (0-100 for capture progress)
  capture,       // () => Promise<void> - starts burst sequence
  retake,        // () => void
  confirm,       // () => Promise<void>
} = useGifCapture({
  cameraRef,
  frameCount: 4,
  frameInterval: 500, // ms between frames
  countdown: { enabled: true, seconds: 3 }
})
```

**GIF capture flow:**
1. User taps capture
2. Optional countdown (3, 2, 1...)
3. Capture 4 frames with interval (e.g., 500ms apart)
4. Show animated preview
5. Confirm/retake

### Video Capture (Future)

Video recording with duration limit.

```typescript
// hooks/useVideoCapture.ts (future)
const {
  status,          // 'idle' | 'countdown' | 'recording' | 'preview' | 'uploading' | 'error'
  video,           // CapturedVideo | null
  duration,        // number (current recording duration in seconds)
  maxDuration,     // number (auto-stop limit)
  isRecording,     // boolean
  startRecording,  // () => void
  stopRecording,   // () => void
  retake,          // () => void
  confirm,         // () => Promise<void>
} = useVideoCapture({
  cameraRef,
  maxDuration: 15, // seconds, auto-stop
  countdown: { enabled: false }
})
```

**Video capture flow:**
1. User taps record
2. Recording starts, duration timer shows
3. User taps stop OR auto-stop at maxDuration
4. Show video preview with playback
5. Confirm/retake

### Countdown Timer (Future Enhancement)

Shared countdown logic for all modes:

```typescript
// hooks/useCountdown.ts (future)
const {
  isActive,
  secondsRemaining,
  start,
  cancel,
} = useCountdown({
  seconds: 3,
  onComplete: () => capture(),
})
```

### Future Step Types

```typescript
// Step type configuration
type CaptureStepType = 'capture.photo' | 'capture.gif' | 'capture.video'

// Each mode has its own config schema
const capturePhotoConfigSchema = z.object({
  aspectRatio: z.enum(['1:1', '9:16']).default('1:1'),
})

const captureGifConfigSchema = z.object({
  aspectRatio: z.enum(['1:1', '9:16']).default('1:1'),
  frameCount: z.number().min(2).max(8).default(4),
  frameInterval: z.number().min(200).max(1000).default(500),
})

const captureVideoConfigSchema = z.object({
  aspectRatio: z.enum(['1:1', '9:16']).default('9:16'),
  maxDuration: z.number().min(5).max(60).default(15),
})
```

### Future Directory Structure

```
shared/camera/
├── hooks/
│   ├── useCameraPermission.ts   # Shared
│   ├── usePhotoCapture.ts       # Photo mode
│   ├── useGifCapture.ts         # GIF mode (future)
│   ├── useVideoCapture.ts       # Video mode (future)
│   ├── useCountdown.ts          # Shared countdown (future)
│   └── index.ts
├── lib/
│   ├── gif-encoder.ts           # GIF assembly (future)
│   └── video-utils.ts           # Video processing (future)
└── ...

domains/experience/steps/
├── renderers/
│   ├── CapturePhotoRenderer.tsx   # Photo UI
│   ├── CaptureGifRenderer.tsx     # GIF UI (future)
│   └── CaptureVideoRenderer.tsx   # Video UI (future)
└── schemas/
    ├── capture-photo.schema.ts
    ├── capture-gif.schema.ts      # (future)
    └── capture-video.schema.ts    # (future)
```

---

## Browser Support

| Browser | Camera API | MediaRecorder (Video) |
|---------|------------|----------------------|
| Chrome (desktop) | Full | Full |
| Chrome (mobile) | Full | Full |
| Safari (desktop) | Full | Full (14.1+) |
| Safari (iOS) | Full | Full (14.5+) |
| Firefox | Full | Full |

**Note**: Camera API requires HTTPS in production.

## Performance Considerations

- Release camera stream when component unmounts
- Compress images before upload (target: < 1MB)
- Clean up blob URLs after use to prevent memory leaks
- Use appropriate resolution based on aspect ratio
- Lazy load camera components when possible

## Testing

The module includes comprehensive tests:

```bash
# Run camera module tests
pnpm test src/shared/camera
```

Key test files:
- `hooks/useCameraPermission.test.ts`
- `hooks/useLibraryPicker.test.ts`
- `components/CameraView.test.tsx`
- `components/CameraControls.test.tsx`
- `lib/capture.test.ts`
