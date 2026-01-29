# Variable Mapping Architecture

## Status: Superseded by AI Presets

**Created**: 2025-01-24
**Last Updated**: 2025-01-26

---

## Architecture Evolution

This document originally proposed embedding variable mappings directly in the Transform Pipeline config. After further analysis (see [Problem Analysis](#problem-analysis-multiple-ai-nodes) below), the architecture evolved to separate concerns:

| Domain                 | Responsibility                                                                 | Location                                         |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| **AI Presets**         | Media registry, variables with value mappings, prompt template, model settings | `/workspaces/{workspaceId}/aiPresets/{presetId}` |
| **Transform Pipeline** | Node orchestration, variable bindings (1:1 step mapping)                       | Experience config                                |

**See:** `/requirements/ai-presets/spec.md` for full AI Presets specification.

---

## Core Principles

1. **Images should be attached to prompt only when they are actually going to be used by the prompt.** No sending 9 images when only 3 are needed.

2. **AI generation logic should be testable in isolation.** Admins should be able to configure and test prompts without running full sessions.

3. **UX for orchestrating transform pipeline should be seamless and streamlined.** Admins shouldn't have to manage complexity scattered across multiple places.

4. **Separation of concerns.** AI generation configuration (presets) is distinct from pipeline orchestration (transform).

---

## Problem Statement

### Original Issues

#### 1. Prompt Enrichment Gap

Raw step values often don't map directly to what should appear in AI prompts.

**Example:**

- User selects: `"cat"`
- What prompt needs: `"holding a cat (see image @cat)"`

The transformation from user-facing value to prompt-ready text was missing.

#### 2. Reference Image Inefficiency

Original design attached all reference images to the AI Image node statically:

```typescript
{
  type: 'aiImage',
  references: [
    { assetId: 'cat1', label: 'cat' },
    { assetId: 'dog1', label: 'dog' },
    { assetId: 'hobbiton1', label: 'hobbiton' },
    // ... all images, regardless of user selection
  ]
}
```

**Problems:**

- All images sent to LLM regardless of user selections
- Increased input tokens (cost)
- LLM must decide which images are relevant (unpredictable)
- More images = more potential for confusion/errors

#### 3. Scattered Image Definitions

An alternative (distributed refs per variable) would scatter image definitions across multiple places, making it hard for admins to see the full picture.

### Problem Analysis: Multiple AI Nodes

When exploring embedding variable mappings directly in transform config, a critical issue emerged:

**Scenario:** Transform pipeline with 2 AI Image nodes:

- Node 1: Portrait generation (uses `@style`, `@mood`)
- Node 2: Frame overlay (uses `@frame_style`)

**Problem:** Global variable mappings defined at transform level don't work when different nodes need different variables or different interpretations of the same variable.

**Options Considered:**

| Option              | Approach                                   | Issues                              |
| ------------------- | ------------------------------------------ | ----------------------------------- |
| A: Node-centric     | Each AI node has its own mappings          | Duplication, scattered config       |
| B: Direct step refs | Remove variables, reference steps directly | Loses enrichment capability         |
| C: Namespaced       | `node1.style`, `node2.frame`               | Complex, unintuitive                |
| D: Inheritance      | Global + node overrides                    | Still scattered, complex resolution |
| **E: AI Presets**   | Standalone templates with simple wiring    | Clean separation, testable          |

**Decision:** Option E - AI Presets provides the best balance of testability, reusability, and clean UX.

---

## Final Architecture: AI Presets + Transform Pipeline

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                       AI PRESET                              │
│  (Standalone, testable, reusable)                           │
├─────────────────────────────────────────────────────────────┤
│  Media Registry:  @user_photo, @cat, @dog, @hobbiton, ...   │
│  Variables:       @pet (with value mappings), @background   │
│  Prompt Template: "Transform @user_photo... @pet... @bg..." │
│  Model Settings:  gemini-2.5-pro, 3:2 aspect ratio          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ presetId reference
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TRANSFORM PIPELINE                        │
│  (Orchestration only)                                        │
├─────────────────────────────────────────────────────────────┤
│  AI Image Node:                                              │
│    presetId: "hobbit-preset-123"                            │
│    variableBindings: {                                       │
│      pet: { stepId: "petStep" }         ← 1:1 mapping       │
│      background: { stepId: "bgStep" }   ← 1:1 mapping       │
│      user_photo: { stepId: "capture" }  ← for media too     │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Key Insight: Where Value Mappings Live

**Value mappings live in AI Presets, NOT in Transform Pipeline.**

Transform Pipeline only does 1:1 binding:

- `@pet` → `petStep` (raw value passed to preset)
- `@background` → `bgStep` (raw value passed to preset)

The AI Preset's variable definition handles the transformation:

```typescript
// In AI Preset
variables: [
  {
    name: 'pet',
    valueMap: [
      { value: 'cat', text: 'holding a cat (see @cat)' },
      { value: 'dog', text: 'holding a dog (see @dog)' },
      { value: 'none', text: 'with empty hands' },
    ],
  },
]
```

---

## Unified Syntax: @ Mentions

Both variables and media use unified `@name` syntax with visual differentiation:

| Type      | Color | Example               |
| --------- | ----- | --------------------- |
| Variables | Blue  | `@pet`, `@background` |
| Media     | Green | `@user_photo`, `@cat` |

### How LLMs Handle Labeled Images

LLMs like Gemini expect interleaved text labels and images:

```javascript
// Gemini API expects this pattern
const result = await model.generateContent([
  { text: 'Image Reference ID: @user_photo' },
  userPhotoData,
  { text: 'Image Reference ID: @cat' },
  catImageData,
  { text: 'Transform @user_photo into hobbit holding a cat (see @cat)...' },
])
```

Resolution parses `@name` references in the resolved prompt to determine which images to include.

---

## Schema Overview

### AI Preset Schema (Full spec in `/requirements/ai-presets/spec.md`)

```typescript
const aiPresetSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Media from workspace library
  mediaRegistry: z.array(
    z.object({
      name: z.string(), // Reference name (@name)
      mediaId: z.string(), // Workspace media library asset
      description: z.string().optional(),
    }),
  ),

  // Variables with optional value mappings
  variables: z.array(
    z.object({
      name: z.string(), // Reference name (@name)
      type: z.enum(['text', 'image']),
      label: z.string(),
      required: z.boolean().default(true),
      defaultValue: z.string().optional(),
      valueMap: z
        .array(
          z.object({
            value: z.string(),
            text: z.string(), // Can include @media refs
          }),
        )
        .optional(),
    }),
  ),

  promptTemplate: z.string(),
  model: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.0']),
  aspectRatio: z.enum(['1:1', '3:2', '2:3', '9:16', '16:9']),

  createdAt: z.number(),
  updatedAt: z.number(),
  createdBy: z.string(),
})
```

### Transform Pipeline AI Image Node (Updated)

```typescript
const aiImageNodeSchema = z.object({
  type: z.literal('aiImage'),
  id: z.string(),

  // Reference to AI Preset
  presetId: z.string(),

  // 1:1 bindings from preset variables to experience steps
  variableBindings: z.record(
    z.string(),
    z.object({
      stepId: z.string(),
    }),
  ),

  // Input image (optional, can come from previous node)
  input: nodeInputSourceSchema.optional(),
})
```

---

## Resolution Flow

### At Pipeline Execution Time

```
1. Fetch AI Preset by presetId

2. For each variable binding:
   - Get raw value from session (stepId)
   - Pass to preset variable

3. Preset resolution:
   a. For each variable in prompt:
      - If valueMap exists: lookup text for raw value
      - Else: use raw value directly

   b. Replace @variable with resolved text

   c. Parse @media references in resolved prompt

   d. Build image array (only referenced images)

4. Call LLM with resolved prompt + images
```

### Example Execution

**AI Preset: "Hobbit Portrait"**

```typescript
{
  mediaRegistry: [
    { name: 'cat', mediaId: 'cat123' },
    { name: 'dog', mediaId: 'dog456' },
    { name: 'hobbiton', mediaId: 'hob789' },
    { name: 'art_style', mediaId: 'style999' },
  ],
  variables: [
    {
      name: 'user_photo',
      type: 'image',
      label: 'User Photo'
    },
    {
      name: 'pet',
      type: 'text',
      label: 'Pet Companion',
      valueMap: [
        { value: 'cat', text: 'holding a cat (see @cat)' },
        { value: 'dog', text: 'holding a dog (see @dog)' },
        { value: 'none', text: 'with empty hands' }
      ]
    },
    {
      name: 'background',
      type: 'text',
      label: 'Background',
      valueMap: [
        { value: 'hobbiton', text: 'in the Shire @hobbiton' },
        { value: 'rivendell', text: 'in Rivendell @rivendell' }
      ]
    }
  ],
  promptTemplate: `
    Transform @user_photo into a hobbit character.
    They should be @pet.
    Set the scene @background.
    Use @art_style as artistic reference.
  `
}
```

**Transform Pipeline Node:**

```typescript
{
  type: 'aiImage',
  presetId: 'hobbit-preset-123',
  variableBindings: {
    user_photo: { stepId: 'captureStep' },
    pet: { stepId: 'petStep' },
    background: { stepId: 'bgStep' }
  }
}
```

**Session Answers:** `{ pet: 'cat', background: 'hobbiton' }`

**Execution:**

```
1. Resolve @pet: 'cat' → "holding a cat (see @cat)"
2. Resolve @background: 'hobbiton' → "in the Shire @hobbiton"
3. Resolved prompt:
   "Transform @user_photo into a hobbit character.
    They should be holding a cat (see @cat).
    Set the scene in the Shire @hobbiton.
    Use @art_style as artistic reference."

4. Parse @media refs: [user_photo, cat, hobbiton, art_style]

5. Images sent: 4 (only referenced)
   Images NOT sent: dog, rivendell
```

---

## Design Decisions

### D30: AI Presets as Separate Domain

**Decision**: Create AI Presets as standalone, workspace-level entities

**Rationale**:

- Testable in isolation (preview + test generation)
- Reusable across experiences
- Clean separation from pipeline orchestration
- Solves multi-node variable conflict problem

### D31: Unified @ Mention Syntax

**Decision**: Use `@name` for both variables and media references

**Rationale**:

- Familiar pattern (like Cursor IDE, Notion, etc.)
- Single autocomplete system
- Visual differentiation via color coding
- Cleaner than mixed `{{var}}` and `<label>` syntax

### D32: Value Mappings in Preset, Not Pipeline

**Decision**: Value transformations defined in AI Preset, pipeline does 1:1 binding only

**Rationale**:

- Value mappings are intrinsic to prompt design
- Can test value mappings in preset editor
- Pipeline stays simple (just wiring)
- No duplication of mapping logic

### D33: Array for Media Registry and Variables

**Decision**: Use arrays instead of records/maps

**Rationale**:

- Supports reordering (drag-and-drop in admin UI)
- Explicit ordering in data model
- Consistent with other list-based UI patterns

### D34: Prompt-Based Image Inclusion

**Decision**: Images included based on `@name` references in resolved prompt

**Rationale**:

- Only referenced images are sent to LLM
- Explicit in prompt what images are used
- Automatic optimization - no manual conditional logic
- Matches how Gemini expects labeled images

### D35: Workspace Media Library Integration

**Decision**: AI Preset media comes from workspace media library

**Rationale**:

- Reuse existing media management infrastructure
- Consistent asset management across features
- Thumbnails and metadata already available

---

## Migration Path

### From Inline Transform Config to AI Presets

Existing transform configs with inline prompt configuration will need migration:

1. **Extract to AI Preset**: Create AI Preset from inline config
2. **Update Node**: Replace inline config with `presetId` + `variableBindings`
3. **Backward Compatibility**: Support both formats during transition

```typescript
// Before: Inline config
{
  type: 'aiImage',
  promptTemplate: '...',
  model: 'gemini-2.5-pro',
  references: [...]
}

// After: Preset reference
{
  type: 'aiImage',
  presetId: 'extracted-preset-123',
  variableBindings: { ... }
}
```

---

## Potential Risks

### 1. Two-Place Configuration

**Risk**: Admins must understand that AI Presets define "what" and Transform Pipeline defines "how/when".

**Mitigation**:

- Clear UI separation with navigation
- Inline preview of preset configuration in pipeline editor
- Good documentation and onboarding

### 2. Preset Changes Affect Multiple Pipelines

**Risk**: Changing a shared AI Preset affects all experiences using it.

**Mitigation**:

- Future: Preset versioning (noted as open question)
- Current: Clear UI showing which experiences use a preset
- Option to duplicate preset for isolated changes

### 3. Validation Across Boundaries

**Risk**: Need to validate that pipeline bindings satisfy preset requirements.

**Mitigation**:

- Validation at publish time
- Clear error messages: "Preset requires @pet but no binding provided"
- Real-time validation in pipeline editor

### 4. Orphaned Presets

**Risk**: Presets created but never used, cluttering workspace.

**Mitigation**:

- Future: Show usage count in preset list
- Future: Archive/cleanup functionality

---

## Summary

The architecture evolved from inline variable mappings to a clean separation:

1. **AI Presets**: Self-contained, testable AI generation configurations
   - Media registry (from workspace library)
   - Variables with optional value mappings
   - Prompt template with @ mentions
   - Model settings

2. **Transform Pipeline**: Orchestration layer
   - References AI Presets by ID
   - Simple 1:1 variable bindings to experience steps
   - Handles multi-node pipelines cleanly

**Key benefits:**

- Testable in isolation (preview + test generation in preset editor)
- Reusable across experiences
- Clean separation of concerns
- Solves multi-node variable conflict
- Only referenced images sent to LLM (cost optimization)
- Unified @ mention syntax for intuitive editing

**Related Documents:**

- `/requirements/ai-presets/spec.md` - Full AI Presets specification
- `/requirements/ai-presets/prd-phases.md` - Implementation phases
- `/requirements/transform-pipeline/diagrams/transform-ui-pipeline-tab.html` - Pipeline tab mockup
