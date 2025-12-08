# Camera Module PRD

## Overview

A self-contained, reusable camera feature module that handles the complete photo capture flow: permission requests, live camera preview, photo capture, and review/confirmation. Exposes a single container component with lifecycle callbacks for easy integration.

## Problem Statement

The current camera implementation is tightly coupled to the guest flow step renderers. This creates duplication when we need camera functionality elsewhere (e.g., admin preview, future features) and makes the CaptureStep renderer unnecessarily complex.

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

## Design Principles

### Storage Agnostic

The camera module does NOT:
- Upload photos to any storage
- Write to Firestore or any database
- Know about sessions, projects, or any domain concepts

It only:
- Captures photos (camera or library)
- Returns `File` + `previewUrl` via callbacks
- Lets consumer decide what to do with the photo

**Consumer responsibility (e.g., CaptureStep):**
```tsx
const handleSubmit = async (photo: CapturedPhoto) => {
  // 1. Upload to storage (consumer's job)
  const uploadedUrl = await uploadToStorage(photo.file);

  // 2. Update session/state (consumer's job)
  onChange({ type: "photo", url: uploadedUrl });

  // 3. Advance flow
  onComplete();
};
```

## User Experience

### Flow States

```
┌─────────────────────────────────────────────────────────────┐
│                     CAMERA CAPTURE FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                                           │
│  │  PERMISSION  │  User hasn't granted camera access        │
│  │    PROMPT    │  → Show request button + explanation      │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ▼ granted                                           │
│  ┌──────────────┐                                           │
│  │    CAMERA    │  Live viewfinder active                   │
│  │    ACTIVE    │  → Capture, flip, library buttons         │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ▼ photo taken                                       │
│  ┌──────────────┐                                           │
│  │    PHOTO     │  Shows captured/selected photo            │
│  │    REVIEW    │  → Retake or Confirm buttons              │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ▼ confirmed                                         │
│  onSubmit(photo) callback fired                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Permission States

| State | UI | Actions |
|-------|-----|---------|
| `prompt` | Explanation + "Allow Camera" button | User taps to trigger browser permission |
| `granted` | Camera viewfinder | Proceed to capture |
| `denied` | Error message + "Open Settings" hint | Fallback to photo library |
| `unavailable` | "Camera not available" + library button | File upload only |

### Camera Controls

- **Capture button** - Large, centered, prominent
- **Flip camera** - Toggle front/back (when available)
- **Photo library** - Open device gallery as fallback/alternative
- **Flash toggle** - (Future) When device supports

### Photo Review

- **Full preview** - Shows captured photo
- **Retake** - Returns to camera
- **Confirm** - Fires callback with photo data

## Component API

### CameraCapture (Container)

The primary export - a self-contained component handling the full flow.

```tsx
<CameraCapture
  // Lifecycle callbacks
  onPhoto={(photo: CapturedPhoto) => void}    // Photo taken/selected (enters review state)
  onSubmit={(photo: CapturedPhoto) => void}   // User confirmed the photo
  onRetake={() => void}                        // Optional: user wants to retake (for analytics)
  onCancel={() => void}                        // Optional: user wants to exit
  onError={(error: CameraCaptureError) => void} // Optional: permission denied, camera error

  // Configuration
  enableCamera?: boolean                       // Show camera option (default: true)
  enableLibrary?: boolean                      // Show library option (default: true)
  cameraFacing?: "user" | "environment" | "both"  // Available cameras (default: "both")
  initialFacing?: "user" | "environment"       // Starting camera (default: "user")
  aspectRatio?: "3:4" | "1:1" | "9:16"         // Crop guide (default: "3:4")

  // Customization
  className?: string                           // Container styling
  labels?: CameraCaptureLabels                 // i18n support
/>
```

### Configuration Behavior

| `cameraFacing` | Flip Button | Behavior |
|----------------|-------------|----------|
| `"user"` | Hidden | Front camera only |
| `"environment"` | Hidden | Back camera only |
| `"both"` | Visible | User can toggle |

| `enableCamera` | `enableLibrary` | UI |
|----------------|-----------------|-----|
| `true` | `true` | Camera + library button |
| `true` | `false` | Camera only |
| `false` | `true` | Library picker only (no viewfinder) |
| `false` | `false` | Invalid - error |

### Photo Data

```ts
/** How the photo was obtained */
type CaptureMethod = "camera" | "library";

interface CapturedPhoto {
  /** Object URL for immediate display */
  previewUrl: string;

  /** Raw file for upload */
  file: File;

  /** How the photo was captured (for analytics) */
  method: CaptureMethod;

  /** Image dimensions */
  width: number;
  height: number;
}
```

### Error Types

```ts
type CameraCaptureErrorCode =
  | "PERMISSION_DENIED"      // User denied camera access
  | "PERMISSION_DISMISSED"   // User dismissed permission prompt
  | "CAMERA_UNAVAILABLE"     // No camera on device
  | "CAMERA_IN_USE"          // Camera used by another app
  | "CAPTURE_FAILED"         // Failed to capture photo
  | "UNKNOWN";

interface CameraCaptureError {
  code: CameraCaptureErrorCode;
  message: string;
}
```

## Integration Example

### In CaptureStep (Experience Engine)

```tsx
// experience-engine/components/steps/CaptureStep.tsx

export function CaptureStep({ step, onChange, onComplete }: CaptureStepProps) {
  const handleSubmit = useCallback((photo: CapturedPhoto) => {
    // Store the photo data (method available for analytics)
    onChange({
      type: "photo",
      url: photo.previewUrl,
      file: photo.file,
      method: photo.method,
    });
    // Auto-advance to next step
    onComplete();
  }, [onChange, onComplete]);

  return (
    <StepLayout
      title={step.title}
      description={step.description}
      mediaUrl={step.mediaUrl}
      mediaType={step.mediaType}
    >
      <CameraCapture
        onSubmit={handleSubmit}
        aspectRatio="3:4"
        cameraFacing="both"
        enableLibrary={true}
      />
    </StepLayout>
  );
}
```

### Configuration Examples

```tsx
// Selfie booth - front camera only, no library
<CameraCapture
  enableLibrary={false}
  cameraFacing="user"
  onSubmit={handleSubmit}
/>

// Document scan - back camera only
<CameraCapture
  enableLibrary={false}
  cameraFacing="environment"
  onSubmit={handleSubmit}
/>

// Full options (default guest experience)
<CameraCapture
  enableCamera={true}
  enableLibrary={true}
  cameraFacing="both"
  initialFacing="user"
  onSubmit={handleSubmit}
/>

// Library only (when camera unavailable)
<CameraCapture
  enableCamera={false}
  enableLibrary={true}
  onSubmit={handleSubmit}
/>
```

## Mobile Considerations

### iOS Safari
- Requires HTTPS for camera access
- `capture="user"` attribute for file input fallback
- Handle permission prompt carefully (only one chance)

### Android Chrome
- More lenient permission re-prompting
- Better camera API support
- Handle both permission models

### Fallback Strategy
1. Try `getUserMedia` for live camera
2. If unavailable/denied, show file input with `capture` attribute
3. File input works universally as last resort

## Success Metrics

- **Permission grant rate** - % of users who allow camera
- **Capture success rate** - % who complete photo capture
- **Retake rate** - % who use retake (indicates UX issues if high)
- **Time to capture** - From permission to confirmed photo

## Future Considerations

- Video capture mode
- AR overlays/filters
- Multi-photo capture
- Zoom controls
- Flash control
- Photo quality settings

## Dependencies

- No external libraries required (uses native browser APIs)
- Works with existing step-primitives for consistent styling

## Dev Tools Integration

### Purpose

Provide an interactive testing environment for the CameraCapture component during development, allowing developers to:
- Test all configuration combinations
- Verify permission flows
- Debug camera behavior across devices
- Validate callback payloads

### Route Structure

```
/dev-tools              → Dev Tools landing (redirects to /dev-tools/camera)
/dev-tools/camera       → Camera testing playground
/dev-tools/[future]     → Other dev tools (e.g., theme, steps, etc.)
```

### Sidebar Integration

Add "Dev Tools" menu item to admin sidebar:
- Icon: Wrench or Flask
- Position: Bottom of sidebar (with Settings)
- Only visible in development or for admin users

### UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Dev Tools                                                            │
├─────────────────────────────────────────────────────────────────────┤
│ [Camera]  [Theme]  [Steps]  ...                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐ │
│  │   PROP CONTROLS     │    │         CAMERA PREVIEW              │ │
│  │                     │    │                                     │ │
│  │  enableCamera  [✓]  │    │    ┌─────────────────────────┐     │ │
│  │  enableLibrary [✓]  │    │    │                         │     │ │
│  │                     │    │    │      CameraCapture      │     │ │
│  │  cameraFacing:      │    │    │       Component         │     │ │
│  │  ○ user             │    │    │                         │     │ │
│  │  ○ environment      │    │    │                         │     │ │
│  │  ● both             │    │    └─────────────────────────┘     │ │
│  │                     │    │                                     │ │
│  │  initialFacing:     │    ├─────────────────────────────────────┤ │
│  │  ● user             │    │  CALLBACK LOG                       │ │
│  │  ○ environment      │    │                                     │ │
│  │                     │    │  12:34:56 onPhoto({ method: "camera"│ │
│  │  aspectRatio:       │    │  12:34:58 onSubmit({ ... })         │ │
│  │  ○ 3:4              │    │  12:35:01 onRetake()                │ │
│  │  ● 1:1              │    │                                     │ │
│  │  ○ 9:16             │    │                                     │ │
│  │                     │    │                                     │ │
│  └─────────────────────┘    └─────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Prop Controls Panel

Interactive controls for all CameraCapture props:

| Control | Type | Options |
|---------|------|---------|
| `enableCamera` | Checkbox | true/false |
| `enableLibrary` | Checkbox | true/false |
| `cameraFacing` | Radio | user, environment, both |
| `initialFacing` | Radio | user, environment |
| `aspectRatio` | Radio | 3:4, 1:1, 9:16 |

### Callback Log Panel

Real-time log of all callbacks fired:
- Timestamp
- Callback name (`onPhoto`, `onSubmit`, `onRetake`, `onCancel`, `onError`)
- Payload (JSON formatted)
- Clear log button

### Preview Panel

- Renders CameraCapture with current prop configuration
- Mobile-sized container (simulates phone viewport)
- Reset button to remount component
