# Data Model: AI Image Node Settings

**Feature**: 053-ai-image-node-settings
**Date**: 2026-01-31

## Overview

This feature modifies an existing data structure (`AIImageNodeConfig`) within the transform pipeline. No new collections or documents are created; this is an update to the `draft.transform.nodes[]` array in an Experience document.

## Existing Schema (packages/shared)

### AIImageNodeConfig

**Location**: `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`

```typescript
// No schema changes required - using existing definitions

export const aiImageModelSchema = z.enum([
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
])

export const aiImageAspectRatioSchema = z.enum([
  '1:1',
  '3:2',
  '2:3',
  '9:16',
  '16:9',
])

export const aiImageNodeConfigSchema = z.object({
  model: aiImageModelSchema,
  aspectRatio: aiImageAspectRatioSchema,
  prompt: z.string(),
  refMedia: z.array(mediaReferenceSchema),
})

export const aiImageNodeSchema = z.object({
  id: z.string(),
  type: z.literal('ai.imageGeneration'),
  config: aiImageNodeConfigSchema,
})
```

### MediaReference

**Location**: `packages/shared/src/schemas/media/media-reference.schema.ts`

```typescript
export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: z.string().default('Untitled'),
})
```

## Type Definitions

```typescript
// Inferred from schemas
type AIImageModel = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'

type AIImageAspectRatio = '1:1' | '3:2' | '2:3' | '9:16' | '16:9'

interface MediaReference {
  mediaAssetId: string
  url: string
  filePath: string | null
  displayName: string
}

interface AIImageNodeConfig {
  model: AIImageModel
  aspectRatio: AIImageAspectRatio
  prompt: string
  refMedia: MediaReference[]
}

interface AIImageNode {
  id: string
  type: 'ai.imageGeneration'
  config: AIImageNodeConfig
}
```

## Firestore Document Structure

**Collection**: `experiences`
**Document Path**: `workspaces/{workspaceId}/experiences/{experienceId}`

```typescript
interface Experience {
  id: string
  name: string
  // ... other fields
  draft: {
    steps: ExperienceStep[]
    transform: TransformConfig | null
  }
  draftVersion: number
  updatedAt: Timestamp
}

interface TransformConfig {
  nodes: TransformNode[]  // AIImageNode is one type in this union
  outputFormat: null      // Placeholder for future
}
```

## Field Constraints

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `config.model` | enum | Yes | One of defined model values |
| `config.aspectRatio` | enum | Yes | One of defined ratio values |
| `config.prompt` | string | Yes | Non-empty at publish time |
| `config.refMedia` | array | Yes | Max 10 items, unique by `mediaAssetId` |
| `refMedia[].mediaAssetId` | string | Yes | Unique within array |
| `refMedia[].url` | string | Yes | Valid URL |
| `refMedia[].filePath` | string | null | No | Storage path or null |
| `refMedia[].displayName` | string | Yes | Defaults to 'Untitled' |

## Validation Rules

### Client-Side (UI Feedback)

1. **Empty Prompt Warning**: Display "Prompt is required" when prompt is empty
2. **Reference Limit**: Disable add controls when `refMedia.length >= 10`
3. **Duplicate Prevention**: Check `mediaAssetId` before adding new reference

### Mutation-Time (Pure Functions)

```typescript
// In transform-operations.ts

function addRefMedia(
  config: AIImageNodeConfig,
  newRefs: MediaReference[]
): AIImageNodeConfig {
  const existingIds = new Set(config.refMedia.map(r => r.mediaAssetId))
  const uniqueNewRefs = newRefs.filter(r => !existingIds.has(r.mediaAssetId))
  const combined = [...config.refMedia, ...uniqueNewRefs]
  return {
    ...config,
    refMedia: combined.slice(0, 10) // Enforce max limit
  }
}

function removeRefMedia(
  config: AIImageNodeConfig,
  mediaAssetId: string
): AIImageNodeConfig {
  return {
    ...config,
    refMedia: config.refMedia.filter(r => r.mediaAssetId !== mediaAssetId)
  }
}
```

## State Transitions

```
[Initial State]
  config.prompt = ''
  config.model = 'gemini-2.5-flash-image' (default)
  config.aspectRatio = '1:1' (default)
  config.refMedia = []

[After User Edits]
  config.prompt = 'A portrait of @{step:userName} in @{ref:abc123} style'
  config.model = 'gemini-3-pro-image-preview'
  config.aspectRatio = '16:9'
  config.refMedia = [
    { mediaAssetId: 'abc123', url: '...', displayName: 'Style Guide' },
    { mediaAssetId: 'def456', url: '...', displayName: 'Reference Photo' }
  ]
```

## No Schema Changes Required

This feature uses existing schemas without modification. The validation constraints (max 10 references, deduplication) are enforced at the application level in pure functions, not in the Zod schema itself.

**Rationale**: The schema defines the data shape, while business rules (max 10, unique IDs) are better enforced in the mutation layer where they can provide appropriate user feedback.
