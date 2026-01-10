# Implementation Plan: Experience Data Layer & Event Config Schema

**Branch**: `021-exp-data-layer` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-exp-data-layer/spec.md`

## Summary

Implement the foundational data layer for workspace experiences (Phase 1) and extend event configuration schema to support experience assignments (Phase 2). This creates the CRUD operations for experiences at the workspace level and adds the `experiences` field to event config for main, pregate, and preshare slots.

**Technical approach**: Follow existing domain patterns with Zod schemas, TanStack Query hooks, Firestore real-time subscriptions, and profile validation utilities.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Query 5.66.5, Zod 4.1.12, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (NoSQL) - subcollection pattern at `/workspaces/{workspaceId}/experiences/{experienceId}`
**Testing**: Vitest (unit tests for schemas and validation utilities)
**Target Platform**: Web application (TanStack Start)
**Project Type**: Web application (monorepo with frontend app)
**Performance Goals**: CRUD operations < 2 seconds, list queries < 1 second for 100 experiences
**Constraints**: Client-first architecture, real-time updates via onSnapshot
**Scale/Scope**: Initial feature supporting up to 100 experiences per workspace

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Data layer only, no UI in this feature |
| II. Clean Code & Simplicity | ✅ PASS | Following existing patterns, no new abstractions |
| III. Type-Safe Development | ✅ PASS | Zod schemas + TypeScript strict mode |
| IV. Minimal Testing Strategy | ✅ PASS | Unit tests for schemas and validation only |
| V. Validation Gates | ✅ PASS | Standard validation loop applies |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase SDK |
| VII. Backend & Firebase | ✅ PASS | Client SDK for reads, security rules for access |
| VIII. Project Structure | ✅ PASS | Follows vertical slice architecture in domains/ |

**Applicable Standards**:
- `backend/firestore.md` - Firestore patterns
- `backend/firestore-security.md` - Security rules
- `global/zod-validation.md` - Zod validation patterns
- `global/project-structure.md` - Domain structure

## Project Structure

### Documentation (this feature)

```text
specs/021-exp-data-layer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (not applicable - no REST API)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/
│   ├── experience/
│   │   ├── shared/
│   │   │   ├── schemas/
│   │   │   │   ├── workspace-experience.schema.ts    # Experience document schema
│   │   │   │   ├── experience-reference.schema.ts   # Reference schema for event config
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   │   ├── workspace-experience.types.ts    # TypeScript types
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useWorkspaceExperiences.ts       # List experiences
│   │   │   │   ├── useWorkspaceExperience.ts        # Get single experience
│   │   │   │   ├── useCreateExperience.ts           # Create mutation
│   │   │   │   ├── useUpdateExperience.ts           # Update mutation
│   │   │   │   ├── useDeleteExperience.ts           # Soft delete mutation
│   │   │   │   └── index.ts
│   │   │   ├── queries/
│   │   │   │   ├── workspace-experiences.query.ts   # Query options
│   │   │   │   ├── workspace-experience.query.ts    # Single experience query
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── validation/
│   │   │   ├── profile-rules.ts                     # Profile validation utilities
│   │   │   ├── profile-rules.test.ts                # Co-located test
│   │   │   ├── slot-compatibility.ts                # Slot compatibility checks
│   │   │   ├── slot-compatibility.test.ts           # Co-located test
│   │   │   └── index.ts
│   │   └── index.ts
│   └── event/
│       └── shared/
│           └── schemas/
│               ├── project-event-config.schema.ts   # Updated with experiences field
│               ├── event-experiences-config.schema.ts # New experiences config schema
│               └── experience-release.schema.ts     # Experience release schema

firebase/
└── firestore.rules                                  # Updated with experiences rules
```

**Structure Decision**: Following the existing domain-driven design pattern. Experience domain already has scaffolding from Phase 0. This feature adds the data layer to `experience/shared/` and extends `event/shared/schemas/`.

## Complexity Tracking

> No violations - feature follows established patterns.
