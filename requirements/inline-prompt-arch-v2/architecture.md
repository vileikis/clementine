# Architecture

**Part of**: [Inline Prompt Architecture (v2)](./README.md)

---

## Document Structure

```
Experience Document
├── steps: ExperienceStep[]
│   ├── capture-photo
│   ├── input-multi-select (AI-aware options)
│   │   └── options: [
│   │       { value, promptFragment?, promptMedia? }
│   │     ]
│   ├── input-yes-no (bonus phase)
│   └── input-short-text
│
└── transformConfig
    └── nodes: [
        {
          type: "ai.imageGeneration",
          config: {
            model: "gemini-2.5-pro",
            aspectRatio: "3:2",
            prompt: "@{step:captureStep} @{step:petStep} @{ref:abc123}",
            refMedia: [
              { mediaAssetId, url, filePath, displayName }
            ]
          }
        }
      ]
```

---

## Data Flow

```
┌─────────────────────────────────────────┐
│         EXPERIENCE DESIGNER             │
│                                         │
│  1. Define Steps:                       │
│     - captureStep (photo)               │
│     - petStep (multiselect)             │
│       options:                          │
│         value: "cat"                    │
│         promptFragment: "holding cat"   │
│         promptMedia: <cat_image>        │
│                                         │
│  2. AI Image Node:                      │
│     - Upload refMedia (artStyle)        │
│     - Write prompt in Lexical:          │
│       "Transform @captureStep into      │
│        hobbit @petStep. Style:          │
│        @artStyle"                       │
│                                         │
│  3. Test Run:                           │
│     - Upload test photo                 │
│     - Select "cat"                      │
│     - See resolved prompt               │
│     - Preview images                    │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│      STORAGE (Firestore)                │
│                                         │
│  prompt: "@{step:captureStep} into      │
│           hobbit @{step:petStep}.       │
│           Style: @{ref:abc123xyz}"      │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│      RUNTIME RESOLUTION                 │
│                                         │
│  Inputs:                                │
│    captureStep → { mediaAssetId: "789" }│
│    petStep → "cat"                      │
│                                         │
│  Resolved:                              │
│    "<789> into hobbit holding cat       │
│     (see <cat123>). Style: <abc123xyz>" │
│                                         │
│  Media: [789, cat123, abc123xyz]        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│      GEMINI API CALL                    │
│                                         │
│  parts: [                               │
│    { text: "Image Reference ID: <789>" },│
│    <capture_image_data>,                │
│    { text: "Image Reference ID: <cat123>" },│
│    <cat_image_data>,                    │
│    { text: "Image Reference ID: <abc123xyz>" },│
│    <artstyle_image_data>,               │
│    { text: "<789> into hobbit..." }     │
│  ]                                      │
└─────────────────────────────────────────┘
```

---

## Core Components

### 1. Experience Steps

Experience steps are the building blocks that collect user input:

**AI-Aware Steps**:
- `input-multi-select` - Enhanced with `promptFragment` and `promptMedia` on options
- `input-yes-no` - (Bonus phase) Similar AI-aware enhancements
- `capture-photo` - Media capture (always AI-aware)

**Standard Steps**:
- `input-short-text` - Text input (used as-is in prompts)
- `input-long-text` - Multi-line text input

See [Data Models](./data-models.md) for schema details.

---

### 2. AI Image Node

The AI Image Generation node in the transform pipeline:

**Configuration**:
- `model` - Gemini model selection (2.5-flash, 2.5-pro, 3.0)
- `aspectRatio` - Image dimensions (1:1, 3:2, 2:3, 9:16, 16:9)
- `prompt` - Stored in plain text with `@{type:name}` patterns
- `refMedia` - Node-level media array with displayNames

**Storage Format**:
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
        url: "https://...",
        filePath: "workspaces/ws1/media/overlay.jpg",
        displayName: "artStyle"
      }
    ]
  }
}
```

See [Data Models](./data-models.md) for complete schema.

---

### 3. Three-Format System

The architecture uses three distinct representations of prompts:

1. **Storage Format** - Parseable, unambiguous, stored in Firestore
   - Pattern: `@{step:stepName}`, `@{ref:mediaAssetId}`
   - Example: `@{step:captureStep} @{ref:abc123xyz}`

2. **Display Format** - User-friendly, visual in Lexical editor
   - Pattern: `@stepName` (blue pill), `@displayName` (green pill)
   - Example: `@captureStep` `@artStyle`

3. **Resolved Format** - LLM-ready text with mediaAssetId placeholders
   - Pattern: `<mediaAssetId>`
   - Example: `<cap789> <abc123xyz>`

See [Three-Format System](./three-format-system.md) for details.

---

### 4. Resolution Pipeline

The resolution process transforms stored prompts into LLM-ready text:

**Inputs**:
- Stored prompt (with `@{type:name}` patterns)
- Experience steps
- User input values
- Node refMedia

**Process**:
1. Parse step mentions (`@{step:...}`)
2. Resolve each mention based on step type
3. Parse refMedia mentions (`@{ref:...}`)
4. Replace with `<mediaAssetId>` placeholders
5. Extract all media references
6. Validate for missing references

**Outputs**:
- Resolved text
- Media reference array
- Validation results

See [Resolution Algorithm](./resolution-algorithm.md) for complete logic.

---

### 5. Lexical Editor

Visual prompt editing with mention autocomplete:

**Features**:
- Type `@` to trigger autocomplete
- Select steps (blue pills) or refMedia (green pills)
- Real-time serialization to storage format
- Validation of references

**Node Types**:
- `StepMentionNode` - Serializes to `@{step:stepName}`
- `MediaMentionNode` - Serializes to `@{ref:mediaAssetId}`

See [Lexical Editor](./lexical-editor.md) for implementation details.

---

## Key Architectural Decisions

### Why MediaAssetId-Based?

**Problem**: Media names can change, breaking prompt references.

**Solution**: Store references by stable `mediaAssetId`, display with user-friendly `displayName`.

**Benefits**:
- ✅ References never break when renaming
- ✅ Autocomplete shows readable names
- ✅ Storage remains unambiguous

---

### Why Three Formats?

**Problem**: Need parseable storage, user-friendly editing, and LLM-compatible output.

**Solution**: Separate formats optimized for each use case.

**Benefits**:
- ✅ Storage format is type-safe and parseable
- ✅ Display format is human-readable
- ✅ Resolved format matches Gemini API expectations

---

### Why Inline Configuration?

**Problem**: AI Presets added complexity with mapping and indirection.

**Solution**: Embed prompt config directly in transform nodes.

**Benefits**:
- ✅ Simpler mental model (no separate preset management)
- ✅ Fewer abstractions (no variable mappings)
- ✅ Faster workflow (edit prompt directly in node)
- ✅ Clear ownership (prompt belongs to node)

---

### Why Auto-Reference Pattern?

**Problem**: Users often want step option media in prompts, but manually referencing is tedious.

**Solution**: Automatically append `(see <mediaAssetId>)` when option has `promptMedia`.

**Example**:
```typescript
Option: {
  value: "cat",
  promptFragment: "holding a grumpy cat",
  promptMedia: { mediaAssetId: "cat123" }
}

// Resolves to:
"holding a grumpy cat (see <cat123>)"
```

**Benefits**:
- ✅ No manual reference needed
- ✅ Consistent pattern across all options
- ✅ Reduces user effort

---

## System Boundaries

### In Scope (Phase 1)

- ✅ Multiselect steps with AI-aware options
- ✅ Capture steps
- ✅ Text steps
- ✅ AI Image node with inline prompt
- ✅ RefMedia management
- ✅ Lexical editor with autocomplete
- ✅ Test run dialog with resolution preview
- ✅ Validation

### Out of Scope (Phase 1)

- ❌ Yes/No steps with AI options (Phase 2)
- ❌ Template library (Phase 3)
- ❌ DisplayMedia field on options (Phase 5)
- ❌ Prompt versioning (Phase 4)
- ❌ Auto-update references on step rename (Phase 4)

---

## Code Reuse Strategy

The architecture leverages ~60% code reuse from AI Presets:

**High Reuse (90%)**:
- Lexical infrastructure (mention nodes, plugins)
- Serialization utilities

**Moderate Reuse (70%)**:
- Resolution algorithm structure
- Validation patterns
- Media reference extraction

**Pattern Reuse**:
- Preview components (test input forms, media grids)
- Upload hooks
- UI layouts

See [Implementation Plan](./plan.md) for adaptation details.

---

## Related Documents

- [Three-Format System](./three-format-system.md) - Format specifications
- [Data Models](./data-models.md) - Complete schemas
- [Resolution Algorithm](./resolution-algorithm.md) - Resolution logic
- [Lexical Editor](./lexical-editor.md) - Editor integration
