# Research: Camera Module

**Feature**: 022-camera-module
**Date**: 2025-12-08

## Research Summary

This document consolidates research findings for the Camera Module feature, resolving technical decisions and documenting best practices for implementation.

## 1. Existing Camera Implementation Analysis

### Current State

The existing camera implementation in `web/src/features/guest/` is tightly coupled to the guest flow:

**Current Files:**
- `hooks/useCamera.ts` - MediaDevices API hook
- `lib/capture.ts` - Canvas capture utility
- `components/GuestCaptureStep.tsx` - Integrated capture + upload
- `components/CameraView.tsx` - Live preview component

**Current Patterns:**
- Uses `navigator.mediaDevices.getUserMedia` with front-facing camera (facingMode: "user")
- Resolution: 1280x720 ideal
- Canvas capture to JPEG Blob (0.9 quality)
- Mirrors front camera feed (scaleX(-1))
- File upload fallback via hidden `<input type="file" capture="environment">`

### Decision: Extract and Enhance

**Decision**: Create a new `features/camera/` module by extracting and enhancing existing logic rather than rewriting from scratch.

**Rationale**:
- Existing code proves the MediaDevices API works correctly
- Canvas capture pattern is efficient and well-tested
- Enhancements needed: back camera support, state machine, configurable options, better error handling

**Alternatives Considered**:
1. ~~Keep existing implementation~~ - Rejected: tightly coupled, not reusable
2. ~~Use third-party library (react-webcam)~~ - Rejected: adds dependency, less control, existing native API works well

## 2. MediaDevices API Best Practices

### Permission Flow

**iOS Safari Considerations:**
- Permission prompt appears only ONCE per session
- Must show pre-permission explanation before calling `getUserMedia`
- `NotAllowedError` = user denied or previously blocked
- Requires HTTPS (camera access blocked on HTTP)

**Android Chrome Considerations:**
- More lenient permission re-prompting
- Can check `navigator.permissions.query({ name: 'camera' })` for state
- Handles multiple cameras better than iOS

### Decision: User-Initiated Permission

**Decision**: Request permission only when user taps "Allow Camera" button, not on component mount.

**Rationale**:
- Improves permission grant rate (user understands context)
- Respects iOS Safari single-prompt behavior
- Follows best UX practices for sensitive permissions

**Implementation Pattern:**
```typescript
const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('prompt');

const requestPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: constraints });
    setPermissionState('granted');
    return stream;
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      setPermissionState('denied');
    } else if (error.name === 'NotFoundError') {
      setPermissionState('unavailable');
    }
    throw error;
  }
};
```

## 3. Camera Switching (Front/Back)

### MediaDevices Constraints

**facingMode Options:**
- `"user"` - Front-facing camera (selfie)
- `"environment"` - Back-facing camera (document scan)
- `{ exact: "user" }` - Fail if not available
- `{ ideal: "user" }` - Prefer but fallback

### Decision: Configurable with Runtime Detection

**Decision**: Support `cameraFacing: "user" | "environment" | "both"` prop with runtime detection of available cameras.

**Rationale**:
- "both" enables flip button when multiple cameras available
- "user" or "environment" hides flip button (single camera mode)
- Runtime detection prevents UI confusion on single-camera devices

**Implementation:**
```typescript
// Check for multiple cameras
const devices = await navigator.mediaDevices.enumerateDevices();
const videoInputs = devices.filter(d => d.kind === 'videoinput');
const hasMultipleCameras = videoInputs.length > 1;

// Switch camera by toggling facingMode
const switchCamera = () => {
  const newFacing = currentFacing === 'user' ? 'environment' : 'user';
  // Stop current stream, restart with new constraints
};
```

## 4. Photo Capture Strategy

### Canvas Capture Method

**Current Implementation:**
```typescript
export async function capturePhoto(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to capture')),
      'image/jpeg',
      0.9
    );
  });
}
```

### Decision: Enhanced Canvas Capture with Metadata

**Decision**: Keep canvas capture method, enhance with dimension metadata and File creation.

**Rationale**:
- Canvas method is fast and reliable
- No need for complex image processing libraries
- Adding metadata (width, height) enables consumers to make layout decisions

**Enhancement:**
```typescript
interface CapturedPhoto {
  previewUrl: string;  // URL.createObjectURL(file)
  file: File;          // For upload
  method: 'camera' | 'library';
  width: number;
  height: number;
}

async function capturePhoto(video: HTMLVideoElement): Promise<CapturedPhoto> {
  const blob = await canvasCapture(video);
  const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
  return {
    previewUrl: URL.createObjectURL(file),
    file,
    method: 'camera',
    width: video.videoWidth,
    height: video.videoHeight,
  };
}
```

## 5. Aspect Ratio Implementation

### Options Analysis

**Approach 1: CSS Crop Guide Overlay**
- Show aspect ratio guide overlay on viewfinder
- Capture full frame, let consumer crop if needed
- Pros: Simple, no image processing
- Cons: Consumer must handle cropping

**Approach 2: Canvas Crop on Capture**
- Crop image to aspect ratio during capture
- Pros: Delivered image matches guide exactly
- Cons: More complex, potential quality loss

### Decision: CSS Overlay with Optional Canvas Crop

**Decision**: Start with CSS overlay guide (simpler), document future enhancement for canvas crop.

**Rationale**:
- Keeps initial implementation simple (YAGNI)
- Most use cases (AI transform) don't require exact aspect ratio
- Can add canvas cropping in future iteration if needed

**Implementation:**
```css
.aspect-guide {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.aspect-guide-inner {
  aspect-ratio: 3 / 4; /* or 1 / 1 or 9 / 16 */
  max-width: 100%;
  max-height: 100%;
  border: 2px dashed rgba(255, 255, 255, 0.5);
}
```

## 6. Error Handling Strategy

### Error Code Taxonomy

Based on MediaDevices API errors and UX requirements:

```typescript
type CameraCaptureErrorCode =
  | 'PERMISSION_DENIED'      // NotAllowedError - user denied
  | 'PERMISSION_DISMISSED'   // User closed prompt without choosing
  | 'CAMERA_UNAVAILABLE'     // NotFoundError - no camera
  | 'CAMERA_IN_USE'          // NotReadableError - camera busy
  | 'CAPTURE_FAILED'         // Canvas/blob creation failed
  | 'INVALID_FILE_TYPE'      // Library selection - wrong type
  | 'UNKNOWN';               // Unexpected errors
```

### Decision: Typed Error Codes with User-Friendly Messages

**Decision**: Use discriminated union error codes with separate user-facing messages.

**Rationale**:
- Typed codes enable exhaustive switch handling
- Separate messages allow i18n/customization
- Consumer can react differently to each error type

## 7. State Machine Design

### Flow States

```
PERMISSION_PROMPT → CAMERA_ACTIVE → PHOTO_REVIEW → [onSubmit]
       ↓                  ↓              ↓
  [DENIED/ERROR]    [CAPTURE_FAILED]  [RETAKE] → CAMERA_ACTIVE
```

### Decision: useReducer State Machine

**Decision**: Implement state machine using `useReducer` for predictable state transitions.

**Rationale**:
- Explicit state transitions prevent impossible states
- Easier to test than useState combinations
- Self-documenting flow logic

**Implementation Sketch:**
```typescript
type CameraState =
  | { status: 'permission-prompt' }
  | { status: 'camera-active'; stream: MediaStream; facing: 'user' | 'environment' }
  | { status: 'photo-review'; photo: CapturedPhoto }
  | { status: 'error'; error: CameraCaptureError };

type CameraAction =
  | { type: 'PERMISSION_GRANTED'; stream: MediaStream }
  | { type: 'PERMISSION_DENIED'; error: CameraCaptureError }
  | { type: 'PHOTO_CAPTURED'; photo: CapturedPhoto }
  | { type: 'RETAKE' }
  | { type: 'FLIP_CAMERA' }
  | { type: 'ERROR'; error: CameraCaptureError };
```

## 8. Dev Tools Implementation

### Route Structure

Following existing admin route patterns:

```
web/src/app/(admin)/dev-tools/
├── page.tsx           # Redirects to /dev-tools/camera
├── layout.tsx         # Dev tools layout
└── camera/
    └── page.tsx       # Camera playground
```

### Decision: Simple Prop Controls + Callback Log

**Decision**: Implement minimal dev tools with form controls and console-style log panel.

**Rationale**:
- Sufficient for testing all configurations
- No complex state management needed
- Can use Zustand if log persistence needed (future)

**Components:**
1. **PropControls** - Checkboxes, radio buttons for all CameraCapture props
2. **CameraPreview** - Mobile-sized container with actual CameraCapture
3. **CallbackLog** - Time-stamped log of all callback invocations with JSON payload

## 9. Sidebar Integration (Dev Tools)

### Decision: Development-Only Visibility

**Decision**: Show Dev Tools menu item only in development environment or for admin users.

**Rationale**:
- Dev tools are not for end users
- Environment check keeps production clean
- Admin check enables debugging in production if needed

**Implementation:**
```typescript
// In sidebar constants or component
const showDevTools = process.env.NODE_ENV === 'development' || isAdmin;
```

## 10. Integration with Guest Flow

### Migration Path

Current `GuestCaptureStep` can be refactored to use new `CameraCapture`:

**Before:**
```tsx
// GuestCaptureStep.tsx - 200+ lines with camera logic
function GuestCaptureStep() {
  const { stream, error, videoRef, requestPermission } = useCamera();
  // ... lots of camera-specific code
  // ... upload logic mixed in
}
```

**After:**
```tsx
// GuestCaptureStep.tsx - ~30 lines
function GuestCaptureStep({ step, onChange, onComplete }) {
  const handleSubmit = async (photo: CapturedPhoto) => {
    const uploadedUrl = await uploadToStorage(photo.file);
    onChange({ type: 'photo', url: uploadedUrl, method: photo.method });
    onComplete();
  };

  return (
    <StepLayout title={step.title} description={step.description}>
      <CameraCapture
        onSubmit={handleSubmit}
        aspectRatio="3:4"
        enableLibrary={true}
      />
    </StepLayout>
  );
}
```

### Decision: Non-Breaking Migration

**Decision**: New module doesn't modify existing guest flow; migration happens separately after module is stable.

**Rationale**:
- Reduces risk during development
- Allows thorough testing in dev tools first
- Existing guest flow continues to work

---

## Summary of Key Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Implementation approach | Extract and enhance existing code | Proven API usage, minimize rewrite risk |
| Permission timing | User-initiated (button tap) | Improves grant rate, respects iOS behavior |
| Camera switching | Configurable prop + runtime detection | Flexible API, handles single-camera devices |
| Photo capture | Enhanced canvas capture with metadata | Simple, fast, provides needed info to consumers |
| Aspect ratio | CSS overlay guide (no crop) | YAGNI, simpler implementation |
| Error handling | Typed error codes + messages | Exhaustive handling, i18n support |
| State management | useReducer state machine | Predictable transitions, testable |
| Dev tools | Simple controls + callback log | Minimal viable tooling |
| Integration | Non-breaking, migrate after stable | Reduces risk, allows thorough testing |
