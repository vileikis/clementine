# Data Model: Flatten Transform Configuration

**Feature**: 054-transform-flatten
**Date**: 2026-01-31

## Entity Changes

### ExperienceConfig (MODIFIED)

**Before**:
```typescript
export const experienceConfigSchema = z.looseObject({
  steps: z.array(experienceStepSchema).default([]),
  transform: transformConfigSchema.nullable().default(null),
})

// Where transformConfigSchema was:
export const transformConfigSchema = z.looseObject({
  nodes: z.array(transformNodeSchema).default([]),
  outputFormat: outputFormatSchema.nullable().default(null),
})
```

**After**:
```typescript
export const experienceConfigSchema = z.looseObject({
  steps: z.array(experienceStepSchema).default([]),
  transformNodes: z.array(transformNodeSchema).default([]),
})
```

**Field Changes**:
| Field | Before | After |
|-------|--------|-------|
| `transform` | `TransformConfig \| null` | REMOVED |
| `transformNodes` | N/A | `TransformNode[]` (default: `[]`) |

**Access Pattern Change**:
| Operation | Before | After |
|-----------|--------|-------|
| Read nodes | `config.transform?.nodes ?? []` | `config.transformNodes` |
| Check empty | `!config.transform?.nodes?.length` | `!config.transformNodes.length` |
| Add node | `{ transform: { ...config.transform, nodes: [...] } }` | `{ transformNodes: [...] }` |

### TransformNode (UNCHANGED)

The discriminated union schema remains unchanged:

```typescript
export const transformNodeSchema = z.discriminatedUnion('type', [
  aiImageNodeSchema,
])

export type TransformNode = z.infer<typeof transformNodeSchema>
```

### AIImageNode (UNCHANGED)

```typescript
export const aiImageNodeSchema = z.object({
  id: z.string(),
  type: z.literal('ai.imageGeneration'),
  config: aiImageNodeConfigSchema,
})
```

## Schemas to Remove

### transformConfigSchema (REMOVE)

```typescript
// DELETE THIS SCHEMA
export const transformConfigSchema = z.looseObject({
  nodes: z.array(transformNodeSchema).default([]),
  outputFormat: outputFormatSchema.nullable().default(null),
})
```

### outputFormatSchema (REMOVE)

```typescript
// DELETE THIS SCHEMA
export const outputFormatSchema = z.looseObject({
  aspectRatio: outputAspectRatioSchema.nullable().default(null),
  quality: z.number().min(0).max(100).nullable().default(null),
})
```

### outputAspectRatioSchema (REMOVE)

```typescript
// DELETE THIS SCHEMA
export const outputAspectRatioSchema = z.enum(['1:1', '9:16', '3:2', '2:3'])
```

## Type Exports Changes

### packages/shared/src/index.ts

**Remove exports**:
- `transformConfigSchema`
- `outputFormatSchema`
- `outputAspectRatioSchema`
- `TransformConfig` type
- `OutputFormat` type
- `OutputAspectRatio` type

**Keep exports**:
- `transformNodeSchema`
- `TransformNode` type
- `aiImageNodeSchema`
- `AIImageNode` type
- All node-related types

## Validation Rules

### transformNodes Field

| Rule | Validation |
|------|------------|
| Type | Array of `TransformNode` |
| Default | Empty array `[]` |
| Min length | 0 (empty allowed) |
| Max length | No limit |
| Node validation | Discriminated union on `type` field |

### TransformNode Discriminator

| type | Schema |
|------|--------|
| `ai.imageGeneration` | `aiImageNodeSchema` |
| (future types) | (added to discriminated union) |

## State Transitions

No state transitions for this entity. The `transformNodes` array is a configuration field, not a state machine.

## Relationships

```
Experience
├── draft: ExperienceConfig
│   ├── steps: Step[]
│   └── transformNodes: TransformNode[]  ← NEW LOCATION
└── published: ExperienceConfig | null
    ├── steps: Step[]
    └── transformNodes: TransformNode[]  ← NEW LOCATION
```

## Migration Notes

**Pre-launch**: No data migration required. Fresh schema deployment.

**If migration were needed** (for reference):
```typescript
// Hypothetical migration transform
const migrateExperienceConfig = (old: OldConfig): NewConfig => ({
  steps: old.steps,
  transformNodes: old.transform?.nodes ?? [],
})
```
