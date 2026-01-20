# Data Model: Capture Photo Extend

**Feature**: 035-capture-photo-extend
**Date**: 2026-01-20

## Overview

This feature extends existing data types. No new entities are introduced. No database/Firestore schema changes required.

---

## Type Extensions

### 1. AspectRatio (Camera Module)

**Location**: `apps/clementine-app/src/shared/camera/types/camera.types.ts`

```typescript
// BEFORE
export type AspectRatio = '3:4' | '1:1' | '9:16'

// AFTER
export type AspectRatio = '3:4' | '1:1' | '9:16' | '3:2' | '2:3'
```

**Validation**: TypeScript union type (compile-time only)

---

### 2. AspectRatio (Step Schema)

**Location**: `apps/clementine-app/src/domains/experience/steps/schemas/capture-photo.schema.ts`

```typescript
// BEFORE
export const aspectRatioSchema = z.enum(['1:1', '9:16'])

// AFTER
export const aspectRatioSchema = z.enum(['1:1', '9:16', '3:2', '2:3'])
```

**Validation**: Zod enum (runtime validation)
**Default**: `'1:1'` (unchanged)

---

### 3. CapturePhotoStepConfig

**Location**: `apps/clementine-app/src/domains/experience/steps/schemas/capture-photo.schema.ts`

No structural changes. The inferred type automatically includes new aspect ratio values:

```typescript
export type CapturePhotoStepConfig = z.infer<typeof capturePhotoStepConfigSchema>
// Result: { aspectRatio: '1:1' | '9:16' | '3:2' | '2:3' }
```

---

## Constant Extensions

### 1. ASPECT_RATIO_VALUES

**Location**: `apps/clementine-app/src/shared/camera/lib/capture.ts`

```typescript
// BEFORE
const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  '3:4': 3 / 4,
  '1:1': 1,
  '9:16': 9 / 16,
}

// AFTER
const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  '3:4': 3 / 4,   // 0.75
  '1:1': 1,       // 1.0
  '9:16': 9 / 16, // 0.5625
  '3:2': 3 / 2,   // 1.5 (landscape)
  '2:3': 2 / 3,   // 0.667 (tall portrait)
}
```

---

### 2. ASPECT_RATIO_CSS

**Location**: `apps/clementine-app/src/shared/camera/components/CameraView.tsx`

```typescript
// BEFORE
const ASPECT_RATIO_CSS: Record<AspectRatio, string> = {
  '3:4': '3 / 4',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
}

// AFTER
const ASPECT_RATIO_CSS: Record<AspectRatio, string> = {
  '3:4': '3 / 4',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
  '2:3': '2 / 3',
}
```

---

### 3. ASPECT_RATIO_OPTIONS (Config Panel)

**Location**: `apps/clementine-app/src/domains/experience/steps/config-panels/CapturePhotoConfigPanel.tsx`

```typescript
// BEFORE
const ASPECT_RATIO_OPTIONS: EditorOption<AspectRatio>[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '9:16', label: 'Portrait (9:16)' },
]

// AFTER
const ASPECT_RATIO_OPTIONS: EditorOption<AspectRatio>[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '3:2', label: 'Landscape (3:2)' },
  { value: '2:3', label: 'Tall Portrait (2:3)' },
]
```

---

## Aspect Ratio Reference

| Ratio | Numeric Value | Orientation | CSS Value | Use Case |
|-------|---------------|-------------|-----------|----------|
| 1:1 | 1.0 | Square | `1 / 1` | Profile photos, social media posts |
| 9:16 | 0.5625 | Tall Portrait | `9 / 16` | Stories, reels, full-screen mobile |
| 3:2 | 1.5 | Landscape | `3 / 2` | Traditional photo, DSLR-style |
| 2:3 | 0.667 | Tall Portrait | `2 / 3` | Portrait photos, between 1:1 and 9:16 |
| 3:4 | 0.75 | Portrait | `3 / 4` | (Internal camera module only) |

---

## State Transitions

No new state transitions. The `PhotoCaptureStatus` state machine remains unchanged:

```
idle → camera-active → photo-preview → uploading → (complete)
                    ↘ error ↗
```

---

## Persistence

**Firestore**: No changes. `CapturePhotoStepConfig.aspectRatio` is stored as a string field. New values are valid strings.

**Migration**: Not required. Existing documents with `'1:1'` or `'9:16'` continue to work.
