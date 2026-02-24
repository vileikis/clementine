# Implementation Plan: Experience Type Flattening

**Branch**: `081-experience-type-flattening` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/081-experience-type-flattening/spec.md`

## Summary

Unify `experience.profile` and `outcome.type` into a single `experience.type` field. Flatten outcome configuration from `experience.draft.outcome.aiImage` to `experience.draft.aiImage`. Update all consumers (frontend components, backend pipeline, job snapshots) and write a Firestore migration script. This is a pre-launch structural refactor — no backward compatibility logic needed.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: TanStack Start 1.132.0, React 19, Zod 4.1.12, Firebase SDK 12.5.0, Firebase Admin SDK, shadcn/ui
**Storage**: Firebase Firestore (NoSQL), Firebase Storage (media files)
**Testing**: Vitest (unit tests)
**Target Platform**: Web (mobile-first) + Firebase Cloud Functions (Node.js)
**Project Type**: Monorepo (pnpm workspaces) — apps/clementine-app, functions, packages/shared
**Performance Goals**: No new performance requirements — structural refactor
**Constraints**: Pre-launch migration (no backward compat), no in-flight jobs during deploy
**Scale/Scope**: All existing experience documents in Firestore

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | No new UI layouts; type picker replaces profile picker in existing mobile-optimized forms |
| II. Clean Code & Simplicity | PASS | Reduces nesting, removes dead code (story profile), simplifies creation flow |
| III. Type-Safe Development | PASS | New `experienceTypeSchema` with Zod; all types fully typed; strict mode enforced |
| IV. Minimal Testing Strategy | PASS | Tests for schema changes, migration script; no new E2E needed |
| V. Validation Gates | PASS | Will run format/lint/type-check before commits; standards review before merge |
| VI. Frontend Architecture | PASS | Client-first pattern maintained; Firestore writes via client SDK |
| VII. Backend & Firebase | PASS | Admin SDK for migration script; client SDK for reads; security rules unaffected |
| VIII. Project Structure | PASS | Vertical slice architecture maintained; changes within existing feature modules |

**Gate result**: ALL PASS — no violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/081-experience-type-flattening/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Phase 1 data model changes
├── quickstart.md        # Phase 1 developer setup
├── contracts/           # Phase 1 Firestore schema contracts
│   └── firestore-schema.md
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
packages/shared/
└── src/schemas/
    ├── experience/
    │   ├── experience.schema.ts    # experienceTypeSchema, experienceConfigSchema, experienceSchema
    │   └── outcome.schema.ts       # Per-type config schemas (unchanged), outcomeSchema (removed)
    ├── job/
    │   └── job.schema.ts           # jobSnapshotSchema (flattened)
    └── index.ts                    # Export updates

apps/clementine-app/
└── src/domains/experience/
    ├── library/
    │   ├── components/
    │   │   ├── CreateExperienceForm.tsx   # Use ExperienceTypePicker instead of ProfileSelector
    │   │   ├── ProfileSelector.tsx        # REMOVED → replaced by ExperienceTypePicker
    │   │   ├── ExperienceTypePicker.tsx   # NEW — single-step type selection
    │   │   ├── ProfileBadge.tsx           # REMOVED → replaced by TypeBadge
    │   │   ├── TypeBadge.tsx              # NEW — type badge for library cards
    │   │   └── ExperienceListItem.tsx     # Use TypeBadge instead of ProfileBadge
    │   └── containers/
    │       └── ExperiencesPage.tsx        # Type-based filter tabs (replaces profile tabs)
    ├── create/
    │   ├── components/
    │   │   ├── CreateTabForm.tsx          # Read from experience.type + experience.draft.[type]
    │   │   └── outcome-picker/
    │   │       ├── OutcomeTypePicker.tsx  # REMOVED (type selected at creation)
    │   │       └── OutcomeTypeSelector.tsx # RENAMED → ExperienceTypeSwitch.tsx, writes experience.type
    │   ├── hooks/
    │   │   └── useUpdateOutcome.ts        # RENAMED → useUpdateExperienceConfig.ts
    │   └── lib/
    │       └── outcome-operations.ts      # RENAMED → experience-config-operations.ts
    └── shared/
        └── types/
            └── profile.types.ts           # REPLACED with type-metadata.ts

functions/
├── src/
│   ├── repositories/
│   │   └── job.ts                         # buildJobSnapshot reads flattened config
│   ├── callable/
│   │   └── startTransformPipeline.ts      # Validate experience.type, read flattened config
│   └── services/transform/
│       ├── engine/
│       │   └── runOutcome.ts              # Dispatch on snapshot.type
│       └── outcomes/
│           ├── aiImageOutcome.ts          # Read snapshot.aiImage (was snapshot.outcome.aiImage)
│           ├── aiVideoOutcome.ts          # Read snapshot.aiVideo (was snapshot.outcome.aiVideo)
│           └── photoOutcome.ts            # Read snapshot.photo (was snapshot.outcome.photo)
└── scripts/migrations/
    └── 081-experience-type-flattening.ts  # NEW — migration script
```

**Structure Decision**: Changes are within existing feature module structure. No new directories or modules needed. New components (`ExperienceTypePicker`, `TypeBadge`) replace removed ones in the same locations.

## Phase 0: Research Summary

All research decisions documented in [research.md](./research.md). Key decisions:

1. **Schema flattening**: Remove `outcomeSchema` wrapper, move per-type configs directly onto `experienceConfigSchema`
2. **Job snapshot**: Flatten to mirror experience config structure (`snapshot.type` + `snapshot.[typeConfig]`)
3. **Type enum**: Unified `experienceTypeSchema` = survey + all outcome types
4. **Step categories**: Survey → info/input/capture; all others → info/input/capture/transform
5. **Backend pipeline**: Survey rejected at pipeline entry; executor registry unchanged
6. **Migration**: Follow 072 pattern with dry-run/production flags, idempotent

## Phase 1: Design Summary

### Data Model

Full before/after documented in [data-model.md](./data-model.md). Key changes:

- `experience.profile` → `experience.type` (top-level)
- `experience.draft.outcome.{type}` → `experience.draft.{type}` (one level up)
- `snapshot.outcome.{type}` → `snapshot.{type}` (one level up)
- `outcomeSchema` wrapper → removed
- `experienceProfileSchema` → removed, replaced by `experienceTypeSchema`

### Contracts

Firestore schema contracts documented in [contracts/firestore-schema.md](./contracts/firestore-schema.md). Covers:

- Experience document write contracts (create, type switch, config update)
- Job snapshot write/read contracts
- Migration transformation rules

### Developer Setup

See [quickstart.md](./quickstart.md) for development workflow, dependency order, and validation commands.

## Constitution Check (Post-Design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Type picker designed for mobile touch targets (card-based, same pattern as existing type picker) |
| II. Clean Code & Simplicity | PASS | Removes 1 nesting level, 1 dead profile, 2 redundant components. Net code reduction. |
| III. Type-Safe Development | PASS | `experienceTypeSchema` Zod enum; all consumers typed; migration uses typed transforms |
| IV. Minimal Testing Strategy | PASS | Schema unit tests, migration script tests against emulators |
| V. Validation Gates | PASS | pnpm app:check + type-check + test before merge |
| VI. Frontend Architecture | PASS | Client SDK Firestore writes; no new server-side data fetching |
| VII. Backend & Firebase | PASS | Admin SDK for migration only; Firestore security rules unchanged (collection paths same) |
| VIII. Project Structure | PASS | Vertical slice maintained; new files in existing domain directories |

**Post-design gate result**: ALL PASS — design maintains constitutional compliance.
