# Research: Capture Photo Extend

**Feature**: 035-capture-photo-extend
**Date**: 2026-01-20
**Status**: Complete

## Overview

Research findings for extending the CapturePhoto step with new aspect ratios (3:2, 2:3) and responsive photo preview sizing.

---

## 1. Current Aspect Ratio Implementation

### Decision
The existing aspect ratio system uses two parallel type definitions:
1. **Step Schema** (`capture-photo.schema.ts`): Zod enum with `'1:1' | '9:16'`
2. **Camera Module** (`camera.types.ts`): TypeScript union with `'3:4' | '1:1' | '9:16'`

### Rationale
The camera module has a broader set of aspect ratios for potential reuse across features, while the step schema defines what's exposed to experience creators. This separation is intentional and should be maintained.

### Findings
- **Schema location**: `apps/clementine-app/src/domains/experience/steps/schemas/capture-photo.schema.ts`
- **Camera types location**: `apps/clementine-app/src/shared/camera/types/camera.types.ts`
- **CSS mapping location**: `apps/clementine-app/src/shared/camera/components/CameraView.tsx` (line 70-74)
- **Capture calculation location**: `apps/clementine-app/src/shared/camera/lib/capture.ts` (line 14-18)

### Current Values
```typescript
// camera.types.ts
export type AspectRatio = '3:4' | '1:1' | '9:16'

// capture.ts
const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  '3:4': 3 / 4,   // 0.75 - portrait
  '1:1': 1,       // 1.0  - square
  '9:16': 9 / 16, // 0.5625 - tall portrait
}

// CameraView.tsx
const ASPECT_RATIO_CSS: Record<AspectRatio, string> = {
  '3:4': '3 / 4',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
}
```

---

## 2. New Aspect Ratio Values

### Decision
Add `'3:2'` (landscape) and `'2:3'` (tall portrait) to both type systems.

### Rationale
- **3:2** (1.5 ratio): Traditional photo format, ideal for landscape shots and DSLR-style photos
- **2:3** (0.667 ratio): Inverse of 3:2, provides a portrait option between 1:1 and 9:16

### Implementation Values
```typescript
// New values to add
'3:2': 3 / 2,   // 1.5 - landscape
'2:3': 2 / 3,   // 0.667 - tall portrait

// CSS aspect-ratio
'3:2': '3 / 2',
'2:3': '2 / 3',
```

### Alternatives Considered
- **4:3 landscape**: Rejected - too similar to existing 3:4 portrait (just inverted)
- **16:9 landscape**: Rejected - very wide, not ideal for mobile portrait devices
- **5:4**: Rejected - too similar to 1:1, doesn't provide meaningful differentiation

---

## 3. Photo Preview Responsive Sizing

### Decision
Replace fixed pixel dimensions with CSS-based responsive sizing using `aspect-ratio` property, matching the CameraView component pattern.

### Rationale
The CameraView component already implements responsive sizing correctly:
```tsx
// CameraView.tsx line 307-318
<div
  className={cn(
    'relative bg-black overflow-hidden',
    aspectRatio ? 'w-full' : 'w-full h-full',
    className,
  )}
  style={
    aspectRatio
      ? { aspectRatio: ASPECT_RATIO_CSS[aspectRatio], maxHeight: '100%' }
      : undefined
  }
>
```

The PhotoPreview component currently uses fixed dimensions:
```tsx
// PhotoPreview.tsx line 27-29
<div
  className={`overflow-hidden rounded-lg ${
    isSquare ? 'w-64 h-64' : 'w-44 h-80'
  }`}
>
```

### Implementation Approach
1. Pass `aspectRatio` prop to PhotoPreview (instead of just `isSquare` boolean)
2. Use CSS `aspect-ratio` property with `w-full` and `max-h-full` constraints
3. Container will scale to fill available space while maintaining aspect ratio

### Findings
- Current fixed sizes: 256x256px (square), 176x320px (portrait)
- These are too small on modern mobile screens (320px+ width)
- CameraView proves the responsive pattern works correctly

---

## 4. Type Synchronization Strategy

### Decision
Update types in this order to maintain type safety:
1. Camera module types (`camera.types.ts`)
2. Camera capture logic (`capture.ts`)
3. CameraView CSS mapping (`CameraView.tsx`)
4. Step schema (`capture-photo.schema.ts`)
5. Config panel options (`CapturePhotoConfigPanel.tsx`)
6. Runtime renderer (`CapturePhotoRunMode.tsx`)
7. Photo preview (`PhotoPreview.tsx`)

### Rationale
Starting from the shared camera module ensures all downstream consumers get the new types. The build will fail if any file is missed due to TypeScript strict mode.

### Alternatives Considered
- Separate type per domain: Rejected - creates sync issues and duplicate definitions
- Generic aspect ratio parser: Rejected - over-engineering for 4 fixed values

---

## 5. Config Panel Labels

### Decision
Use descriptive labels that indicate orientation:

| Value | Label | Description |
|-------|-------|-------------|
| `1:1` | Square (1:1) | (existing) |
| `9:16` | Portrait (9:16) | (existing) |
| `3:2` | Landscape (3:2) | NEW |
| `2:3` | Tall Portrait (2:3) | NEW |

### Rationale
- Labels indicate orientation first (Landscape/Portrait) for quick scanning
- Ratio value in parentheses for technical reference
- Consistent with existing pattern

### Alternatives Considered
- "Photo (3:2)": Rejected - unclear orientation
- "Wide (3:2)": Rejected - less precise than "Landscape"
- "Traditional (3:2)": Rejected - not universally understood

---

## 6. Backward Compatibility

### Decision
No migration needed. Existing experiences with `1:1` or `9:16` continue to work unchanged.

### Rationale
- Adding new enum values to Zod schema doesn't break existing data
- Default remains `1:1` (unchanged)
- No database schema changes required

### Findings
- Default config factory: `createDefaultCapturePhotoConfig()` returns `{ aspectRatio: '1:1' }`
- Schema default: `aspectRatio: aspectRatioSchema.default('1:1')`
- Both remain valid with extended enum

---

## Summary

All research items resolved. The implementation is straightforward:
1. Extend type unions in 2 places (camera module + step schema)
2. Add numeric values and CSS mappings
3. Add config panel options
4. Refactor PhotoPreview from fixed dimensions to responsive `aspect-ratio`

No technical blockers identified. Ready for Phase 1 design artifacts.
