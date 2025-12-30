# Quickstart: Camera Module

**Feature**: 007-camera-migration
**Date**: 2025-12-30
**Status**: COMPLETE

## Overview

This guide shows how to use the camera module in your TanStack Start application. The camera module provides photo capture from device cameras and library picker fallback.

---

## Installation

The camera module is already installed in `/shared/camera/`. No additional installation needed.

**Location**: `apps/clementine-app/src/shared/camera/`

---

## Basic Usage

### Simple Camera Capture

```tsx
import { useState } from "react";
import { CameraCapture, CapturedPhoto } from "@/shared/camera";

export function PhotoUploadPage() {
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);

  const handlePhotoCapture = (photo: CapturedPhoto) => {
    console.log("Photo captured:", photo);
    setCapturedPhoto(photo);
  };

  const handlePhotoSubmit = async (photo: CapturedPhoto) => {
    // Upload to Firebase Storage or other service
    console.log("Uploading photo:", photo.file);

    // Clean up blob URL after upload
    URL.revokeObjectURL(photo.previewUrl);

    // Your upload logic here...
  };

  return (
    <div className="h-screen">
      <CameraCapture
        onPhoto={handlePhotoCapture}
        onSubmit={handlePhotoSubmit}
      />
    </div>
  );
}
```

---

## Configuration Options

### Enable Library Picker

Allow users to select photos from their device library.

```tsx
<CameraCapture
  onPhoto={handlePhotoCapture}
  onSubmit={handlePhotoSubmit}
  enableLibrary={true}  // Show "Choose from Library" button
/>
```

---

### Camera Facing Mode

Control which camera to use (front or back).

```tsx
// Front camera only (selfie mode)
<CameraCapture
  cameraFacing="user"
  initialFacing="user"
  {...callbacks}
/>

// Rear camera only
<CameraCapture
  cameraFacing="environment"
  initialFacing="environment"
  {...callbacks}
/>

// Both cameras with flip button
<CameraCapture
  cameraFacing="both"
  initialFacing="user"  // Start with front camera
  {...callbacks}
/>
```

---

### Aspect Ratio Cropping

Apply aspect ratio cropping to captured photos.

```tsx
// Portrait (3:4 aspect ratio)
<CameraCapture
  aspectRatio="3:4"
  {...callbacks}
/>

// Square (1:1 aspect ratio)
<CameraCapture
  aspectRatio="1:1"
  {...callbacks}
/>

// Stories/vertical (9:16 aspect ratio)
<CameraCapture
  aspectRatio="9:16"
  {...callbacks}
/>

// No cropping (full camera frame)
<CameraCapture
  aspectRatio={undefined}
  {...callbacks}
/>
```

---

### Custom Labels (i18n)

Customize UI labels for internationalization.

```tsx
import { CameraCapture, DEFAULT_LABELS } from "@/shared/camera";

const spanishLabels = {
  ...DEFAULT_LABELS,
  permissionTitle: "Acceso a la cámara requerido",
  permissionButton: "Permitir acceso a la cámara",
  captureButton: "Tomar foto",
  confirmButton: "Confirmar",
  retakeButton: "Volver a tomar",
};

<CameraCapture
  labels={spanishLabels}
  {...callbacks}
/>
```

---

## Event Handlers

### onPhoto

Called when a photo is captured or selected from library.

```tsx
const handlePhotoCapture = (photo: CapturedPhoto) => {
  console.log("Photo captured!");
  console.log("Method:", photo.method); // "camera" or "library"
  console.log("Dimensions:", photo.width, "x", photo.height);
  console.log("File size:", photo.file.size, "bytes");
  console.log("Preview URL:", photo.previewUrl);

  // Display preview, save to state, etc.
};
```

---

### onSubmit

Called when user confirms the photo.

```tsx
const handlePhotoSubmit = async (photo: CapturedPhoto) => {
  try {
    // Upload to Firebase Storage
    const storageRef = ref(storage, `photos/${photo.file.name}`);
    const snapshot = await uploadBytes(storageRef, photo.file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log("Photo uploaded:", downloadURL);

    // Clean up blob URL (important!)
    URL.revokeObjectURL(photo.previewUrl);

    // Navigate to next step...
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
```

---

### onError

Called when camera errors occur.

```tsx
import type { CameraCaptureError } from "@/shared/camera";

const handleError = (error: CameraCaptureError) => {
  console.error("Camera error:", error.code, error.message);

  switch (error.code) {
    case "PERMISSION_DENIED":
      // Show instructions to enable camera in browser settings
      break;
    case "CAMERA_NOT_FOUND":
      // Show library picker as fallback
      break;
    case "CAMERA_IN_USE":
      // Ask user to close other apps using camera
      break;
    default:
      // Generic error handling
      break;
  }
};

<CameraCapture
  onError={handleError}
  {...otherProps}
/>
```

---

### onRetake

Called when user clicks "Retake" in photo review.

```tsx
const handleRetake = () => {
  console.log("User requested retake");
  // Optional: Track analytics, clear previous photo, etc.
};

<CameraCapture
  onRetake={handleRetake}
  {...otherProps}
/>
```

---

### onCancel

Called when user cancels photo review (if cancel button enabled).

```tsx
const handleCancel = () => {
  console.log("User cancelled photo capture");
  // Optional: Navigate back, clear state, etc.
};

<CameraCapture
  onCancel={handleCancel}
  {...otherProps}
/>
```

---

## Complete Example

### Photo Upload with Firebase Storage

```tsx
import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/shared/firebase";
import { CameraCapture, CapturedPhoto, CameraCaptureError } from "@/shared/camera";

export function PhotoUploadFlow() {
  const [uploading, setUploading] = useState(false);
  const [uploadedURL, setUploadedURL] = useState<string | null>(null);

  const handlePhotoCapture = (photo: CapturedPhoto) => {
    console.log("Photo captured:", {
      method: photo.method,
      dimensions: `${photo.width}x${photo.height}`,
      size: `${(photo.file.size / 1024).toFixed(2)} KB`,
    });
  };

  const handlePhotoSubmit = async (photo: CapturedPhoto) => {
    setUploading(true);

    try {
      // Upload to Firebase Storage
      const fileName = `photos/${Date.now()}-${photo.file.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, photo.file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log("Photo uploaded successfully:", downloadURL);
      setUploadedURL(downloadURL);

      // Clean up blob URL (important for memory management)
      URL.revokeObjectURL(photo.previewUrl);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleError = (error: CameraCaptureError) => {
    console.error("Camera error:", error);

    // Show user-friendly error messages
    const errorMessages: Record<string, string> = {
      PERMISSION_DENIED: "Please enable camera access in your browser settings.",
      CAMERA_IN_USE: "Camera is in use by another app. Please close it and try again.",
      CAMERA_NOT_FOUND: "No camera detected. Please use the library picker instead.",
      CAMERA_NOT_SUPPORTED: "Your browser doesn't support camera access.",
      INVALID_FILE_TYPE: "Please select a JPEG, PNG, GIF, or WebP image.",
      FILE_TOO_LARGE: "File is too large. Maximum size is 50MB.",
    };

    alert(errorMessages[error.code] || "An error occurred. Please try again.");
  };

  if (uploadedURL) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">Photo Uploaded!</h2>
        <img src={uploadedURL} alt="Uploaded" className="max-w-md rounded-lg shadow-lg" />
        <button
          onClick={() => setUploadedURL(null)}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Upload Another Photo
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen">
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-lg font-semibold">Uploading photo...</p>
          </div>
        </div>
      )}

      <CameraCapture
        onPhoto={handlePhotoCapture}
        onSubmit={handlePhotoSubmit}
        onError={handleError}
        enableLibrary={true}
        cameraFacing="both"
        initialFacing="user"
        aspectRatio="3:4"
      />
    </div>
  );
}
```

---

## Advanced Usage

### Using Individual Components

For more control, you can use individual components instead of the all-in-one `CameraCapture`.

```tsx
import { useRef, useState } from "react";
import {
  CameraView,
  CameraControls,
  PhotoReview,
  useCameraPermission,
  type CapturedPhoto,
  type CameraViewRef,
} from "@/shared/camera";

export function CustomCameraUI() {
  const cameraRef = useRef<CameraViewRef>(null);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const { state: permissionState, requestPermission } = useCameraPermission();

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    const capturedPhoto = await cameraRef.current.takePhoto();
    setPhoto(capturedPhoto);
  };

  const handleFlipCamera = () => {
    if (!cameraRef.current) return;
    cameraRef.current.switchCamera();
  };

  if (permissionState !== "granted") {
    return (
      <div className="flex items-center justify-center h-screen">
        <button
          onClick={requestPermission}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Allow Camera Access
        </button>
      </div>
    );
  }

  if (photo) {
    return (
      <PhotoReview
        photo={photo}
        onConfirm={() => {
          console.log("Photo confirmed:", photo);
          URL.revokeObjectURL(photo.previewUrl);
          setPhoto(null);
        }}
        onRetake={() => setPhoto(null)}
        labels={{
          confirmButton: "Use This Photo",
          retakeButton: "Take Another",
        }}
      />
    );
  }

  return (
    <div className="h-screen relative">
      <CameraView
        ref={cameraRef}
        facing="user"
        aspectRatio="1:1"
        onError={(error) => console.error("Camera error:", error)}
      />

      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
        <CameraControls
          onCapture={handleCapture}
          onFlipCamera={handleFlipCamera}
          onLibraryPick={() => {/* Optional library picker */}}
          hasMultipleCameras={cameraRef.current?.hasMultipleCameras ?? false}
          enableLibrary={false}
        />
      </div>
    </div>
  );
}
```

---

### Using Hooks

#### useCameraPermission

Manage camera permission state independently.

```tsx
import { useCameraPermission } from "@/shared/camera";

function CameraPermissionChecker() {
  const { state, requestPermission } = useCameraPermission();

  useEffect(() => {
    console.log("Permission state:", state);
    // unknown → undetermined → granted/denied/unavailable
  }, [state]);

  return (
    <div>
      <p>Permission: {state}</p>
      {state === "undetermined" && (
        <button onClick={requestPermission}>Request Permission</button>
      )}
    </div>
  );
}
```

---

#### useLibraryPicker

Handle library photo selection independently.

```tsx
import { useLibraryPicker } from "@/shared/camera";

function LibraryOnlyUpload() {
  const { openPicker, InputComponent } = useLibraryPicker({
    onPhoto: (photo) => {
      console.log("Photo selected:", photo);
      // Upload photo...
    },
    onError: (error) => {
      console.error("File error:", error);
    },
  });

  return (
    <div>
      <button onClick={openPicker}>Choose Photo from Library</button>
      <InputComponent />  {/* Hidden file input */}
    </div>
  );
}
```

---

## Testing

### Dev-Tools Testing Interface

Test all camera configurations interactively at:

**URL**: `http://localhost:3000/admin/dev-tools/camera`

**Features**:
- **Column 1**: Configure props (enableLibrary, cameraFacing, aspectRatio)
- **Column 2**: Live camera preview (375×667px mobile viewport)
- **Column 3**: Callback event log (timestamps + payloads)

**Usage**:
1. Navigate to `/admin/dev-tools/camera`
2. Adjust props in left panel
3. Test camera capture in center preview
4. View callback events in right panel
5. Click "Reset & Remount" to clear state

---

## Error Handling

### Error Codes

| Code | Meaning | Recovery Action |
|------|---------|-----------------|
| `PERMISSION_DENIED` | User denied camera permission | Show browser settings instructions |
| `CAMERA_IN_USE` | Camera already in use | Ask user to close other apps |
| `CAMERA_NOT_FOUND` | No camera hardware | Offer library picker fallback |
| `CAMERA_NOT_SUPPORTED` | Browser doesn't support getUserMedia | Offer library picker fallback |
| `CAMERA_TIMEOUT` | Camera failed to start | Show retry button |
| `CAPTURE_FAILED` | Failed to capture photo | Show retry button |
| `LIBRARY_PICKER_FAILED` | Library picker error | Show error message |
| `INVALID_FILE_TYPE` | Unsupported file type | Show accepted formats |
| `FILE_TOO_LARGE` | File exceeds 50MB | Show max size |

---

### Error Recovery Example

```tsx
const handleError = (error: CameraCaptureError) => {
  switch (error.code) {
    case "PERMISSION_DENIED":
      return (
        <div className="p-4">
          <h2>Camera Access Denied</h2>
          <p>Please enable camera access in your browser settings:</p>
          <ol>
            <li>Click the lock icon in your browser's address bar</li>
            <li>Find "Camera" in the permissions list</li>
            <li>Change it to "Allow"</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      );

    case "CAMERA_NOT_FOUND":
    case "CAMERA_NOT_SUPPORTED":
      // Fall back to library picker
      return <LibraryOnlyUpload />;

    case "CAMERA_IN_USE":
      return (
        <div className="p-4">
          <h2>Camera In Use</h2>
          <p>Another application is using your camera. Please close it and try again.</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      );

    default:
      return (
        <div className="p-4">
          <h2>Camera Error</h2>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      );
  }
};
```

---

## Best Practices

### Memory Management

Always clean up blob URLs to prevent memory leaks.

```tsx
// ✅ Good: Clean up after upload
const handleSubmit = async (photo: CapturedPhoto) => {
  await uploadPhoto(photo.file);
  URL.revokeObjectURL(photo.previewUrl);  // Important!
};

// ❌ Bad: Memory leak (blob URLs never revoked)
const handleSubmit = async (photo: CapturedPhoto) => {
  await uploadPhoto(photo.file);
  // Forgot to revoke blob URL
};
```

---

### Permission UX

Request permission only after user action (don't prompt on page load).

```tsx
// ✅ Good: User-initiated permission request
<button onClick={() => setCameraActive(true)}>
  Take Photo
</button>
{cameraActive && <CameraCapture {...props} />}

// ❌ Bad: Immediate permission prompt on page load
export function Page() {
  return <CameraCapture {...props} />;  // Prompts immediately
}
```

---

### Aspect Ratio Selection

Choose aspect ratio based on use case.

| Use Case | Aspect Ratio | Reasoning |
|----------|--------------|-----------|
| Profile photos | `"1:1"` | Square format (universal) |
| Full-body photos | `"3:4"` | Portrait orientation |
| Story/reel content | `"9:16"` | Vertical format |
| General purpose | `undefined` | No cropping (flexibility) |

---

### Fallback Strategy

Always enable library picker as fallback.

```tsx
// ✅ Good: Library fallback for camera failures
<CameraCapture
  enableLibrary={true}  // Users can still upload if camera fails
  {...props}
/>

// ⚠️ Risky: No fallback (users stuck if camera fails)
<CameraCapture
  enableLibrary={false}
  {...props}
/>
```

---

## TypeScript Types

### Import Types

```typescript
import type {
  CapturedPhoto,
  CameraCaptureError,
  CameraCaptureErrorCode,
  CaptureMethod,
  CameraFacing,
  CameraFacingConfig,
  AspectRatio,
  PermissionState,
  CameraCaptureLabels,
} from "@/shared/camera";
```

---

### CapturedPhoto

```typescript
interface CapturedPhoto {
  previewUrl: string;           // Blob URL for preview
  file: File;                   // File object for upload
  method: "camera" | "library"; // Capture method
  width: number;                // Image width (px)
  height: number;               // Image height (px)
}
```

---

### CameraCaptureError

```typescript
interface CameraCaptureError {
  code: CameraCaptureErrorCode;
  message: string;
  originalError?: Error;
}

type CameraCaptureErrorCode =
  | "PERMISSION_DENIED"
  | "CAMERA_IN_USE"
  | "CAMERA_NOT_FOUND"
  | "CAMERA_NOT_SUPPORTED"
  | "CAMERA_TIMEOUT"
  | "CAPTURE_FAILED"
  | "LIBRARY_PICKER_FAILED"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE";
```

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 53+ | ✅ Full | |
| Safari 11+ | ✅ Full | iOS requires HTTPS |
| Firefox 47+ | ✅ Full | |
| Edge 79+ | ✅ Full | Chromium-based |

**Requirements**:
- HTTPS connection (localhost is exempt in dev)
- Camera hardware (or library picker fallback)
- User permission grant

---

## FAQs

### Q: Can I use the camera module during SSR?

**A**: The camera module uses feature detection to handle SSR gracefully. Browser APIs are checked with `typeof navigator !== "undefined"` before use. No special directives needed - TanStack Start handles this automatically.

---

### Q: How do I customize the camera UI?

**A**: Use individual components (`CameraView`, `CameraControls`, `PhotoReview`) instead of the all-in-one `CameraCapture`. See "Advanced Usage" section.

---

### Q: What image formats are supported?

**A**: JPEG, PNG, GIF, and WebP. Max file size is 50MB.

---

### Q: How do I handle iOS Safari camera issues?

**A**: iOS Safari requires HTTPS for camera access. In development, use `localhost` (exempt from HTTPS requirement). In production, ensure your hosting provides HTTPS.

---

### Q: Can I capture video instead of photos?

**A**: No. The camera module only supports photo capture. Video recording is out of scope.

---

### Q: How do I test without a physical camera?

**A**: Use the library picker feature (`enableLibrary={true}`) to select existing photos. Or use browser dev tools to simulate camera devices.

---

## Resources

- **Dev-Tools Page**: `/admin/dev-tools/camera`
- **Data Model**: See `specs/007-camera-migration/data-model.md`
- **Research**: See `specs/007-camera-migration/research.md`
- **Source Code**: `apps/clementine-app/src/shared/camera/`

---

**Quickstart Status**: COMPLETE
**Last Updated**: 2025-12-30
