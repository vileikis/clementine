# Implementation Plan: Experience Preview Controls

**Branch**: `033-exp-preview-controls` | **Date**: 2026-01-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/033-exp-preview-controls/spec.md`

## Summary

Refactor `ExperiencePreviewModal` to reuse the `FullscreenOverlay` component from `@/shared/preview-shell` instead of implementing custom fullscreen modal logic. Add mobile/desktop viewport switching capability to match other preview components (Welcome, Theme, Share editors). This eliminates code duplication and provides consistent UX across all preview experiences.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: React 19, TanStack Start, shadcn/ui, Radix UI, Zustand
**Storage**: Zustand with localStorage persistence (viewport mode preference)
**Testing**: Vitest (unit tests)
**Target Platform**: Web (mobile-first, responsive)
**Project Type**: Web application (TanStack Start)
**Performance Goals**: Instant viewport switching (<100ms), smooth transitions
**Constraints**: Mobile-first design, must preserve existing session creation/execution functionality
**Scale/Scope**: Single component refactor + viewport integration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Adding mobile viewport preview supports mobile-first testing |
| II. Clean Code & Simplicity | ✅ PASS | Reducing duplication by reusing shared components |
| III. Type-Safe Development | ✅ PASS | Using existing typed preview-shell exports |
| IV. Minimal Testing Strategy | ✅ PASS | No new test requirements for UI refactor |
| V. Validation Gates | ✅ PASS | Will run format, lint, type-check before commit |
| VI. Frontend Architecture | ✅ PASS | Client-first pattern maintained |
| VII. Backend & Firebase | N/A | No backend changes |
| VIII. Project Structure | ✅ PASS | Reusing shared module, maintaining domain structure |

**Applicable Standards**:
- `frontend/design-system.md` - Using theme tokens, no hard-coded colors
- `frontend/component-libraries.md` - Reusing shadcn/ui and shared components
- `global/code-quality.md` - Clean, simple refactor

## Project Structure

### Documentation (this feature)

```text
specs/033-exp-preview-controls/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── shared/preview-shell/          # Existing shared module (no changes needed)
│   ├── components/
│   │   ├── FullscreenOverlay.tsx  # Reuse as-is
│   │   ├── DeviceFrame.tsx        # Reuse as-is
│   │   ├── ViewportSwitcher.tsx   # Reuse as-is
│   │   └── ...
│   ├── hooks/
│   │   ├── useFullscreen.ts       # Reuse as-is
│   │   └── useViewport.ts         # Reuse as-is
│   ├── store/
│   │   └── viewportStore.ts       # Reuse for persistence
│   └── context/
│       └── ViewportContext.tsx    # Reuse for viewport-aware rendering
│
└── domains/experience/preview/
    └── containers/
        └── ExperiencePreviewModal.tsx  # MODIFY: Refactor to use FullscreenOverlay
```

**Structure Decision**: This is a refactor of an existing component to use shared infrastructure. No new files are created; only `ExperiencePreviewModal.tsx` is modified to consume existing preview-shell exports.

## Complexity Tracking

> No violations identified. This refactor reduces complexity by eliminating custom fullscreen logic.
