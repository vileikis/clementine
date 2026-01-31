# Schema Contract: Transform Flatten

**Feature**: 054-transform-flatten
**Date**: 2026-01-31

## Schema Changes

This document defines the schema contract changes for the flatten transform refactor.

### ExperienceConfig Schema

#### Current Contract (v1)

```typescript
interface ExperienceConfig {
  steps: Step[]
  transform?: {
    nodes: TransformNode[]
    outputFormat?: {
      aspectRatio: '1:1' | '9:16' | '3:2' | '2:3' | null
      quality: number | null
    } | null
  } | null
}
```

#### New Contract (v2)

```typescript
interface ExperienceConfig {
  steps: Step[]
  transformNodes: TransformNode[]
}
```

### Breaking Changes

| Change | Type | Impact |
|--------|------|--------|
| `transform` field removed | Breaking | All access via `transform.nodes` must change to `transformNodes` |
| `outputFormat` removed | Breaking | Field was unused; no functional impact |
| `transformNodes` required | Non-breaking | Defaults to `[]`, no null-checking needed |

### TransformNode Schema (Unchanged)

```typescript
// Discriminated union - extensible for future node types
type TransformNode = AIImageNode // | FutureNodeType

interface AIImageNode {
  id: string
  type: 'ai.imageGeneration'
  config: {
    model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'
    aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9'
    prompt: string
    refMedia: MediaReference[]
  }
}
```

### Zod Schema Definitions

#### Before

```typescript
// packages/shared/src/schemas/experience/transform.schema.ts
export const transformConfigSchema = z.looseObject({
  nodes: z.array(transformNodeSchema).default([]),
  outputFormat: outputFormatSchema.nullable().default(null),
})

// packages/shared/src/schemas/experience/experience.schema.ts
export const experienceConfigSchema = z.looseObject({
  steps: z.array(experienceStepSchema).default([]),
  transform: transformConfigSchema.nullable().default(null),
})
```

#### After

```typescript
// packages/shared/src/schemas/experience/transform.schema.ts
export const transformNodeSchema = z.discriminatedUnion('type', [
  aiImageNodeSchema,
])

// packages/shared/src/schemas/experience/experience.schema.ts
export const experienceConfigSchema = z.looseObject({
  steps: z.array(experienceStepSchema).default([]),
  transformNodes: z.array(transformNodeSchema).default([]),
})
```

### Type Export Changes

#### Removed Exports

```typescript
// No longer exported from @clementine/shared
export type TransformConfig = z.infer<typeof transformConfigSchema>
export type OutputFormat = z.infer<typeof outputFormatSchema>
export type OutputAspectRatio = z.infer<typeof outputAspectRatioSchema>
```

#### Preserved Exports

```typescript
// Still exported from @clementine/shared
export type TransformNode = z.infer<typeof transformNodeSchema>
export type AIImageNode = z.infer<typeof aiImageNodeSchema>
export type AIImageNodeConfig = z.infer<typeof aiImageNodeConfigSchema>
```

## Validation Contract

### transformNodes Field

| Aspect | Contract |
|--------|----------|
| Type | `TransformNode[]` |
| Default | `[]` |
| Required | Yes (with default) |
| Nullability | Not nullable |
| Min items | 0 |
| Max items | Unlimited |

### Individual Node Validation

Each node is validated against its discriminated type:

```typescript
// Valid
{ id: "abc", type: "ai.imageGeneration", config: { ... } }

// Invalid - unknown type
{ id: "abc", type: "unknown", config: { ... } }  // Zod error

// Invalid - missing required field
{ id: "abc", type: "ai.imageGeneration" }  // Zod error (missing config)
```
