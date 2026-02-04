# Implementation Plan: Experience Create Outcome Configuration

**Branch**: `059-experience-create` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/059-experience-create/spec.md`

## Summary

Add `create` field to experience config schema and implement publish-time validation for outcome-based generation (image/gif/video). The `CreateOutcome` schema already exists in the shared package - this feature integrates it into the experience config, adds validation during publish, and handles new experience initialization. UI for configuring outcomes is deferred to PRD 2.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: TanStack Query, Zustand, Firebase Firestore, Zod 4.1
**Storage**: Firebase Firestore (client SDK)
**Testing**: Vitest
**Target Platform**: Web (TanStack Start)
**Project Type**: Web application (monorepo with shared package)
**Performance Goals**: Validation completes in <100ms client-side
**Constraints**: Backward compatible with existing experiences (transformNodes preserved)
**Scale/Scope**: All experiences in production (~estimated hundreds)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ N/A | Data model only - no UI in this PRD |
| II. Clean Code & Simplicity | ✅ Pass | Extends existing patterns, no new abstractions |
| III. Type-Safe Development | ✅ Pass | Zod schemas with TypeScript inference |
| IV. Minimal Testing Strategy | ✅ Pass | Unit tests for validation, integration tests for publish |
| V. Validation Gates | ✅ Pass | Technical validation + schema compliance |
| VI. Frontend Architecture | ✅ Pass | Client-first with Firebase client SDK |
| VII. Backend & Firebase | ✅ Pass | Client SDK for reads, mutations through validated code |
| VIII. Project Structure | ✅ Pass | Vertical slice in experience domain |

**Gate Status**: ✅ PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/059-experience-create/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (validation contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/experience/
├── create-outcome.schema.ts       # ✅ EXISTS - outcome configuration schema
├── experience.schema.ts           # MODIFY - add create field to ExperienceConfig
└── index.ts                       # MODIFY - export create outcome types

apps/clementine-app/src/domains/experience/
├── designer/
│   └── hooks/
│       └── usePublishExperience.ts    # MODIFY - add create outcome validation
├── shared/
│   ├── hooks/
│   │   └── useCreateExperience.ts     # MODIFY - initialize create defaults
│   └── lib/
│       └── create-outcome-validation.ts  # CREATE - validation logic
└── shared/schemas/
    └── index.ts                       # MODIFY - re-export from shared package
```

**Structure Decision**: Extends existing vertical slice architecture in experience domain. Validation logic isolated in `shared/lib/` for reuse across designer and publish flows.

## Complexity Tracking

> No violations identified. Implementation follows existing patterns without new abstractions.
