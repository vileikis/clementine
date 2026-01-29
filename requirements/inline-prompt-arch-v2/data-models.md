# Data Models & Schemas

**Part of**: [Inline Prompt Architecture (v2)](./README.md)

---

## Overview

This document specifies all Zod schemas and TypeScript types for the Inline Prompt Architecture.

**Package**: `packages/shared/src/schemas/`

---

## 1. Enhanced Multiselect Step Schema

### Location

`packages/shared/src/schemas/experience/steps/input-multi-select.schema.ts`

### Schema Definition

```typescript
import { z } from 'zod'
import { mediaReferenceSchema } from '../media.schema'

/**
 * Multiselect option with AI-aware fields
 */
const multiSelectOptionSchema = z.object({
  // Core field
  value: z.string().min(1).max(100),

  // AI-aware fields (optional)
  promptFragment: z.string().max(500).optional(),
  promptMedia: mediaReferenceSchema.optional(),
})

/**
 * Multiselect step configuration
 */
const experienceInputMultiSelectStepConfigSchema = z.object({
  title: z.string().max(200),
  required: z.boolean().default(false),
  options: z.array(multiSelectOptionSchema).min(2).max(10),
  multiSelect: z.boolean().default(false),
})

export type MultiSelectOption = z.infer<typeof multiSelectOptionSchema>
export type ExperienceInputMultiSelectStepConfig = z.infer<
  typeof experienceInputMultiSelectStepConfigSchema
>
```

### Type Definitions

```typescript
type MultiSelectOption = {
  value: string                     // Required: option value
  promptFragment?: string           // Optional: text for prompt
  promptMedia?: MediaReference      // Optional: reference image
}

type ExperienceInputMultiSelectStepConfig = {
  title: string
  required: boolean
  options: MultiSelectOption[]      // 2-10 options
  multiSelect: boolean              // Allow multiple selections
}
```

### Example Data

```typescript
{
  title: "Choose your companion",
  required: true,
  multiSelect: false,
  options: [
    {
      value: "cat",
      promptFragment: "holding a grumpy cat",
      promptMedia: {
        mediaAssetId: "cat123xyz",
        url: "https://storage.googleapis.com/...",
        filePath: "workspaces/ws1/media/cat.jpg"
      }
    },
    {
      value: "dog",
      promptFragment: "holding a happy dog",
      promptMedia: {
        mediaAssetId: "dog456abc",
        url: "https://storage.googleapis.com/...",
        filePath: "workspaces/ws1/media/dog.jpg"
      }
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | string | Yes | Option value (shown to user, used as fallback) |
| `promptFragment` | string | No | Text inserted into prompt when selected |
| `promptMedia` | MediaReference | No | Image auto-referenced when option selected |

### Validation Rules

1. **value**: 1-100 characters
2. **promptFragment**: Maximum 500 characters
3. **promptMedia**: Must be valid MediaReference (if provided)
4. **options**: 2-10 options required
5. Backward compatible: Options without AI fields work normally

---

## 2. Enhanced Yes/No Step Schema (Bonus Phase)

### Location

`packages/shared/src/schemas/experience/steps/input-yes-no.schema.ts`

### Schema Definition

```typescript
import { z } from 'zod'
import { mediaReferenceSchema } from '../media.schema'

/**
 * Yes/No option with AI-aware fields
 */
const yesNoOptionSchema = z.object({
  label: z.string().default('Yes'), // or 'No'
  promptFragment: z.string().max(500).optional(),
  promptMedia: mediaReferenceSchema.optional(),
})

/**
 * Yes/No step configuration
 */
const experienceInputYesNoStepConfigSchema = z.object({
  title: z.string().max(200),
  required: z.boolean().default(false),

  // Options object (consistent with multiselect pattern)
  options: z
    .object({
      yes: yesNoOptionSchema.optional(),
      no: yesNoOptionSchema.optional(),
    })
    .default({ yes: {}, no: {} }),
})

export type YesNoOption = z.infer<typeof yesNoOptionSchema>
export type ExperienceInputYesNoStepConfig = z.infer<
  typeof experienceInputYesNoStepConfigSchema
>
```

### Type Definitions

```typescript
type YesNoOption = {
  label: string                     // Default: "Yes" or "No"
  promptFragment?: string           // Optional: text for prompt
  promptMedia?: MediaReference      // Optional: reference image
}

type ExperienceInputYesNoStepConfig = {
  title: string
  required: boolean
  options: {
    yes?: YesNoOption
    no?: YesNoOption
  }
}
```

### Example Data

```typescript
{
  title: "Add wings?",
  required: false,
  options: {
    yes: {
      label: "With wings",
      promptFragment: "with magnificent angel wings",
      promptMedia: {
        mediaAssetId: "wings123",
        url: "https://...",
        filePath: "workspaces/ws1/media/wings.jpg"
      }
    },
    no: {
      label: "Without wings",
      promptFragment: "without wings",
      // No promptMedia
    }
  }
}
```

### Key Points

- Custom labels: "With wings" / "Without wings" instead of "Yes" / "No"
- Same AI-aware fields as multiselect (`promptFragment`, `promptMedia`)
- Consistent structure for resolution logic
- Both options are optional (defaults to basic yes/no)

---

## 3. RefMedia Entry Schema

### Location

`packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`

### Schema Definition

```typescript
import { z } from 'zod'
import { mediaReferenceSchema } from '../media.schema'

/**
 * RefMedia entry with displayName for autocomplete
 * Extends MediaReference with user-friendly name
 */
const refMediaEntrySchema = mediaReferenceSchema.extend({
  displayName: z.string().optional(),
})

export type RefMediaEntry = z.infer<typeof refMediaEntrySchema>
```

### Type Definition

```typescript
type RefMediaEntry = {
  mediaAssetId: string              // Required: stable ID
  url: string                       // Required: media URL
  filePath: string                  // Required: storage path
  displayName?: string              // Optional: user-friendly name
}
```

### Example Data

```typescript
{
  mediaAssetId: "abc123xyz456",
  url: "https://storage.googleapis.com/clementine/media/overlay.jpg",
  filePath: "workspaces/ws1/media/overlay-xDzikf-inJI69MJ81TrsQ.jpg",
  displayName: "artStyle"  // User-defined or auto-generated
}
```

### DisplayName Generation

```typescript
/**
 * Auto-generate displayName from fileName
 * User can override in UI
 */
function deriveDisplayName(filePath: string): string {
  // Extract fileName from path
  const fileName = filePath.split('/').pop() || ''
  // "overlay-xDzikf-inJI69MJ81TrsQ.jpg"

  // Remove extension
  const withoutExt = fileName.replace(/\.[^.]+$/, '')
  // "overlay-xDzikf-inJI69MJ81TrsQ"

  // Take base (before first dash)
  const base = withoutExt.split('-')[0]
  // "overlay"

  return base
}
```

### Uniqueness Validation

DisplayNames must be unique within a node's refMedia array:

```typescript
function validateRefMediaUniqueness(refMedia: RefMediaEntry[]): ValidationError[] {
  const errors: ValidationError[] = []
  const displayNames = new Map<string, number>()

  for (const entry of refMedia) {
    const name = entry.displayName || deriveDisplayName(entry.filePath)
    const count = displayNames.get(name) || 0
    displayNames.set(name, count + 1)
  }

  for (const [name, count] of displayNames.entries()) {
    if (count > 1) {
      errors.push({
        field: 'refMedia',
        message: `DisplayName '${name}' is used by multiple media. Names must be unique.`
      })
    }
  }

  return errors
}
```

---

## 4. AI Image Node Schema

### Location

`packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`

### Schema Definition

```typescript
import { z } from 'zod'
import { nodeInputSourceSchema } from './node-input.schema'

/**
 * AI Image Generation Node (inline configuration)
 */
const aiImageNodeSchema = z.object({
  type: z.literal('ai.imageGeneration'),
  id: z.string(),

  // Inline configuration
  config: z.object({
    // Model settings
    model: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.0']),
    aspectRatio: z.enum(['1:1', '3:2', '2:3', '9:16', '16:9']),

    // Prompt (stored as plain text with @{type:name} patterns)
    prompt: z.string().min(1),

    // RefMedia (node-level media, not step media)
    refMedia: z.array(refMediaEntrySchema).default([]),
  }),

  // Optional input from previous node
  input: nodeInputSourceSchema.optional(),
})

export type AIImageNode = z.infer<typeof aiImageNodeSchema>
```

### Type Definition

```typescript
type AIImageNode = {
  type: 'ai.imageGeneration'
  id: string
  config: {
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-3.0'
    aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9'
    prompt: string                // Storage format: @{type:name}
    refMedia: RefMediaEntry[]     // Node-level media
  }
  input?: NodeInputSource         // Optional previous node
}
```

### Example Data

```typescript
{
  type: "ai.imageGeneration",
  id: "node1",
  config: {
    model: "gemini-2.5-pro",
    aspectRatio: "3:2",
    prompt: "Transform @{step:captureStep} into hobbit @{step:petStep}. Style: @{ref:abc123xyz}",
    refMedia: [
      {
        mediaAssetId: "abc123xyz456",
        url: "https://storage.googleapis.com/...",
        filePath: "workspaces/ws1/media/overlay.jpg",
        displayName: "artStyle"
      }
    ]
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `model` | enum | Gemini model to use |
| `aspectRatio` | enum | Output image dimensions |
| `prompt` | string | Stored prompt with @{type:name} patterns |
| `refMedia` | array | Node-level media (not step media) |

### Key Points

- `prompt` instead of `promptTemplate` (simpler naming)
- `refMedia` instead of `mediaRegistry` (explicit purpose)
- RefMedia contains only node-level media (NOT step option promptMedia)
- Step option promptMedia automatically available during resolution

---

## 5. Supporting Schemas

### MediaReference Schema

```typescript
/**
 * Reference to media asset
 */
const mediaReferenceSchema = z.object({
  mediaAssetId: z.string(),
  url: z.string().url(),
  filePath: z.string(),
})

export type MediaReference = z.infer<typeof mediaReferenceSchema>
```

### NodeInputSource Schema

```typescript
/**
 * Reference to output from previous node
 */
const nodeInputSourceSchema = z.object({
  nodeId: z.string(),
  outputKey: z.string().optional(),
})

export type NodeInputSource = z.infer<typeof nodeInputSourceSchema>
```

---

## Schema Migration Strategy

### Backward Compatibility

All new fields are **optional**, ensuring backward compatibility:

```typescript
// Old multiselect option (still valid)
{
  value: "cat"
}

// New AI-aware option (also valid)
{
  value: "cat",
  promptFragment: "holding a grumpy cat",
  promptMedia: { ... }
}
```

### Migration Path

1. **Phase 0**: Deploy schema changes (all fields optional)
2. **Phase 1**: Build UI for editing new fields
3. **Phase 2**: Update resolution logic to handle new fields
4. **Phase 3**: Users gradually adopt AI-aware features

**No breaking changes** - existing experiences continue working.

---

## Validation Summary

### Schema-Level Validation (Zod)

- ✅ Type safety (string, enum, object)
- ✅ Required/optional fields
- ✅ String length limits
- ✅ Array min/max items
- ✅ URL format validation

### Application-Level Validation

- ✅ DisplayName uniqueness (within refMedia array)
- ✅ Step reference existence (during resolution)
- ✅ RefMedia reference existence (during resolution)
- ✅ Required input presence (during test run)

See [Validation](./validation.md) for complete rules.

---

## Related Documents

- [Architecture](./architecture.md) - System overview
- [Three-Format System](./three-format-system.md) - Prompt format specifications
- [Resolution Algorithm](./resolution-algorithm.md) - How schemas are used
- [Validation](./validation.md) - Validation rules and edge cases
