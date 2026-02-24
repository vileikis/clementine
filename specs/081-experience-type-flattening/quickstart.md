# Quickstart: Experience Type Flattening

**Feature Branch**: `081-experience-type-flattening`
**Date**: 2026-02-24

## Prerequisites

- Node.js 18+
- pnpm 10.18.1
- Firebase CLI (`npm install -g firebase-tools`)
- Access to Firebase project credentials (for production migration only)

## Setup

```bash
# Switch to feature branch
git checkout 081-experience-type-flattening

# Install dependencies
pnpm install

# Build shared package (schemas must be built first)
pnpm --filter @clementine/shared build
```

## Development Workflow

### 1. Schema Changes (packages/shared)

Start here — all other changes depend on the schema.

```bash
# Watch mode for shared package
cd packages/shared
pnpm dev

# Run schema tests
pnpm test
```

Key files to modify:
- `packages/shared/src/schemas/experience/experience.schema.ts` — Add `experienceTypeSchema`, update `experienceConfigSchema` and `experienceSchema`
- `packages/shared/src/schemas/experience/outcome.schema.ts` — Per-type configs remain, `outcomeSchema` wrapper removed
- `packages/shared/src/schemas/job/job.schema.ts` — Update `jobSnapshotSchema`
- `packages/shared/src/schemas/index.ts` — Update exports

### 2. Frontend Changes (apps/clementine-app)

```bash
# Start dev server
pnpm app:dev

# Type-check as you go
pnpm app:type-check
```

Key files to modify:
- `apps/clementine-app/src/domains/experience/library/components/CreateExperienceForm.tsx`
- `apps/clementine-app/src/domains/experience/library/components/ProfileSelector.tsx` → Replace with `ExperienceTypePicker`
- `apps/clementine-app/src/domains/experience/library/components/ProfileBadge.tsx` → Replace with `TypeBadge`
- `apps/clementine-app/src/domains/experience/library/containers/ExperiencesPage.tsx` — Update filter tabs
- `apps/clementine-app/src/domains/experience/create/components/CreateTabForm.tsx` — Read from flattened config
- `apps/clementine-app/src/domains/experience/create/components/outcome-picker/OutcomeTypePicker.tsx` → Remove
- `apps/clementine-app/src/domains/experience/create/components/outcome-picker/OutcomeTypeSelector.tsx` → Rename to `ExperienceTypeSwitch.tsx`
- `apps/clementine-app/src/domains/experience/create/hooks/useUpdateOutcome.ts` → Rename to `useUpdateExperienceConfig.ts`
- `apps/clementine-app/src/domains/experience/create/hooks/useOutcomeValidation.ts` → Rename to `useExperienceConfigValidation.ts`
- `apps/clementine-app/src/domains/experience/create/lib/outcome-operations.ts` → Rename to `experience-config-operations.ts`
- `apps/clementine-app/src/domains/experience/create/components/outcome-picker/RemoveOutcomeAction.tsx` → Rename to `ClearTypeConfigAction.tsx`
- `apps/clementine-app/src/domains/experience/shared/types/profile.types.ts` → Replace with type metadata

### 3. Backend Changes (functions)

```bash
# Build functions
cd functions
pnpm build

# Type-check
pnpm tsc --noEmit
```

Key files to modify:
- `functions/src/repositories/job.ts` — Update `buildJobSnapshot`
- `functions/src/services/transform/engine/runOutcome.ts` — Update dispatcher
- `functions/src/services/transform/outcomes/aiImageOutcome.ts` — Read from `snapshot.aiImage`
- `functions/src/services/transform/outcomes/aiVideoOutcome.ts` — Read from `snapshot.aiVideo`
- `functions/src/services/transform/outcomes/photoOutcome.ts` — Read from `snapshot.photo`
- `functions/src/callable/startTransformPipeline.ts` — Update validation

### 4. Migration Script

```bash
# Create migration script
# Location: functions/scripts/migrations/081-experience-type-flattening.ts

# Test with emulators (dry run)
cd functions
pnpm tsx scripts/migrations/081-experience-type-flattening.ts --dry-run

# Test with emulators (live)
pnpm tsx scripts/migrations/081-experience-type-flattening.ts

# Run against production (dry run first!)
pnpm tsx scripts/migrations/081-experience-type-flattening.ts --production --dry-run
pnpm tsx scripts/migrations/081-experience-type-flattening.ts --production
```

## Validation

```bash
# From monorepo root
pnpm --filter @clementine/shared build && pnpm --filter @clementine/shared test
pnpm app:check          # Format + lint fix
pnpm app:type-check     # TypeScript strict
pnpm app:test           # Unit tests
pnpm functions:build    # Functions build check
```

## Dependency Order

Changes must be applied in this order:

1. **Schema** (packages/shared) — Foundation for all other changes
2. **Backend** (functions) — Update snapshot builder and outcome executors
3. **Frontend** (apps/clementine-app) — Update UI components and data access
4. **Migration script** (functions/scripts) — Written last, run before deploy
5. **Dead code removal** — Remove deprecated schemas, components, types

## Key Risks

| Risk | Mitigation |
|------|-----------|
| Schema changes break shared consumers | Build shared package first, then fix consumers |
| Migration data loss | Dry-run mode, test with emulators first |
| Missed references to old paths | TypeScript strict mode catches most; grep for `outcome.type`, `outcome.aiImage`, `profile`, `useUpdateOutcome`, `OutcomeType` |
| Snapshot format mismatch | No in-flight jobs during migration (pre-launch) |
