# Implementation Plan: Capture Photo Extend

**Branch**: `035-capture-photo-extend` | **Date**: 2026-01-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/035-capture-photo-extend/spec.md`

## Summary

Extend the CapturePhoto step to support two new aspect ratios (3:2 landscape and 2:3 tall portrait) while improving the photo preview component to use responsive sizing instead of fixed dimensions. This involves updating the schema, config panel, camera module types, capture logic, and preview renderer.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19, TanStack Start, Zod 4.x, Tailwind CSS v4
**Storage**: Firebase Storage (via client SDK)
**Testing**: Vitest
**Target Platform**: Web (mobile-first, 320px-428px primary viewport)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Camera initialization < 2 seconds, photo capture < 500ms
**Constraints**: Mobile-first, touch targets 44x44px minimum
**Scale/Scope**: Single feature enhancement affecting 3-5 files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Feature targets 320px-428px mobile viewport, all aspect ratios designed for mobile |
| II. Clean Code & Simplicity | ✅ PASS | Simple extension of existing enums and CSS, no new abstractions |
| III. Type-Safe Development | ✅ PASS | Zod schema extension, TypeScript union types |
| IV. Minimal Testing Strategy | ✅ PASS | Will add unit tests for new aspect ratio calculations |
| V. Validation Gates | ✅ PASS | Will run `pnpm app:check` and verify against design-system.md |
| VI. Frontend Architecture | ✅ PASS | Client-first, no server changes needed |
| VII. Backend & Firebase | ✅ PASS | No backend changes required |
| VIII. Project Structure | ✅ PASS | Following existing vertical slice in `domains/experience/steps/` |

**Gate Result**: PASS - No violations, proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/035-capture-photo-extend/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/experience/steps/
│   ├── schemas/
│   │   └── capture-photo.schema.ts     # UPDATE: Add 3:2, 2:3 to AspectRatio enum
│   ├── config-panels/
│   │   └── CapturePhotoConfigPanel.tsx # UPDATE: Add new options to dropdown
│   └── renderers/CapturePhotoRenderer/
│       ├── CapturePhotoRunMode.tsx     # UPDATE: Pass aspectRatio prop correctly
│       └── components/
│           └── PhotoPreview.tsx        # UPDATE: Responsive sizing
└── shared/camera/
    ├── types/
    │   └── camera.types.ts             # UPDATE: Extend AspectRatio type
    ├── lib/
    │   └── capture.ts                  # UPDATE: Add aspect ratio values
    └── components/
        └── CameraView.tsx              # UPDATE: Add CSS aspect-ratio mappings
```

**Structure Decision**: Existing vertical slice architecture in `domains/experience/steps/` with shared camera module. No new directories needed.

## Complexity Tracking

> No violations - this section is empty.
