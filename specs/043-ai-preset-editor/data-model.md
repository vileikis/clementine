# Data Model: AI Preset Editor

**Branch**: `043-ai-preset-editor` | **Date**: 2025-01-26

## Overview

This document defines the data entities, relationships, and validation rules for the AI Preset Editor feature. The core entities already exist in `packages/shared/src/schemas/ai-preset/` - this document serves as a reference and defines additional editor-specific schemas.

---

## Core Entities

### AIPresetConfig (New - Phase 5.5)

Nested configuration object containing all editable preset fields. Used for both published (`config`) and draft (`draftConfig`) states.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `model` | enum | See values below | AI model selection |
| `aspectRatio` | enum | See values below | Output image aspect ratio |
| `mediaRegistry` | PresetMediaEntry[] | Array | Registered media for @mentions |
| `variables` | PresetVariable[] | Array | Variable definitions |
| `promptTemplate` | string | Any length | Prompt with @references |

**Model Values**: `'gemini-2.5-flash'` | `'gemini-2.5-pro'` | `'gemini-3.0'`

**Aspect Ratio Values**: `'1:1'` | `'3:2'` | `'2:3'` | `'16:9'` | `'9:16'`

---

### AIPreset (Updated - Phase 5.5)

**Firestore Path**: `/workspaces/{workspaceId}/aiPresets/{presetId}`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | string | Required, Firestore doc ID | Unique identifier |
| `name` | string | Required, 1-100 chars | Display name |
| `description` | string \| null | Max 500 chars | Optional description |
| `status` | enum | 'active' \| 'deleted' | Soft delete flag |
| `createdAt` | number | Unix timestamp (ms) | Creation time |
| `updatedAt` | number | Unix timestamp (ms) | Last modification time |
| `deletedAt` | number \| null | Unix timestamp (ms) | Deletion time (soft delete) |
| `createdBy` | string | User UID | Creator's user ID |
| `config` | AIPresetConfig | Required | Published configuration (used by runtime) |
| `draftConfig` | AIPresetConfig | Required | Draft configuration (edited in editor) |

**Draft/Published Model**:
- Editor writes to `draftConfig` (auto-save)
- Publish button copies `draftConfig` → `config`
- Runtime (experiences) reads from `config` only
- Similar pattern to Experience entity

**Backwards Compatibility** (Phase 5.5):
- Migration script moves existing top-level fields into `config` and `draftConfig`
- New presets are created with both configs identical

---

### PresetVariable (Existing)

Discriminated union based on `type` field.

#### TextVariable

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `type` | literal | 'text' | Discriminator |
| `name` | string | Alphanumeric + underscore, starts with letter/underscore | Reference name for @mentions |
| `label` | string | 1-100 chars | Display label for UI |
| `required` | boolean | Default: true | Whether input is required |
| `defaultValue` | string \| null | Any length | Default value if not provided |
| `valueMap` | ValueMappingEntry[] \| null | Array or null | Predefined value→text mappings |

#### ImageVariable

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `type` | literal | 'image' | Discriminator |
| `name` | string | Alphanumeric + underscore, starts with letter/underscore | Reference name for @mentions |
| `label` | string | 1-100 chars | Display label for UI |
| `required` | boolean | Default: true | Whether input is required |

**Name Validation Regex**: `/^[a-zA-Z_][a-zA-Z0-9_]*$/`

---

### ValueMappingEntry (Existing)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `value` | string | 1-100 chars, unique within variable | Input value (what user selects) |
| `text` | string | Any length | Output text (inserted in prompt) |

**Note**: `text` field can contain @references to other variables/media.

---

### PresetMediaEntry (Existing)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `mediaAssetId` | string | Required | Reference to media library asset |
| `url` | string | Valid URL | Public CDN URL for display |
| `filePath` | string | Required | Firebase Storage path |
| `name` | string | Alphanumeric + underscore, unique within preset | Reference name for @mentions |

**Name Validation Regex**: `/^[a-zA-Z_][a-zA-Z0-9_]*$/`

---

## Editor-Specific Schemas

### UpdateAIPresetInput

For partial updates via the editor. Updates `draftConfig` only (not published `config`).

```typescript
// All fields optional - only changed fields sent
{
  // Top-level fields (outside config)
  name?: string                    // 1-100 chars
  description?: string | null      // Max 500 chars

  // Draft config fields (written to draftConfig.*)
  model?: ModelType
  aspectRatio?: AspectRatioType
  mediaRegistry?: PresetMediaEntry[]
  variables?: PresetVariable[]
  promptTemplate?: string
}
```

**Validation Rules**:
- At least one field must be provided
- Each field validated against its constraints if present
- Config fields are written to `draftConfig`, not `config`
- Updates `updatedAt` timestamp

---

### PublishAIPresetInput

For publishing draft changes to the live configuration.

```typescript
{
  presetId: string                 // Required - preset to publish
}
```

**Behavior**:
- Copies `draftConfig` → `config`
- Updates `updatedAt` timestamp
- Returns updated preset

**Validation Rules**:
- User must have write permission on workspace
- Preset must exist and be active

---

### AddMediaToRegistryInput

For adding media from library.

```typescript
{
  mediaAssetId: string            // Required - ID from media library
  url: string                     // Required - CDN URL
  filePath: string                // Required - Storage path
  name: string                    // Required - Reference name, must be unique
}
```

**Validation Rules**:
- `name` must match `/^[a-zA-Z_][a-zA-Z0-9_]*$/`
- `name` must not conflict with existing media or variables

---

### CreateVariableInput

For adding a new variable.

```typescript
// Text variable
{
  type: 'text'
  name: string                    // Required, unique
  label: string                   // Required, 1-100 chars
  required?: boolean              // Default: true
  defaultValue?: string | null    // Optional
  valueMap?: ValueMappingEntry[]  // Optional
}

// Image variable
{
  type: 'image'
  name: string                    // Required, unique
  label: string                   // Required, 1-100 chars
  required?: boolean              // Default: true
}
```

**Validation Rules**:
- `name` must match `/^[a-zA-Z_][a-zA-Z0-9_]*$/`
- `name` must not conflict with existing variables or media

---

### UpdateVariableInput

For modifying an existing variable.

```typescript
{
  index: number                   // Required - position in array
  variable: PresetVariable        // Full variable object
}
```

---

### AddValueMappingInput

For adding a mapping to a text variable.

```typescript
{
  variableIndex: number           // Which variable
  value: string                   // 1-100 chars, unique within variable
  text: string                    // Output text
}
```

---

## Entity Relationships

```
Workspace (1)
    │
    └── AIPreset (many)
            │
            ├── config: AIPresetConfig (published)
            │       ├── model
            │       ├── aspectRatio
            │       ├── mediaRegistry: PresetMediaEntry[]
            │       │       └── References MediaAsset from media library
            │       ├── variables: PresetVariable[]
            │       │       ├── TextVariable
            │       │       │       └── ValueMappingEntry[]
            │       │       └── ImageVariable
            │       └── promptTemplate (string)
            │               └── Contains @references to Variables and Media
            │
            └── draftConfig: AIPresetConfig (draft - same structure as config)
```

**Note**: `config` is read by runtime (experiences), `draftConfig` is edited by the editor.

---

## Reference Resolution

### @Reference Format in promptTemplate

**Storage Format**: `@{type:name}`
- `@{var:subject}` - Reference to variable named "subject"
- `@{media:style_ref}` - Reference to media named "style_ref"

**Example**:
```
Create a portrait of @{var:subject} in the style of @{media:reference_image}.
The mood should be @{var:mood}.
```

### Resolution Rules

1. Variables are resolved first
2. Media references are resolved to actual image data
3. Unmapped values use defaultValue (text) or fail (image)
4. Invalid references (deleted var/media) should be flagged in editor

---

## State Transitions

### AIPreset Status

```
active ←───────────────────────→ deleted
       │   deletePreset()        │
       │ (sets deletedAt)        │
       └─────────────────────────┘
              (no restore)
```

### Draft/Publish Workflow (Phase 5.5)

```
┌─────────────────────────────────────────────────────┐
│                     AIPreset                         │
├─────────────────────────────────────────────────────┤
│  draftConfig                    config              │
│  ┌──────────────┐              ┌──────────────┐    │
│  │ model        │              │ model        │    │
│  │ aspectRatio  │   publish()  │ aspectRatio  │    │
│  │ mediaRegistry│ ──────────→  │ mediaRegistry│    │
│  │ variables    │              │ variables    │    │
│  │ promptTemplate│             │ promptTemplate│   │
│  └──────────────┘              └──────────────┘    │
│        ↑                                            │
│     Editor                        Runtime           │
│   (auto-save)                   (experiences)       │
└─────────────────────────────────────────────────────┘
```

**Workflow**:
1. Editor loads preset, displays `draftConfig` values
2. User makes changes → auto-saved to `draftConfig`
3. "Publish" button copies `draftConfig` → `config`
4. Experiences use `config` (stable, published version)

### Editor State (Client-side)

```
loading → loaded → editing → saving → saved
                      ↑         │
                      └─────────┘
                      (auto-save to draftConfig)

saved → hasUnpublishedChanges? → publish → published
```

**Change Detection**:
- Compare `draftConfig` vs `config` to detect unpublished changes
- Show indicator when draft differs from published

---

## Validation Constraints Summary

| Entity | Field | Constraint |
|--------|-------|------------|
| AIPreset | name | Required, 1-100 chars |
| AIPreset | description | Max 500 chars |
| AIPreset | model | One of 3 enum values |
| AIPreset | aspectRatio | One of 5 enum values |
| PresetVariable | name | Regex, unique across vars+media |
| PresetVariable | label | Required, 1-100 chars |
| PresetMediaEntry | name | Regex, unique across vars+media |
| ValueMappingEntry | value | 1-100 chars, unique within variable |

---

## Firestore Security Considerations

**Existing Rules** (from Phase 1):
- Read: Workspace members
- Write: Workspace admins only
- Path: `/workspaces/{workspaceId}/aiPresets/{presetId}`

**Phase 5.5 Notes**:
- Same permissions apply to both `config` and `draftConfig` updates
- Publish operation is a client-side write (copies draftConfig → config)
- No separate publish permission needed (workspace admin can edit = can publish)

---

## Migration Notes (Phase 5.5)

**Existing AIPreset documents** need migration to new schema structure:

```typescript
// Migration: Move top-level fields into nested config objects
const migratedPreset = {
  ...existingPreset,
  config: {
    model: existingPreset.model,
    aspectRatio: existingPreset.aspectRatio,
    mediaRegistry: existingPreset.mediaRegistry,
    variables: existingPreset.variables,
    promptTemplate: existingPreset.promptTemplate,
  },
  draftConfig: {
    model: existingPreset.model,
    aspectRatio: existingPreset.aspectRatio,
    mediaRegistry: existingPreset.mediaRegistry,
    variables: existingPreset.variables,
    promptTemplate: existingPreset.promptTemplate,
  },
}
// Remove old top-level fields after migration
```

**Migration Strategy**:
1. Create migration script in `functions/scripts/migrations/`
2. Run against all existing presets
3. Update schema validators
4. Deploy updated editor code
