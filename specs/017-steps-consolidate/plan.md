# Implementation Plan: Steps Consolidation (Experience-Scoped Steps)

**Branch**: `017-steps-consolidate` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-steps-consolidate/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the steps module to be experience-scoped (instead of journey-scoped), consolidate duplicated step logic between `features/steps/actions/` and `features/experiences/actions/steps.ts`, add a new `ai-transform` step type for AI-powered photo transformations, and remove the deprecated `experience-picker` step type. This aligns with Phase 3 of the scalable architecture roadmap.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20+
**Primary Dependencies**: Next.js 16, React 19, Zod 4.x, Firebase Admin SDK, shadcn/ui
**Storage**: Firebase Firestore (`/experiences/{experienceId}/steps/{stepId}`)
**Testing**: Jest (unit tests co-located with source)
**Target Platform**: Web (mobile-first 320px-768px, desktop secondary)
**Project Type**: Web application (pnpm monorepo)
**Performance Goals**: Page load < 2 seconds, AI transformation < 60 seconds
**Constraints**: Mobile-first design, offline-capable not required
**Scale/Scope**: ~50 max steps per experience, admin dashboard + guest flow

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: AI Transform step editor will be mobile-first (320px-768px), touch targets ≥44x44px per MFR-001/002/003
- [x] **Clean Code & Simplicity**: Consolidating duplicate code (experiences/actions/steps.ts → steps/actions), no new abstractions, YAGNI applied
- [x] **Type-Safe Development**: TypeScript strict mode, Zod schemas for AiTransformConfig (TSR-001), all action params validated (TSR-002)
- [x] **Minimal Testing Strategy**: Jest unit tests for critical step CRUD operations, co-located with source
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test, build) before completion per SC-004/005/006
- [x] **Firebase Architecture Standards**: Admin SDK for writes via Server Actions (FAR-001), schemas in `features/steps/schemas/` (FAR-003), atomic batch writes for reordering (FAR-002)
- [x] **Feature Module Architecture**: Steps module self-contained in `features/steps/`, barrel exports, restricted public API
- [x] **Technical Standards**: Applicable standards from `standards/global/feature-modules.md` and `standards/backend/firebase.md` reviewed

**Complexity Violations**: None - this feature simplifies the codebase by removing duplicate code and consolidating step management.

### Post-Design Verification (Phase 1 Complete)

Re-evaluation after completing design artifacts:

- [x] **Mobile-First**: AiTransformEditor design follows existing mobile-first editor patterns (see quickstart.md)
- [x] **Type-Safe**: AiTransformConfig and AiTransformVariable schemas defined with Zod refinements (see data-model.md)
- [x] **Firebase Standards**: Batch writes documented for atomic create/delete operations (see research.md Topic 8)
- [x] **Feature Module**: All changes contained within steps, experiences, and sessions modules per vertical slice architecture
- [x] **API Contracts**: Server actions and hooks contracts defined (see contracts/)

**Design Gate Status**: PASSED - Ready for task generation (/speckit.tasks)

## Project Structure

### Documentation (this feature)

```text
specs/017-steps-consolidate/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/src/features/
├── steps/                        # PRIMARY - Steps module (experience-scoped)
│   ├── types/
│   │   ├── step.types.ts         # UPDATE: Add ai-transform, remove experience-picker
│   │   └── index.ts
│   ├── schemas/
│   │   ├── step.schemas.ts       # UPDATE: Add AiTransformConfig schema
│   │   └── index.ts
│   ├── constants.ts              # UPDATE: Add ai-transform defaults, meta
│   ├── repositories/
│   │   ├── steps.repository.ts   # UPDATE: experienceId param (not eventId/journeyId)
│   │   └── index.ts
│   ├── actions/
│   │   ├── steps.ts              # UPDATE: Consolidate experience-scoped actions
│   │   ├── step-media.ts         # Keep as-is
│   │   └── index.ts
│   ├── hooks/                    # UPDATE: Remove journey references
│   ├── components/
│   │   ├── editors/
│   │   │   ├── AiTransformEditor.tsx    # NEW: AI transform step editor
│   │   │   └── ...existing editors
│   │   ├── preview/
│   │   └── index.ts
│   └── index.ts
│
├── experiences/                  # MODIFY - Remove duplicate step actions
│   ├── actions/
│   │   ├── experiences.ts        # Keep experience CRUD
│   │   ├── steps.ts              # DELETE: FR-013
│   │   └── index.ts              # UPDATE: Remove steps export
│   ├── hooks/
│   │   ├── useStepMutations.ts   # UPDATE: Import from @/features/steps/actions
│   │   └── ...others
│   └── ...
│
├── sessions/                     # MODIFY - Update to use experience repository
│   ├── actions/
│   │   └── sessions.actions.ts   # UPDATE: Use experience repo (FR-010)
│   └── ...
│
└── journeys/                     # NO CHANGES - Legacy, will be removed in Phase 2
    └── ...
```

**Structure Decision**: This feature modifies existing feature modules following vertical slice architecture. The steps module becomes the single source of truth for all step operations, scoped to experiences instead of journeys.

## Complexity Tracking

> No violations - this feature reduces complexity by consolidating duplicate code.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
