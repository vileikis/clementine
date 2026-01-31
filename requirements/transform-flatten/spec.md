# Refactor: Flatten Transform Configuration

**Created**: 2026-01-31
**Status**: Proposed
**Branch**: TBD

## Summary

Flatten the `transform.nodes` array to the top level of `ExperienceConfig` as `transformNodes`, and remove the `outputFormat` field entirely. This simplifies the schema by eliminating unnecessary nesting while maintaining semantic clarity.

## Current Structure

```typescript
// experience.schema.ts
experienceConfigSchema = {
  steps: Step[],                    // Collect tab data
  transform: {                      // Nested container
    nodes: TransformNode[],         // AI processing nodes
    outputFormat: OutputFormat | null  // Post-processing (unused)
  } | null
}
```

**Problems with current structure:**

1. **Unnecessary nesting** - `transform.nodes` requires null-checking and deep access patterns
2. **Asymmetric with steps** - `steps` is top-level, but conceptually parallel `nodes` is nested
3. **outputFormat is unused** - It's semantically another transformation, not a special case
4. **Premature abstraction** - Pipeline-level settings don't exist yet; wrapper adds no value

## Proposed Structure

```typescript
// experience.schema.ts
experienceConfigSchema = {
  steps: Step[],                    // Collect tab data
  transformNodes: TransformNode[],  // Generate tab data (flattened)
}
```

**Benefits:**

1. **Simpler access** - `config.transformNodes` vs `config.transform?.nodes ?? []`
2. **Consistent** - Both `steps` and `transformNodes` are top-level arrays
3. **YAGNI** - Remove `outputFormat` until actually needed
4. **Clearer naming** - `transformNodes` is explicit about what it contains

## Rationale

### Why flatten nodes?

The `transform` wrapper was intended to group "AI processing concerns" together. However:

- The only content is `nodes[]` and unused `outputFormat`
- Pipeline-level settings (enabled, maxRetries, etc.) don't exist
- If needed later, a dedicated `transformSettings` field can be added

### Why remove outputFormat?

`outputFormat` performs resize/crop/compress operations. This is semantically a transformation node, not a special pipeline output step. Options:

- **A) Convert to node type** - Add `transform.resize` node type
- **B) Remove entirely (chosen)** - Add when actually needed

We chose **B** because:
- No current use case for post-processing separate from node output
- AI Image nodes already define their output aspect ratio
- YAGNI - add complexity when there's a real requirement

### Future extensibility

If pipeline-level settings are needed later:

```typescript
experienceConfigSchema = {
  steps: Step[],
  transformNodes: TransformNode[],
  transformSettings: {              // Add when needed
    enabled: boolean,
    maxRetries: number,
    // etc.
  }
}
```

This keeps arrays separate from configuration, which is cleaner than nesting arrays inside config objects.

## Schema Changes

### packages/shared/src/schemas/experience/transform.schema.ts

**Before:**
```typescript
export const transformConfigSchema = z.looseObject({
  nodes: z.array(transformNodeSchema).default([]),
  outputFormat: outputFormatSchema.nullable().default(null),
})
```

**After:**
```typescript
// Remove transformConfigSchema entirely
// Export transformNodeSchema directly for use in experience.schema.ts

// Remove outputFormatSchema and outputAspectRatioSchema
```

### packages/shared/src/schemas/experience/experience.schema.ts

**Before:**
```typescript
export const experienceConfigSchema = z.looseObject({
  steps: z.array(experienceStepSchema).default([]),
  transform: transformConfigSchema.nullable().default(null),
})
```

**After:**
```typescript
export const experienceConfigSchema = z.looseObject({
  steps: z.array(experienceStepSchema).default([]),
  transformNodes: z.array(transformNodeSchema).default([]),
})
```

## Migration Requirements

### Firestore Data Migration

Existing documents need migration from:
```json
{
  "draft": {
    "steps": [...],
    "transform": {
      "nodes": [...],
      "outputFormat": null
    }
  }
}
```

To:
```json
{
  "draft": {
    "steps": [...],
    "transformNodes": [...]
  }
}
```

**Migration script needed**: Move `draft.transform.nodes` → `draft.transformNodes` and `published.transform.nodes` → `published.transformNodes`.

### Code Changes Required

| Location | Change |
|----------|--------|
| `packages/shared/src/schemas/experience/transform.schema.ts` | Remove `transformConfigSchema`, `outputFormatSchema`, `outputAspectRatioSchema` |
| `packages/shared/src/schemas/experience/experience.schema.ts` | Replace `transform` with `transformNodes` |
| `apps/clementine-app/.../ExperienceGeneratePage.tsx` | Update to use `transformNodes` |
| `apps/clementine-app/.../TransformPipelineEditor.tsx` | Update to use `transformNodes` |
| `apps/clementine-app/.../useUpdateTransformConfig.ts` | Update field path |
| `functions/src/http/startTransformPipeline.ts` | Update to read `transformNodes` |
| `functions/src/tasks/transformPipelineJob.ts` | Update to read `transformNodes` |
| `functions/src/repositories/job.ts` | Update snapshot building |

### Type Changes

**Before:**
```typescript
type ExperienceConfig = {
  steps: Step[]
  transform: TransformConfig | null
}

type TransformConfig = {
  nodes: TransformNode[]
  outputFormat: OutputFormat | null
}
```

**After:**
```typescript
type ExperienceConfig = {
  steps: Step[]
  transformNodes: TransformNode[]
}

// TransformConfig type removed
// OutputFormat type removed
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration misses documents | Low | High | Run migration in transaction, verify counts |
| Code references old path | Medium | Medium | TypeScript will catch most; grep for `transform.nodes` and `.transform?.` |
| Job snapshots break | Low | High | Update snapshot building before migration |

## Success Criteria

- [ ] Schema compiles with no TypeScript errors
- [ ] All frontend components use `transformNodes`
- [ ] All Cloud Functions use `transformNodes`
- [ ] Migration script moves all existing data
- [ ] Existing experiences load correctly after migration
- [ ] New experiences create with `transformNodes: []` default

## Open Questions

None - decision is clear based on discussion.

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-31 | Flatten `transform.nodes` to `transformNodes` | Simpler access, consistent with `steps`, YAGNI |
| 2026-01-31 | Remove `outputFormat` entirely | Semantically a node, not special; unused; add when needed |
| 2026-01-31 | Name field `transformNodes` not `nodes` | Explicit naming avoids ambiguity |
