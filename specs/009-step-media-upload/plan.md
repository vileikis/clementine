# Implementation Plan: Step Media Upload

**Branch**: `009-step-media-upload` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-step-media-upload/spec.md`

## Summary

Replace the manual URL text input for `mediaUrl` in step editors with a media upload component supporting images (JPG, PNG, WebP), videos (MP4, WebM), GIFs, and Lottie JSON animations. Media is stored at company level for reuse across events/journeys/steps. The `lottie-react` library renders Lottie animations. Remove action unlinks media from step without deleting from storage.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Firebase Storage (Admin SDK), lottie-react, Zod 4.x
**Storage**: Firebase Storage with company-level paths: `media/{companyId}/{mediaType}/{timestamp}-{filename}`
**Testing**: Jest unit tests (co-located with source)
**Target Platform**: Web (mobile-first responsive design)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Upload + preview display < 5 seconds for files under 5MB
**Constraints**: File size limits: 10MB images/GIFs, 25MB videos, 5MB Lottie
**Scale/Scope**: 11 step editor types, 1 new shared upload component, 1 new server action

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Upload button 44x44px min touch target, preview scales to viewport, 14px+ error text
- [x] **Clean Code & Simplicity**: Single upload component reused across all editors, follows existing patterns (ImageUploadField, PreviewMediaUpload)
- [x] **Type-Safe Development**: Zod validation for file types/sizes, discriminated union for media types, strict mode maintained
- [x] **Minimal Testing Strategy**: Unit tests for validation logic and type detection, component tests for upload flow
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test tasks before completion
- [x] **Firebase Architecture Standards**: Admin SDK for uploads via Server Action, public URLs stored in Firestore, schemas in `features/steps/schemas/`
- [x] **Feature Module Architecture**: New code in `features/steps/` following vertical slice pattern
- [x] **Technical Standards**: Follows existing upload patterns from `lib/storage/actions.ts` and `features/experiences/actions/photo-media.ts`

**Complexity Violations**: None - this feature follows established patterns.

## Project Structure

### Documentation (this feature)

```text
specs/009-step-media-upload/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── step-media.ts    # Server action contract
└── checklists/
    └── requirements.md  # Specification checklist
```

### Source Code (repository root)

```text
web/src/
├── features/steps/
│   ├── actions/
│   │   ├── index.ts                    # UPDATE: export step-media
│   │   ├── steps.ts                    # EXISTING
│   │   ├── step-media.ts               # NEW: upload server action
│   │   └── types.ts                    # EXISTING
│   ├── components/
│   │   ├── editors/
│   │   │   ├── BaseStepEditor.tsx      # UPDATE: integrate StepMediaUpload
│   │   │   └── [11 type editors]       # UPDATE: pass companyId prop
│   │   └── shared/
│   │       └── StepMediaUpload.tsx     # NEW: upload component
│   ├── schemas/
│   │   └── step.schemas.ts             # UPDATE: add mediaType field
│   ├── types/
│   │   └── step.types.ts               # UPDATE: add StepMediaType
│   └── utils/
│       ├── index.ts                    # UPDATE: export new utils
│       ├── media-type.ts               # NEW: type detection
│       └── lottie-validation.ts        # NEW: Lottie structure validation
├── features/preview-runtime/
│   └── components/
│       └── step-renderers/             # UPDATE: render by mediaType
└── components/shared/
    └── LottiePlayer.tsx                # NEW: reusable Lottie wrapper
```

**Structure Decision**: All new code lives in `features/steps/` following the vertical slice architecture. A shared `LottiePlayer` component is created in `components/shared/` for potential reuse outside step context.

## Complexity Tracking

> No violations - feature follows established patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
