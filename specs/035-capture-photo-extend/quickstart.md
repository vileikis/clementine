# Quickstart: Capture Photo Extend

**Feature**: 035-capture-photo-extend
**Date**: 2026-01-20

## Overview

This guide covers extending the CapturePhoto step with new aspect ratios (3:2, 2:3) and improving photo preview responsiveness.

---

## Prerequisites

- Node.js 18+
- pnpm 10.18.1
- Access to `apps/clementine-app/`

---

## Files to Modify

| File | Change |
|------|--------|
| `src/shared/camera/types/camera.types.ts` | Add `'3:2' \| '2:3'` to AspectRatio union |
| `src/shared/camera/lib/capture.ts` | Add numeric values to ASPECT_RATIO_VALUES |
| `src/shared/camera/components/CameraView.tsx` | Add CSS values to ASPECT_RATIO_CSS |
| `src/domains/experience/steps/schemas/capture-photo.schema.ts` | Add to Zod enum |
| `src/domains/experience/steps/config-panels/CapturePhotoConfigPanel.tsx` | Add dropdown options |
| `src/domains/experience/steps/renderers/CapturePhotoRenderer/CapturePhotoRunMode.tsx` | Update prop passing |
| `src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx` | Responsive sizing |

---

## Step-by-Step Implementation

### 1. Extend Camera Module Types

```typescript
// src/shared/camera/types/camera.types.ts

// FIND this line (~line 62):
export type AspectRatio = '3:4' | '1:1' | '9:16'

// REPLACE with:
export type AspectRatio = '3:4' | '1:1' | '9:16' | '3:2' | '2:3'
```

### 2. Add Numeric Values

```typescript
// src/shared/camera/lib/capture.ts

// FIND ASPECT_RATIO_VALUES (~line 14-18):
const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  '3:4': 3 / 4,
  '1:1': 1,
  '9:16': 9 / 16,
}

// REPLACE with:
const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  '3:4': 3 / 4,   // 0.75 - portrait
  '1:1': 1,       // 1.0  - square
  '9:16': 9 / 16, // 0.5625 - tall portrait
  '3:2': 3 / 2,   // 1.5 - landscape
  '2:3': 2 / 3,   // 0.667 - tall portrait
}
```

### 3. Add CSS Mappings

```typescript
// src/shared/camera/components/CameraView.tsx

// FIND ASPECT_RATIO_CSS (~line 70-74):
const ASPECT_RATIO_CSS: Record<AspectRatio, string> = {
  '3:4': '3 / 4',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
}

// REPLACE with:
const ASPECT_RATIO_CSS: Record<AspectRatio, string> = {
  '3:4': '3 / 4',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}
```

### 4. Update Step Schema

```typescript
// src/domains/experience/steps/schemas/capture-photo.schema.ts

// FIND aspectRatioSchema (~line 11):
export const aspectRatioSchema = z.enum(['1:1', '9:16'])

// REPLACE with:
export const aspectRatioSchema = z.enum(['1:1', '9:16', '3:2', '2:3'])
```

### 5. Add Config Panel Options

```typescript
// src/domains/experience/steps/config-panels/CapturePhotoConfigPanel.tsx

// FIND ASPECT_RATIO_OPTIONS (~line 16-19):
const ASPECT_RATIO_OPTIONS: EditorOption<AspectRatio>[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '9:16', label: 'Portrait (9:16)' },
]

// REPLACE with:
const ASPECT_RATIO_OPTIONS: EditorOption<AspectRatio>[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '3:2', label: 'Landscape (3:2)' },
  { value: '2:3', label: 'Tall Portrait (2:3)' },
]
```

### 6. Update PhotoPreview Component

```typescript
// src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx

// CHANGE props interface:
interface PhotoPreviewProps {
  photo: CapturedPhoto
  aspectRatio: '1:1' | '9:16' | '3:2' | '2:3'  // Changed from isSquare: boolean
  onRetake: () => void
  onConfirm: () => void
}

// ADD CSS mapping:
const ASPECT_RATIO_CSS: Record<string, string> = {
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}

// UPDATE component:
export function PhotoPreview({
  photo,
  aspectRatio,
  onRetake,
  onConfirm,
}: PhotoPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Preview image - responsive sizing */}
      <div
        className="w-full overflow-hidden rounded-lg"
        style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] }}
      >
        <img
          src={photo.previewUrl}
          alt="Captured photo preview"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 w-full max-w-xs">
        <ThemedButton
          onClick={onRetake}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          Retake
        </ThemedButton>
        <ThemedButton onClick={onConfirm} size="lg" className="flex-1">
          Continue
        </ThemedButton>
      </div>
    </div>
  )
}
```

### 7. Update CapturePhotoRunMode

```typescript
// src/domains/experience/steps/renderers/CapturePhotoRenderer/CapturePhotoRunMode.tsx

// FIND PhotoPreview usage (~line 255-260):
<PhotoPreview
  photo={photo}
  isSquare={isSquare}
  onRetake={retake}
  onConfirm={handleConfirm}
/>

// REPLACE with:
<PhotoPreview
  photo={photo}
  aspectRatio={aspectRatio}
  onRetake={retake}
  onConfirm={handleConfirm}
/>
```

Also update the props interface for CapturePhotoRunMode:

```typescript
// FIND interface (~line 47-54):
interface CapturePhotoRunModeProps {
  step: StepRendererProps['step']
  aspectRatio: '1:1' | '9:16'
  isSquare: boolean
  // ...
}

// REPLACE with:
interface CapturePhotoRunModeProps {
  step: StepRendererProps['step']
  aspectRatio: '1:1' | '9:16' | '3:2' | '2:3'
  // Remove isSquare - no longer needed
  // ...
}
```

---

## Validation

After implementing, run:

```bash
cd apps/clementine-app

# Type check
pnpm type-check

# Lint and format
pnpm check

# Run tests
pnpm test
```

---

## Testing Checklist

- [ ] Open experience designer, add capture photo step
- [ ] Verify all 4 aspect ratio options appear in dropdown
- [ ] Select 3:2 (Landscape), save, reload - verify persists
- [ ] Select 2:3 (Tall Portrait), save, reload - verify persists
- [ ] Run experience with 3:2 - verify camera shows landscape
- [ ] Run experience with 2:3 - verify camera shows tall portrait
- [ ] Capture photo - verify preview fills available space
- [ ] Test on mobile viewport (320px-428px width)
