# Implementation Plan: Experience System Structural Foundations

**Branch**: `019-exp-system-foundations` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-exp-system-foundations/spec.md`

## Summary

This phase establishes the structural foundations for the Experience System without implementing any UI. The goal is to create domain scaffolding (`domains/experience/`, `domains/session/`), define step registry types, establish the `ExperienceProfile` enum with empty validators, define the runtime engine interface, and create session API shapes. The `activeEventId` field already exists in the project schema. This enables future phases to build on stable contracts without architectural rewrites.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: Zod 4.1.12 (validation), TanStack Query 5.66.5 (data fetching), Firebase SDK 12.5.0 (Firestore)
**Storage**: Firebase Firestore (NoSQL) - subcollection pattern for experiences and sessions
**Testing**: Vitest (unit tests)
**Target Platform**: Web (TanStack Start, React 19.2.0)
**Project Type**: Web application (pnpm monorepo)
**Performance Goals**: N/A for this phase (scaffolding only, no runtime implementation)
**Constraints**: No circular dependencies between domains, backwards compatibility with existing project records
**Scale/Scope**: Type definitions and empty implementations only - no functional code in this phase

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | No UI in this phase |
| II. Clean Code & Simplicity | PASS | Only scaffolding + types, no premature abstractions |
| III. Type-Safe Development | PASS | TypeScript strict mode, Zod schemas for all entities |
| IV. Minimal Testing Strategy | PASS | Focus on type validation, no runtime tests needed |
| V. Validation Gates | PASS | Will run `pnpm app:check` before commit |
| VI. Frontend Architecture | PASS | Following existing domain patterns |
| VII. Backend & Firebase | PASS | Firestore subcollection pattern from architecture doc |
| VIII. Project Structure | PASS | Vertical slice architecture, barrel exports |

**Gate Result**: PASS - No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/019-exp-system-foundations/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts for types-only phase)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/domains/
├── experience/                    # NEW - Core experience domain
│   ├── shared/
│   │   ├── schemas/
│   │   │   ├── experience.schema.ts      # Experience document schema
│   │   │   ├── step-registry.schema.ts   # Step type definitions
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── experience.types.ts       # Experience interfaces
│   │   │   ├── step.types.ts             # Step type interfaces
│   │   │   ├── runtime.types.ts          # Runtime engine interface
│   │   │   ├── profile.types.ts          # ExperienceProfile enum + validators
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
│
├── session/                       # NEW - Session domain
│   ├── shared/
│   │   ├── schemas/
│   │   │   ├── session.schema.ts         # Session document schema
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── session.types.ts          # Session interfaces
│   │   │   ├── session-api.types.ts      # Session API shapes
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
│
└── project/shared/schemas/        # EXISTING - activeEventId already present
    └── project.schema.ts                 # No changes needed
```

**Structure Decision**: Following existing vertical slice architecture pattern with `shared/` subdirectory for cross-subdomain utilities. New domains (`experience/`, `session/`) follow the same pattern as existing domains (`event/`, `workspace/`). The `activeEventId` field already exists in `project/shared/schemas/project.schema.ts` - no modifications needed.

## Complexity Tracking

> **No violations - this section is empty**

The implementation follows existing patterns with no complexity violations. All new code is type definitions and empty implementations following the established domain architecture.
