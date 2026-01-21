# Implementation Plan: Transform Pipeline Foundation & Schema

**Branch**: `036-transform-foundation` | **Date**: 2026-01-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/036-transform-foundation/spec.md`

## Summary

Establish the data model foundation for the transform pipeline feature by:

1. **Consolidating schemas into shared kernel** (`packages/shared/`) - Session, Experience, Event, Project, Workspace, and new Job schemas as single source of truth for both app and functions
2. **Adding step naming** - `name` field on base step schema
3. **Adding transform configuration** - `transform` field on ExperienceConfig
4. **Adding job tracking** - New Job document schema and `jobStatus` on Session

This phase focuses on schema changes and shared kernel consolidation - no UI or backend processing implementation.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: Zod 4.1.12, TanStack Start 1.132.0, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (client SDK + Admin SDK for functions)
**Testing**: Vitest
**Target Platform**: Web (mobile-first), Firebase Cloud Functions (Node.js)
**Project Type**: pnpm monorepo with apps/packages structure
**Performance Goals**: Schema validation < 10ms, Firestore operations < 500ms
**Constraints**: Backward-compatible with existing experiences/sessions, no breaking changes
**Scale/Scope**: ~15 schema files in shared kernel, app imports updated, 1 security rules update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Schema-only changes, no UI in this phase |
| II. Clean Code & Simplicity | ✅ PASS | Consolidation reduces duplication, follows DRY |
| III. Type-Safe Development | ✅ PASS | Zod schemas with strict TypeScript, runtime validation |
| IV. Minimal Testing Strategy | ✅ PASS | Schema validation tests for new types |
| V. Validation Gates | ✅ PASS | Will run `pnpm app:check` and type-check before completion |
| VI. Frontend Architecture | ✅ PASS | Client-first pattern maintained, Firebase SDK for data |
| VII. Backend & Firebase | ✅ PASS | Security rules follow allow-reads, deny-writes pattern |
| VIII. Project Structure | ✅ PASS | Shared kernel in packages/shared, domain logic stays in app |

**Complexity Justification**: None required - consolidation reduces complexity by establishing single source of truth.

## Project Structure

### Documentation (this feature)

```text
specs/036-transform-foundation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A for schema-only feature)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code - Shared Kernel (NEW STRUCTURE)

```text
packages/shared/src/
├── index.ts                           # Re-exports all schemas
├── schemas/
│   ├── index.ts                       # Barrel export for all schemas
│   │
│   ├── session/
│   │   ├── index.ts
│   │   └── session.schema.ts          # CONSOLIDATED: Full session schema with jobStatus
│   │
│   ├── job/
│   │   ├── index.ts
│   │   └── job.schema.ts              # NEW: Job document schema
│   │
│   ├── experience/
│   │   ├── index.ts
│   │   ├── experience.schema.ts       # MOVE: From app, with transform field
│   │   ├── step.schema.ts             # MOVE: Base step only (id, type, name, config)
│   │   └── transform.schema.ts        # NEW: TransformConfig schema
│   │
│   ├── event/
│   │   ├── index.ts
│   │   ├── project-event.schema.ts    # MOVE: Full event document schema
│   │   └── project-event-config.schema.ts  # MOVE: Event config schema
│   │
│   ├── project/
│   │   ├── index.ts
│   │   └── project.schema.ts          # MOVE: From entities/project/
│   │
│   └── workspace/
│       ├── index.ts
│       └── workspace.schema.ts        # MOVE: From entities/workspace/
│
└── entities/                          # REMOVE: Consolidate into schemas/
```

### Source Code - App (IMPORTS UPDATED)

```text
apps/clementine-app/src/
├── domains/
│   ├── experience/
│   │   ├── shared/schemas/
│   │   │   ├── index.ts               # RE-EXPORT from @clementine/shared
│   │   │   └── experience.schema.ts   # REMOVE: Use shared
│   │   └── steps/schemas/
│   │       ├── step.schema.ts         # KEEP: Discriminated union of all 8 step configs
│   │       ├── capture-photo.schema.ts # KEEP: Step-specific configs
│   │       └── ... (other steps)       # KEEP: Step-specific configs
│   │
│   ├── session/
│   │   └── shared/schemas/
│   │       ├── index.ts               # RE-EXPORT from @clementine/shared
│   │       └── session.schema.ts      # REMOVE: Use shared
│   │
│   ├── event/
│   │   └── shared/schemas/
│   │       ├── index.ts               # RE-EXPORT from @clementine/shared
│   │       └── project-event-*.ts     # REMOVE: Use shared
│   │
│   └── project/
│       └── shared/schemas/
│           └── index.ts               # RE-EXPORT from @clementine/shared

# Firebase Functions
functions/src/
└── lib/schemas/
    └── (imports from @clementine/shared)  # Use shared kernel

# Firebase Configuration
firebase/
├── firestore.rules                    # UPDATE: Add /projects/{projectId}/jobs/{jobId} rules
└── firestore.indexes.json             # UPDATE: Add job query indexes
```

### Import Pattern After Consolidation

```typescript
// In app code - import from shared or domain re-exports
import { sessionSchema, type Session } from '@clementine/shared'
// or
import { sessionSchema, type Session } from '@/domains/session/shared/schemas'

// In functions code - import directly from shared
import { sessionSchema, jobSchema, type Session, type Job } from '@clementine/shared'
```

**Structure Decision**:
- Shared kernel grouped by domain (`schemas/session/`, `schemas/experience/`, etc.)
- Entities folder removed - consolidated into schemas
- App domains re-export from shared for local imports
- Step-specific configs (8 step types) stay in app - not needed by functions

## Complexity Tracking

> No violations - consolidation reduces complexity by establishing single source of truth.

## Migration Notes

### Files to Move

| From | To | Notes |
|------|-----|-------|
| `apps/.../session/shared/schemas/session.schema.ts` | `packages/shared/src/schemas/session/` | Add jobStatus field |
| `apps/.../experience/shared/schemas/experience.schema.ts` | `packages/shared/src/schemas/experience/` | Add transform field |
| `apps/.../event/shared/schemas/project-event-full.schema.ts` | `packages/shared/src/schemas/event/` | As-is |
| `apps/.../event/shared/schemas/project-event-config.schema.ts` | `packages/shared/src/schemas/event/` | As-is |
| `packages/shared/src/entities/project/` | `packages/shared/src/schemas/project/` | Rename entities → schemas |
| `packages/shared/src/entities/workspace/` | `packages/shared/src/schemas/workspace/` | Rename entities → schemas |

### Files to Create

| File | Description |
|------|-------------|
| `packages/shared/src/schemas/job/job.schema.ts` | New job document schema |
| `packages/shared/src/schemas/experience/transform.schema.ts` | New transform config schema |
| `packages/shared/src/schemas/experience/step.schema.ts` | Base step schema (simplified) |

### Files to Remove

| File | Replacement |
|------|-------------|
| `packages/shared/src/entities/` | Moved to `schemas/` |
| `packages/shared/src/schemas/session.schemas.ts` | Replaced by `schemas/session/session.schema.ts` |
| App domain schema files | Re-export from shared |

### Import Updates Required

- All app imports of moved schemas → import from `@clementine/shared` or domain re-exports
- All functions imports → import from `@clementine/shared`
- Remove old `entities` imports
