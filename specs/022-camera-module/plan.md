# Implementation Plan: Camera Module

**Branch**: `022-camera-module` | **Date**: 2025-12-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-camera-module/spec.md`

## Summary

Build a self-contained, reusable camera feature module that encapsulates the complete photo capture flow (permission requests, live camera preview, photo capture, review/confirmation) into a single `CameraCapture` container component with lifecycle callbacks. The module will be storage-agnostic, allowing consumers to handle upload and domain logic, while providing graceful degradation to file upload when camera is unavailable.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 16
**Primary Dependencies**: Native browser APIs (MediaDevices/getUserMedia), React hooks, Tailwind CSS v4, shadcn/ui
**Storage**: N/A - Module is storage-agnostic by design; consumers handle storage
**Testing**: Jest with React Testing Library (co-located tests)
**Target Platform**: Mobile-first web (iOS Safari, Android Chrome); Desktop secondary (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Next.js App Router monorepo)
**Performance Goals**: Photo capture flow < 30 seconds; permission prompt → viewfinder < 1 second
**Constraints**: HTTPS required for camera access; must work on 320px-768px viewport; 44x44px minimum touch targets
**Scale/Scope**: Single reusable component; ~10 files; integration with Experience Engine (future)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px (capture button 64x64px recommended), readable typography (≥14px)
- [x] **Clean Code & Simplicity**: Single responsibility component with callback API, no premature abstraction, reuses existing step-primitives
- [x] **Type-Safe Development**: TypeScript strict mode, typed interfaces (CapturedPhoto, CameraCaptureError), Zod validation for file type checking
- [x] **Minimal Testing Strategy**: Jest unit tests for hook logic and state machine, integration tests for component (70%+ coverage goal)
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: N/A - Module is storage-agnostic; no Firebase operations (consumers handle storage)
- [x] **Feature Module Architecture**: Follows vertical slice pattern in `features/camera/` with organized subdirectories
- [x] **Technical Standards**: Mobile-first responsive design, TypeScript strict, Tailwind CSS v4

**Complexity Violations**: None - This feature follows existing patterns and doesn't introduce new architectural complexity.

## Project Structure

### Documentation (this feature)

```text
specs/022-camera-module/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── component-api.md # Component prop interface documentation
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/features/camera/
├── components/
│   ├── CameraCapture.tsx       # Main container component (public API)
│   ├── CameraViewfinder.tsx    # Live camera preview
│   ├── PhotoReview.tsx         # Review captured photo
│   ├── PermissionPrompt.tsx    # Permission request UI
│   ├── LibraryPicker.tsx       # File input wrapper
│   ├── CameraControls.tsx      # Capture, flip, library buttons
│   ├── ErrorState.tsx          # Error display with fallback
│   └── index.ts                # Barrel exports
├── hooks/
│   ├── useCamera.ts            # Camera stream management hook
│   ├── useCameraPermission.ts  # Permission state hook
│   ├── usePhotoCapture.ts      # Photo capture logic hook
│   └── index.ts                # Barrel exports
├── lib/
│   ├── capture.ts              # Canvas capture utility
│   ├── image-utils.ts          # Image processing utilities
│   └── index.ts                # Barrel exports
├── schemas/
│   ├── camera.schemas.ts       # Zod schemas for file validation
│   └── index.ts                # Barrel exports
├── types/
│   ├── camera.types.ts         # TypeScript interfaces
│   └── index.ts                # Barrel exports
├── constants.ts                # Error codes, default config
└── index.ts                    # Public API (CameraCapture, types only)

web/src/app/(admin)/dev-tools/
├── page.tsx                    # Dev tools landing (redirect)
├── layout.tsx                  # Dev tools layout
└── camera/
    └── page.tsx                # Camera testing playground
```

**Structure Decision**: Follows existing feature module pattern observed in `features/experiences/`, `features/projects/`, etc. Uses vertical slice architecture with components, hooks, lib, schemas, and types subdirectories. Dev tools route follows App Router conventions.

## Complexity Tracking

> No violations - feature follows existing patterns without introducing new complexity.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| N/A       | N/A        | N/A                                  |
