# Schema Contracts: Schema Foundations (PRD 1A)

**Date**: 2026-02-04

This document defines the schema contracts for the Schema Foundations feature. These are Zod validation schemas, not API contracts.

---

## 1. Media Display Name Schema

**Export Path**: `@clementine/shared` → `mediaDisplayNameSchema`

### Contract

```typescript
// Input: any string
// Output: validated string (1-100 chars, alphanumeric + space/hyphen/underscore/period)
// Fallback: 'Untitled' on validation failure

mediaDisplayNameSchema.parse(input: unknown) → string
mediaDisplayNameSchema.safeParse(input: unknown) → { success: boolean, data?: string, error?: ZodError }
```

### Valid Examples

| Input | Output |
|-------|--------|
| `"hero-shot"` | `"hero-shot"` |
| `"User Photo 1"` | `"User Photo 1"` |
| `"logo.v2"` | `"logo.v2"` |
| `"  trimmed  "` | `"trimmed"` |

### Invalid Examples (Fallback to 'Untitled')

| Input | Reason |
|-------|--------|
| `""` | Empty string |
| `"logo}test"` | Contains `}` |
| `"name:value"` | Contains `:` |
| `"test{name"` | Contains `{` |
| `"a".repeat(101)` | Exceeds 100 chars |

---

## 2. Create Outcome Schema

**Export Path**: `@clementine/shared` → `createOutcomeSchema`

### Contract

```typescript
// Input: Partial<CreateOutcome> or {}
// Output: Fully defaulted CreateOutcome object

createOutcomeSchema.parse(input: unknown) → CreateOutcome
createOutcomeSchema.safeParse(input: unknown) → { success: boolean, data?: CreateOutcome, error?: ZodError }
```

### Type Definition

```typescript
type CreateOutcome = {
  type: 'image' | 'gif' | 'video' | null
  captureStepId: string | null
  aiEnabled: boolean
  imageGeneration: {
    prompt: string
    refMedia: MediaReference[]
    model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'
    aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9'
  }
  options: ImageOptions | GifOptions | VideoOptions | null
}

type ImageOptions = { kind: 'image' }
type GifOptions = { kind: 'gif', fps: number, duration: number }
type VideoOptions = { kind: 'video', videoPrompt: string, duration: number }
```

### Default Values

```typescript
{
  type: null,
  captureStepId: null,
  aiEnabled: true,
  imageGeneration: {
    prompt: '',
    refMedia: [],
    model: 'gemini-2.5-flash-image',
    aspectRatio: '1:1',
  },
  options: null,
}
```

### Discriminated Union: options

| `kind` | Required Fields | Optional Fields |
|--------|-----------------|-----------------|
| `'image'` | `kind` | - |
| `'gif'` | `kind` | `fps` (default 24), `duration` (default 3) |
| `'video'` | `kind` | `videoPrompt` (default ''), `duration` (default 5) |

---

## 3. Session Response Schema

**Export Path**: `@clementine/shared` → `sessionResponseSchema`

### Contract

```typescript
// Input: SessionResponse object with required fields
// Output: Validated SessionResponse

sessionResponseSchema.parse(input: unknown) → SessionResponse
sessionResponseSchema.safeParse(input: unknown) → { success: boolean, data?: SessionResponse, error?: ZodError }
```

### Type Definition

```typescript
type SessionResponse = {
  stepId: string           // Required
  stepName: string         // Required
  stepType: string         // Required
  value: string | string[] | null  // Default: null
  context: unknown | null  // Default: null
  createdAt: number        // Required (Unix ms)
  updatedAt: number        // Required (Unix ms)
}
```

### Required vs Optional Fields

| Field | Required | Default |
|-------|----------|---------|
| `stepId` | Yes | - |
| `stepName` | Yes | - |
| `stepType` | Yes | - |
| `value` | No | `null` |
| `context` | No | `null` |
| `createdAt` | Yes | - |
| `updatedAt` | Yes | - |

### Context Interpretation

The `context` field is typed as `unknown` and interpreted based on `stepType`:

| `stepType` Pattern | `context` Type |
|-------------------|----------------|
| `input.*` (except multiSelect) | `null` |
| `input.multiSelect` | `MultiSelectOption[]` |
| `capture.*` | `MediaReference[]` |

---

## Related Schemas

### MediaReference (Existing - Reused)

```typescript
// From media/media-reference.schema.ts
type MediaReference = {
  mediaAssetId: string
  url: string
  filePath: string | null
  displayName: string  // Now validated by mediaDisplayNameSchema
}
```

### AIImageModel (Defined in create-outcome.schema.ts)

> **Note**: Defined locally, NOT imported from deprecated `nodes/ai-image-node.schema.ts`

```typescript
type AIImageModel = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'
```

### AIImageAspectRatio (Defined in create-outcome.schema.ts)

> **Note**: Defined locally, NOT imported from deprecated `nodes/ai-image-node.schema.ts`

```typescript
type AIImageAspectRatio = '1:1' | '3:2' | '2:3' | '9:16' | '16:9'
```
