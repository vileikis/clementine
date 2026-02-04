# PRD 1A: Schema Foundations

**Epic**: [Outcome-based Create](./epic.md)
**Status**: Draft
**Dependencies**: None (first PRD)
**Enables**: PRD 1B, PRD 1C

---

## Overview

Add new Zod schemas to the shared package that will be used by subsequent PRDs. This is pure schema work with no runtime changes.

---

## 1. Media displayName Validation

Add validation to media display names to ensure they're safe for `@{ref:displayName}` mention parsing.

**File**: `packages/shared/src/schemas/media/media-reference.schema.ts`

```ts
/**
 * Media display name schema
 * Validation ensures names are safe for @{ref:displayName} mention parsing.
 * Prevents characters that would break mention syntax (}, :, {).
 */
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

export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: mediaDisplayNameSchema,
})
```

### Acceptance Criteria

- [ ] AC-1.1: `mediaDisplayNameSchema` exported from shared package
- [ ] AC-1.2: New media uploads require valid displayName (no `}`, `:`, `{` characters)
- [ ] AC-1.3: Existing media with invalid displayName still parses (backward compatible via `.catch()`)

---

## 2. Create Outcome Schema

New schema for outcome-based generation configuration.

**File**: `packages/shared/src/schemas/experience/create-outcome.schema.ts` (NEW)

```ts
import { z } from 'zod'
import {
  aiImageModelSchema,
  aiImageAspectRatioSchema,
} from './nodes/ai-image-node.schema'
import { mediaReferenceSchema } from '../media/media-reference.schema'

/**
 * Create outcome types
 * - image: AI image generation (MVP)
 * - gif, video: Future outcome types (schema stubs)
 */
export const createOutcomeTypeSchema = z.enum(['image', 'gif', 'video'])

/**
 * Image generation configuration
 * Used by all outcomes as the primary AI generation stage.
 * Named explicitly for future stages (textGeneration, videoGeneration).
 */
export const imageGenerationConfigSchema = z.object({
  /** Prompt template with @{step:...} and @{ref:...} mentions */
  prompt: z.string().default(''),

  /** Reference images for style/content guidance */
  refMedia: z.array(mediaReferenceSchema).default([]),

  /** AI model for generation */
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),

  /** Output aspect ratio */
  aspectRatio: aiImageAspectRatioSchema.default('1:1'),
})

/**
 * Image outcome options (type-specific)
 * Currently empty for MVP, but structure allows future extensions.
 */
export const imageOptionsSchema = z.object({
  kind: z.literal('image'),
})

/**
 * GIF outcome options (stub for future)
 */
export const gifOptionsSchema = z.object({
  kind: z.literal('gif'),
  fps: z.number().int().min(1).max(60).default(24),
  duration: z.number().min(0.5).max(30).default(3),
})

/**
 * Video outcome options (stub for future)
 */
export const videoOptionsSchema = z.object({
  kind: z.literal('video'),
  videoPrompt: z.string().default(''),
  // videoModel: videoModelSchema, // Future
  duration: z.number().min(1).max(60).default(5),
})

/**
 * Discriminated union for type-specific options
 */
export const outcomeOptionsSchema = z.discriminatedUnion('kind', [
  imageOptionsSchema,
  gifOptionsSchema,
  videoOptionsSchema,
])

/**
 * Complete create outcome configuration
 */
export const createOutcomeSchema = z.object({
  /** Outcome type. Null = not configured */
  type: createOutcomeTypeSchema.nullable().default(null),

  /** Capture step ID for source media. Null = prompt-only or invalid for passthrough */
  captureStepId: z.string().nullable().default(null),

  /** Global toggle for AI generation. False = passthrough mode */
  aiEnabled: z.boolean().default(true),

  /** Image generation config (preserved when switching outcomes) */
  imageGeneration: imageGenerationConfigSchema.default({
    prompt: '',
    refMedia: [],
    model: 'gemini-2.5-flash-image',
    aspectRatio: '1:1',
  }),

  /** Type-specific options (can reset on outcome switch) */
  options: outcomeOptionsSchema.nullable().default(null),
})

// Type exports
export type CreateOutcomeType = z.infer<typeof createOutcomeTypeSchema>
export type ImageGenerationConfig = z.infer<typeof imageGenerationConfigSchema>
export type ImageOptions = z.infer<typeof imageOptionsSchema>
export type GifOptions = z.infer<typeof gifOptionsSchema>
export type VideoOptions = z.infer<typeof videoOptionsSchema>
export type OutcomeOptions = z.infer<typeof outcomeOptionsSchema>
export type CreateOutcome = z.infer<typeof createOutcomeSchema>
```

### Acceptance Criteria

- [ ] AC-2.1: `createOutcomeSchema` exported from shared package
- [ ] AC-2.2: `captureStepId` at top level (shared across outcomes)
- [ ] AC-2.3: `aiEnabled` at top level (global toggle)
- [ ] AC-2.4: `imageGeneration` as named block (not `ai`)
- [ ] AC-2.5: `options` as discriminated union by `kind`
- [ ] AC-2.6: Reuses `aiImageModelSchema` and `aiImageAspectRatioSchema`
- [ ] AC-2.7: GIF/Video options are stubs with reasonable defaults

---

## 3. Session Response Schema

Unified response schema that replaces separate `answers[]` and `capturedMedia[]`.

**File**: `packages/shared/src/schemas/session/session-response.schema.ts` (NEW)

```ts
import { z } from 'zod'

/**
 * Session Response Schema
 *
 * Unified shape for both input answers and capture media.
 * Uses stepType directly - no separate kind enum needed.
 *
 * Key design decisions:
 * - No separate `media` field - capture media stored in `context` as MediaReference[]
 * - `value` is null for captures - no analytical use case for asset IDs
 * - Captures always use MediaReference[] - even single photo/video uses array for consistency
 * - @{step:...} works for all steps - inputs and captures both referenceable in prompts
 */
export const sessionResponseSchema = z.object({
  /** Step that produced this response */
  stepId: z.string(),

  /** Step name for direct @{step:stepName} prompt resolution (input AND capture) */
  stepName: z.string(),

  /** Step type (e.g., 'input.scale', 'capture.photo') */
  stepType: z.string(),

  /**
   * Analytics-friendly primitive value:
   * - string: text inputs, yes/no ("yes"/"no"), scale ("1"-"5")
   * - string[]: multi-select inputs
   * - null: capture steps (no analytical use case for asset IDs)
   */
  value: z
    .union([z.string(), z.array(z.string())])
    .nullable()
    .default(null),

  /**
   * Rich structured data - interpretation depends on stepType:
   * - input.multiSelect: MultiSelectOption[] with promptFragment/promptMedia
   * - capture.photo: MediaReference[] (1 item)
   * - capture.gif: MediaReference[] (4 items)
   * - capture.video: MediaReference[] (1 item)
   * - other inputs: null (value is sufficient)
   */
  context: z.unknown().nullable().default(null),

  /** Response creation timestamp (Unix ms) */
  createdAt: z.number(),

  /** Last update timestamp (Unix ms) */
  updatedAt: z.number(),
})

export type SessionResponse = z.infer<typeof sessionResponseSchema>
```

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

### Acceptance Criteria

- [ ] AC-3.1: `sessionResponseSchema` exported from shared package
- [ ] AC-3.2: Includes `stepName` field for prompt resolution (input AND capture steps)
- [ ] AC-3.3: No separate `media` field - captures use `context` with `MediaReference[]`
- [ ] AC-3.4: No separate `kind` enum - uses `stepType` directly
- [ ] AC-3.5: Type exported: `SessionResponse`
- [ ] AC-3.6: Capture responses always use `MediaReference[]` (array), even for single items

---

## 4. Barrel Exports

Update index files to export new schemas.

**File**: `packages/shared/src/schemas/experience/index.ts`
```ts
// Add:
export * from './create-outcome.schema'
```

**File**: `packages/shared/src/schemas/session/index.ts`
```ts
// Add:
export * from './session-response.schema'
```

**File**: `packages/shared/src/schemas/media/index.ts`
```ts
// Add (if not already exported):
export { mediaDisplayNameSchema } from './media-reference.schema'
```

### Acceptance Criteria

- [ ] AC-4.1: All new schemas accessible via `@clementine/shared`
- [ ] AC-4.2: Build succeeds with no type errors

---

## Testing

- [ ] Unit tests for `mediaDisplayNameSchema` validation (valid/invalid characters)
- [ ] Unit tests for `createOutcomeSchema` defaults
- [ ] Unit tests for `outcomeOptionsSchema` discriminated union
- [ ] Unit tests for `sessionResponseSchema` shape validation

---

## Files Changed

| File | Action |
|------|--------|
| `packages/shared/src/schemas/media/media-reference.schema.ts` | MODIFY |
| `packages/shared/src/schemas/experience/create-outcome.schema.ts` | CREATE |
| `packages/shared/src/schemas/session/session-response.schema.ts` | CREATE |
| `packages/shared/src/schemas/experience/index.ts` | MODIFY |
| `packages/shared/src/schemas/session/index.ts` | MODIFY |
