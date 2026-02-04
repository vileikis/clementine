# Data Model: Schema Foundations (PRD 1A)

**Date**: 2026-02-04
**Status**: Complete

## Overview

This document defines the data structures for the Schema Foundations feature. All schemas are Zod-based validation schemas that define types at compile-time and provide runtime validation.

---

## 1. Media Display Name

**Location**: `packages/shared/src/schemas/media/media-reference.schema.ts`

### Schema Definition

```typescript
export const mediaDisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be 100 characters or less')
  .regex(
    /^[a-zA-Z0-9 \-_.]+$/,
    'Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
  )
  .catch('Untitled')  // Backward compatibility
```

### Type Export

```typescript
export type MediaDisplayName = z.infer<typeof mediaDisplayNameSchema>
// Inferred: string
```

### Validation Rules

| Rule | Value | Error Message |
|------|-------|---------------|
| Required | Yes | "Display name is required" |
| Min length | 1 | "Display name is required" |
| Max length | 100 | "Display name must be 100 characters or less" |
| Pattern | `/^[a-zA-Z0-9 \-_.]+$/` | "Display name can only contain..." |
| Fallback | "Untitled" | N/A (silent fallback) |

### Integration

Update `mediaReferenceSchema` to use validated display name:

```typescript
export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: mediaDisplayNameSchema,  // Changed from z.string().default('Untitled')
})
```

---

## 2. Create Outcome

**Location**: `packages/shared/src/schemas/experience/create-outcome.schema.ts` (NEW)

### Type Hierarchy

```
CreateOutcome
├── type: 'image' | 'gif' | 'video' | null
├── captureStepId: string | null
├── aiEnabled: boolean
├── imageGeneration: ImageGenerationConfig
│   ├── prompt: string
│   ├── refMedia: MediaReference[]
│   ├── model: AIImageModel
│   └── aspectRatio: AIImageAspectRatio
└── options: OutcomeOptions | null
    └── (discriminated by 'kind')
        ├── ImageOptions { kind: 'image' }
        ├── GifOptions { kind: 'gif', fps, duration }
        └── VideoOptions { kind: 'video', videoPrompt, duration }
```

### Schema Definitions

> **Note**: Model and aspect ratio schemas are defined locally in this file, NOT imported from `nodes/ai-image-node.schema.ts`. This avoids coupling to the deprecated `transformNodes` system.

#### Outcome Type

```typescript
export const createOutcomeTypeSchema = z.enum(['image', 'gif', 'video'])
export type CreateOutcomeType = z.infer<typeof createOutcomeTypeSchema>
```

#### AI Image Model (defined locally)

> **Note**: Named with 'create' prefix to avoid conflict with deprecated schemas in nodes/

```typescript
export const createAiImageModelSchema = z.enum([
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
])
export type CreateAiImageModel = z.infer<typeof createAiImageModelSchema>
```

#### AI Image Aspect Ratio (defined locally)

> **Note**: Named with 'create' prefix to avoid conflict with deprecated schemas in nodes/

```typescript
export const createAiImageAspectRatioSchema = z.enum([
  '1:1',
  '3:2',
  '2:3',
  '9:16',
  '16:9',
])
export type CreateAiImageAspectRatio = z.infer<typeof createAiImageAspectRatioSchema>
```

#### Image Generation Config

```typescript
export const imageGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  refMedia: z.array(mediaReferenceSchema).default([]),
  model: createAiImageModelSchema.default('gemini-2.5-flash-image'),
  aspectRatio: createAiImageAspectRatioSchema.default('1:1'),
})
export type ImageGenerationConfig = z.infer<typeof imageGenerationConfigSchema>
```

#### Outcome Options (Discriminated Union)

```typescript
export const imageOptionsSchema = z.object({
  kind: z.literal('image'),
})

export const gifOptionsSchema = z.object({
  kind: z.literal('gif'),
  fps: z.number().int().min(1).max(60).default(24),
  duration: z.number().min(0.5).max(30).default(3),
})

export const videoOptionsSchema = z.object({
  kind: z.literal('video'),
  videoPrompt: z.string().default(''),
  duration: z.number().min(1).max(60).default(5),
})

export const outcomeOptionsSchema = z.discriminatedUnion('kind', [
  imageOptionsSchema,
  gifOptionsSchema,
  videoOptionsSchema,
])

export type ImageOptions = z.infer<typeof imageOptionsSchema>
export type GifOptions = z.infer<typeof gifOptionsSchema>
export type VideoOptions = z.infer<typeof videoOptionsSchema>
export type OutcomeOptions = z.infer<typeof outcomeOptionsSchema>
```

#### Complete Create Outcome

```typescript
export const createOutcomeSchema = z.object({
  type: createOutcomeTypeSchema.nullable().default(null),
  captureStepId: z.string().nullable().default(null),
  aiEnabled: z.boolean().default(true),
  imageGeneration: imageGenerationConfigSchema.default({
    prompt: '',
    refMedia: [],
    model: 'gemini-2.5-flash-image',
    aspectRatio: '1:1',
  }),
  options: outcomeOptionsSchema.nullable().default(null),
})
export type CreateOutcome = z.infer<typeof createOutcomeSchema>
```

### Field Details

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `'image' \| 'gif' \| 'video' \| null` | `null` | Outcome type; null = not configured |
| `captureStepId` | `string \| null` | `null` | Source capture step ID for image-to-image |
| `aiEnabled` | `boolean` | `true` | Global AI toggle; false = passthrough mode |
| `imageGeneration` | `ImageGenerationConfig` | (see below) | AI image generation settings |
| `options` | `OutcomeOptions \| null` | `null` | Type-specific options |

### ImageGenerationConfig Defaults

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prompt` | `string` | `''` | Prompt template with @{step:...} and @{ref:...} |
| `refMedia` | `MediaReference[]` | `[]` | Reference images for style guidance |
| `model` | `CreateAiImageModel` | `'gemini-2.5-flash-image'` | AI model selection |
| `aspectRatio` | `CreateAiImageAspectRatio` | `'1:1'` | Output aspect ratio |

### GifOptions Constraints

| Field | Type | Min | Max | Default |
|-------|------|-----|-----|---------|
| `fps` | `number (int)` | 1 | 60 | 24 |
| `duration` | `number` | 0.5 | 30 | 3 |

### VideoOptions Constraints

| Field | Type | Min | Max | Default |
|-------|------|-----|-----|---------|
| `videoPrompt` | `string` | - | - | `''` |
| `duration` | `number` | 1 | 60 | 5 |

---

## 3. Session Response

**Location**: `packages/shared/src/schemas/session/session-response.schema.ts` (NEW)

### Schema Definition

```typescript
export const sessionResponseSchema = z.object({
  stepId: z.string(),
  stepName: z.string(),
  stepType: z.string(),
  value: z.union([z.string(), z.array(z.string())]).nullable().default(null),
  context: z.unknown().nullable().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
})
export type SessionResponse = z.infer<typeof sessionResponseSchema>
```

### Field Details

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `stepId` | `string` | Yes | - | Links to step definition |
| `stepName` | `string` | Yes | - | For @{step:...} prompt resolution |
| `stepType` | `string` | Yes | - | e.g., 'input.scale', 'capture.photo' |
| `value` | `string \| string[] \| null` | No | `null` | Analytics-friendly primitive |
| `context` | `unknown \| null` | No | `null` | Rich structured data |
| `createdAt` | `number` | Yes | - | Unix timestamp (ms) |
| `updatedAt` | `number` | Yes | - | Unix timestamp (ms) |

### Context Shape by Step Type

| Step Type | `value` | `context` |
|-----------|---------|-----------|
| `input.shortText` | `"user text"` | `null` |
| `input.longText` | `"user text"` | `null` |
| `input.scale` | `"1"` to `"5"` | `null` |
| `input.yesNo` | `"yes"` or `"no"` | `null` |
| `input.multiSelect` | `["opt1", "opt2"]` | `MultiSelectOption[]` |
| `capture.photo` | `null` | `MediaReference[]` (1 item) |
| `capture.gif` | `null` | `MediaReference[]` (4 items) |
| `capture.video` | `null` | `MediaReference[]` (1 item) |

---

## Relationships

```
┌─────────────────────┐     ┌─────────────────────┐
│  Experience.create  │────▶│   CreateOutcome     │
└─────────────────────┘     └─────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────────┐
                            │ImageGenerationConfig│
                            └─────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────────┐
                            │  MediaReference[]   │
                            │  (refMedia)         │
                            └─────────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│ Session.responses[] │────▶│  SessionResponse    │
└─────────────────────┘     └─────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────────┐
                            │  context: unknown   │
                            │  (MediaReference[]  │
                            │   for captures)     │
                            └─────────────────────┘
```

---

## Migration Notes

This PRD adds new schemas only. No migration required because:
1. `mediaDisplayNameSchema` uses `.catch('Untitled')` for backward compatibility
2. `createOutcomeSchema` is new (experience.create doesn't exist yet - PRD 1B)
3. `sessionResponseSchema` is new (session.responses[] doesn't exist yet - PRD 1C)
