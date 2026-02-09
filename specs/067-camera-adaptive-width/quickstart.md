# Quickstart: Camera Adaptive Width

**Branch**: `067-camera-adaptive-width`
**Date**: 2026-02-09

## Overview

This feature implements a strict two-zone layout for the camera capture UI that adapts to any device and aspect ratio while keeping controls always accessible.

## Key Concepts

### Two-Zone Layout

Every camera state (active, preview, upload) uses this layout:

```
┌─────────────────────────────────────┐
│         Preview Zone (flex-1)       │  ← Fills remaining space
│    ┌───────────────────────────┐    │
│    │   Content (contain fit)   │    │  ← Aspect ratio preserved
│    └───────────────────────────┘    │
├─────────────────────────────────────┤
│         Controls Zone               │  ← Fixed height + safe-area
└─────────────────────────────────────┘
```

### Contain Behavior

The camera/photo content uses `object-fit: contain` which:
- Preserves aspect ratio
- Shows letterboxing (black bars) when content ratio differs from container ratio
- Never crops or stretches content

## Files to Modify

```
apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/
├── components/
│   ├── CameraActive.tsx       # Two-zone layout with black container
│   ├── PhotoPreview.tsx       # Two-zone layout without container styling
│   └── UploadProgress.tsx     # Two-zone layout for loading state
```

## Implementation Pattern

### CameraActive Layout

```tsx
<div className="flex flex-col h-full w-full">
  {/* Preview Zone */}
  <div className="flex-1 min-h-0 flex items-center justify-center p-4">
    <div className="w-full h-full max-w-full max-h-full bg-black rounded-2xl overflow-hidden flex items-center justify-center">
      <CameraView
        ref={cameraRef}
        aspectRatio={aspectRatio}
        className="max-w-full max-h-full"
        // CameraView applies aspect-ratio CSS internally
      />
    </div>
  </div>

  {/* Controls Zone */}
  <div className="flex items-center justify-center gap-6 py-6 pb-[env(safe-area-inset-bottom,1.5rem)]">
    {/* Controls */}
  </div>
</div>
```

### PhotoPreview Layout (Clean Style)

```tsx
<div className="flex flex-col h-full w-full">
  {/* Preview Zone - NO black container */}
  <div className="flex-1 min-h-0 flex items-center justify-center p-4">
    <img
      src={photo.previewUrl}
      alt="Captured photo"
      className="max-w-full max-h-full object-contain"
      style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] }}
    />
  </div>

  {/* Controls Zone */}
  <div className="flex items-center justify-center gap-4 py-6 pb-[env(safe-area-inset-bottom,1.5rem)]">
    <ThemedButton onClick={onRetake} variant="outline">Retake</ThemedButton>
    <ThemedButton onClick={onConfirm} variant="primary">Continue</ThemedButton>
  </div>
</div>
```

## Key CSS Classes

| Class | Purpose |
|-------|---------|
| `flex-1 min-h-0` | Preview zone fills remaining space, prevents overflow |
| `max-w-full max-h-full` | Content fits within container |
| `object-contain` | Preserves aspect ratio with letterboxing |
| `pb-[env(safe-area-inset-bottom,1.5rem)]` | Safe-area padding with fallback |

## Testing Checklist

1. **Aspect Ratio Scenarios**:
   - [ ] 1:1 on tall phone → letterboxing top/bottom
   - [ ] 9:16 on wide screen → pillarboxing left/right
   - [ ] 2:3 and 3:2 variations

2. **Device Tests**:
   - [ ] iPhone (with notch/dynamic island)
   - [ ] Android phone
   - [ ] iPad
   - [ ] Desktop browser

3. **State Consistency**:
   - [ ] Controls remain visible in all states
   - [ ] Photo Review matches Camera Active framing
   - [ ] Upload Progress maintains layout

## Validation Commands

```bash
# Before committing
cd apps/clementine-app
pnpm check      # Format + lint
pnpm type-check # TypeScript
pnpm test       # Unit tests (if any)
```

## Standards Compliance

- ✅ Mobile-first design
- ✅ Using existing ThemedButton/ThemedIconButton
- ✅ Safe-area handling for iOS
- ✅ No hard-coded colors (bg-black is semantic for camera container)
