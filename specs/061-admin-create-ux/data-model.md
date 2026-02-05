# Data Model: Admin Create Tab UX

**Feature**: 061-admin-create-ux
**Date**: 2026-02-05

## Overview

This feature uses existing Zod schemas from `packages/shared` with a rename from "create outcome" to "outcome" for clarity. This document maps the spec requirements to schema definitions.

---

## Schema Rename

As part of this implementation, we rename "create outcome" to simply "outcome":

| Current | New |
|---------|-----|
| `create-outcome.schema.ts` | `outcome.schema.ts` |
| `createOutcomeSchema` | `outcomeSchema` |
| `CreateOutcome` | `Outcome` |
| `createOutcomeTypeSchema` | `outcomeTypeSchema` |
| `CreateOutcomeType` | `OutcomeType` |
| `config.create` | `config.outcome` |

---

## Schema Definitions (After Rename)

### Outcome Schema

**Location**: `packages/shared/src/schemas/experience/outcome.schema.ts`

```typescript
// Outcome type (image, gif, video)
export const outcomeTypeSchema = z.enum(['image', 'gif', 'video'])

// AI model options
export const aiImageModelSchema = z.enum([
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
])

// Aspect ratio options
export const aiImageAspectRatioSchema = z.enum([
  '1:1',
  '3:2',
  '2:3',
  '9:16',
  '16:9',
])

// Image generation config
export const imageGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  refMedia: z.array(mediaReferenceSchema).default([]),
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),
  aspectRatio: aiImageAspectRatioSchema.default('1:1'),
})

// Complete outcome
export const outcomeSchema = z.object({
  type: outcomeTypeSchema.nullable().default(null),
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
```

### MediaReference Schema

**Location**: `packages/shared/src/schemas/media/media-reference.schema.ts`

```typescript
export const mediaReferenceSchema = z.object({
  mediaAssetId: z.string(),      // Firebase Storage asset ID
  displayName: z.string(),       // User-editable name for @mentions
})
```

### ExperienceStep Schema

**Location**: `packages/shared/src/schemas/experience/step.schema.ts`

```typescript
// Step types for filtering
export const experienceStepTypeSchema = z.enum([
  'info',
  'input.scale',
  'input.yesNo',
  'input.multiSelect',
  'input.shortText',
  'input.longText',
  'capture.photo',
])

// Base step properties
const baseStepSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: experienceStepTypeSchema,
  // ... additional fields per type
})
```

---

## Entity Relationships

```
Experience
└── config: ExperienceConfig
    ├── steps: ExperienceStep[]          ← Source for @mentions and source image
    ├── transformNodes: TransformNode[]  ← DEPRECATED (being replaced)
    └── outcome: Outcome | null          ← NEW outcome-based config
        ├── type: 'image' | 'gif' | 'video' | null
        ├── captureStepId: string | null  ← References steps[].id
        ├── aiEnabled: boolean
        ├── imageGeneration
        │   ├── prompt: string           ← Contains @{step:x} @{ref:x} mentions
        │   ├── refMedia: MediaReference[]
        │   ├── model: AIImageModel
        │   └── aspectRatio: AIImageAspectRatio
        └── options: OutcomeOptions | null
```

---

## Field Mapping: Spec → Schema

| Spec Requirement | Schema Field | Notes |
|------------------|--------------|-------|
| Outcome type selection | `outcome.type` | `null` = not selected |
| Source image dropdown | `outcome.captureStepId` | `null` = "None (prompt only)" |
| AI generation toggle | `outcome.aiEnabled` | Default: `true` |
| Prompt editor | `outcome.imageGeneration.prompt` | Contains mention syntax |
| Reference images | `outcome.imageGeneration.refMedia` | Array of `MediaReference` |
| Model selector | `outcome.imageGeneration.model` | Default: `'gemini-2.5-flash-image'` |
| Aspect ratio selector | `outcome.imageGeneration.aspectRatio` | Default: `'1:1'` |

---

## Validation Rules (UI Layer)

These validations are implemented in the UI, not in schemas:

| Rule | Implementation |
|------|----------------|
| Passthrough requires source | `!aiEnabled && !captureStepId` → error |
| AI requires prompt | `aiEnabled && prompt.trim() === ''` → error |
| captureStepId must exist | Check against `steps.map(s => s.id)` |
| displayName uniqueness | Check for duplicates in `refMedia` array |
| displayName characters | Reject `}`, `:`, `{` in displayName |

---

## Default Values

When creating a new experience or initializing the Create tab:

```typescript
const DEFAULT_OUTCOME: Outcome = {
  type: null,           // User must select
  captureStepId: null,  // "None (prompt only)"
  aiEnabled: true,      // AI enabled by default
  imageGeneration: {
    prompt: '',
    refMedia: [],
    model: 'gemini-2.5-flash-image',
    aspectRatio: '1:1',
  },
  options: null,
}
```

---

## State Transitions

### Outcome Type Selection

```
null → 'image'  : Show image-specific form
'image' → 'gif' : Show "coming soon" message (no state change)
'image' → 'video' : Show "coming soon" message (no state change)
```

### AI Toggle

```
aiEnabled: true → false : Collapse PromptComposer, preserve values
aiEnabled: false → true : Expand PromptComposer, restore values
```

### Passthrough Mode

```
aiEnabled: false + captureStepId: null  → Invalid (error shown)
aiEnabled: false + captureStepId: 'xxx' → Valid passthrough
```

---

## No New Contracts

This feature is entirely frontend-focused:

- **No new API endpoints**: Uses existing Firestore document updates
- **No new server functions**: Client SDK for all mutations
- **Schema rename only**: Existing schema structure is complete

The `contracts/` directory is not needed for this feature.
