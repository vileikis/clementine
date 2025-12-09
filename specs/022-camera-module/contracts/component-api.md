# Component API Contract: CameraCapture

**Feature**: 022-camera-module
**Date**: 2025-12-08

## Overview

This document defines the public API contract for the `CameraCapture` component - the single entry point for the camera module.

## Component Signature

```typescript
import { CameraCapture } from '@/features/camera';
import type { CapturedPhoto, CameraCaptureError, CameraCaptureLabels } from '@/features/camera';

<CameraCapture
  // Required
  onSubmit={(photo: CapturedPhoto) => void}

  // Optional lifecycle callbacks
  onPhoto={(photo: CapturedPhoto) => void}
  onRetake={() => void}
  onCancel={() => void}
  onError={(error: CameraCaptureError) => void}

  // Configuration
  enableCamera={true}
  enableLibrary={true}
  cameraFacing="both"
  initialFacing="user"
  aspectRatio="3:4"

  // Customization
  className=""
  labels={customLabels}
/>
```

---

## Props Reference

### Required Props

#### `onSubmit`

```typescript
onSubmit: (photo: CapturedPhoto) => void
```

Called when user confirms their photo selection. This is the primary success callback.

**When called**: User taps "Confirm" / "Use Photo" button on review screen.

**Payload**:
```typescript
{
  previewUrl: "blob:http://...",  // Object URL for display
  file: File,                     // Raw File for upload
  method: "camera" | "library",   // How photo was obtained
  width: 1280,                    // Image width in pixels
  height: 720                     // Image height in pixels
}
```

---

### Optional Lifecycle Callbacks

#### `onPhoto`

```typescript
onPhoto?: (photo: CapturedPhoto) => void
```

Called when a photo is captured or selected, before review. Useful for analytics or preview purposes.

**When called**:
- Immediately after camera capture button is pressed
- Immediately after file is selected from library

---

#### `onRetake`

```typescript
onRetake?: () => void
```

Called when user taps "Retake" from the review screen. Useful for analytics.

**When called**: User taps "Retake" button, before returning to camera/library.

---

#### `onCancel`

```typescript
onCancel?: () => void
```

Called when user wants to exit the camera flow entirely (if your UI supports cancellation).

**When called**: User taps cancel/close button (if implemented by consumer via wrapper).

**Note**: The base `CameraCapture` component doesn't render a cancel button. Consumers should wrap with their own header/close button if needed.

---

#### `onError`

```typescript
onError?: (error: CameraCaptureError) => void
```

Called when any error occurs. Useful for logging/analytics.

**When called**: Permission denied, camera unavailable, capture failed, etc.

**Payload**:
```typescript
{
  code: "PERMISSION_DENIED" | "PERMISSION_DISMISSED" | "CAMERA_UNAVAILABLE" |
        "CAMERA_IN_USE" | "CAPTURE_FAILED" | "INVALID_FILE_TYPE" | "UNKNOWN",
  message: "Human readable error message"
}
```

---

### Configuration Props

#### `enableCamera`

```typescript
enableCamera?: boolean  // default: true
```

Whether to show camera capture option. Set to `false` for library-only mode.

**Validation**: Cannot be `false` if `enableLibrary` is also `false`.

---

#### `enableLibrary`

```typescript
enableLibrary?: boolean  // default: true
```

Whether to show photo library/gallery option.

**Behavior**:
- When `true`: Shows library button on camera screen
- When `false` + camera denied: Component shows error without fallback

---

#### `cameraFacing`

```typescript
cameraFacing?: "user" | "environment" | "both"  // default: "both"
```

Which camera(s) to enable.

| Value | Flip Button | Behavior |
|-------|-------------|----------|
| `"user"` | Hidden | Front camera only (selfie) |
| `"environment"` | Hidden | Back camera only (document) |
| `"both"` | Visible (if device has multiple) | User can toggle |

---

#### `initialFacing`

```typescript
initialFacing?: "user" | "environment"  // default: "user"
```

Which camera to start with when `cameraFacing="both"`.

**Ignored when**: `cameraFacing` is `"user"` or `"environment"`.

---

#### `aspectRatio`

```typescript
aspectRatio?: "3:4" | "1:1" | "9:16"  // default: "3:4"
```

Aspect ratio guide overlay shown on viewfinder.

**Note**: This is a visual guide only. The captured image is not cropped.

---

### Customization Props

#### `className`

```typescript
className?: string
```

Additional CSS classes for the container element.

---

#### `labels`

```typescript
labels?: Partial<CameraCaptureLabels>
```

Custom labels for internationalization. Partial - only override what you need.

```typescript
interface CameraCaptureLabels {
  permissionTitle: string;
  permissionDescription: string;
  allowCamera: string;
  capture: string;
  flipCamera: string;
  openLibrary: string;
  retake: string;
  confirm: string;
  permissionDenied: string;
  permissionDeniedHint: string;
  cameraUnavailable: string;
  cameraInUse: string;
  captureError: string;
}
```

---

## Type Exports

The module exports these types for consumer use:

```typescript
// From @/features/camera
export type {
  CapturedPhoto,
  CaptureMethod,
  CameraCaptureError,
  CameraCaptureErrorCode,
  CameraCaptureLabels,
  CameraCaptureProps
} from '@/features/camera';
```

---

## Usage Examples

### Basic Usage

```tsx
import { CameraCapture } from '@/features/camera';

function PhotoCapture() {
  const handleSubmit = (photo) => {
    console.log('Photo confirmed:', photo);
    // Upload photo.file to your storage
  };

  return <CameraCapture onSubmit={handleSubmit} />;
}
```

### Selfie Mode (Front Camera Only)

```tsx
<CameraCapture
  onSubmit={handleSubmit}
  cameraFacing="user"
  enableLibrary={false}
/>
```

### Document Scan (Back Camera Only)

```tsx
<CameraCapture
  onSubmit={handleSubmit}
  cameraFacing="environment"
  enableLibrary={true}
/>
```

### Library Only (No Camera)

```tsx
<CameraCapture
  onSubmit={handleSubmit}
  enableCamera={false}
  enableLibrary={true}
/>
```

### Full Options with Analytics

```tsx
import { CameraCapture, type CapturedPhoto, type CameraCaptureError } from '@/features/camera';

function PhotoCapture() {
  const handlePhoto = (photo: CapturedPhoto) => {
    analytics.track('photo_captured', { method: photo.method });
  };

  const handleSubmit = async (photo: CapturedPhoto) => {
    const url = await uploadToStorage(photo.file);
    URL.revokeObjectURL(photo.previewUrl); // Cleanup
    setPhotoUrl(url);
  };

  const handleRetake = () => {
    analytics.track('photo_retake');
  };

  const handleError = (error: CameraCaptureError) => {
    analytics.track('camera_error', { code: error.code });
    toast.error(error.message);
  };

  return (
    <CameraCapture
      onPhoto={handlePhoto}
      onSubmit={handleSubmit}
      onRetake={handleRetake}
      onError={handleError}
      enableCamera={true}
      enableLibrary={true}
      cameraFacing="both"
      initialFacing="user"
      aspectRatio="3:4"
    />
  );
}
```

### With Custom Labels (i18n)

```tsx
const spanishLabels = {
  permissionTitle: "Acceso a la Cámara",
  permissionDescription: "Necesitamos acceso a tu cámara para tomar tu foto",
  allowCamera: "Permitir Cámara",
  capture: "Tomar Foto",
  retake: "Repetir",
  confirm: "Usar Foto",
};

<CameraCapture
  onSubmit={handleSubmit}
  labels={spanishLabels}
/>
```

### Integration with Step Layout

```tsx
import { StepLayout, ActionBar } from '@/components/step-primitives';
import { CameraCapture } from '@/features/camera';

function CaptureStep({ step, onComplete }) {
  const handleSubmit = async (photo) => {
    const url = await uploadToStorage(photo.file);
    await saveStepResult({ photoUrl: url, method: photo.method });
    onComplete();
  };

  return (
    <StepLayout
      title={step.title}
      description={step.description}
      mediaUrl={step.mediaUrl}
    >
      <CameraCapture
        onSubmit={handleSubmit}
        aspectRatio="3:4"
      />
    </StepLayout>
  );
}
```

---

## Error Handling Contract

The component handles errors internally with graceful degradation:

| Error | Internal Behavior | `onError` Called |
|-------|-------------------|------------------|
| Permission denied | Show denied UI + library button | Yes |
| Permission dismissed | Show retry button | Yes |
| Camera unavailable | Auto-switch to library mode | Yes |
| Camera in use | Show retry + library option | Yes |
| Capture failed | Show retry button | Yes |
| Invalid file type | Show error, reopen picker | Yes |

**Consumer responsibility**: Log errors, show toasts if desired. The component shows its own error UI.

---

## Accessibility

The component follows accessibility best practices:

- All buttons have appropriate `aria-label` attributes
- Focus management when transitioning between states
- Keyboard navigation supported (Tab, Enter, Space)
- Live camera preview has `aria-hidden="true"` (decorative)
- Error messages announced via `aria-live` region
