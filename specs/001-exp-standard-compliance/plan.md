# Implementation Plan: Experiences Feature Standards Compliance

**Branch**: `001-exp-standard-compliance` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-exp-standard-compliance/spec.md`

## Summary

Refactor the `web/src/features/experiences/` module to comply with project standards defined in `standards/global/feature-modules.md` and `standards/global/validation.md`. This involves reorganizing folder structure (moving from `lib/` to dedicated `repositories/`, `schemas/`, `types/` folders), applying proper file naming conventions (`[domain].[purpose].ts`), fixing export patterns, removing duplicate components, and ensuring all validation schemas follow Zod v4 best practices.

**Primary goal**: Improve developer experience through consistent, discoverable code organization without changing runtime behavior.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Zod 4.x, Firebase Admin SDK
**Storage**: Firestore (existing nested subcollection pattern - not changing in this refactor)
**Testing**: Jest + React Testing Library (existing tests to be migrated)
**Target Platform**: Web (Next.js App Router)
**Project Type**: Web application (monorepo with `web/` workspace)
**Performance Goals**: N/A (refactoring task - no performance changes)
**Constraints**: Zero runtime behavior changes, all existing tests must pass
**Scale/Scope**: ~38 files, ~6,764 lines of code in experiences feature

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: N/A - Refactoring task with no UI changes
- [x] **Clean Code & Simplicity**: Refactoring improves simplicity by removing duplicate code (AITransformSettings), removing deprecated file (legacy.ts), and eliminating mixed-concern `lib/` folder
- [x] **Type-Safe Development**: TypeScript strict mode maintained, no new `any` types, Zod schemas preserved
- [x] **Minimal Testing Strategy**: Existing tests will be migrated with import path updates only; test logic unchanged
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) after each phase
- [x] **Firebase Architecture Standards**: Repository continues using Admin SDK; no schema location changes beyond feature-internal organization
- [x] **Technical Standards**: This refactor enforces `standards/global/feature-modules.md` and `standards/global/validation.md`

**Complexity Violations**: None - this refactor reduces complexity.

## Project Structure

### Documentation (this feature)

```text
specs/001-exp-standard-compliance/
├── plan.md              # This file
├── research.md          # Phase 0: Current structure analysis and migration strategy
├── data-model.md        # Phase 1: N/A (no data model changes)
├── quickstart.md        # Phase 1: Migration guide for developers
├── contracts/           # Phase 1: N/A (no API changes)
└── tasks.md             # Phase 2: Task breakdown by user story
```

### Source Code (before refactor)

```text
web/src/features/experiences/
├── actions/
│   ├── gif-create.ts
│   ├── gif-update.ts
│   ├── index.ts
│   ├── legacy.ts            # ❌ DEPRECATED - DELETE
│   ├── photo-create.ts
│   ├── photo-media.ts
│   ├── photo-update.ts
│   ├── shared.ts
│   ├── types.ts
│   └── utils.ts
├── components/
│   ├── gif/
│   │   ├── GifCaptureSettings.tsx
│   │   └── GifExperienceEditor.tsx
│   ├── photo/
│   │   ├── AITransformSettings.tsx      # ❌ DUPLICATE - DELETE
│   │   ├── AITransformSettings.test.tsx # ❌ DUPLICATE - DELETE
│   │   ├── CountdownSettings.tsx
│   │   ├── CountdownSettings.test.tsx
│   │   ├── OverlaySettings.tsx
│   │   ├── OverlaySettings.test.tsx
│   │   └── PhotoExperienceEditor.tsx
│   └── shared/
│       ├── AITransformSettings.tsx      # ✅ KEEP (shared version)
│       ├── BaseExperienceFields.tsx
│       ├── CreateExperienceForm.tsx
│       ├── DeleteExperienceButton.tsx
│       ├── ExperienceEditor.tsx
│       ├── ExperienceEditor.test.tsx
│       ├── ExperienceEditorHeader.tsx
│       ├── ExperienceEditorWrapper.tsx
│       ├── ExperienceTypeSelector.tsx
│       ├── ExperiencesList.tsx
│       ├── ExperiencesSidebar.tsx
│       ├── PreviewMediaCompact.tsx
│       ├── PreviewMediaUpload.tsx
│       └── PreviewMediaUpload.test.tsx
├── hooks/                    # ❌ EMPTY - DELETE
├── lib/                      # ❌ MIXED CONCERNS - MIGRATE & DELETE
│   ├── constants.ts          # → constants.ts (root)
│   ├── repository.ts         # → repositories/experiences.repository.ts
│   ├── schemas.ts            # → schemas/experiences.schemas.ts
│   └── schemas.test.ts       # → schemas/experiences.schemas.test.ts
└── index.ts
```

### Source Code (after refactor)

```text
web/src/features/experiences/
├── actions/
│   ├── gif-create.ts
│   ├── gif-update.ts
│   ├── index.ts             # Types-only barrel (unchanged)
│   ├── photo-create.ts
│   ├── photo-media.ts
│   ├── photo-update.ts
│   ├── shared.ts
│   ├── types.ts
│   └── utils.ts
├── components/
│   ├── gif/
│   │   ├── GifCaptureSettings.tsx
│   │   ├── GifExperienceEditor.tsx
│   │   └── index.ts         # NEW barrel export
│   ├── photo/
│   │   ├── CountdownSettings.tsx
│   │   ├── CountdownSettings.test.tsx
│   │   ├── OverlaySettings.tsx
│   │   ├── OverlaySettings.test.tsx
│   │   ├── PhotoExperienceEditor.tsx
│   │   └── index.ts         # NEW barrel export
│   ├── shared/
│   │   ├── AITransformSettings.tsx
│   │   ├── BaseExperienceFields.tsx
│   │   ├── CreateExperienceForm.tsx
│   │   ├── DeleteExperienceButton.tsx
│   │   ├── ExperienceEditor.tsx
│   │   ├── ExperienceEditor.test.tsx
│   │   ├── ExperienceEditorHeader.tsx
│   │   ├── ExperienceEditorWrapper.tsx
│   │   ├── ExperienceTypeSelector.tsx
│   │   ├── ExperiencesList.tsx
│   │   ├── ExperiencesSidebar.tsx
│   │   ├── PreviewMediaCompact.tsx
│   │   ├── PreviewMediaUpload.tsx
│   │   ├── PreviewMediaUpload.test.tsx
│   │   └── index.ts         # NEW barrel export
│   └── index.ts             # Barrel re-exporting from subfolders
├── repositories/            # NEW folder
│   ├── experiences.repository.ts
│   ├── experiences.repository.test.ts   # Future test location
│   └── index.ts
├── schemas/                 # NEW folder
│   ├── experiences.schemas.ts
│   ├── experiences.schemas.test.ts
│   └── index.ts
├── types/                   # NEW folder
│   ├── experiences.types.ts
│   └── index.ts
├── constants.ts             # MOVED from lib/
└── index.ts                 # Public API (components, types only)
```

**Structure Decision**: Web application following feature-modules.md standard with technical concern separation.

## Complexity Tracking

> No complexity violations - this refactor reduces complexity by:
> - Removing duplicate component (AITransformSettings)
> - Removing deprecated code (legacy.ts)
> - Eliminating mixed-concern folder (lib/)
> - Adding clear folder structure per standards
