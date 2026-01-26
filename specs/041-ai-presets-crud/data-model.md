# Data Model: AI Presets

**Feature**: 041-ai-presets-crud
**Date**: 2026-01-26

## Overview

This document defines the data model for AI Presets including Zod schemas, TypeScript types, and Firestore structure.

---

## 1. Firestore Structure

### Collection Path
```
/workspaces/{workspaceId}/aiPresets/{presetId}
```

### Document Structure
```json
{
  "id": "preset_abc123",
  "name": "My AI Preset",
  "description": "Optional description",
  "status": "active",

  "mediaRegistry": [
    { "name": "style_ref", "assetId": "asset_123", "url": "https://..." }
  ],

  "variables": [
    { "type": "image", "name": "subject", "label": "Subject Photo", "required": true },
    { "type": "text", "name": "style", "label": "Style", "required": false, "defaultValue": "realistic" }
  ],

  "promptTemplate": "Transform @subject in @style style using @style_ref as reference",

  "model": "gemini-2.5-flash",
  "aspectRatio": "1:1",

  "createdAt": 1706000000000,
  "updatedAt": 1706000000000,
  "deletedAt": null,
  "createdBy": "user_123"
}
```

---

## 2. Entity Schemas

### 2.1 AI Preset Status

```typescript
// packages/shared/src/schemas/ai-preset/ai-preset.schema.ts

export const aiPresetStatusSchema = z.enum(['active', 'deleted'])

export type AIPresetStatus = z.infer<typeof aiPresetStatusSchema>
```

### 2.2 Preset Media Entry

```typescript
// packages/shared/src/schemas/ai-preset/preset-media.schema.ts

/**
 * Media registry entry - references workspace media library
 * Used for images that can be included in prompts via @name syntax
 */
export const presetMediaEntrySchema = z.object({
  /** Reference name used in prompt (e.g., "cat", "hobbiton") - alphanumeric + underscore */
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid reference name'),

  /** Asset ID from workspace media library */
  assetId: z.string().min(1),

  /** Cached public URL for display (from media library) */
  url: z.string().url(),
})

export type PresetMediaEntry = z.infer<typeof presetMediaEntrySchema>
```

### 2.3 Value Mapping Entry

```typescript
// packages/shared/src/schemas/ai-preset/preset-variable.schema.ts

/**
 * Value mapping entry for text variables
 * Maps input values to prompt text (can include @media references)
 */
export const valueMappingEntrySchema = z.object({
  /** The input value to match */
  value: z.string().min(1),

  /** Text to substitute in prompt (can include @media references) */
  text: z.string(),
})

export type ValueMappingEntry = z.infer<typeof valueMappingEntrySchema>
```

### 2.4 Preset Variable (Discriminated Union)

```typescript
// packages/shared/src/schemas/ai-preset/preset-variable.schema.ts

/**
 * Text variable - from step answers or pass-through input
 */
export const textVariableSchema = z.object({
  type: z.literal('text'),

  /** Variable name used in prompt (alphanumeric + underscore) */
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid variable name'),

  /** Human-readable label for UI */
  label: z.string().min(1).max(100),

  /** Optional description for documentation */
  description: z.string().max(500).nullable().default(null),

  /** Whether this variable is required */
  required: z.boolean().default(true),

  /** Default value if not provided or unmapped */
  defaultValue: z.string().nullable().default(null),

  /** Value mappings (if not provided, pass-through) */
  valueMap: z.array(valueMappingEntrySchema).nullable().default(null),
})

/**
 * Image variable - from capture steps or node outputs
 */
export const imageVariableSchema = z.object({
  type: z.literal('image'),

  /** Variable name used in prompt (alphanumeric + underscore) */
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid variable name'),

  /** Human-readable label for UI */
  label: z.string().min(1).max(100),

  /** Optional description for documentation */
  description: z.string().max(500).nullable().default(null),

  /** Whether this variable is required */
  required: z.boolean().default(true),
})

/**
 * Preset variable - discriminated union of text and image types
 */
export const presetVariableSchema = z.discriminatedUnion('type', [
  textVariableSchema,
  imageVariableSchema,
])

export type TextVariable = z.infer<typeof textVariableSchema>
export type ImageVariable = z.infer<typeof imageVariableSchema>
export type PresetVariable = z.infer<typeof presetVariableSchema>
```

### 2.5 AI Model and Aspect Ratio

```typescript
// packages/shared/src/schemas/ai-preset/ai-preset.schema.ts

/**
 * Supported AI models for image generation
 */
export const aiModelSchema = z.enum([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.0',
])

/**
 * Supported aspect ratios for generated images
 */
export const aspectRatioSchema = z.enum([
  '1:1',
  '3:2',
  '2:3',
  '9:16',
  '16:9',
])

export type AIModel = z.infer<typeof aiModelSchema>
export type AspectRatio = z.infer<typeof aspectRatioSchema>
```

### 2.6 AI Preset (Main Entity)

```typescript
// packages/shared/src/schemas/ai-preset/ai-preset.schema.ts

/**
 * AI Preset document schema
 * Stored at /workspaces/{workspaceId}/aiPresets/{presetId}
 */
export const aiPresetSchema = z.looseObject({
  /**
   * IDENTITY
   */

  /** Preset ID (Firestore document ID) */
  id: z.string().min(1),

  /** Preset display name */
  name: z.string().min(1).max(100),

  /** Optional description */
  description: z.string().max(500).nullable().default(null),

  /**
   * LIFECYCLE
   */

  /** Preset status (soft delete) */
  status: aiPresetStatusSchema.default('active'),

  /** Creation timestamp (Unix ms) */
  createdAt: z.number(),

  /** Last update timestamp (Unix ms) */
  updatedAt: z.number(),

  /** Soft delete timestamp (Unix ms) */
  deletedAt: z.number().nullable().default(null),

  /** UID of admin who created the preset */
  createdBy: z.string().min(1),

  /**
   * CONFIGURATION
   */

  /** Media registry - images available for prompt references */
  mediaRegistry: z.array(presetMediaEntrySchema).default([]),

  /** Variable definitions */
  variables: z.array(presetVariableSchema).default([]),

  /** Prompt template with @variable and @media references */
  promptTemplate: z.string().default(''),

  /**
   * MODEL SETTINGS
   */

  /** AI model for generation */
  model: aiModelSchema.default('gemini-2.5-flash'),

  /** Output aspect ratio */
  aspectRatio: aspectRatioSchema.default('1:1'),
})

export type AIPreset = z.infer<typeof aiPresetSchema>
```

---

## 3. Input Schemas (Domain-specific)

These schemas are for mutation inputs, located in the app domain.

```typescript
// apps/clementine-app/src/domains/ai-presets/schemas/ai-preset.input.schemas.ts

/**
 * Create AI Preset input
 * Most fields optional - uses defaults
 */
export const createAIPresetInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
}).default({ name: 'Untitled preset' })

/**
 * Rename AI Preset input
 */
export const renameAIPresetInputSchema = z.object({
  presetId: z.string().min(1, 'Preset ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
})

/**
 * Delete AI Preset input
 */
export const deleteAIPresetInputSchema = z.object({
  presetId: z.string().min(1, 'Preset ID is required'),
})

/**
 * Duplicate AI Preset input
 */
export const duplicateAIPresetInputSchema = z.object({
  presetId: z.string().min(1, 'Preset ID is required'),
  newName: z.string().min(1).max(100).optional(), // If not provided, uses "Copy of {original}"
})

// Type exports
export type CreateAIPresetInput = z.infer<typeof createAIPresetInputSchema>
export type RenameAIPresetInput = z.infer<typeof renameAIPresetInputSchema>
export type DeleteAIPresetInput = z.infer<typeof deleteAIPresetInputSchema>
export type DuplicateAIPresetInput = z.infer<typeof duplicateAIPresetInputSchema>
```

---

## 4. Default Values

When creating a new AI Preset, the following defaults apply:

| Field | Default Value |
|-------|---------------|
| name | "Untitled preset" |
| description | null |
| status | "active" |
| mediaRegistry | [] |
| variables | [] |
| promptTemplate | "" |
| model | "gemini-2.5-flash" |
| aspectRatio | "1:1" |

---

## 5. Computed/Derived Values (for List Display)

The list page shows derived values that are computed from the stored data:

| Display Field | Derivation |
|--------------|------------|
| Variable count | `preset.variables.length` |
| Media count | `preset.mediaRegistry.length` |
| Last updated | `formatRelativeTime(preset.updatedAt)` |

---

## 6. Validation Rules

### Entity Validation (at save time)
1. `name` must be 1-100 characters
2. `description` must be ≤500 characters if provided
3. Variable names must be unique within `variables` array
4. Media names must be unique within `mediaRegistry` array
5. Variable/media names must match pattern: `^[a-zA-Z_][a-zA-Z0-9_]*$`

### Reference Validation (future - Phase 3)
1. All `@references` in `promptTemplate` must match a variable or media name
2. Required variables must have bindings when used in pipeline

---

## 7. Security Rules

```javascript
// firebase/firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ... existing rules ...

    match /workspaces/{workspaceId}/aiPresets/{presetId} {
      // Workspace members can read presets
      allow read: if isWorkspaceMember(workspaceId);

      // Workspace admins can create, update, delete presets
      allow write: if isWorkspaceAdmin(workspaceId);
    }
  }
}
```

---

## 8. Indexes

No custom indexes required for Phase 1-2. Basic queries:
- List all active presets: `where('status', '==', 'active')` + `orderBy('createdAt', 'desc')`

This uses the automatic single-field index on `status` and `createdAt`.
