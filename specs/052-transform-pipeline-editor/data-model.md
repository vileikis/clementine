# Data Model: Transform Pipeline Editor

**Phase**: 1 (Design & Contracts)
**Date**: 2026-01-31
**Status**: Complete

## Overview

This document defines the data model for the Transform Pipeline Editor feature. The model describes how AI Image nodes are structured, stored, and manipulated within the experience draft's transform configuration.

---

## Entity Relationship Diagram

```
Experience Draft (Firestore)
└── draft.transform: TransformConfig
    ├── nodes: TransformNode[]
    │   └── [0..n] TransformNode
    │       ├── id: string (nanoid)
    │       ├── type: 'ai.imageGeneration'
    │       └── config: AIImageNodeConfig
    │           ├── model: AIImageModel
    │           ├── aspectRatio: AIImageAspectRatio
    │           ├── prompt: string
    │           └── refMedia: MediaReference[]
    │               └── [0..n] MediaReference
    │                   ├── mediaAssetId: string
    │                   ├── url: string
    │                   ├── filePath: string | null
    │                   └── displayName: string
    └── outputFormat: OutputFormat | null
        ├── aspectRatio: OutputAspectRatio | null
        └── quality: number | null
```

---

## Core Entities

### 1. TransformConfig

**Description**: Container for all transformation nodes in an experience. Stored as part of the experience draft (`experience.draft.transform`).

**Schema**: `transformConfigSchema` (from `packages/shared/src/schemas/experience/transform.schema.ts`)

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `nodes` | `TransformNode[]` | Yes | `[]` | Ordered array of pipeline nodes |
| `outputFormat` | `OutputFormat \| null` | No | `null` | Post-processing settings |

**Relationships**:
- **Contains** 0 to many `TransformNode` entities
- **Part of** `ExperienceDraft` (stored in Firestore at `draft.transform`)

**Validation Rules**:
- Nodes array can be empty (valid empty pipeline)
- Output format is optional (null allowed)
- Uses `looseObject` schema for extensibility

**Storage**:
```typescript
// Firestore path
experiences/{workspaceId}_{experienceId}/draft.transform

// Example document
{
  draft: {
    transform: {
      nodes: [...],
      outputFormat: null
    }
  },
  draftVersion: 42,
  updatedAt: serverTimestamp()
}
```

---

### 2. TransformNode

**Description**: Represents a single transformation node in the pipeline. For Phase 1b-2, only AI Image Generation nodes are supported.

**Schema**: `transformNodeSchema` (from `packages/shared/src/schemas/experience/transform.schema.ts`)

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` | Yes | `nanoid()` | Unique node identifier |
| `type` | `string` | Yes | - | Node type identifier |
| `config` | `Record<string, unknown>` | Yes | `{}` | Node-specific configuration (polymorphic) |

**Relationships**:
- **Contained by** `TransformConfig`
- **For AI Image nodes**: config field contains `AIImageNodeConfig` data

**Validation Rules**:
- ID must be unique within the transform config
- Type determines config structure (polymorphic)
- Config is generic Record but validated against type-specific schema

**Node Types** (Phase 1b-2):
- `'ai.imageGeneration'`: AI Image Generation node (only type in this phase)

**Example**:
```typescript
{
  id: 'node_abc123',
  type: 'ai.imageGeneration',
  config: {
    model: 'gemini-2.5-flash-image',
    aspectRatio: '3:2',
    prompt: 'Transform @{step:Pet Choice} into a watercolor painting',
    refMedia: []
  }
}
```

---

### 3. AIImageNodeConfig

**Description**: Configuration for AI Image Generation nodes. Contains settings for model, aspect ratio, prompt template, and reference media.

**Schema**: `aiImageNodeConfigSchema` (from `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`)

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `model` | `AIImageModel` | Yes | `'gemini-2.5-pro'` | AI model for image generation |
| `aspectRatio` | `AIImageAspectRatio` | Yes | `'3:2'` | Output aspect ratio |
| `prompt` | `string` | Yes | - | Prompt template with placeholders |
| `refMedia` | `MediaReference[]` | Yes | `[]` | Reference media for prompt |

**Relationships**:
- **Part of** `TransformNode` (stored in `config` field)
- **Contains** 0 to many `MediaReference` entities

**Validation Rules**:
- Prompt minimum 1 character (cannot be empty)
- Model must be one of valid AIImageModel values
- Aspect ratio must be one of valid AIImageAspectRatio values
- RefMedia array required but can be empty

**Enumerations**:

**AIImageModel**:
- `'gemini-2.5-flash-image'` - Fast, lower cost
- `'gemini-3-pro-image-preview'` - Higher quality, preview model

**AIImageAspectRatio**:
- `'1:1'` - Square
- `'3:2'` - Landscape (default)
- `'2:3'` - Portrait
- `'9:16'` - Vertical (stories/reels)
- `'16:9'` - Horizontal (widescreen)

**Placeholder Syntax**:
- `@{step:stepName}` - Reference step output (e.g., `@{step:Pet Choice}`)
- `@{ref:mediaAssetId}` - Reference media from refMedia array

**Example**:
```typescript
{
  model: 'gemini-2.5-flash-image',
  aspectRatio: '1:1',
  prompt: 'Transform @{step:User Photo} with @{ref:media_xyz123} as reference',
  refMedia: [
    {
      mediaAssetId: 'media_xyz123',
      url: 'https://storage.googleapis.com/...',
      filePath: 'workspaces/ws-1/media/xyz.jpg',
      displayName: 'Art Style Reference'
    }
  ]
}
```

---

### 4. MediaReference

**Description**: Reference to a media asset used in prompts. Contains the media ID, URL, file path, and display name.

**Schema**: `mediaReferenceSchema` (from `packages/shared/src/schemas/media/media-reference.schema.ts`)

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `mediaAssetId` | `string` | Yes | - | Unique media identifier |
| `url` | `string` | Yes | - | Public URL for media access |
| `filePath` | `string \| null` | No | `null` | Storage path (nullable for backward compatibility) |
| `displayName` | `string` | Yes | `'Untitled'` | Human-readable name for UI |

**Relationships**:
- **Contained by** `AIImageNodeConfig` (in refMedia array)
- **Referenced by** prompt placeholders (`@{ref:mediaAssetId}`)

**Validation Rules**:
- mediaAssetId must be unique within refMedia array
- URL must be valid URL format (Zod `.url()` validator)
- displayName always has value (defaults to 'Untitled')
- filePath is nullable (backward compatibility)

**Example**:
```typescript
{
  mediaAssetId: 'media_abc123',
  url: 'https://storage.googleapis.com/clementine-prod/media/abc.jpg',
  filePath: 'workspaces/ws-1/experiences/exp-1/media/abc.jpg',
  displayName: 'Overlay Image'
}
```

---

## UI State Entities

### 5. GenerateEditorState (Zustand Store)

**Description**: Client-side UI state for the transform pipeline editor. Manages selected node and save status.

**Location**: `domains/experience/generate/stores/useGenerateEditorStore.ts`

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `selectedNodeId` | `string \| null` | Yes | `null` | Currently selected node ID |
| `pendingSaves` | `number` | Yes | `0` | Count of pending save operations |
| `lastCompletedAt` | `number \| null` | Yes | `null` | Timestamp of last save completion |

**Actions**:
- `setSelectedNodeId(id: string | null)`: Set selected node
- `startSave()`: Increment pending saves counter
- `completeSave()`: Decrement counter, update timestamp

**State Transitions**:
```
selectedNodeId:
  null → node_id (user clicks node card)
  node_id → null (user closes editor panel)
  node_id_1 → node_id_2 (user clicks different node)

pendingSaves:
  0 → 1 (save starts)
  1 → 0 (save completes)

lastCompletedAt:
  null → timestamp (first save completes)
  timestamp_1 → timestamp_2 (subsequent saves)
```

---

## Data Flow

### Create Node Flow

```
User clicks "Add Node"
  ↓
useAddNode hook:
  1. Generate node ID (nanoid)
  2. Create default config
  3. Add to nodes array
  4. Update local state (immediate)
  5. Call useUpdateTransformConfig
  ↓
useUpdateTransformConfig hook:
  1. Validate transform config
  2. Update Firestore (transaction)
  3. Increment draftVersion
  4. Set updatedAt timestamp
  ↓
TanStack Query:
  1. Invalidate experience cache
  2. Refetch experience data
  ↓
UI updates with new node
```

### Delete Node Flow

```
User clicks delete button
  ↓
DeleteNodeDialog opens
  ↓
User confirms deletion
  ↓
useDeleteNode hook:
  1. Filter node from nodes array
  2. Update local state (immediate)
  3. Call useUpdateTransformConfig
  ↓
useUpdateTransformConfig hook:
  1. Validate transform config
  2. Update Firestore (transaction)
  3. Increment draftVersion
  4. Set updatedAt timestamp
  ↓
TanStack Query:
  1. Invalidate experience cache
  2. Refetch experience data
  ↓
Dialog closes
UI updates without deleted node
```

### Auto-Save Flow

```
User edits node (future phases - Phase 1b-2 has placeholder only)
  ↓
Form updates
  ↓
useAutoSave hook:
  1. Debounce 2000ms
  2. Validate form
  3. Compare with original values
  4. Detect changes
  ↓
If changes detected:
  useTrackedMutation:
    1. store.startSave() (pendingSaves++)
    2. Call useUpdateTransformConfig
    3. store.completeSave() (pendingSaves--, update timestamp)
  ↓
EditorSaveStatus component:
  1. Shows spinner while pendingSaves > 0
  2. Shows checkmark for 3 seconds after completion
```

---

## Firestore Structure

### Experience Document

```typescript
// Path: experiences/{workspaceId}_{experienceId}
{
  id: 'exp_abc123',
  workspaceId: 'ws_xyz789',
  name: 'Summer Festival Photo Booth',
  status: 'draft',

  // Draft configuration (editable)
  draft: {
    steps: [...],
    theme: {...},
    welcome: {...},

    // Transform configuration (THIS FEATURE)
    transform: {
      nodes: [
        {
          id: 'node_123',
          type: 'ai.imageGeneration',
          config: {
            model: 'gemini-2.5-flash-image',
            aspectRatio: '3:2',
            prompt: 'Transform @{step:User Photo} into vintage style',
            refMedia: []
          }
        }
      ],
      outputFormat: null
    }
  },

  // Optimistic locking
  draftVersion: 42,

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Update Operations

**Add Node**:
```typescript
// Transaction update
{
  'draft.transform.nodes': arrayUnion(newNode),
  'draftVersion': increment(1),
  'updatedAt': serverTimestamp()
}
```

**Delete Node**:
```typescript
// Full replace (array operations don't support removal by filter)
{
  'draft.transform': {
    nodes: nodes.filter(n => n.id !== deletedNodeId),
    outputFormat: existingOutputFormat
  },
  'draftVersion': increment(1),
  'updatedAt': serverTimestamp()
}
```

**Update Config** (future phases):
```typescript
// Full replace (nested object update)
{
  'draft.transform': {
    nodes: updatedNodes,
    outputFormat: existingOutputFormat
  },
  'draftVersion': increment(1),
  'updatedAt': serverTimestamp()
}
```

---

## Default Values

### New AI Image Node

```typescript
{
  id: nanoid(),
  type: 'ai.imageGeneration',
  config: {
    model: 'gemini-2.5-pro',           // Default model
    aspectRatio: '3:2',                 // Default aspect ratio
    prompt: '',                         // Empty (user fills in future phases)
    refMedia: []                        // Empty array
  }
}
```

### Empty Transform Config

```typescript
{
  nodes: [],
  outputFormat: null
}
```

---

## Constraints & Invariants

### Business Rules

1. **Node ID Uniqueness**: Each node must have a unique ID within the transform config
2. **Prompt Required**: AI Image nodes cannot have empty prompts (enforced by schema)
3. **Model Required**: AI Image nodes must specify a valid model
4. **Aspect Ratio Required**: AI Image nodes must specify a valid aspect ratio
5. **RefMedia Array Required**: refMedia must exist (but can be empty)

### Data Integrity

1. **Draft Version Increments**: Every update must increment draftVersion for conflict detection
2. **Server Timestamps**: updatedAt must use serverTimestamp() for consistency
3. **Transaction Updates**: All multi-field updates must use transactions for atomicity
4. **Cache Invalidation**: All mutations must invalidate TanStack Query cache

### UI Constraints

1. **Single Selection**: Only one node can be selected at a time (selectedNodeId is string | null)
2. **Save Status**: pendingSaves count must be ≥ 0
3. **Timestamp Ordering**: lastCompletedAt must be monotonically increasing

---

## Migration Considerations

**Phase 1b-2 Scope**: This phase implements foundational CRUD operations only. Future phases will add:

- **Phase 1c**: RefMedia management (upload, edit, delete)
- **Phase 1d**: Lexical prompt editor (mention nodes, autocomplete)
- **Phase 1e**: Model and aspect ratio controls (Settings UI)
- **Phase 1f**: Prompt resolution logic (not data model)

**Backward Compatibility**: All schemas use extensible patterns (looseObject, optional fields) to support future enhancements without breaking changes.

**No Migration Needed**: Transform config is new field in draft. Existing experiences without transform config will default to empty config `{ nodes: [], outputFormat: null }`.

---

## Summary

The data model provides:
- ✅ Clear entity relationships (TransformConfig → TransformNode → AIImageNodeConfig → MediaReference)
- ✅ Comprehensive validation rules (Zod schemas from Phase 1a)
- ✅ Firestore storage structure (dot notation updates, transactions)
- ✅ UI state management (Zustand store for selection and save status)
- ✅ Data flow documentation (create, delete, auto-save)
- ✅ Default values for new entities
- ✅ Constraints and invariants for data integrity

Ready for implementation (Phase 2: Tasks).
