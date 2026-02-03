# Data Model: Lexical Prompt Editor with Mentions

**Feature**: 055-lexical-prompt-editor
**Date**: 2026-02-01

## Overview

This feature does not introduce new database entities. It modifies how the existing `prompt` field is stored and displayed. The storage format changes from plain text to plain text with mention syntax.

## Storage Format

### Before (Plain Text)

```text
Create a portrait of the user's pet
```

### After (Plain Text with Mention Syntax)

```text
Create a portrait of @{step:Pet Choice} in @{ref:summer background.jpeg} style
```

**Key points**:
- Storage format remains a simple string
- Mentions are encoded as `@{type:name}` patterns using human-readable names
- Names are used (not IDs) for debuggability - prompts are readable in Firestore
- Trade-off: Renames invalidate references (visible via validation plugin)
- Compatible with existing Firestore schema (no migration needed)

## Entity Relationships

```text
┌─────────────────────────────────────────────────────────────────┐
│ Experience                                                       │
│ └── draft: ExperienceConfig                                      │
│     ├── steps: ExperienceStep[]                                  │
│     │   ├── id: string (UUID)                                    │
│     │   ├── name: string ────────────────┐ referenced by         │
│     │   └── type: ExperienceStepType     │ @{step:name}          │
│     │                                    │                       │
│     └── transformNodes: TransformNode[]  │                       │
│         └── AIImageNode                  │                       │
│             └── config                   │                       │
│                 ├── prompt: string ──────┘                       │
│                 │   Contains @{step:name} and @{ref:name}        │
│                 │                                                │
│                 └── refMedia: MediaReference[]                   │
│                     ├── mediaAssetId                             │
│                     └── displayName ─────────────────────┐       │
│                                        referenced by     │       │
│                                        @{ref:name} ──────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Mention Types

### StepMentionNode (Editor Node)

Represents a reference to an experience step in the Lexical editor.

| Property | Type | Description |
|----------|------|-------------|
| stepName | string | Step name (used for both display and storage) |
| stepType | ExperienceStepType | Step type for icon display |
| isInvalid | boolean | True if step name no longer matches any step |

**Serialization**: `@{step:stepName}`

**Color**: Blue pill (#e3f2fd background, #1976d2 text)

### MediaMentionNode (Editor Node)

Represents a reference to a media asset in the Lexical editor.

| Property | Type | Description |
|----------|------|-------------|
| mediaName | string | Display name (used for both display and storage) |
| isInvalid | boolean | True if display name no longer matches any refMedia |

**Serialization**: `@{ref:displayName}`

**Color**: Green pill (#e8f5e9 background, #2e7d32 text)

## Option Types (Runtime)

### StepOption

Used to populate the autocomplete menu with available steps.

```typescript
interface StepOption {
  id: string                  // Step UUID
  name: string                // Step display name
  type: ExperienceStepType    // For icon selection
}
```

**Adapter function**:
```typescript
function toStepOption(step: ExperienceStep): StepOption {
  return {
    id: step.id,
    name: step.name,
    type: step.type,
  }
}
```

### MediaOption

Used to populate the autocomplete menu with available media.

```typescript
interface MediaOption {
  id: string    // mediaAssetId
  name: string  // displayName
}
```

**Adapter function**:
```typescript
function toMediaOption(media: MediaReference): MediaOption {
  return {
    id: media.mediaAssetId,
    name: media.displayName,
  }
}
```

## State Transitions

### Mention Lifecycle

```text
┌──────────────┐     User types @     ┌──────────────┐
│    Empty     │ ──────────────────→ │  Autocomplete │
└──────────────┘                      │    Visible    │
                                      └───────┬───────┘
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     │                        │                        │
              User selects            User presses Esc          No match found
                     │                        │                        │
                     ▼                        ▼                        ▼
            ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
            │   Mention    │         │  Autocomplete │         │  Autocomplete │
            │   Inserted   │         │    Closed     │         │  Shows Empty  │
            └──────────────┘         └──────────────┘         └──────────────┘
```

### Mention Validation States

```text
┌──────────────┐
│    Valid     │  Step/media name matches current context
│  (normal)    │
└──────┬───────┘
       │
  Step/media renamed or deleted
       │
       ▼
┌──────────────┐
│   Invalid    │  Name no longer matches any step/media
│   (error)    │  Red styling, strikethrough
└──────────────┘
```

## Validation Rules

### Step Name Constraints (from existing schema)

- Min length: 1 character
- Max length: 50 characters
- Allowed characters: `[a-zA-Z0-9 \-_]`
- Cannot be empty or whitespace-only

### Mention Name Format

- Step names: `[a-zA-Z0-9 \-_]` (enforced by existing schema)
- Media display names: Should be restricted to `[a-zA-Z0-9 \-_.]` to prevent parsing issues (see `future-session-schema-refactor.md`)

### Prompt Field

- No length limit in schema (validated at publish time)
- Can be empty string
- UTF-8 encoded

## Migration

**No migration required.**

The storage format change is backward compatible:
- Old prompts without mentions work as-is
- New prompts with mentions are valid strings
- Deserializer handles both formats gracefully

## Index Requirements

**No new indexes required.**

The prompt field is not queried directly; it's read as part of the experience document.
