# Implementation Plan: Experience-Level Aspect Ratio & Overlay System

**Branch**: `065-exp-aspect-ratio-overlays` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/065-exp-aspect-ratio-overlays/spec.md`

## Summary

Establish the Experience Output Aspect Ratio as the single source of truth for all downstream systems. This involves:

1. **Unifying aspect ratio definitions** in `schemas/media/` with a canonical set
2. **Extending overlay configuration** from 2 aspect ratios (1:1, 9:16) to 5 (1:1, 3:2, 2:3, 9:16, default)
3. **Updating the overlay editor UI** to support all aspect ratio slots
4. **Resolving overlay choice at job creation** in `startTransformPipeline.ts` (not at execution)
5. **Flattening job snapshot** with `overlayChoice` field (removing `projectContext`)
6. **Simplifying backend transform** to use pre-resolved `overlayChoice`

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, React 19, Firebase SDK 12.5.0, Zod 4.1.12, FFmpeg
**Storage**: Firebase Firestore (NoSQL), Firebase Storage (media files)
**Testing**: Vitest
**Target Platform**: Web (mobile-first), Firebase Cloud Functions (Node.js)
**Project Type**: Monorepo (pnpm workspaces) - apps/clementine-app + functions/ + packages/shared/
**Performance Goals**: Overlay resolution < 500ms, page load < 2s on 4G, AI transformation < 60s
**Constraints**: Mobile-first (320px-768px primary), 44x44px min touch targets
**Scale/Scope**: ~50 files modified across 3 packages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Overlay editor UI already mobile-responsive; camera UI respects mobile constraints |
| II. Clean Code & Simplicity | ✅ PASS | Simplified by flattening job schema; overlay resolution in one place |
| III. Type-Safe Development | ✅ PASS | Zod schemas for all aspect ratios; TypeScript strict mode |
| IV. Minimal Testing Strategy | ✅ PASS | Focus on critical paths: overlay resolution, aspect ratio validation |
| V. Validation Gates | ✅ PASS | Will run `pnpm app:check` before commits; review against design-system.md |
| VI. Frontend Architecture | ✅ PASS | Client-first pattern maintained; Firestore security rules enforced |
| VII. Backend & Firebase | ✅ PASS | Overlay storage via Admin SDK; reads via Client SDK |
| VIII. Project Structure | ✅ PASS | Extends existing vertical slices in project-config, experience domains |

**Standards to Review Before Completion**:
- `frontend/design-system.md` - UI components for overlay editor
- `frontend/component-libraries.md` - shadcn/ui patterns
- `backend/firestore.md` - Overlay storage patterns
- `global/zod-validation.md` - Schema definitions

## Project Structure

### Documentation (this feature)

```text
specs/065-exp-aspect-ratio-overlays/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/shared/
└── src/schemas/
    ├── media/
    │   ├── media-reference.schema.ts    # Existing
    │   ├── aspect-ratio.schema.ts       # NEW: Canonical aspect ratio definitions
    │   └── index.ts                     # UPDATE: Export aspect-ratio
    ├── experience/
    │   ├── steps/capture-photo.schema.ts  # UPDATE: Import from media/aspect-ratio
    │   └── outcome.schema.ts              # UPDATE: Import from media/aspect-ratio
    ├── project/
    │   └── project-config.schema.ts       # UPDATE: Extend overlays to 5 slots
    └── job/
        └── job.schema.ts                  # UPDATE: Flatten with overlayChoice, remove projectContext

apps/clementine-app/
└── src/domains/
    ├── project-config/
    │   └── settings/
    │       ├── components/
    │       │   ├── OverlaySection.tsx     # UPDATE: Support all aspect ratios
    │       │   └── OverlayFrame.tsx       # UPDATE: Add default overlay variant
    │       └── hooks/
    │           └── useUpdateOverlays.ts   # UPDATE: Handle new aspect ratios
    └── experience/
        ├── steps/config-panels/
        │   └── CapturePhotoConfigPanel.tsx  # UPDATE: Sync with experience output ratio
        └── create/
            ├── lib/model-options.ts         # UPDATE: Import canonical ratios
            └── components/PromptComposer/   # Review: Ensure aspect ratio sync

functions/
└── src/
    ├── callable/
    │   └── startTransformPipeline.ts      # UPDATE: Resolve overlayChoice at job creation
    ├── repositories/
    │   ├── job.ts                         # UPDATE: buildJobSnapshot with overlayChoice
    │   └── project.ts                     # NEW: fetchProject for overlay resolution
    └── services/transform/
        ├── operations/
        │   └── applyOverlay.ts            # SIMPLIFY: Remove resolution logic
        └── outcomes/
            └── imageOutcome.ts            # SIMPLIFY: Use snapshot.overlayChoice directly
```

**Structure Decision**: Existing monorepo structure is preserved. Aspect ratio schema placed in `media/` folder alongside related media schemas. Job snapshot flattened by removing `projectContext` wrapper and adding `overlayChoice` directly. Overlay resolution moved from backend transform to callable function.

## Complexity Tracking

> No constitution violations identified. Feature follows existing patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | — | — |
