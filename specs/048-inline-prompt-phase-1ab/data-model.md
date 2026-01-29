# Data Model: Inline Prompt Architecture - Phase 1a & 1b

**Feature**: 048-inline-prompt-phase-1ab
**Date**: 2026-01-29

## Overview

This document defines the data model changes for Phase 1a & 1b of the inline prompt architecture. These changes establish the foundation for AI-aware step configuration with human-readable step names and optional AI context on multiselect options.

## Entity Relationship Diagram

```
Experience
  └── steps: ExperienceStep[] (1:N)
      ├── name: string (required, unique)
      └── config: StepConfig
          └── [for multiselect] options: MultiSelectOption[] (1:N)
              ├── promptFragment?: string
              └── promptMedia?: MediaReference (N:1)

TransformConfig
  └── nodes: TransformNode[] (1:N)
      └── [for AI nodes] config: AIImageNodeConfig
          ├── prompt: string (references step names)
          └── refMedia: RefMediaEntry[] (1:N)
              └── extends MediaReference
                  └── displayName: string
```

---

## Entities

### ExperienceStep (Updated)

**Purpose**: Represents a single step in the experience flow with required unique name for prompt references.

**Schema Location**: `packages/shared/src/schemas/experience/step.schema.ts`

#### Fields

| Field | Type | Required | Constraints | Change |
|-------|------|----------|-------------|--------|
| `id` | UUID | Yes | Unique identifier | Unchanged |
| `type` | ExperienceStepType | Yes | Enum of step types | Unchanged |
| `name` | string | Yes | See validation rules below | **Changed** - now required |
| `config` | ExperienceStepConfig | Yes | Varies by step type | Unchanged |

#### Validation Rules

**name field** (enforced by Zod schema):
- **Required**: Cannot be `undefined`, `null`, or empty string after trim
- **Regex**: Must match `/^[a-zA-Z0-9 \-_]+$/` (letters, numbers, spaces, hyphens, underscores only)
- **Max Length**: 50 characters
- **Trimmed**: Automatically trimmed before validation (whitespace-only names rejected)
- **Uniqueness**: Must be unique within experience (case-sensitive, enforced in UI hook)

**Error Messages**:
- Empty name: "Step name is required"
- Invalid characters: "Step name can only contain letters, numbers, spaces, hyphens, and underscores"
- Exceeds length: "Step name must be 50 characters or less"
- Duplicate (UI hook): `Name "{name}" is already used`

#### State Transitions

```
1. Step created → auto-generate name from type
   Example: multiselect → "Pet Choice", capture.photo → "User Photo"

2. User edits name → validate format on blur
   - Check regex pattern
   - Check max length
   - Trim whitespace

3. User edits name → check uniqueness on blur
   - Scan all steps in experience
   - Case-sensitive comparison
   - Exclude current step

4. Valid name → debounced auto-save to Firestore (2000ms)
   - Optimistic UI update (immediate)
   - Firestore write after debounce

5. Invalid name → show inline error, prevent save
   - Display error message below input
   - Red border on input field
   - No Firestore write
```

#### Relationships

- **One Experience has many Steps** (1:N)
  - Parent: Experience document in Firestore
  - Foreign key: Experience.steps array

- **Step names referenced in AI node prompts** (N:N via string references)
  - AI node prompt: `@{step:Pet Choice}` references step with `name: "Pet Choice"`
  - Referential integrity via validation (not enforced in database)

#### Example

```typescript
// Valid step with required name
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "input.multiSelect",
  name: "Pet Choice",  // <-- Now required (was optional)
  config: {
    title: "What's your favorite pet?",
    required: true,
    options: ["Cat", "Dog", "Bird"],
    multiSelect: false
  }
}

// Auto-generated name examples
{
  type: "input.multiSelect" → name: "Pet Choice" (or "Option Selection")
  type: "capture.photo" → name: "User Photo"
  type: "input.shortText" → name: "Text Input"
  type: "input.scale" → name: "Rating"
}
```

---

### MultiSelectOption (Updated)

**Purpose**: Selectable option in multiselect step, optionally enhanced with AI context.

**Schema Location**: `packages/shared/src/schemas/experience/steps/input-multi-select.schema.ts`

#### Fields

| Field | Type | Required | Constraints | Change |
|-------|------|----------|-------------|--------|
| `value` | string | Yes | 1-100 chars, option display text | Unchanged |
| `promptFragment` | string | No | Max 500 chars | **NEW** |
| `promptMedia` | MediaReference | No | Valid MediaReference | **NEW** |

#### Validation Rules

**promptFragment**:
- Optional (may be `undefined` or omitted)
- If present, max 500 characters
- Plain text (no formatting, no HTML)
- Inserted verbatim into prompt when option selected

**promptMedia**:
- Optional (may be `undefined` or omitted)
- If present, must be valid MediaReference (Zod schema validation)
- References uploaded image in Firebase Storage
- Inserted as `<mediaAssetId>` in prompt when option selected

**AI-Aware Logic**:
- Option is "AI-enabled" if `promptFragment !== undefined` OR `promptMedia !== undefined`
- At least one of (value, promptFragment, promptMedia) must be non-empty (implicit from value validation)

#### Visual Indicator

**AIEnabledBadge Component**:
- Shown in option list when option is AI-enabled
- Badge text: "AI" with Sparkles icon
- Theme tokens: `bg-primary/10 text-primary`
- Location: Inline with option value in list view

#### Relationships

- **One MultiSelect Step has many Options** (1:N)
  - Parent: ExperienceInputMultiSelectStepConfig.options array
  - Index: Array position

- **Option promptMedia references MediaAsset** (N:1, optional)
  - Foreign key: promptMedia.mediaAssetId
  - Stored in Firebase Storage: `prompt-media/{workspaceId}/{mediaAssetId}`

#### Example

```typescript
// Plain option (no AI context)
{
  value: "Dog"
}

// AI-enabled option (promptFragment only)
{
  value: "Cat",
  promptFragment: "fluffy orange tabby cat with green eyes"
}

// AI-enabled option (promptMedia only)
{
  value: "Bird",
  promptMedia: {
    mediaAssetId: "abc-123",
    url: "https://storage.googleapis.com/.../abc-123.jpg",
    filePath: "prompt-media/workspace-id/abc-123.jpg",
    fileName: "parrot.jpg"
  }
}

// AI-enabled option (both)
{
  value: "Cat",
  promptFragment: "fluffy orange tabby cat",
  promptMedia: { /* ... */ }
}
```

---

### MediaReference (Unchanged)

**Purpose**: Reference to uploaded media file in Firebase Storage.

**Schema Location**: `packages/shared/src/schemas/media.schema.ts` (assumed existing)

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaAssetId` | string | Yes | Unique identifier (UUID) |
| `url` | string | Yes | Full public URL |
| `filePath` | string | Yes | Storage path |
| `fileName` | string | No | Original filename (optional) |

**Note**: This schema already exists in the codebase and is used for experience covers, generated images, etc. No changes needed.

#### Usage in This Feature

- **MultiSelectOption.promptMedia**: Optional reference to uploaded prompt media
- **RefMediaEntry** (below): Extends MediaReference with displayName

---

### RefMediaEntry (New, Phase 1a)

**Purpose**: MediaReference extended with display name for AI node reference media.

**Schema Location**: `packages/shared/src/schemas/experience/nodes/ref-media-entry.schema.ts` (new file)

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| *(All MediaReference fields)* | - | - | Inherited |
| `displayName` | string | Yes | Human-readable name for prompt editor autocomplete |

#### Validation Rules

**displayName**:
- Required (non-empty string)
- Max length: 50 characters (consistent with step names)
- Uniqueness: Enforced in UI (not schema) - must be unique within AI node's refMedia array
- Auto-generated from fileName on upload, editable by user

#### Relationships

- **Extends MediaReference** (inheritance)
  - Has all fields from MediaReference
  - Adds displayName field

- **Part of AI Node refMedia array** (1:N)
  - Parent: AIImageNodeConfig.refMedia array
  - Used in prompt editor autocomplete

#### Example

```typescript
{
  // MediaReference fields
  mediaAssetId: "def-456",
  url: "https://storage.googleapis.com/.../def-456.jpg",
  filePath: "ref-media/workspace-id/def-456.jpg",
  fileName: "style-guide-1.jpg",

  // New field
  displayName: "Style Guide"  // <-- Used in autocomplete: @Style Guide
}
```

**Note**: RefMedia management UI is Phase 1c (out of scope for 1a/1b). Schema defined now for completeness.

---

### AIImageNode (New, Phase 1a)

**Purpose**: Transform pipeline node for AI image generation with inline prompt configuration.

**Schema Location**: `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts` (new file)

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Node identifier (unique within transform pipeline) |
| `type` | "ai.imageGeneration" | Yes | Literal discriminator for node type |
| `config` | AIImageNodeConfig | Yes | AI-specific configuration (see below) |

#### AIImageNodeConfig Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | AI model identifier (e.g., "gemini-2.5-pro") |
| `aspectRatio` | AspectRatio | Yes | Output aspect ratio enum |
| `prompt` | string | Yes | Prompt template with placeholders |
| `refMedia` | RefMediaEntry[] | Yes | Reference media array (may be empty) |

**AspectRatio Enum**: `"1:1" | "3:2" | "2:3" | "9:16" | "16:9"`

#### Validation Rules

**prompt**:
- Required (non-empty string)
- Contains placeholders: `@{step:stepName}` and `@{ref:mediaAssetId}`
- No max length (prompts can be long)
- Validated at resolution time (undefined step/media references flagged)

**refMedia**:
- Array (may be empty `[]`)
- Each entry must be valid RefMediaEntry
- No max count (practical limit ~20 for UX)

**model** and **aspectRatio**:
- Validated against Zod enums
- Model options defined in schema (e.g., "gemini-2.5-pro", "gemini-2.5-flash")

#### Relationships

- **Part of TransformConfig.nodes array** (1:N)
  - Parent: TransformConfig document
  - Array of mixed node types (AI, filter, etc.)

- **Prompt references ExperienceSteps by name** (N:N via string references)
  - `@{step:Pet Choice}` resolves to step with `name: "Pet Choice"`
  - Validation at resolution time (not enforced in schema)

- **refMedia contains MediaReferences** (1:N)
  - Each RefMediaEntry has mediaAssetId
  - Uploaded to Firebase Storage: `ref-media/{workspaceId}/{mediaAssetId}`

#### Example

```typescript
{
  id: "node-1",
  type: "ai.imageGeneration",
  config: {
    model: "gemini-2.5-pro",
    aspectRatio: "3:2",
    prompt: "A photo of @{step:Pet Choice} in a park with @{ref:style-guide-1}",
    refMedia: [
      {
        mediaAssetId: "style-guide-1",
        url: "https://storage.googleapis.com/.../style-1.jpg",
        filePath: "ref-media/workspace-id/style-1.jpg",
        fileName: "park-style.jpg",
        displayName: "Park Style"
      }
    ]
  }
}
```

**Note**: Prompt editing UI and refMedia management are Phase 1c+ (out of scope). Schema defined now to enable incremental development.

---

### TransformConfig (Updated)

**Purpose**: Configuration for experience transform pipeline.

**Schema Location**: `packages/shared/src/schemas/experience/transform.schema.ts`

#### Fields

| Field | Type | Required | Change |
|-------|------|----------|--------|
| `nodes` | TransformNode[] | Yes | Unchanged |
| `variableMappings` | VariableMapping[] | - | **REMOVED** |
| `outputFormat` | OutputFormat | No | Unchanged |

#### Breaking Change

**Removed**: `variableMappings` field

**Rationale**:
- Obsolete with inline prompt architecture
- Step name references replace variable mappings
- Field was never fully implemented (no UI, no runtime usage)

**Safety**:
- System is pre-launch (no production data to migrate)
- Backward compatibility not needed (no existing usages)

**Migration**: None needed

#### Example

```typescript
// BEFORE (old schema)
{
  nodes: [/* ... */],
  variableMappings: [  // <-- REMOVED
    { source: "step1", target: "inputImage", mappingType: "direct" }
  ],
  outputFormat: { aspectRatio: "3:2", quality: 90 }
}

// AFTER (new schema)
{
  nodes: [
    {
      id: "node-1",
      type: "ai.imageGeneration",
      config: {
        prompt: "@{step:Pet Choice}",  // <-- Direct reference replaces mapping
        /* ... */
      }
    }
  ],
  // variableMappings field removed
  outputFormat: { aspectRatio: "3:2", quality: 90 }
}
```

---

## Schema Update Summary

| Schema | File | Change Type | Breaking |
|--------|------|-------------|----------|
| `experienceStepNameSchema` | `step.schema.ts` | Modified | Yes - now required |
| `experienceInputMultiSelectStepConfigSchema` | `input-multi-select.schema.ts` | Modified | No - additive only |
| `refMediaEntrySchema` | `nodes/ref-media-entry.schema.ts` | New | N/A |
| `aiImageNodeSchema` | `nodes/ai-image-node.schema.ts` | New | N/A |
| `transformConfigSchema` | `transform.schema.ts` | Modified | Yes - removed field |
| `transformNodeSchema` | `transform.schema.ts` | Modified | No - supports more types |

---

## Type Safety Guarantees

All schemas generate strict TypeScript types with no `any` or `unknown`:

```typescript
// Step names are required strings (not string | undefined)
type ExperienceStep = {
  id: string
  type: ExperienceStepType
  name: string  // <-- Changed from `string | undefined` to `string`
  config: ExperienceStepConfig
}

// Multiselect options have optional AI fields (explicit undefined, not any)
type MultiSelectOption = {
  value: string
  promptFragment?: string  // <-- NEW (string | undefined)
  promptMedia?: MediaReference  // <-- NEW (MediaReference | undefined)
}

// AI node config is fully typed (no loose objects)
type AIImageNodeConfig = {
  model: string
  aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9'  // Enum, not string
  prompt: string
  refMedia: RefMediaEntry[]  // Array, not any[]
}

// RefMediaEntry extends MediaReference (type-safe inheritance)
type RefMediaEntry = MediaReference & {
  displayName: string
}
```

---

## Firestore Document Structure

### Experience Draft Document

**Collection**: `experience-drafts`
**Document ID**: `{draftId}` (UUID)

```typescript
{
  id: string
  workspaceId: string
  createdAt: Timestamp
  updatedAt: Timestamp

  // Steps array with required names
  steps: ExperienceStep[]  // <-- Updated

  // Transform config without variableMappings
  transformConfig?: {
    nodes: TransformNode[]  // <-- May include AI nodes
    // variableMappings removed
    outputFormat?: {
      aspectRatio: "3:2" | /* ... */
      quality: number
    }
  }

  // ... other fields (theme, metadata, etc.)
}
```

### Step Document Structure

```typescript
// Multiselect step with AI-aware options
{
  id: "uuid-1",
  type: "input.multiSelect",
  name: "Pet Choice",  // <-- Required
  config: {
    title: "Choose your pet",
    required: true,
    multiSelect: false,
    options: [
      {
        value: "Cat",
        promptFragment: "fluffy orange tabby",  // <-- NEW
        promptMedia: {  // <-- NEW
          mediaAssetId: "media-1",
          url: "https://storage.googleapis.com/.../media-1.jpg",
          filePath: "prompt-media/workspace-id/media-1.jpg",
          fileName: "cat.jpg"
        }
      },
      {
        value: "Dog"
        // No promptFragment or promptMedia (plain option)
      }
    ]
  }
}
```

### Transform Node Document Structure

```typescript
// AI image generation node
{
  id: "node-1",
  type: "ai.imageGeneration",
  config: {
    model: "gemini-2.5-pro",
    aspectRatio: "3:2",
    prompt: "A @{step:Pet Choice} playing in the park",
    refMedia: [
      {
        mediaAssetId: "ref-1",
        url: "https://storage.googleapis.com/.../ref-1.jpg",
        filePath: "ref-media/workspace-id/ref-1.jpg",
        fileName: "park.jpg",
        displayName: "Park Background"
      }
    ]
  }
}
```

---

## Migration Strategy

### Existing Data Handling

**Scenario**: Existing experiences have steps with `name: undefined` or `name: ""`

**Solution**: Graceful degradation with UI fallback

1. **StepList Display**: Show `step.name || step.config.title || 'Untitled Step'`
2. **Auto-Migration on Edit**: When user opens step editor, auto-generate name if missing
3. **No Forced Migration**: App renders existing experiences (doesn't block access)

**Testing**:
- Load experience with old schema (name: undefined)
- Verify StepList shows fallback (title)
- Open step editor, verify name auto-generated
- Save, verify name persists

**No Migration Script Needed**: System is pre-launch, graceful degradation sufficient.

---

## Validation Rules Summary

### Schema-Level (Zod)

- Step name: required, regex `/^[a-zA-Z0-9 \-_]+$/`, max 50 chars
- Prompt fragment: optional, max 500 chars
- Prompt media: optional, valid MediaReference

### Application-Level (UI Hooks)

- Step name uniqueness: case-sensitive, within experience
- DisplayName uniqueness: within AI node refMedia array (Phase 1c)

### Firestore-Level (Security Rules)

- No new rules needed for Phase 1a/1b
- Existing workspace auth rules sufficient

---

## Future Enhancements (Out of Scope)

- **Phase 1c**: RefMedia management UI, displayName editing
- **Phase 1d**: Lexical prompt editor with step/media mentions
- **Phase 1f**: Prompt resolution algorithm (template → resolved text)
- **Future**: Firestore security rules for step name validation
