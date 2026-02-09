# Implementation Plan: Camera Adaptive Width

**Branch**: `067-camera-adaptive-width` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/067-camera-adaptive-width/spec.md`

## Summary

Refactor the camera capture UI to use a strict two-zone layout (Preview Zone + Controls Zone) that adapts to any device and aspect ratio while keeping controls always accessible. The camera view uses CSS `object-fit: contain` behavior to display within its container with letterboxing/pillarboxing as needed. Photo Review uses a cleaner layout without the black container styling.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: React 19, TanStack Start, Tailwind CSS v4, shadcn/ui components
**Storage**: N/A (layout changes only)
**Testing**: Vitest (unit tests)
**Target Platform**: Web (mobile-first: iOS Safari, Android Chrome, desktop browsers)
**Project Type**: Web application (TanStack Start app)
**Performance Goals**: 60fps during layout changes, no janky transitions on orientation change
**Constraints**: Safe-area insets support (iOS), responsive to all aspect ratios (1:1, 2:3, 3:2, 9:16)
**Scale/Scope**: 3 components to modify (CameraActive, PhotoPreview, UploadProgress)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Primary use case is mobile guests; layout adapts to all viewports |
| II. Clean Code & Simplicity | ✅ PASS | Refactoring existing components, no new abstractions needed |
| III. Type-Safe Development | ✅ PASS | TypeScript strict mode, all props already typed |
| IV. Minimal Testing Strategy | ✅ PASS | Layout changes testable manually; unit tests for CSS calculations if needed |
| V. Validation Gates | ✅ PASS | Will run `pnpm app:check` before commit; review design-system.md compliance |
| VI. Frontend Architecture | ✅ PASS | Client-side components only, no data layer changes |
| VII. Backend & Firebase | N/A | No backend changes |
| VIII. Project Structure | ✅ PASS | Modifying existing domain components in correct location |

**Standards Compliance Review Required**:
- `frontend/design-system.md` - Must use theme tokens (bg-black is standard Tailwind, acceptable for camera container)
- `frontend/component-libraries.md` - Using existing ThemedButton, ThemedIconButton from shared/theming

## Project Structure

### Documentation (this feature)

```text
specs/067-camera-adaptive-width/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # N/A - no data model changes
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A - no API changes
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/experience/steps/renderers/CapturePhotoRenderer/
│   ├── components/
│   │   ├── CameraActive.tsx       # MODIFY: Two-zone layout with contain behavior
│   │   ├── PhotoPreview.tsx       # MODIFY: Clean preview zone without container styling
│   │   └── UploadProgress.tsx     # MODIFY: Consistent two-zone layout
│   └── CapturePhotoRunMode.tsx    # REVIEW: May need layout wrapper adjustments
└── shared/camera/
    └── components/
        └── CameraView.tsx         # REVIEW: Verify contain behavior works correctly
```

**Structure Decision**: Modifications to existing domain components. No new files needed. All changes within the established vertical slice architecture.

## Complexity Tracking

> No complexity violations - implementation follows existing patterns with refinements.

## Design Decisions

### Two-Zone Layout Architecture

```
┌─────────────────────────────────────┐
│                                     │
│         Preview Zone (flex-1)       │
│    ┌───────────────────────────┐    │
│    │                           │    │
│    │   Camera/Photo Content    │    │ ← Aspect-ratio preserved
│    │   (contain behavior)      │    │   with letterboxing
│    │                           │    │
│    └───────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│         Controls Zone               │ ← Fixed height, safe-area aware
│    [Library]  [Capture]  [Switch]   │
│              pb-safe-area           │
└─────────────────────────────────────┘
```

### Key CSS Techniques

1. **Two-Zone Layout**:
   - Outer container: `flex flex-col h-full`
   - Preview zone: `flex-1 min-h-0` (fills remaining space)
   - Controls zone: Fixed padding, `pb-[env(safe-area-inset-bottom)]`

2. **Contain Behavior for Camera View**:
   - Container: `flex items-center justify-center` (centers content)
   - Camera: CSS `aspect-ratio` + `max-width: 100%` + `max-height: 100%` + `object-fit: contain`
   - Result: Camera view fits within container preserving aspect ratio, extra space shows container background (black)

3. **Photo Review (Clean Layout)**:
   - No black container wrapper (no `bg-black rounded-2xl`)
   - Preview fills available space with same contain behavior
   - Consistent margins maintain visual alignment

4. **Safe-Area Handling**:
   - Controls zone: `pb-[env(safe-area-inset-bottom,1rem)]` (fallback padding)
   - Ensures controls never overlap iOS home indicator

### Component Changes Summary

| Component | Current State | Target State |
|-----------|--------------|--------------|
| CameraActive | `max-h-[70vh]` container | Two-zone with contain, remove vh constraint |
| PhotoPreview | Black rounded container | Clean preview without container, same two-zone |
| UploadProgress | Centered column layout | Two-zone layout matching CameraActive |
