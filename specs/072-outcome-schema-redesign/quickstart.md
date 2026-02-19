# Quickstart: Outcome Schema Redesign — Photo & AI Photo

**Branch**: `072-outcome-schema-redesign` | **Date**: 2026-02-19

## Prerequisites

- Node.js 18+
- pnpm 10.18.1
- Firebase CLI
- Access to Firebase project (for migration testing)

## Setup

```bash
# Switch to feature branch
git checkout 072-outcome-schema-redesign

# Install dependencies
pnpm install

# Build shared package first (other packages depend on it)
pnpm --filter @clementine/shared build
```

## Development Workflow

### 1. Schema Changes (start here)

```bash
cd packages/shared

# Watch mode for schema development
pnpm dev

# Run tests after changes
pnpm test

# Type check
pnpm build
```

Changes to the shared package require rebuilding before the app or functions can see them.

### 2. Frontend Development

```bash
# From monorepo root
pnpm app:dev

# Or from app directory
cd apps/clementine-app
pnpm dev
```

Key files to modify:
- `src/domains/experience/create/components/CreateTabForm/` — Main editor form and sub-components
- `src/domains/experience/create/hooks/` — Outcome mutation and validation hooks
- `src/domains/experience/create/lib/` — Pure outcome operations and constants
- `src/domains/experience/shared/schemas/` — App-level schema re-exports

### 3. Backend Development

```bash
cd functions

# Build
pnpm build

# Serve locally with emulators
pnpm serve
```

Key files to modify:
- `src/services/transform/outcomes/` — Outcome executors
- `src/services/transform/engine/runOutcome.ts` — Dispatcher
- `src/callable/startTransformPipeline.ts` — Job creation

### 4. Migration Script

```bash
cd functions

# Dry run (read-only, shows what would change)
npx tsx scripts/migrations/072-outcome-schema-redesign.ts --dry-run

# Production run (requires credentials)
npx tsx scripts/migrations/072-outcome-schema-redesign.ts --production
```

## Validation

```bash
# Shared package
pnpm --filter @clementine/shared build && pnpm --filter @clementine/shared test

# Frontend
pnpm app:type-check && pnpm app:lint

# Backend
pnpm functions:build

# All-in-one format + lint fix
pnpm app:check
```

## Key Architecture Notes

1. **Schema is the source of truth** — Change `packages/shared` first, then update consumers.
2. **Per-type configs are nullable** — All default to `null`. Only the active type's config is populated.
3. **Type switching preserves configs** — Changing `outcome.type` does NOT clear other type's config fields.
4. **Aspect ratio cascades** — Changing aspect ratio in outcome config must also update the referenced capture step.
5. **`z.looseObject()`** — Used for backward compatibility during migration window. Old fields are ignored.
6. **Coordinated deployment** — Schema, frontend, backend, and migration must deploy together.
