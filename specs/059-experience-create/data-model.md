# Data Model: Experience Create Outcome Configuration

**Feature**: 059-experience-create
**Date**: 2026-02-04

## Entity Overview

This feature extends the existing `ExperienceConfig` entity with a new `create` field. No new collections or documents are created.

## Schema Changes

### ExperienceConfig (Modified)

**Location**: `packages/shared/src/schemas/experience/experience.schema.ts`

```typescript
export const experienceConfigSchema = z.looseObject({
  /** Array of steps in the experience */
  steps: z.array(experienceStepSchema).default([]),

  /** @deprecated Use create instead. Kept for backward compatibility. */
  transformNodes: z.array(transformNodeSchema).default([]),

  /** Create outcome configuration (replaces transformNodes). Null means not configured. */
  create: createOutcomeSchema.nullable().default(null),
})
```

### CreateOutcome (Existing - No Changes)

**Location**: `packages/shared/src/schemas/experience/create-outcome.schema.ts`

```typescript
interface CreateOutcome {
  /** Output type: 'image' | 'gif' | 'video' | null */
  type: CreateOutcomeType | null

  /** Source capture step ID for image-to-image (null = no source) */
  captureStepId: string | null

  /** Global AI toggle (false = passthrough mode) */
  aiEnabled: boolean

  /** AI image generation settings */
  imageGeneration: ImageGenerationConfig

  /** Type-specific output options (null = not configured) */
  options: OutcomeOptions | null
}
```

### ImageGenerationConfig (Existing - No Changes)

```typescript
interface ImageGenerationConfig {
  /** Prompt template with @{step:...} and @{ref:...} placeholders */
  prompt: string

  /** Reference images for style guidance */
  refMedia: MediaReference[]

  /** AI model selection */
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'

  /** Output aspect ratio */
  aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9'
}
```

### OutcomeOptions (Existing - No Changes)

Discriminated union by `kind` field:

```typescript
type OutcomeOptions = ImageOptions | GifOptions | VideoOptions

interface ImageOptions {
  kind: 'image'
}

interface GifOptions {
  kind: 'gif'
  fps: number       // 1-60, default 24
  duration: number  // 0.5-30 seconds, default 3
}

interface VideoOptions {
  kind: 'video'
  videoPrompt: string
  duration: number  // 1-60 seconds, default 5
}
```

## Firestore Document Structure

**Path**: `/workspaces/{workspaceId}/experiences/{experienceId}`

```json
{
  "id": "exp_abc123",
  "name": "Summer Campaign",
  "profile": "freeform",
  "status": "active",

  "draft": {
    "steps": [...],
    "transformNodes": [],
    "create": {
      "type": "image",
      "captureStepId": "step_xyz789",
      "aiEnabled": true,
      "imageGeneration": {
        "prompt": "Transform this photo into a summer beach scene",
        "refMedia": [
          {
            "mediaAssetId": "asset_123",
            "url": "https://storage.example.com/ref.jpg",
            "filePath": "workspaces/ws1/media/ref.jpg",
            "displayName": "beach_style"
          }
        ],
        "model": "gemini-2.5-flash-image",
        "aspectRatio": "1:1"
      },
      "options": {
        "kind": "image"
      }
    }
  },

  "published": {
    "steps": [...],
    "transformNodes": [],
    "create": {...}
  },

  "draftVersion": 3,
  "publishedVersion": 2,
  "publishedAt": 1707091200000,
  "publishedBy": null
}
```

## Validation Rules

### Publish-Time Validation

**Note:** If `create` is `null`, no validation is performed - publishing without outcome generation is valid.

| Rule | Field | Condition | Error Message |
|------|-------|-----------|---------------|
| V1 | `create.type` | `=== null` | "Select an outcome type (Image, GIF, or Video)" |
| V2 | `create.captureStepId` | `!aiEnabled && !captureStepId` | "Passthrough mode requires a source image..." |
| V3 | `create.captureStepId` | Step not found | "Selected source step no longer exists" |
| V4 | `create.captureStepId` | Step not capture type | "Source step must be a capture step" |
| V5 | `create.imageGeneration.prompt` | `aiEnabled && !prompt.trim()` | "Prompt is required when AI is enabled" |
| V6 | `create.imageGeneration.refMedia` | Duplicate displayNames | "Duplicate reference media names: {names}" |
| V7 | `create.type` | `=== 'gif' \|\| === 'video'` | "{TYPE} outcome is coming soon" |
| V8 | `create.options.kind` | `!== create.type` | "Options kind must match outcome type" |

### Validation Execution Order

```
0. If create is null → valid (no outcome generation)
1. Type null check (V1) → early return if fails
2. Passthrough validation (V2)
3. CaptureStepId validation (V3, V4)
4. AI prompt validation (V5)
5. RefMedia uniqueness (V6)
6. Type coming soon (V7)
7. Options kind match (V8)
```

## State Transitions

### New Experience

```
Created → draft.create = null (not configured)
         Can be published without outcome generation
         Configure create when AI output is needed
```

### Publish Flow

```
Draft (valid) → Published
  - draft.create copied to published.create
  - published.transformNodes set to []
  - publishedVersion = draftVersion
  - publishedAt = serverTimestamp()
```

### Outcome Type Switch

```
Image → GIF/Video
  - type updated
  - imageGeneration preserved
  - captureStepId preserved
  - aiEnabled preserved
  - options reset to type defaults
```

## Backward Compatibility

| Scenario | Behavior |
|----------|----------|
| Existing experience without `create` field | Zod default applied on read |
| Existing experience tries to publish | Fails V1 (type null) |
| New experience created | `create` initialized with defaults |
| Published experience re-published | `transformNodes` set to `[]` |

## Related Entities

| Entity | Relationship | Notes |
|--------|--------------|-------|
| ExperienceStep | Referenced by captureStepId | Capture steps only (`type.startsWith('capture.')`) |
| MediaReference | Embedded in refMedia array | Must have unique displayName |
| Workspace | Parent collection | Path: `/workspaces/{id}/experiences/{id}` |
