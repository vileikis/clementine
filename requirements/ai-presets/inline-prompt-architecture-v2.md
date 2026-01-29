# Inline Prompt Architecture (v2)

**Status**: Approved for Implementation
**Created**: 2026-01-29
**Supersedes**: AI Presets (Phases 1-4) and inline-prompt-architecture.md (v1)

---

## Executive Summary

This document specifies the **Inline Prompt Architecture** - a streamlined approach to AI prompt configuration that embeds all prompt logic directly in Experience transform pipelines. No separate preset or template libraries - just inline configuration with direct step references.

### Core Principles

1. **Inline Configuration**: All AI prompt config lives in Experience transform pipeline
2. **Direct Step References**: Prompts reference experience steps by name using `@` mentions
3. **Three-Format System**: Storage (parseable) → Display (user-friendly) → Resolved (LLM-ready)
4. **MediaAssetId-Based**: All media references use stable mediaAssetIds, not names
5. **Auto-Reference Pattern**: Step option media automatically included in prompts
6. **No Template Library**: Focus on inline simplicity (templates may come later)

### Key Features

✅ **Simple workflow**: No preset mapping, no variable bindings
✅ **Direct mentions**: `@stepName` and `@mediaName` in Lexical editor
✅ **Stable references**: MediaAssetId-based (never breaks)
✅ **Auto-composition**: Step promptFragments compose into final prompt
✅ **Visual editing**: Lexical editor with colored pills (blue steps, green media)
✅ **Live testing**: Test run dialog with real-time resolution
✅ **LLM-ready**: Resolved prompt matches Gemini API format exactly

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Three-Format System](#three-format-system)
3. [Data Models & Schemas](#data-models--schemas)
4. [Resolution Algorithm](#resolution-algorithm)
5. [Lexical Editor Integration](#lexical-editor-integration)
6. [User Workflows](#user-workflows)
7. [Implementation Plan](#implementation-plan)
8. [Migration from AI Presets](#migration-from-ai-presets)
9. [Edge Cases & Validation](#edge-cases--validation)

---

## Architecture Overview

### Document Structure

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

### Data Flow

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

## Three-Format System

### 1. Storage Format (Plain Text)

**Purpose**: Unambiguous, parseable representation stored in Firestore

**Format**:
```
"Transform @{step:captureStep} into hobbit @{step:petStep}.
 Style: @{ref:abc123xyz}"
```

**Patterns**:
- Step mentions: `@{step:stepName}`
- RefMedia mentions: `@{ref:mediaAssetId}`

**Characteristics**:
- ✅ Type-safe (explicit `step:` and `ref:` prefixes)
- ✅ Stable (mediaAssetIds don't change)
- ✅ Parseable (regex-based extraction)
- ❌ Not human-friendly (mediaAssetIds are UUIDs)

---

### 2. Display Format (Lexical UI)

**Purpose**: User-friendly visual representation in editor

**Format**:
```
"Transform @captureStep into hobbit @petStep. Style: @artStyle"
           [blue pill]              [blue pill]     [green pill]
```

**Characteristics**:
- ✅ Human-readable (step names, displayNames)
- ✅ Visual distinction (colored pills)
- ✅ Autocomplete-friendly
- ✅ Clean syntax (simple `@name`)

**Pill Colors**:
- **Blue**: Step mentions (`@captureStep`, `@petStep`)
- **Green**: RefMedia mentions (`@artStyle`)

---

### 3. Resolved Format (LLM Input)

**Purpose**: Final text sent to Gemini API, all references resolved to mediaAssetIds

**Format**:
```
"Transform <cap789> into hobbit holding a grumpy cat (see <cat123>).
 Style: <abc123xyz>"
```

**Characteristics**:
- ✅ LLM-ready (matches Gemini API pattern)
- ✅ All mediaAssetIds exposed (for image inclusion)
- ✅ No `@` symbols (avoids user confusion in preview)
- ✅ Step values resolved (capture → `<mediaAssetId>`, multiselect → promptFragment + auto-ref)

**Placeholder Pattern**: `<mediaAssetId>`

---

## Data Models & Schemas

### 1. Enhanced Multiselect Step Schema

**Location**: `packages/shared/src/schemas/experience/steps/input-multi-select.schema.ts`

```typescript
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

**Key Points**:
- `promptFragment`: Text snippet inserted into prompt (e.g., "holding a grumpy cat")
- `promptMedia`: Reference image for this option (auto-referenced in prompt)
- Both fields optional (backward compatible, graceful fallback)
- No `displayMedia` field (out of scope for Phase 1)

---

### 2. Enhanced Yes/No Step Schema (Bonus Phase)

**Location**: `packages/shared/src/schemas/experience/steps/input-yes-no.schema.ts`

```typescript
/**
 * Yes/No option with AI-aware fields
 */
const yesNoOptionSchema = z.object({
  label: z.string().default('Yes'),  // or 'No'
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
  options: z.object({
    yes: yesNoOptionSchema.optional(),
    no: yesNoOptionSchema.optional(),
  }).default({ yes: {}, no: {} }),
})

export type YesNoOption = z.infer<typeof yesNoOptionSchema>
export type ExperienceInputYesNoStepConfig = z.infer<
  typeof experienceInputYesNoStepConfigSchema
>
```

**Key Points**:
- Custom labels: "With wings" / "Without wings" instead of "Yes" / "No"
- Same AI-aware fields as multiselect (promptFragment, promptMedia)
- Consistent structure for resolution logic

---

### 3. RefMedia Entry Schema

**Location**: `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`

```typescript
/**
 * RefMedia entry with displayName for autocomplete
 * Extends MediaReference with user-friendly name
 */
const refMediaEntrySchema = mediaReferenceSchema.extend({
  displayName: z.string().optional(),
})

export type RefMediaEntry = z.infer<typeof refMediaEntrySchema>

// Example:
// {
//   mediaAssetId: "abc123xyz456",
//   url: "https://storage.googleapis.com/...",
//   filePath: "workspaces/ws1/media/overlay-xDzikf.jpg",
//   displayName: "artStyle"  // User-defined or auto-generated
// }
```

**DisplayName Generation**:
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

**Uniqueness Validation**: DisplayNames must be unique within a node's refMedia array

---

### 4. AI Image Node Schema

**Location**: `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`

```typescript
/**
 * AI Image Generation Node (inline configuration)
 */
const aiImageNodeSchema = z.object({
  type: z.literal('ai.imageGeneration'),
  id: z.string(),

  // Inline configuration
  config: z.object({
    // Model settings
    model: z.enum([
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-3.0',
    ]),
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

// Example:
// {
//   type: "ai.imageGeneration",
//   id: "node1",
//   config: {
//     model: "gemini-2.5-pro",
//     aspectRatio: "3:2",
//     prompt: "Transform @{step:captureStep} into hobbit @{step:petStep}. Style: @{ref:abc123xyz}",
//     refMedia: [
//       {
//         mediaAssetId: "abc123xyz456",
//         url: "https://...",
//         filePath: "workspaces/ws1/media/overlay.jpg",
//         displayName: "artStyle"
//       }
//     ]
//   }
// }
```

**Key Points**:
- `prompt` instead of `promptTemplate` (simpler naming)
- `refMedia` instead of `mediaRegistry` (explicit purpose)
- RefMedia contains only node-level media (NOT step option promptMedia)
- Step option promptMedia automatically available during resolution

---

## Resolution Algorithm

### Overview

Resolution transforms the stored prompt into LLM-ready text with all references resolved to `<mediaAssetId>` placeholders.

**Input**:
- Stored prompt: `@{step:...}` and `@{ref:...}` patterns
- Experience steps with configurations
- Test/runtime input values
- Node refMedia

**Output**:
- Resolved text: All mentions → `<mediaAssetId>`
- Media references: Array of mediaAssetIds to include

---

### Complete Algorithm

```typescript
interface ResolvedPrompt {
  text: string                    // Resolved prompt text
  characterCount: number           // Length
  mediaReferences: string[]        // All mediaAssetIds to include
  hasUnresolved: boolean          // Any missing references?
  unresolvedRefs: Reference[]     // List of missing refs
}

interface Reference {
  type: 'step' | 'refMedia'
  name: string
}

function resolvePrompt(
  storedPrompt: string,
  steps: ExperienceStep[],
  testInputs: Record<string, any>,
  refMedia: RefMediaEntry[]
): ResolvedPrompt {
  let resolved = storedPrompt
  const unresolvedRefs: Reference[] = []

  // ============================================
  // 1. RESOLVE STEP MENTIONS: @{step:stepName}
  // ============================================

  const stepMentions = parseStepMentions(storedPrompt)

  for (const mention of stepMentions) {
    const step = steps.find(s => s.name === mention.stepName)

    if (!step) {
      // Step not found
      unresolvedRefs.push({ type: 'step', name: mention.stepName })
      resolved = resolved.replace(
        `@{step:${mention.stepName}}`,
        `<missing>`
      )
      continue
    }

    const inputValue = testInputs[step.name]
    let replacement = ''

    // Resolve based on step type
    switch (step.type) {
      case 'capture-photo': {
        // Capture step result is MediaReference
        const mediaRef = inputValue as MediaReference | undefined
        replacement = mediaRef?.mediaAssetId
          ? `<${mediaRef.mediaAssetId}>`
          : `<missing>`
        break
      }

      case 'input-multi-select': {
        // Get selected value(s)
        const values = Array.isArray(inputValue)
          ? inputValue
          : [inputValue]

        // Map each value to promptFragment + auto-reference
        const fragments = values
          .filter(val => val != null)
          .map(val => {
            const option = step.config.options.find(
              opt => opt.value === val
            )

            if (!option) {
              // Option not found, use raw value
              return val
            }

            // Use promptFragment or fallback to value
            const text = option.promptFragment || option.value

            // Auto-add media reference if promptMedia exists
            const mediaRef = option.promptMedia?.mediaAssetId
              ? ` (see <${option.promptMedia.mediaAssetId}>)`
              : ''

            return text + mediaRef
          })

        // Join multiple selections with comma
        replacement = fragments.length > 0
          ? fragments.join(', ')
          : `<missing>`
        break
      }

      case 'input-yes-no': {
        // Bonus phase - similar to multiselect but simpler
        const selectedOption = inputValue === 'yes'
          ? step.config.options?.yes
          : step.config.options?.no

        if (!selectedOption) {
          replacement = inputValue || `<missing>`
          break
        }

        const text = selectedOption.promptFragment || inputValue
        const mediaRef = selectedOption.promptMedia?.mediaAssetId
          ? ` (see <${selectedOption.promptMedia.mediaAssetId}>)`
          : ''

        replacement = text + mediaRef
        break
      }

      case 'input-short-text':
      case 'input-long-text': {
        // Simple text replacement
        replacement = inputValue || `<missing>`
        break
      }

      default:
        replacement = `<missing>`
    }

    // Replace @{step:stepName} with resolved value
    resolved = resolved.replace(
      `@{step:${mention.stepName}}`,
      replacement
    )
  }

  // ============================================
  // 2. RESOLVE REFMEDIA MENTIONS: @{ref:mediaAssetId}
  // ============================================

  const refMentions = parseRefMentions(storedPrompt)

  for (const mention of refMentions) {
    const media = refMedia.find(
      m => m.mediaAssetId === mention.mediaAssetId
    )

    if (!media) {
      // RefMedia not found
      unresolvedRefs.push({ type: 'refMedia', name: mention.mediaAssetId })
    }

    // Replace @{ref:mediaAssetId} with <mediaAssetId>
    // (Even if not found, show placeholder)
    resolved = resolved.replace(
      `@{ref:${mention.mediaAssetId}}`,
      `<${mention.mediaAssetId}>`
    )
  }

  // ============================================
  // 3. EXTRACT ALL MEDIA REFERENCES
  // ============================================

  // Find all <mediaAssetId> patterns in resolved text
  const mediaReferences = extractMediaIds(resolved)

  return {
    text: resolved,
    characterCount: resolved.length,
    mediaReferences,
    hasUnresolved: unresolvedRefs.length > 0,
    unresolvedRefs,
  }
}
```

---

### Helper Functions

```typescript
/**
 * Parse step mentions from stored prompt
 */
function parseStepMentions(prompt: string): Array<{ stepName: string }> {
  const regex = /@\{step:([a-zA-Z_][a-zA-Z0-9_]*)\}/g
  const matches = []
  let match

  while ((match = regex.exec(prompt)) !== null) {
    matches.push({ stepName: match[1] })
  }

  return matches
}

/**
 * Parse refMedia mentions from stored prompt
 */
function parseRefMentions(prompt: string): Array<{ mediaAssetId: string }> {
  const regex = /@\{ref:([a-zA-Z0-9_-]+)\}/g
  const matches = []
  let match

  while ((match = regex.exec(prompt)) !== null) {
    matches.push({ mediaAssetId: match[1] })
  }

  return matches
}

/**
 * Extract all <mediaAssetId> placeholders from resolved text
 */
function extractMediaIds(resolved: string): string[] {
  const regex = /<([a-zA-Z0-9_-]+)>/g
  const ids = []
  let match

  while ((match = regex.exec(resolved)) !== null) {
    const id = match[1]
    if (id !== 'missing' && !ids.includes(id)) {
      ids.push(id)
    }
  }

  return ids
}
```

---

### Resolution Examples

#### Example 1: Simple Resolution

**Stored Prompt**:
```
"Transform @{step:captureStep} into hobbit @{step:petStep}. Style: @{ref:abc123xyz}"
```

**Inputs**:
- `captureStep` → `{ mediaAssetId: "cap789" }`
- `petStep` → `"cat"` (selected value)
- Option "cat": `{ promptFragment: "holding a grumpy cat", promptMedia: { mediaAssetId: "cat123" } }`

**Resolved**:
```
"Transform <cap789> into hobbit holding a grumpy cat (see <cat123>). Style: <abc123xyz>"
```

**Media References**: `["cap789", "cat123", "abc123xyz"]`

---

#### Example 2: Multi-Selection

**Stored Prompt**:
```
"Image shows @{step:petsStep}"
```

**Inputs**:
- `petsStep` → `["cat", "dog"]` (multiSelect: true)
- Option "cat": `{ promptFragment: "a grumpy cat", promptMedia: { mediaAssetId: "cat123" } }`
- Option "dog": `{ promptFragment: "a happy dog", promptMedia: { mediaAssetId: "dog456" } }`

**Resolved**:
```
"Image shows a grumpy cat (see <cat123>), a happy dog (see <dog456>)"
```

**Media References**: `["cat123", "dog456"]`

---

#### Example 3: Missing References

**Stored Prompt**:
```
"Transform @{step:unknownStep} with @{ref:unknownMedia}"
```

**Inputs**:
- No step named "unknownStep"
- No refMedia with mediaAssetId "unknownMedia"

**Resolved**:
```
"Transform <missing> with <unknownMedia>"
```

**Unresolved Refs**:
```typescript
[
  { type: 'step', name: 'unknownStep' },
  { type: 'refMedia', name: 'unknownMedia' }
]
```

---

## Lexical Editor Integration

### Mention Node Types

#### 1. StepMentionNode

```typescript
import { DecoratorNode } from 'lexical'

class StepMentionNode extends DecoratorNode<JSX.Element> {
  __stepName: string

  constructor(stepName: string, key?: NodeKey) {
    super(key)
    this.__stepName = stepName
  }

  static getType(): string {
    return 'step-mention'
  }

  getStepName(): string {
    return this.__stepName
  }

  // Serialize to storage format
  exportText(): string {
    return `@{step:${this.__stepName}}`
  }

  // Render as blue pill
  decorate(): JSX.Element {
    return (
      <StepMentionPill
        stepName={this.__stepName}
        color="blue"
      />
    )
  }

  // ... other Lexical node methods
}
```

---

#### 2. MediaMentionNode

```typescript
class MediaMentionNode extends DecoratorNode<JSX.Element> {
  __mediaAssetId: string
  __displayName: string

  constructor(mediaAssetId: string, displayName: string, key?: NodeKey) {
    super(key)
    this.__mediaAssetId = mediaAssetId
    this.__displayName = displayName
  }

  static getType(): string {
    return 'media-mention'
  }

  getMediaAssetId(): string {
    return this.__mediaAssetId
  }

  getDisplayName(): string {
    return this.__displayName
  }

  // Serialize to storage format (mediaAssetId)
  exportText(): string {
    return `@{ref:${this.__mediaAssetId}}`
  }

  // Render as green pill (displayName)
  decorate(): JSX.Element {
    return (
      <MediaMentionPill
        displayName={this.__displayName}
        color="green"
      />
    )
  }

  // ... other Lexical node methods
}
```

---

### Autocomplete Configuration

```typescript
interface LexicalMentionConfig {
  steps: Array<{
    name: string        // Step name (e.g., "captureStep")
    type: string        // Step type (e.g., "capture-photo")
  }>

  refMedia: Array<{
    mediaAssetId: string   // Storage ID
    displayName: string    // Display name
    url: string           // For thumbnail preview
  }>
}

// Usage in AI node editor
<PromptEditor
  value={node.config.prompt}
  onChange={(newPrompt) => updateNode({ prompt: newPrompt })}
  mentions={{
    steps: experience.steps.map(s => ({
      name: s.name,
      type: s.type,
    })),
    refMedia: node.config.refMedia.map(m => ({
      mediaAssetId: m.mediaAssetId,
      displayName: m.displayName || deriveDisplayName(m.filePath),
      url: m.url,
    }))
  }}
/>
```

---

### Autocomplete UI

```typescript
function MentionAutocomplete({
  query,
  steps,
  refMedia,
  onSelect
}: MentionAutocompleteProps) {
  const filteredSteps = steps.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  )

  const filteredMedia = refMedia.filter(m =>
    m.displayName.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="autocomplete-menu">
      {/* Steps section */}
      {filteredSteps.length > 0 && (
        <div className="section">
          <div className="section-label">Steps</div>
          {filteredSteps.map(step => (
            <div
              key={step.name}
              onClick={() => onSelect('step', step.name)}
              className="item"
            >
              <StepIcon type={step.type} />
              <span className="name">@{step.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* RefMedia section */}
      {filteredMedia.length > 0 && (
        <div className="section">
          <div className="section-label">Media</div>
          {filteredMedia.map(media => (
            <div
              key={media.mediaAssetId}
              onClick={() => onSelect('refMedia', media.mediaAssetId, media.displayName)}
              className="item"
            >
              <img src={media.url} className="thumbnail" />
              <span className="name">@{media.displayName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### Serialization & Deserialization

```typescript
/**
 * Serialize Lexical EditorState to plain text with @{type:name} patterns
 */
function serializeToPlainText(editorState: EditorState): string {
  let text = ''

  editorState.read(() => {
    const root = $getRoot()
    text = root.getTextContent()  // Calls exportText() on all nodes
  })

  return text
}

/**
 * Deserialize plain text to Lexical EditorState with mention nodes
 */
function deserializeFromPlainText(
  text: string,
  steps: ExperienceStep[],
  refMedia: RefMediaEntry[]
): EditorState {
  // Parse mentions and create appropriate nodes
  // @{step:stepName} → StepMentionNode
  // @{ref:mediaAssetId} → MediaMentionNode (with displayName lookup)

  // Implementation similar to current AI preset Lexical utils
  // See: domains/ai-presets/lexical/utils/serialization.ts
}
```

---

## User Workflows

### Workflow 1: Create Experience with Inline AI Prompt

**User Goal**: Build new experience with AI transformation

**Steps**:

1. **Create Experience**
   - Name: "Hobbit Portrait"
   - Navigate to experience designer

2. **Define Steps**
   - Add capture step: `captureStep` (photo upload)
   - Add multiselect step: `petStep`
     - Title: "Choose your companion"
     - Options:
       - Value: "cat"
         - PromptFragment: "holding a grumpy cat"
         - PromptMedia: Upload cat image
       - Value: "dog"
         - PromptFragment: "holding a happy dog"
         - PromptMedia: Upload dog image

3. **Add AI Image Node to Transform Pipeline**
   - Click "Add Node" → "AI Image Generation"
   - Opens AI node editor

4. **Configure AI Node**
   - **Model**: Select "gemini-2.5-pro"
   - **Aspect Ratio**: Select "3:2"
   - **RefMedia**: Upload "artStyle" image
     - Auto-generates displayName: "artStyle"
   - **Prompt**: Write in Lexical editor
     - Type: "Transform @" → autocomplete shows steps
     - Select `@captureStep`
     - Type: " into hobbit " → type normally
     - Type: "@" → select `@petStep`
     - Type: ". Style: @" → select `@artStyle`
   - Final display: `"Transform @captureStep into hobbit @petStep. Style: @artStyle"`
   - Stored as: `"Transform @{step:captureStep} into hobbit @{step:petStep}. Style: @{ref:abc123xyz}"`

5. **Test Run**
   - Click "Test Run" button
   - Dialog opens with test input form:
     - `captureStep`: Upload test photo
     - `petStep`: Select "cat" from dropdown
   - See resolved prompt:
     - `"Transform <cap789> into hobbit holding a grumpy cat (see <cat123>). Style: <abc123xyz>"`
   - See media preview: 3 images (capture, cat, artStyle)
   - Validation: All green (no errors)

6. **Publish Experience**
   - Click "Publish"
   - Experience ready for events

---

### Workflow 2: Edit Existing AI Node

**User Goal**: Update prompt in existing experience

**Steps**:

1. **Open Experience**
   - Navigate to experience designer
   - Switch to transform pipeline tab

2. **Edit AI Node**
   - Click on AI Image node card
   - Opens editor with current config

3. **Update Prompt**
   - Lexical editor shows: `"Transform @captureStep into hobbit @petStep. Style: @artStyle"`
   - Edit: Add "with dramatic lighting" at end
   - Mentions remain intact (pills are stable)
   - Auto-saves

4. **Test Changes**
   - Click "Test Run"
   - Enter test inputs
   - Verify resolved prompt looks correct

5. **Publish Changes**
   - Click "Publish" in experience

---

### Workflow 3: Add RefMedia to Existing Node

**User Goal**: Add new reference image to prompt

**Steps**:

1. **Open AI Node Editor**

2. **RefMedia Section**
   - Click "Add Media"
   - Upload image or select from library
   - Auto-generated displayName: "overlay" (from fileName)
   - Edit displayName: "frameStyle"

3. **Update Prompt**
   - Place cursor in Lexical editor
   - Type "@" → autocomplete now shows "frameStyle"
   - Select `@frameStyle`
   - Prompt now includes new media reference

4. **Test and Publish**

---

## Implementation Plan

### Phase 1a: Schemas & Foundation (2-3 days)

**Goal**: Update schemas to support AI-aware features

**Tasks**:
- [ ] Enhance `multiSelectOptionSchema`:
  - Add `promptFragment: z.string().max(500).optional()`
  - Add `promptMedia: mediaReferenceSchema.optional()`
- [ ] Create `refMediaEntrySchema`:
  - Extend `mediaReferenceSchema` with `displayName`
- [ ] Create `aiImageNodeSchema`:
  - Fields: `model`, `aspectRatio`, `prompt`, `refMedia`
- [ ] Update `transformNodeSchema` to support typed configs
- [ ] Write unit tests for schemas

**Files**:
- `packages/shared/src/schemas/experience/steps/input-multi-select.schema.ts`
- `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`
- `packages/shared/src/schemas/experience/nodes/ref-media-entry.schema.ts`
- `packages/shared/src/schemas/experience/transform.schema.ts`

**Success Criteria**:
- ✅ Schemas validate correctly
- ✅ TypeScript types generated
- ✅ Unit tests pass

---

### Phase 1b: Step Editor Enhancement (3-4 days)

**Goal**: Add AI-aware fields to multiselect step editor

**Tasks**:
- [ ] Add promptFragment text input to option editor
  - Label: "Prompt Fragment (optional)"
  - Help text: "Text to insert when this option is selected"
  - Max 500 chars
  - Debounced auto-save
- [ ] Add promptMedia picker to option editor
  - Label: "Prompt Media (optional)"
  - Upload button or media library picker
  - Shows thumbnail when set
  - Remove button
- [ ] Visual indicator when option is AI-aware
  - Badge/icon showing "AI-enabled"
  - Visible when promptFragment or promptMedia is set
- [ ] Validation
  - promptFragment max length
  - promptMedia must be valid MediaReference

**Components** (new or enhanced):
- `domains/experience/designer/steps/components/MultiSelectOptionEditor.tsx`
- `domains/experience/designer/steps/components/PromptFragmentInput.tsx`
- `domains/experience/designer/steps/components/PromptMediaPicker.tsx`

**Success Criteria**:
- ✅ Can add/edit promptFragment for options
- ✅ Can upload promptMedia for options
- ✅ Changes save to experience draft
- ✅ Visual feedback for AI-enabled options

---

### Phase 1c: RefMedia Management (2-3 days)

**Goal**: Build refMedia section for AI node

**Tasks**:
- [ ] RefMedia section UI
  - Similar to current media registry
  - Thumbnail grid layout
  - Empty state
- [ ] Upload/add media
  - Upload button
  - File picker or drag-drop
  - Upload to Firebase Storage
  - Create RefMediaEntry
- [ ] Auto-generate displayName
  - Extract from fileName
  - Editable text input
  - Validate uniqueness
- [ ] Display media
  - Thumbnail with displayName label
  - Hover shows full fileName
- [ ] Delete media
  - Delete button on hover
  - Confirmation dialog
- [ ] Reorder media (optional)
  - Drag-drop to reorder (if needed)

**Components** (new):
- `domains/experience/designer/transform/components/RefMediaSection.tsx`
- `domains/experience/designer/transform/components/RefMediaGrid.tsx`
- `domains/experience/designer/transform/components/RefMediaItem.tsx`
- `domains/experience/designer/transform/components/AddRefMediaDialog.tsx`

**Hooks** (new):
- `domains/experience/designer/transform/hooks/useUpdateRefMedia.ts`

**Success Criteria**:
- ✅ Can upload media to refMedia
- ✅ DisplayName auto-generated and editable
- ✅ DisplayName uniqueness validated
- ✅ Can delete refMedia
- ✅ Changes save to experience draft

---

### Phase 1d: Lexical Prompt Editor (3-4 days)

**Goal**: Adapt Lexical editor for AI node prompt

**Tasks**:
- [ ] Create PromptEditor component
  - Based on `domains/ai-presets/editor/components/PromptTemplateEditor.tsx`
  - Adapt for experience context
- [ ] Implement StepMentionNode
  - Blue pill display
  - Serialize: `@{step:stepName}`
  - Deserialize with step lookup
- [ ] Implement MediaMentionNode
  - Green pill display
  - Serialize: `@{ref:mediaAssetId}`
  - Deserialize with displayName lookup
- [ ] MentionsPlugin configuration
  - Trigger on `@` character
  - Autocomplete with steps + refMedia
  - Insert appropriate node type
- [ ] Autocomplete component
  - Show steps (with type icon)
  - Show refMedia (with thumbnail)
  - Search/filter by name
  - Keyboard navigation
- [ ] Serialization utils
  - `serializeToPlainText()`: EditorState → `@{type:name}` format
  - `deserializeFromPlainText()`: Plain text → EditorState
- [ ] Character count display
- [ ] Validation
  - Check for undefined step references
  - Check for undefined refMedia references

**Components** (new):
- `domains/experience/designer/transform/components/PromptEditor.tsx`
- `domains/experience/designer/transform/components/MentionAutocomplete.tsx`
- `domains/experience/designer/transform/components/StepMentionPill.tsx`
- `domains/experience/designer/transform/components/MediaMentionPill.tsx`

**Lexical infrastructure** (adapt from ai-presets):
- `domains/experience/designer/transform/lexical/nodes/StepMentionNode.ts`
- `domains/experience/designer/transform/lexical/nodes/MediaMentionNode.ts`
- `domains/experience/designer/transform/lexical/plugins/MentionsPlugin.tsx`
- `domains/experience/designer/transform/lexical/utils/serialization.ts`

**Success Criteria**:
- ✅ Can type `@` to trigger autocomplete
- ✅ Autocomplete shows steps and refMedia
- ✅ Can insert step mentions (blue pills)
- ✅ Can insert media mentions (green pills)
- ✅ Serializes correctly to storage format
- ✅ Deserializes correctly to display format
- ✅ Character count updates
- ✅ Validation shows undefined references

---

### Phase 1e: AI Node Settings (1-2 days)

**Goal**: Add model and aspect ratio controls

**Tasks**:
- [ ] Model dropdown
  - Options: gemini-2.5-flash, gemini-2.5-pro, gemini-3.0
  - Default: gemini-2.5-pro
- [ ] Aspect ratio dropdown
  - Options: 1:1, 3:2, 2:3, 9:16, 16:9
  - Default: 3:2
- [ ] Auto-save integration
  - Debounce updates (2000ms)
  - Save to experience draft
- [ ] Save status indicator
  - Reuse shared editor-status module
  - Show "Saving...", "Saved", "Error"

**Components** (new):
- `domains/experience/designer/transform/components/ModelSettings.tsx`

**Hooks** (adapt):
- `domains/experience/designer/hooks/useUpdateExperienceDraft.ts`

**Success Criteria**:
- ✅ Can select model
- ✅ Can select aspect ratio
- ✅ Changes auto-save
- ✅ Save status indicator works

---

### Phase 1f: Resolution Logic (3-4 days)

**Goal**: Implement prompt resolution algorithm

**Tasks**:
- [ ] Parse mention patterns
  - `parseStepMentions()`: Extract `@{step:...}` patterns
  - `parseRefMentions()`: Extract `@{ref:...}` patterns
- [ ] Resolve step mentions
  - Capture step → `<mediaAssetId>`
  - Multiselect step → promptFragment + auto-ref
  - Text step → input value
  - Handle multi-selection (comma join)
  - Handle missing options (fallback to value)
- [ ] Resolve refMedia mentions
  - `@{ref:mediaAssetId}` → `<mediaAssetId>`
- [ ] Extract media references
  - `extractMediaIds()`: Find all `<...>` patterns
  - Deduplicate
  - Exclude `<missing>`
- [ ] Validation
  - Check for undefined step references
  - Check for undefined refMedia references
  - Check for missing required inputs
- [ ] Unit tests
  - Test all step types
  - Test multi-selection
  - Test missing references
  - Test media extraction

**Files** (new):
- `domains/experience/designer/transform/lib/prompt-resolution.ts`
- `domains/experience/designer/transform/lib/prompt-resolution.test.ts`
- `domains/experience/designer/transform/lib/validation.ts`
- `domains/experience/designer/transform/lib/validation.test.ts`

**Success Criteria**:
- ✅ Resolution algorithm works for all step types
- ✅ Multi-selection joins correctly
- ✅ Media references extracted correctly
- ✅ Validation catches errors
- ✅ Unit tests pass (100% coverage)

---

### Phase 1g: Test Run Dialog (3-4 days)

**Goal**: Build test run dialog for AI node

**Tasks**:
- [ ] Test run button in AI node editor
  - Opens dialog
  - Passes node config + experience steps
- [ ] Test input form generation
  - Parse prompt for step references
  - Generate input field per step type:
    - Capture → Image upload
    - Multiselect → Dropdown (or checkboxes if multiSelect)
    - Text → Text input
  - Pre-fill with defaults (if any)
  - Required field indicators
- [ ] Real-time resolution
  - Listen to input changes
  - Debounce resolution (300ms)
  - Update preview on change
- [ ] Resolved prompt display
  - Show resolved text
  - Character count
  - Highlight `<missing>` placeholders
- [ ] Media preview grid
  - Show all referenced media
  - Thumbnails with labels
  - "X of Y media" indicator
  - Distinguish: capture, step option, refMedia
- [ ] Validation display
  - Status indicator (valid/invalid/incomplete)
  - List errors (missing required inputs)
  - List warnings (undefined references)
  - Click error → focus input field
- [ ] Test generation button (placeholder)
  - Disabled state when invalid
  - Tooltip explaining why disabled
  - Placeholder UI (will implement in Phase 5)

**Components** (new):
- `domains/experience/designer/transform/components/TestRunDialog.tsx`
- `domains/experience/designer/transform/components/TestInputsForm.tsx`
- `domains/experience/designer/transform/components/TestInputField.tsx`
- `domains/experience/designer/transform/components/ResolvedPromptDisplay.tsx`
- `domains/experience/designer/transform/components/MediaPreviewGrid.tsx`
- `domains/experience/designer/transform/components/ValidationDisplay.tsx`
- `domains/experience/designer/transform/components/TestGenerationButton.tsx`

**Hooks** (new):
- `domains/experience/designer/transform/hooks/useTestInputs.ts` (Zustand store)
- `domains/experience/designer/transform/hooks/usePromptResolution.ts`
- `domains/experience/designer/transform/hooks/usePromptValidation.ts`
- `domains/experience/designer/transform/hooks/useMediaReferences.ts`

**Success Criteria**:
- ✅ Test run dialog opens
- ✅ Input form generated from prompt
- ✅ Can enter test values
- ✅ Resolved prompt updates in real-time
- ✅ Media preview shows correct images
- ✅ Validation shows errors/warnings
- ✅ Test generation button disabled when invalid

---

### Phase 1h: Transform Pipeline Integration (2-3 days)

**Goal**: Integrate AI node into transform pipeline UI

**Tasks**:
- [ ] Update pipeline canvas
  - Show AI Image nodes
  - Node card displays:
    - Model badge
    - Aspect ratio
    - Prompt preview (first 50 chars)
    - Media count
- [ ] Add AI node button
  - "Add Node" menu → "AI Image Generation"
  - Creates new node with defaults
  - Opens editor
- [ ] Edit node
  - Click node card → open editor
  - Editor in sidebar or dialog
- [ ] Delete node
  - Delete button on node card
  - Confirmation dialog
- [ ] Node connections (if multi-node)
  - Visual connections between nodes
  - Input/output indicators

**Components** (enhanced):
- `domains/experience/designer/transform/containers/TransformPipelineEditor.tsx`
- `domains/experience/designer/transform/components/AIImageNodeCard.tsx`
- `domains/experience/designer/transform/components/AddNodeMenu.tsx`

**Success Criteria**:
- ✅ Can add AI Image node
- ✅ Node card shows summary
- ✅ Can edit node (opens editor)
- ✅ Can delete node
- ✅ Pipeline saves to experience draft

---

### Phase 1i: Migration & Testing (2 days)

**Goal**: Migrate test experiences and ensure quality

**Tasks**:
- [ ] Create migration script
  - Find experiences using AI presets
  - Extract preset config
  - Map to inline node config
  - Update experience document
- [ ] Run migration on test data
  - Verify all experiences migrated
  - Test in experience preview
- [ ] End-to-end testing
  - Create new experience
  - Add multiselect with AI options
  - Configure AI node
  - Test run
  - Publish
  - Verify in guest view
- [ ] Bug fixes
  - Address any issues found
- [ ] Documentation
  - Update developer docs
  - Add inline architecture doc to wiki
  - Comment complex code

**Success Criteria**:
- ✅ All test experiences migrated
- ✅ E2E workflow works smoothly
- ✅ No critical bugs
- ✅ Documentation updated

---

### Phase 1 Total: ~21-27 days (4-5 weeks)

Each sub-phase is **1-4 days**, making progress trackable and manageable.

---

## Migration from AI Presets

### What to Reuse

**Lexical Infrastructure** (~60% reuse):
- ✅ Mention node architecture
- ✅ Autocomplete plugin pattern
- ✅ Serialization/deserialization utils
- ✅ Smart paste plugin (convert plain @mentions)
- ✅ Mention validation plugin

**Resolution & Validation Logic** (~70% reuse):
- ✅ Core resolution algorithm (adapt for steps)
- ✅ Validation patterns (missing refs, required fields)
- ✅ Media reference extraction
- ✅ Type guards and utilities

**Preview Components** (patterns):
- ✅ Test input form structure
- ✅ Resolved prompt display
- ✅ Media preview grid
- ✅ Validation display

**Media Management**:
- ✅ Upload hooks
- ✅ Media picker components
- ✅ Thumbnail display

**Total Code Reuse: ~60%**

---

### What to Archive

**AI Preset Domain** (`domains/ai-presets/`):
- ❌ Preset CRUD services
- ❌ Preset editor containers
- ❌ Preset list page
- ❌ Preset-specific hooks
- ❌ Variable management UI
- ❌ Value mappings editor

**Preset Schemas**:
- ❌ `ai-preset.schema.ts`
- ❌ `ai-preset-config.schema.ts`
- ❌ `preset-variable.schema.ts`

**Move to**: `domains/_archived/ai-presets/` for reference

---

### Migration Script

```typescript
/**
 * Migrate AI Presets to Inline AI Nodes
 *
 * For each experience using AI preset:
 * 1. Extract preset config
 * 2. Create inline AI node
 * 3. Map preset variables to steps
 * 4. Update experience document
 */
async function migratePresetsToInline(workspaceId: string) {
  const experiences = await getExperiences(workspaceId)

  for (const experience of experiences) {
    // Find preset reference (old format)
    const aiNode = experience.transformConfig.nodes.find(
      node => node.type === 'aiImage' && 'presetId' in node
    )

    if (!aiNode) continue  // No preset, skip

    // Fetch preset
    const preset = await getAIPreset(workspaceId, aiNode.presetId)

    // Map preset prompt to inline format
    const inlinePrompt = mapPresetPromptToInline(
      preset.published.promptTemplate,
      aiNode.variableBindings,
      experience.steps
    )

    // Create inline node
    const inlineNode: AIImageNode = {
      type: 'ai.imageGeneration',
      id: aiNode.id,
      config: {
        model: preset.published.model,
        aspectRatio: preset.published.aspectRatio,
        prompt: inlinePrompt,
        refMedia: preset.published.mediaRegistry.map(entry => ({
          mediaAssetId: entry.mediaId,
          url: entry.url,
          filePath: entry.filePath,
          displayName: entry.name,  // Use preset name as displayName
        })),
      },
    }

    // Update experience
    await updateExperience(workspaceId, experience.id, {
      transformConfig: {
        ...experience.transformConfig,
        nodes: experience.transformConfig.nodes.map(node =>
          node.id === aiNode.id ? inlineNode : node
        ),
      },
    })

    console.log(`✅ Migrated experience: ${experience.id}`)
  }
}

/**
 * Map preset prompt with @{text:var} / @{input:var} to @{step:stepName}
 */
function mapPresetPromptToInline(
  presetPrompt: string,
  variableBindings: Record<string, { stepId: string }>,
  steps: ExperienceStep[]
): string {
  let result = presetPrompt

  // Replace @{text:varName} and @{input:varName} with @{step:stepName}
  for (const [varName, binding] of Object.entries(variableBindings)) {
    const step = steps.find(s => s.id === binding.stepId)
    const stepName = step?.name || varName

    result = result
      .replace(new RegExp(`@\\{text:${varName}\\}`, 'g'), `@{step:${stepName}}`)
      .replace(new RegExp(`@\\{input:${varName}\\}`, 'g'), `@{step:${stepName}}`)
  }

  // Replace @{ref:mediaName} with @{ref:mediaAssetId}
  // (Preset uses name, inline uses mediaAssetId)
  // Look up mediaAssetId from preset.mediaRegistry
  const mediaNameToId = new Map(
    preset.published.mediaRegistry.map(m => [m.name, m.mediaId])
  )

  result = result.replace(
    /@\{ref:(\w+)\}/g,
    (match, name) => {
      const mediaAssetId = mediaNameToId.get(name)
      return mediaAssetId ? `@{ref:${mediaAssetId}}` : match
    }
  )

  return result
}
```

---

## Edge Cases & Validation

### Edge Case 1: Empty PromptFragment with PromptMedia

**Scenario**:
```typescript
Option: {
  value: "cat",
  promptFragment: "",  // Empty
  promptMedia: { mediaAssetId: "cat123" }
}
```

**Resolution**: Fallback to value
```
"cat (see <cat123>)"
```

**Rationale**: Provide sensible default rather than error

---

### Edge Case 2: Multi-Selection with Empty Array

**Scenario**:
```typescript
Step: multiSelect = true
Input: []  // No selections
```

**Resolution**: `<missing>` placeholder

**Rationale**: Indicates missing input clearly

---

### Edge Case 3: Undefined Step Reference

**Scenario**:
```typescript
Prompt: "@{step:unknownStep}"
Experience has no step named "unknownStep"
```

**Resolution**:
- Resolved: `<missing>`
- Validation: Error "Step 'unknownStep' not found"

**UI**: Show error in validation display, highlight in prompt editor

---

### Edge Case 4: Undefined RefMedia Reference

**Scenario**:
```typescript
Prompt: "@{ref:abc123xyz}"
Node refMedia doesn't include mediaAssetId "abc123xyz"
```

**Resolution**:
- Resolved: `<abc123xyz>` (placeholder kept)
- Validation: Warning "Media 'abc123xyz' not found in refMedia"

**Rationale**: Allow missing media to pass (might be from step option)

---

### Edge Case 5: DisplayName Collision

**Scenario**:
```typescript
RefMedia: [
  { mediaAssetId: "abc", displayName: "overlay" },
  { mediaAssetId: "xyz", displayName: "overlay" }  // Duplicate!
]
```

**Validation**: Error "DisplayName 'overlay' is used by multiple media. Names must be unique."

**UI**: Show error when adding/editing refMedia

---

### Edge Case 6: Step Name Changes

**Scenario**:
1. Step named "petStep" is referenced in prompt
2. User renames step to "animalStep"
3. Prompt still has `@{step:petStep}`

**Solution**: Validation warning "Step 'petStep' not found. Did you rename it?"

**Future Enhancement**: Auto-update references when step renamed

---

### Edge Case 7: Capture Step with No Upload

**Scenario**:
```typescript
Step: capture-photo
Test input: null (no image uploaded yet)
```

**Resolution**: `<missing>`

**Validation**: Error "Image required for step 'captureStep'"

---

### Edge Case 8: Text Step with Empty Input

**Scenario**:
```typescript
Step: input-short-text (required: true)
Test input: ""  // Empty string
```

**Resolution**: `<missing>`

**Validation**: Error "Value required for step 'phraseStep'"

---

### Validation Summary

**Errors** (block test generation):
- Missing required step inputs
- Undefined step references in prompt
- DisplayName collisions in refMedia

**Warnings** (allow test generation):
- Undefined refMedia references (might be from step options)
- Empty optional inputs

**Validation UI**:
```typescript
interface ValidationState {
  status: 'valid' | 'invalid' | 'incomplete'
  errors: Array<{
    field: string
    message: string
  }>
  warnings: Array<{
    type: string
    message: string
  }>
}

// Status logic:
// 'incomplete' - Has errors (missing required)
// 'invalid' - Has warnings only
// 'valid' - No errors or warnings
```

---

## Appendix

### Gemini API Integration

```typescript
async function generateImage(
  node: AIImageNode,
  inputs: Record<string, any>,
  steps: ExperienceStep[]
): Promise<GeneratedImage> {
  // 1. Resolve prompt
  const resolved = resolvePrompt(
    node.config.prompt,
    steps,
    inputs,
    node.config.refMedia
  )

  // 2. Fetch media data for all references
  const mediaParts = await Promise.all(
    resolved.mediaReferences.map(async (mediaId) => {
      const mediaData = await fetchMediaData(mediaId)
      return [
        { text: `Image Reference ID: <${mediaId}>` },
        mediaData,  // Binary image data
      ]
    })
  )

  // 3. Build Gemini request
  const parts = [
    ...mediaParts.flat(),
    { text: resolved.text }
  ]

  // 4. Call Gemini API
  const model = genAI.getGenerativeModel({ model: node.config.model })
  const result = await model.generateContent(parts)

  // 5. Return generated image
  return {
    url: result.response.candidates[0].content.parts[0].url,
    metadata: {
      model: node.config.model,
      aspectRatio: node.config.aspectRatio,
      promptLength: resolved.characterCount,
      mediaCount: resolved.mediaReferences.length,
    }
  }
}
```

---

### Future Enhancements (Out of Scope)

**Phase 2: Yes/No Steps**
- Implement yes/no with AI-aware options
- Similar to multiselect but simpler

**Phase 3: Template Library** (if needed)
- Workspace-level prompt templates
- "New from Template" / "Save as Template"
- Copy-based (not reference-based)

**Phase 4: Advanced Features**
- Step name change auto-update
- Prompt versioning
- Prompt analytics (which prompts work best)
- Bulk operations (duplicate node, etc.)

**Phase 5: DisplayMedia Field**
- Add `displayMedia` to step options
- Show in selection UI (separate from promptMedia)
- Visual preview during step selection

---

## Summary

The **Inline Prompt Architecture (v2)** provides a streamlined, intuitive approach to AI prompt configuration:

✅ **Simple**: No presets, no mapping - just inline configuration
✅ **Stable**: MediaAssetId-based references never break
✅ **Visual**: Lexical editor with colored pills
✅ **Flexible**: Direct step references, auto-composition
✅ **Testable**: Live preview with test run dialog
✅ **LLM-Ready**: Resolved format matches Gemini API exactly

**Three-Format System**:
- Storage: `@{step:name}`, `@{ref:mediaAssetId}` (parseable)
- Display: `@stepName`, `@displayName` (user-friendly)
- Resolved: `<mediaAssetId>` (LLM-ready)

**Implementation**: 9 phases, ~4-5 weeks total, 60% code reuse from AI Presets

**Next Steps**: Begin Phase 1a (Schemas & Foundation)
