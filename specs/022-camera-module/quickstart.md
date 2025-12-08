# Quickstart: Camera Module

**Feature**: 022-camera-module
**Date**: 2025-12-08

## Prerequisites

- Node.js 18+
- pnpm (workspace manager)
- HTTPS environment (required for camera access)
- Modern browser (Chrome 80+, Safari 14+, Firefox 78+)

## Installation

The camera module is part of the Clementine web app. No external dependencies required.

```bash
# From repository root
pnpm install

# Start dev server (with HTTPS for camera access)
pnpm dev
```

## Basic Usage

### 1. Import the Component

```tsx
import { CameraCapture } from '@/features/camera';
import type { CapturedPhoto } from '@/features/camera';
```

### 2. Implement the Submit Handler

```tsx
function MyPhotoCapture() {
  const handleSubmit = async (photo: CapturedPhoto) => {
    // photo.file - Raw File object for upload
    // photo.previewUrl - Object URL for preview display
    // photo.method - "camera" or "library"
    // photo.width, photo.height - Image dimensions

    const uploadedUrl = await uploadToStorage(photo.file);

    // Clean up the object URL after upload
    URL.revokeObjectURL(photo.previewUrl);

    // Do something with the uploaded URL
    console.log('Photo uploaded:', uploadedUrl);
  };

  return <CameraCapture onSubmit={handleSubmit} />;
}
```

### 3. Add to Your Page

```tsx
// app/my-page/page.tsx
export default function MyPage() {
  return (
    <div className="h-screen">
      <MyPhotoCapture />
    </div>
  );
}
```

## Common Configurations

### Selfie Mode (Front Camera Only)

```tsx
<CameraCapture
  onSubmit={handleSubmit}
  cameraFacing="user"
  enableLibrary={false}
/>
```

### Document Scanning (Back Camera Only)

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

### Square Photos (Instagram-style)

```tsx
<CameraCapture
  onSubmit={handleSubmit}
  aspectRatio="1:1"
/>
```

## Dev Tools

Test the component with different configurations:

1. Start the dev server: `pnpm dev`
2. Navigate to: `http://localhost:3000/dev-tools/camera`
3. Use the prop controls to test configurations
4. Monitor callback payloads in the log panel

## Type Reference

```typescript
interface CapturedPhoto {
  previewUrl: string;           // Object URL for display
  file: File;                    // Raw file for upload
  method: 'camera' | 'library';  // Capture source
  width: number;
  height: number;
}

interface CameraCaptureError {
  code: 'PERMISSION_DENIED' | 'PERMISSION_DISMISSED' |
        'CAMERA_UNAVAILABLE' | 'CAMERA_IN_USE' |
        'CAPTURE_FAILED' | 'INVALID_FILE_TYPE' | 'UNKNOWN';
  message: string;
}
```

## Error Handling

```tsx
const handleError = (error: CameraCaptureError) => {
  switch (error.code) {
    case 'PERMISSION_DENIED':
      // User denied camera access - library fallback is shown
      console.log('Camera permission denied');
      break;
    case 'CAMERA_UNAVAILABLE':
      // No camera on device - library mode activated
      console.log('No camera available');
      break;
    default:
      console.error('Camera error:', error.message);
  }
};

<CameraCapture
  onSubmit={handleSubmit}
  onError={handleError}
/>
```

## Integration with Experience Engine

For use within a Step:

```tsx
import { StepLayout } from '@/components/step-primitives';
import { CameraCapture } from '@/features/camera';

function CaptureStep({ step, onChange, onComplete }) {
  const handleSubmit = async (photo: CapturedPhoto) => {
    // Upload to your storage
    const url = await uploadToStorage(photo.file);

    // Update step state
    onChange({ type: 'photo', url, method: photo.method });

    // Advance to next step
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

## Mobile Testing

### iOS Safari
- Requires HTTPS (use ngrok or similar for local testing)
- Permission prompt appears once per domain
- Test on real device for accurate behavior

### Android Chrome
- More lenient permission handling
- Supports permission re-prompting
- Test camera switching on devices with multiple cameras

### Local HTTPS Setup

```bash
# Option 1: Use mkcert for local HTTPS
brew install mkcert
mkcert -install
mkcert localhost

# Option 2: Use ngrok for public HTTPS URL
ngrok http 3000
```

## File Structure

```
web/src/features/camera/
├── components/
│   ├── CameraCapture.tsx      # Main entry point
│   └── ...internal components
├── hooks/
│   └── useCamera.ts           # Camera stream hook
├── types/
│   └── camera.types.ts        # Type definitions
└── index.ts                   # Public exports
```

## API Reference

See [contracts/component-api.md](./contracts/component-api.md) for full API documentation.

## Troubleshooting

### Camera not working in development
- Ensure you're using HTTPS (camera API requires secure context)
- Check browser console for permission errors
- Try in incognito window to reset permissions

### Black screen on iOS
- Confirm HTTPS is active
- Check that no other app is using the camera
- Try Safari instead of in-app browser

### "Camera in use" error
- Close other apps/tabs using the camera
- On macOS, check if another app has camera access

### Permission stuck in "denied" state
- Clear site permissions in browser settings
- Test in incognito window
