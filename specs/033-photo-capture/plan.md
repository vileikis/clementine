# Implementation Plan: Photo Capture (E5.2)

**Branch**: `033-photo-capture` | **Date**: 2026-01-17 | **Spec**: [epic-e5.2-photo-capture.md](../../requirements/epic-e5.2-photo-capture.md)
**Input**: Feature specification from `requirements/epic-e5.2-photo-capture.md`

## Summary

Implement photo capture functionality for the guest experience, enabling guests to take photos during experience execution with camera integration, themed UI, and storage upload. This builds on the existing `shared/camera` module's primitives (CameraView, useCameraPermission) and integrates with the step renderer system established in E5.

**Technical approach:**
- Extract `usePhotoCapture` orchestration hook from existing camera patterns
- Enhance `CapturePhotoRenderer` to use camera hooks + themed components
- Integrate with Firebase Storage for photo uploads
- Update runtime store with captured media persistence

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**:
- TanStack Start 1.132.0
- React 19.2.0
- Zustand 5.x (state management)
- Zod 4.1.12 (validation)
- Firebase SDK 12.5.0 (Storage, Firestore)

**Storage**: Firebase Storage (client SDK direct upload) + Firestore (session metadata)
**Testing**: Vitest + Testing Library (existing coverage in `shared/camera`)
**Target Platform**: Web (mobile-first, Chrome/Safari/Firefox, HTTPS required)
**Project Type**: Web application - TanStack Start monorepo

**Performance Goals**:
- Camera permission request < 1s response
- Photo capture < 500ms
- Upload to Firebase Storage < 5s on 4G
- Page load < 2s (constitution requirement)

**Constraints**:
- Mobile-first (320px-768px primary viewport)
- Touch targets ≥ 44x44px
- HTTPS required for camera API
- Aspect ratios: 1:1, 9:16

**Scale/Scope**: Single step renderer, 1 new hook, extends existing camera module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Camera UI designed for mobile viewports, touch-optimized buttons |
| II. Clean Code & Simplicity | ✅ PASS | Hook-based architecture, single responsibility per layer |
| III. Type-Safe Development | ✅ PASS | Zod schemas for configs, strict TypeScript, validated camera types |
| IV. Minimal Testing Strategy | ✅ PASS | Existing camera tests, add renderer tests for critical flows |
| V. Validation Gates | ✅ PASS | Run `pnpm app:check` before commits, review design-system compliance |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase Storage SDK, no server functions needed |
| VII. Backend & Firebase | ✅ PASS | Direct Storage upload via client SDK, existing security rules |
| VIII. Project Structure | ✅ PASS | Follows vertical slice in `experience/steps/renderers`, camera in `shared/camera` |

**Standards Compliance:**
- `frontend/design-system.md` - Use ThemedButton, ThemedText, StepLayout
- `frontend/component-libraries.md` - Extend existing shadcn/ui patterns
- `global/project-structure.md` - Follow step renderer patterns
- `backend/firestore.md` - Use existing session/media patterns

## Project Structure

### Documentation (this feature)

```text
specs/033-photo-capture/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal contracts only)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── shared/camera/
│   ├── hooks/
│   │   ├── useCameraPermission.ts     # REUSE - permission state hook
│   │   ├── useLibraryPicker.ts        # REUSE - file picker hook
│   │   └── usePhotoCapture.ts         # NEW - capture orchestration hook
│   ├── lib/
│   │   ├── permission-utils.ts        # NEW - extract isMobileBrowser(), getDeniedInstructions()
│   │   └── ...                        # Existing utilities (capture.ts, etc.)
│   ├── components/
│   │   ├── CameraView.tsx             # REUSE - video element only
│   │   ├── CameraControls.tsx         # NOT REUSED - stays for CameraCapture container
│   │   ├── PhotoReview.tsx            # NOT REUSED - stays for CameraCapture container
│   │   └── PermissionPrompt.tsx       # NOT REUSED - stays for CameraCapture container
│   ├── types/
│   │   └── camera.types.ts            # Existing - extend with hook types
│   └── index.ts                       # Update exports (add permission-utils)
│
├── domains/experience/steps/
│   ├── renderers/
│   │   ├── CapturePhotoRenderer.tsx   # UPDATE - full camera integration
│   │   └── StepLayout.tsx             # Existing - responsive layout
│   └── registry/
│       └── step-validation.ts         # UPDATE - capture step validation
│
├── domains/session/shared/
│   ├── hooks/
│   │   └── useUpdateSessionProgress.ts # Existing - for capturedMedia sync
│   └── schemas/
│       └── session.schema.ts          # Existing - CapturedMedia type
│
└── integrations/firebase/
    └── client.ts                      # Existing - storage instance
```

**Structure Decision**: Follows existing patterns - camera primitives in `shared/camera`, step renderer in `domains/experience/steps/renderers`, session persistence in `domains/session`.

**Key Architectural Decision**: `CapturePhotoRenderer` builds its own themed UI using `ThemedButton`, `ThemedText`, and `StepLayout`. It does NOT reuse `PermissionPrompt`, `PhotoReview`, `CameraControls`, or `ErrorState` components from `shared/camera`. Those components remain for the `CameraCapture` container (used by dev tools). Only hooks (`useCameraPermission`, `useLibraryPicker`), `CameraView`, and extracted utilities (`getDeniedInstructions`) are reused.

## Complexity Tracking

No violations required. The implementation uses established patterns:
- Hook-based camera module (existing)
- Step renderer pattern (existing)
- Firebase Storage client SDK (existing)
- Zustand store for runtime state (existing)

---

## Post-Design Constitution Re-Check

*Performed after Phase 1 design completion.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Mobile-First Design | ✅ PASS | Design uses existing mobile-optimized components (ThemedButton, StepLayout) |
| II. Clean Code & Simplicity | ✅ PASS | Single new hook (`usePhotoCapture`), follows existing patterns, no over-engineering |
| III. Type-Safe Development | ✅ PASS | All new types defined in data-model.md, Zod schemas for validation |
| IV. Minimal Testing Strategy | ✅ PASS | Unit tests for new hook, manual testing checklist in quickstart.md |
| V. Validation Gates | ✅ PASS | Validation workflow documented, standards compliance reviewed |
| VI. Frontend Architecture | ✅ PASS | Client-first upload via Firebase Storage SDK, no server functions |
| VII. Backend & Firebase | ✅ PASS | Uses existing storage path pattern, existing security rules sufficient |
| VIII. Project Structure | ✅ PASS | New hook in `shared/camera`, renderer update in domain, clear separation |

**Design Artifacts Generated:**
- `research.md` - All unknowns resolved
- `data-model.md` - Types and state machine documented
- `contracts/` - Hook and renderer contracts defined
- `quickstart.md` - Implementation guide with testing checklist

**Ready for Phase 2**: Task generation via `/speckit.tasks`
