# PRD 1A: Schema Foundations

**Epic**: [Outcome-based Create](./epic.md)
**Status**: ✅ Complete
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

## 2. Outcome Schema

New schema for outcome-based generation configuration.

**File**: `packages/shared/src/schemas/experience/outcome.schema.ts` (NEW)

```ts
import { z } from 'zod'
import { mediaReferenceSchema } from '../media/media-reference.schema'

/**
 * Outcome type for configuration.
 * Determines the final output format.
 */
export const outcomeTypeSchema = z.enum(['image', 'gif', 'video'])

/**
 * AI image generation model selection.
 * Defined locally to avoid coupling to deprecated nodes/ system.
 */
export const aiImageModelSchema = z.enum([
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
])

/**
 * AI image aspect ratio options.
 * Defined locally to avoid coupling to deprecated nodes/ system.
 */
export const aiImageAspectRatioSchema = z.enum([
  '1:1',
  '3:2',
  '2:3',
  '9:16',
  '16:9',
])

/**
 * Image generation configuration.
 * Contains prompt template, reference media, model, and aspect ratio.
 */
export const imageGenerationConfigSchema = z.object({
  /** Prompt template with @{step:...} and @{ref:...} placeholders */
  prompt: z.string().default(''),
  /** Reference images for style guidance */
  refMedia: z.array(mediaReferenceSchema).default([]),
  /** AI model selection */
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),
  /** Output aspect ratio */
  aspectRatio: aiImageAspectRatioSchema.default('1:1'),
})

/**
 * Options for static image output.
 */
export const imageOptionsSchema = z.object({
  /** Discriminator for image options */
  kind: z.literal('image'),
})

/**
 * Options for animated GIF output.
 */
export const gifOptionsSchema = z.object({
  /** Discriminator for GIF options */
  kind: z.literal('gif'),
  /** Frames per second (1-60) */
  fps: z.number().int().min(1).max(60).default(24),
  /** Duration in seconds (0.5-30) */
  duration: z.number().min(0.5).max(30).default(3),
})

/**
 * Options for video output.
 */
export const videoOptionsSchema = z.object({
  /** Discriminator for video options */
  kind: z.literal('video'),
  /** Prompt for video generation/animation */
  videoPrompt: z.string().default(''),
  /** Duration in seconds (1-60) */
  duration: z.number().min(1).max(60).default(5),
})

/**
 * Discriminated union of outcome options by 'kind' field.
 */
export const outcomeOptionsSchema = z.discriminatedUnion('kind', [
  imageOptionsSchema,
  gifOptionsSchema,
  videoOptionsSchema,
])

/**
 * Complete Outcome configuration.
 * Defines how a session generates its final output.
 */
export const outcomeSchema = z.object({
  /** Output type (null = not configured) */
  type: outcomeTypeSchema.nullable().default(null),
  /** Source capture step ID for image-to-image (null = no source) */
  captureStepId: z.string().nullable().default(null),
  /** Global AI toggle (false = passthrough mode) */
  aiEnabled: z.boolean().default(true),
  /** AI image generation settings */
  imageGeneration: imageGenerationConfigSchema.default({
    prompt: '',
    refMedia: [],
    model: 'gemini-2.5-flash-image',
    aspectRatio: '1:1',
  }),
  /** Type-specific output options (null = not configured) */
  options: outcomeOptionsSchema.nullable().default(null),
})

// Type exports
export type OutcomeType = z.infer<typeof outcomeTypeSchema>
export type AIImageModel = z.infer<typeof aiImageModelSchema>
export type AIImageAspectRatio = z.infer<typeof aiImageAspectRatioSchema>
export type ImageGenerationConfig = z.infer<typeof imageGenerationConfigSchema>
export type ImageOptions = z.infer<typeof imageOptionsSchema>
export type GifOptions = z.infer<typeof gifOptionsSchema>
export type VideoOptions = z.infer<typeof videoOptionsSchema>
export type OutcomeOptions = z.infer<typeof outcomeOptionsSchema>
export type Outcome = z.infer<typeof outcomeSchema>
```

### Acceptance Criteria

- [ ] AC-2.1: `outcomeSchema` exported from shared package
- [ ] AC-2.2: `captureStepId` at top level (shared across outcomes)
- [ ] AC-2.3: `aiEnabled` at top level (global toggle)
- [ ] AC-2.4: `imageGeneration` as named block (not `ai`)
- [ ] AC-2.5: `options` as discriminated union by `kind`
- [ ] AC-2.6: Model and aspect ratio enums defined locally (not coupled to deprecated nodes)
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
export * from './outcome.schema'
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
- [ ] Unit tests for `outcomeSchema` defaults
- [ ] Unit tests for `outcomeOptionsSchema` discriminated union
- [ ] Unit tests for `sessionResponseSchema` shape validation

---

## Files Changed

| File | Action |
|------|--------|
| `packages/shared/src/schemas/media/media-reference.schema.ts` | MODIFY |
| `packages/shared/src/schemas/experience/outcome.schema.ts` | CREATE |
| `packages/shared/src/schemas/session/session-response.schema.ts` | CREATE |
| `packages/shared/src/schemas/experience/index.ts` | MODIFY |
| `packages/shared/src/schemas/session/index.ts` | MODIFY |
