# Quickstart: Flatten Transform Configuration

**Feature**: 054-transform-flatten
**Date**: 2026-01-31

## Overview

This refactor flattens `transform.nodes` to a top-level `transformNodes` array in `ExperienceConfig`, simplifying the developer experience.

## Before vs After

### Accessing Transform Nodes

```typescript
// BEFORE
const nodes = config.transform?.nodes ?? []
const hasNodes = config.transform?.nodes?.length > 0

// AFTER
const nodes = config.transformNodes
const hasNodes = config.transformNodes.length > 0
```

### Creating/Updating Config

```typescript
// BEFORE
const updated = {
  ...config,
  transform: {
    ...config.transform,
    nodes: [...config.transform?.nodes ?? [], newNode],
    outputFormat: config.transform?.outputFormat ?? null,
  },
}

// AFTER
const updated = {
  ...config,
  transformNodes: [...config.transformNodes, newNode],
}
```

## Quick Validation

Run from monorepo root:

```bash
# Build shared package first
pnpm --filter @clementine/shared build

# Type check all workspaces
pnpm app:type-check

# Run tests
pnpm app:test
pnpm --filter @clementine/shared test
```

## Key Files Changed

1. **Schema Definition**: `packages/shared/src/schemas/experience/transform.schema.ts`
2. **Experience Config**: `packages/shared/src/schemas/experience/experience.schema.ts`
3. **Transform Operations**: `apps/clementine-app/src/domains/experience/generate/lib/transform-operations.ts`
4. **Job Repository**: `functions/src/repositories/job.ts`

## Search & Replace Patterns

When updating code, search for these patterns:

| Find | Replace With |
|------|--------------|
| `transform?.nodes` | `transformNodes` |
| `transform.nodes` | `transformNodes` |
| `config.transform` | (context-dependent, see operations) |
| `TransformConfig` | Remove or use inline |
| `OutputFormat` | Remove (unused) |

## Removed Exports

The following are no longer available from `@clementine/shared`:

- `transformConfigSchema`
- `outputFormatSchema`
- `outputAspectRatioSchema`
- `TransformConfig` type
- `OutputFormat` type
- `OutputAspectRatio` type

## Preserved Exports

These remain unchanged:

- `transformNodeSchema`
- `TransformNode` type
- `aiImageNodeSchema`
- `AIImageNode` type
- All node config types
