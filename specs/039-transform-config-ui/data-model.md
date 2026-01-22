# Data Model: Transform Pipeline Creator Config UI

**Date**: 2026-01-22
**Feature**: 039-transform-config-ui

## Overview

This document defines the data model for the Transform Pipeline Config UI. The schema extends the existing transform configuration embedded in the Experience document.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Experience                                   │
│  (existing document at /workspaces/{wId}/experiences/{eId})     │
├─────────────────────────────────────────────────────────────────┤
│  draft: ExperienceConfig                                         │
│    ├── steps: Step[]                    ← existing               │
│    └── transform: TransformConfig | null ← EXTENDED              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TransformConfig                               │
├─────────────────────────────────────────────────────────────────┤
│  variableMappings: Record<string, VariableMapping>               │
│  nodes: TransformNode[]                                          │
│  outputFormat: 'image' | 'gif' | 'video'                        │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│   VariableMapping    │    │        TransformNode              │
├──────────────────────┤    │    (discriminated union)          │
│  type: DataType      │    ├──────────────────────────────────┤
│  stepId: string      │    │  RemoveBackgroundNode             │
│  field?: string      │    │  CompositeNode                    │
│  defaultValue?: any  │    │  BackgroundSwapNode               │
└──────────────────────┘    │  AiImageNode                      │
                            └──────────────────────────────────┘
```

---

## Entities

### TransformConfig

The complete transform configuration embedded in `experience.draft.transform`.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| variableMappings | `Record<string, VariableMapping>` | Yes | `{}` | Maps variable names to step data sources |
| nodes | `TransformNode[]` | Yes | `[]` | Ordered array of pipeline nodes |
| outputFormat | `'image' \| 'gif' \| 'video'` | Yes | `'image'` | Expected output media type |

**Validation Rules**:
- `nodes` can be empty during draft editing (loose validation)
- `nodes` must have at least 1 node at publish time (strict validation - Phase 8)

---

### VariableMapping

Maps a named variable to data from a step.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| type | `'answer' \| 'capturedMedia'` | Yes | - | Type of data to extract from step |
| stepId | `string` | Yes | - | ID of the source step |
| field | `string \| null` | No | `null` | Specific field for structured answers |
| defaultValue | `string \| number \| boolean \| null` | No | `null` | Fallback if step data is missing |

**Validation Rules**:
- Variable name (the key in the record) must be unique within variableMappings
- Variable name should be alphanumeric with underscores (for prompt template compatibility)
- stepId should reference an existing step (warning if not, error on publish)

---

### NodeInputSource

Discriminated union specifying where a node gets its input.

**Variant: Variable**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| source | `'variable'` | Yes | Discriminator |
| variableName | `string` | Yes | Reference to variableMappings key |

**Variant: PreviousNode**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| source | `'previousNode'` | Yes | Discriminator |

**Variant: SpecificNode**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| source | `'node'` | Yes | Discriminator |
| nodeId | `string` | Yes | ID of the source node |

---

### TransformNode (Base)

Common fields for all node types.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | `string (UUID)` | Yes | Unique node identifier |
| type | `NodeType` | Yes | Discriminator for node type |

---

### RemoveBackgroundNode

Removes background from an image.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | `string` | Yes | - | Node ID |
| type | `'removeBackground'` | Yes | - | Discriminator |
| input | `NodeInputSource` | Yes | - | Source image |
| mode | `'keepSubject' \| 'keepBackground'` | No | `'keepSubject'` | What to keep |

**Display Name**: "Cut Out"
**Icon**: Scissors (✂️)

---

### CompositeNode

Layers multiple images together.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | `string` | Yes | - | Node ID |
| type | `'composite'` | Yes | - | Discriminator |
| layers | `CompositeLayer[]` | Yes | `[]` | Layers to combine (Phase 6) |
| outputFormat | `'auto' \| 'image' \| 'gif' \| 'video'` | No | `'auto'` | Output format |

**Display Name**: "Combine"
**Icon**: Layers (🔲)

**Note**: Layer configuration is deferred to Phase 6. For Phase 3, show placeholder UI.

---

### BackgroundSwapNode

Convenience node that removes background and composites onto new background.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | `string` | Yes | - | Node ID |
| type | `'backgroundSwap'` | Yes | - | Discriminator |
| input | `NodeInputSource` | Yes | - | Source image (subject) |
| backgroundSource | `BackgroundSource \| null` | No | `null` | Background image source |

**Display Name**: "Background Swap"
**Icon**: Image (🖼️)

---

### BackgroundSource

Discriminated union for background image source.

**Variant: Asset**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | `'asset'` | Yes | Discriminator |
| asset | `MediaReference` | Yes | Static asset from media library |

**Variant: NodeOutput**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | `'node'` | Yes | Discriminator |
| nodeId | `string` | Yes | Node that produces the background |

---

### AiImageNode

Generates an AI-transformed image.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | `string` | Yes | - | Node ID |
| type | `'aiImage'` | Yes | - | Discriminator |
| input | `NodeInputSource` | Yes | - | Reference image |
| promptTemplate | `string` | Yes | `''` | Prompt with `{{variable}}` placeholders |
| model | `'gemini-2.5-flash' \| 'gemini-2.5-pro' \| 'gemini-3.0'` | No | `'gemini-2.5-flash'` | AI model |
| aspectRatio | `'1:1' \| '3:2' \| '2:3' \| '9:16' \| '16:9'` | No | `'1:1'` | Output aspect ratio |
| references | `MediaReference[]` | No | `[]` | Additional reference images |

**Display Name**: "AI Image"
**Icon**: Sparkles (✨)

**Note**: Rich prompt editor with "Insert Variable" button is deferred to Phase 5. For Phase 3, use simple text input.

---

### MediaReference

Reference to a media asset.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| assetId | `string` | Yes | - | Asset ID in media library |
| url | `string` | Yes | - | Public URL for the asset |
| label | `string \| null` | No | `null` | Optional label for reference |

---

### CompositeLayer (Future - Phase 6)

Layer configuration for composite node.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| source | `LayerSource` | Yes | - | Image source for this layer |
| zIndex | `number` | No | `0` | Stack position (0 = bottom) |
| fit | `'cover' \| 'contain' \| 'stretch' \| 'none'` | No | `'cover'` | How to fit the layer |
| opacity | `number (0-1)` | No | `1` | Layer opacity |

---

## State Transitions

### TransformConfig Lifecycle

```
null                    ← Experience has no transform
  │
  ▼ (user adds first node)
{                       ← TransformConfig created
  variableMappings: {},
  nodes: [firstNode],
  outputFormat: 'image'
}
  │
  ▼ (user adds/edits nodes and variables)
{
  variableMappings: { photo: {...}, pet: {...} },
  nodes: [node1, node2, node3],
  outputFormat: 'image'
}
  │
  ▼ (user removes all nodes)
null                    ← TransformConfig removed (or keep empty?)
```

**Decision**: Keep empty TransformConfig (`{ variableMappings: {}, nodes: [], outputFormat: 'image' }`) rather than setting to null. This preserves user's variable mappings even if all nodes are removed.

---

## Validation Summary

### Draft Validation (Loose - UI editing)
- Schema structure only (Zod)
- Allow empty nodes array
- Allow missing node input sources
- Allow dangling variable/step references

### Publish Validation (Strict - Phase 8)
- At least 1 node required
- All node inputs must be valid
- All step references must exist
- All variable references must be mapped
- All prompt template variables must have mappings

---

## Schema Location

```
packages/shared/src/schemas/experience/transform.schema.ts
```

Update existing schema to match this data model.
