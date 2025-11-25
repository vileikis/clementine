# Implementation Plan: Experiences Feature Refactor

**Branch**: `002-experiences-refactor` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-experiences-refactor/spec.md`

## Summary

Refactor the **existing** Experiences feature module (`web/src/features/experiences/`) from a subcollection architecture to a top-level `/experiences` collection following the normalized Firestore design. This is a modification of existing code, not a greenfield implementation.

**Key changes to existing code**:

1. **Schema** (`schemas/experiences.schemas.ts`): Replace `eventId` with `companyId` + `eventIds[]`, rename `label` → `name`, remove `hidden`, split `aiConfig` into type-specific configs
2. **Repository** (`repositories/experiences.repository.ts`): Change queries from subcollection to `where eventIds array-contains eventId`
3. **Server Actions** (`actions/*.ts`): Update all create/update actions to use new schema fields
4. **Components**: Update props and data access to use new field names

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Zod 4.x, Firebase (Firestore + Storage)
**Storage**: Firestore `/experiences` collection, Firebase Storage for media
**Testing**: Jest for unit tests, React Testing Library for components
**Target Platform**: Web (mobile-first responsive, 320px-768px primary)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Page load < 2s on 4G, experience list renders < 500ms
**Constraints**: Mobile-first UX, real-time updates for experience changes
**Scale/Scope**: ~100 experiences per company, ~10 experiences per event

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px)
- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied, single responsibility maintained
- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, Zod validation for external inputs
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (70%+ coverage goal), tests co-located with source
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: Admin SDK for writes/server-side, Client SDK for real-time reads, schemas in feature module, public images stored as full URLs
- [x] **Technical Standards**: Applicable standards from `standards/` reviewed and referenced

**Complexity Violations**: None. This is a refactor of existing patterns to align with data-model-v4.

## Project Structure

### Documentation (this feature)

```text
specs/002-experiences-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Server Actions API)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code - Existing Module (to be modified)

```text
web/src/features/experiences/
├── actions/                          # Server Actions - MODIFY
│   ├── gif-create.ts                 # Update: companyId, eventIds[], name
│   ├── gif-update.ts                 # Update: new field names
│   ├── photo-create.ts               # Update: companyId, eventIds[], name
│   ├── photo-media.ts                # Review: storage paths
│   ├── photo-update.ts               # Update: new field names
│   ├── shared.ts                     # Update: shared utilities
│   ├── types.ts                      # Update: action types
│   ├── utils.ts                      # Review: utility functions
│   └── index.ts
├── components/
│   ├── shared/                       # Shared components - MODIFY
│   │   ├── AITransformSettings.tsx   # Update: aiPhotoConfig/aiVideoConfig
│   │   ├── BaseExperienceFields.tsx  # Update: name instead of label
│   │   ├── CreateExperienceForm.tsx  # Update: new schema
│   │   ├── DeleteExperienceButton.tsx
│   │   ├── ExperienceEditor.tsx      # Update: new field names
│   │   ├── ExperienceEditorHeader.tsx
│   │   ├── ExperienceEditorWrapper.tsx
│   │   ├── ExperiencesList.tsx       # Update: query by eventIds
│   │   ├── ExperiencesSidebar.tsx    # Update: query by eventIds
│   │   ├── ExperienceTypeSelector.tsx
│   │   ├── PreviewMediaCompact.tsx
│   │   ├── PreviewMediaUpload.tsx
│   │   └── index.ts
│   ├── photo/                        # Photo-specific - MODIFY
│   │   ├── CountdownSettings.tsx
│   │   ├── OverlaySettings.tsx
│   │   ├── PhotoExperienceEditor.tsx # Update: aiPhotoConfig
│   │   └── index.ts
│   ├── gif/                          # GIF-specific - MODIFY
│   │   ├── GifCaptureSettings.tsx
│   │   ├── GifExperienceEditor.tsx   # Update: aiPhotoConfig
│   │   └── index.ts
│   └── index.ts
├── repositories/                     # Data access - MODIFY
│   ├── experiences.repository.ts     # Update: eventIds array-contains query
│   └── index.ts
├── schemas/                          # Zod schemas - MAJOR CHANGES
│   ├── experiences.schemas.ts        # Rewrite: new schema structure
│   ├── experiences.schemas.test.ts   # Update: tests for new schema
│   └── index.ts
├── types/                            # TypeScript types - MODIFY
│   ├── experiences.types.ts          # Update: new type definitions
│   └── index.ts
├── constants.ts
└── index.ts
```

**Modification Scope**:
- **Major rewrite**: `schemas/experiences.schemas.ts` (new field structure)
- **Significant changes**: `repositories/`, `actions/` (new query patterns, field names)
- **Field renames in components**: `label` → `name`, `aiConfig` → `aiPhotoConfig`/`aiVideoConfig`
- **Query changes**: All list/fetch operations need `eventIds array-contains` pattern

## Complexity Tracking

> No violations - standard refactor following established patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
