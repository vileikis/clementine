# AI Presets - Technical Specification

## Status: Draft
**Created**: 2025-01-26
**Last Updated**: 2025-01-26

---

## 1. Overview

### 1.1 What is an AI Preset?

An AI Preset is a standalone, reusable, and testable configuration for AI image generation. It encapsulates:
- **Media Registry**: References to images from the workspace media library
- **Variables**: Input declarations with optional value mappings and defaults
- **Prompt Template**: The AI prompt with `@variable` and `@media` references
- **Model Settings**: AI model, aspect ratio, and other generation parameters

AI Presets are designed to be:
1. **Testable in isolation** - Can be tested without an experience
2. **Reusable** - Can be used across multiple experiences
3. **Self-contained** - All prompt logic lives in the preset

### 1.2 Relationship with Transform Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  AI PRESET (standalone, testable)                           │
│  "Hobbitify Portrait"                                       │
├─────────────────────────────────────────────────────────────┤
│  Variables:                                                 │
│  - @subject (image, required)                               │
│  - @pet (text, options: cat/dog/none, default: none)        │
│  - @background (text, options: hobbiton/rivendell)          │
│  - @phrase (text, pass-through)                             │
│                                                             │
│  Media: cat.jpg, dog.jpg, hobbiton.jpg, art_style.jpg       │
│  Prompt: "Transform @subject into hobbit. @pet. @background"│
│  Model: gemini-2.5-pro | Aspect: 3:2                        │
└─────────────────────────────────────────────────────────────┘
                            ↓ used by
┌─────────────────────────────────────────────────────────────┐
│  TRANSFORM PIPELINE (simple wiring)                         │
├─────────────────────────────────────────────────────────────┤
│  AI Image Node:                                             │
│  - preset: "Hobbitify Portrait"                             │
│  - bindings:                                                │
│      @subject → RemoveBackground node output                │
│      @pet → "Pet Choice" step                               │
│      @background → "Background" step                        │
│      @phrase → "Phrase Input" step                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Data Model

### 2.1 Firestore Structure

```
/workspaces/{workspaceId}/aiPresets/{presetId}
```

### 2.2 AI Preset Schema

```typescript
/**
 * Media registry entry - references workspace media library
 */
const presetMediaEntrySchema = z.object({
  /** Reference name used in prompt (e.g., "cat", "hobbiton") */
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  /** Asset ID from workspace media library */
  assetId: z.string(),
  /** Cached URL for display */
  url: z.string().url(),
})

/**
 * Value mapping entry for text variables
 */
const valueMappingEntrySchema = z.object({
  /** The input value to match */
  value: z.string(),
  /** Text to substitute in prompt (can include @media references) */
  text: z.string(),
})

/**
 * Variable definition
 */
const presetVariableSchema = z.discriminatedUnion('type', [
  // Text variable (from step answers)
  z.object({
    type: z.literal('text'),
    /** Variable name used in prompt */
    name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    /** Human-readable label */
    label: z.string(),
    /** Description for documentation */
    description: z.string().optional(),
    /** Whether this variable is required */
    required: z.boolean().default(true),
    /** Default value if not provided or unmapped */
    defaultValue: z.string().optional(),
    /** Value mappings (optional - if not provided, pass-through) */
    valueMap: z.array(valueMappingEntrySchema).optional(),
  }),
  // Image variable (from capture steps or other nodes)
  z.object({
    type: z.literal('image'),
    /** Variable name used in prompt */
    name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    /** Human-readable label */
    label: z.string(),
    /** Description for documentation */
    description: z.string().optional(),
    /** Whether this variable is required */
    required: z.boolean().default(true),
  }),
])

/**
 * AI Preset document
 */
const aiPresetSchema = z.object({
  /** Preset ID (Firestore document ID) */
  id: z.string(),
  /** Workspace ID */
  workspaceId: z.string(),
  /** Preset name */
  name: z.string().min(1).max(100),
  /** Description */
  description: z.string().max(500).optional(),

  /** Media registry - images available for prompt */
  mediaRegistry: z.array(presetMediaEntrySchema).default([]),

  /** Variable definitions */
  variables: z.array(presetVariableSchema).default([]),

  /** Prompt template with @variable and @media references */
  promptTemplate: z.string().default(''),

  /** AI model settings */
  model: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.0']).default('gemini-2.5-flash'),

  /** Output aspect ratio */
  aspectRatio: z.enum(['1:1', '3:2', '2:3', '9:16', '16:9']).default('1:1'),

  /** Timestamps */
  createdAt: z.number(),
  updatedAt: z.number(),

  /** Created by user ID */
  createdBy: z.string(),
})

type AIPreset = z.infer<typeof aiPresetSchema>
type PresetVariable = z.infer<typeof presetVariableSchema>
type PresetMediaEntry = z.infer<typeof presetMediaEntrySchema>
```

### 2.3 Example AI Preset Document

```json
{
  "id": "preset_abc123",
  "workspaceId": "ws_xyz",
  "name": "Hobbitify Portrait",
  "description": "Transform a person into a hobbit character",

  "mediaRegistry": [
    { "name": "cat", "assetId": "asset_cat123", "url": "https://..." },
    { "name": "dog", "assetId": "asset_dog456", "url": "https://..." },
    { "name": "hobbiton", "assetId": "asset_hob789", "url": "https://..." },
    { "name": "rivendell", "assetId": "asset_riv012", "url": "https://..." },
    { "name": "art_style", "assetId": "asset_style", "url": "https://..." }
  ],

  "variables": [
    {
      "type": "image",
      "name": "subject",
      "label": "Subject Photo",
      "description": "The photo to transform",
      "required": true
    },
    {
      "type": "text",
      "name": "pet",
      "label": "Pet Choice",
      "description": "What pet the hobbit should hold",
      "required": false,
      "defaultValue": "none",
      "valueMap": [
        { "value": "cat", "text": "holding a cat (see @cat)" },
        { "value": "dog", "text": "holding a dog (see @dog)" },
        { "value": "none", "text": "with empty hands" }
      ]
    },
    {
      "type": "text",
      "name": "background",
      "label": "Background",
      "description": "Scene background",
      "required": false,
      "defaultValue": "hobbiton",
      "valueMap": [
        { "value": "hobbiton", "text": "in the rolling hills of the Shire @hobbiton" },
        { "value": "rivendell", "text": "in the elven realm of Rivendell @rivendell" }
      ]
    },
    {
      "type": "text",
      "name": "phrase",
      "label": "Custom Phrase",
      "description": "Text overlay on the image",
      "required": false,
      "defaultValue": ""
    }
  ],

  "promptTemplate": "Transform the person in @subject into a hobbit character from Middle-earth.\n\nThey should be @pet.\n\nSet the scene @background.\n\nUse @art_style as the artistic style reference.\n\nAdd a text overlay: \"@phrase\"",

  "model": "gemini-2.5-pro",
  "aspectRatio": "3:2",

  "createdAt": 1706000000000,
  "updatedAt": 1706000000000,
  "createdBy": "user_123"
}
```

---

## 3. Reference Resolution

### 3.1 Unified @ Syntax

Both variables and media use `@name` syntax in the prompt. The system distinguishes them based on:
1. If `@name` matches a variable name → resolve as variable
2. If `@name` matches a media registry entry → include as image
3. If neither → validation error

### 3.2 Resolution Flow

```typescript
function resolvePreset(
  preset: AIPreset,
  inputs: Record<string, string | ImageData>
): ResolvedPrompt {
  // 1. Build media lookup
  const mediaLookup = new Map(preset.mediaRegistry.map(m => [m.name, m]))

  // 2. Resolve variables
  const resolvedVars: Record<string, string> = {}
  for (const variable of preset.variables) {
    const inputValue = inputs[variable.name]

    if (variable.type === 'image') {
      // Image variables are handled separately
      continue
    }

    // Text variable resolution
    if (inputValue === undefined || inputValue === '') {
      resolvedVars[variable.name] = variable.defaultValue ?? ''
    } else if (variable.valueMap) {
      const mapping = variable.valueMap.find(m => m.value === inputValue)
      resolvedVars[variable.name] = mapping?.text ?? variable.defaultValue ?? inputValue
    } else {
      // Pass-through
      resolvedVars[variable.name] = inputValue
    }
  }

  // 3. Replace @variable references in prompt
  let prompt = preset.promptTemplate
  for (const [name, value] of Object.entries(resolvedVars)) {
    prompt = prompt.replaceAll(`@${name}`, value)
  }

  // 4. Extract @media references from resolved prompt
  const mediaRefs = [...prompt.matchAll(/@([a-zA-Z_][a-zA-Z0-9_]*)/g)]
    .map(m => m[1])
    .filter(name => mediaLookup.has(name))

  // 5. Collect unique media to send
  const mediaToSend = [...new Set(mediaRefs)].map(name => mediaLookup.get(name)!)

  // 6. Add image variable inputs
  const imageInputs = preset.variables
    .filter(v => v.type === 'image')
    .map(v => ({ name: v.name, data: inputs[v.name] as ImageData }))

  return {
    prompt,
    media: mediaToSend,
    imageInputs,
  }
}
```

---

## 4. AI Preset Editor

### 4.1 Layout

Two-column layout:
- **Left (60%)**: Configuration
- **Right (40%)**: Test Area

```
┌─────────────────────────────────────────┬──────────────────────────────┐
│  CONFIGURATION                          │  TEST AREA                   │
├─────────────────────────────────────────┼──────────────────────────────┤
│                                         │                              │
│  [Media Registry]                       │  INPUTS                      │
│  ┌─────┬─────┬─────┬─────┬─────┐       │  ┌────────────────────────┐  │
│  │ 🐱  │ 🐕  │ 🏡  │ 🏔️  │ 🎨  │       │  │ Subject: [Upload]      │  │
│  └─────┴─────┴─────┴─────┴─────┘       │  │ Pet: [cat ▼]           │  │
│  [+ Add from Library]                   │  │ Background: [hobbiton▼]│  │
│                                         │  │ Phrase: [________]     │  │
│  [Variables]                            │  └────────────────────────┘  │
│  ┌─────────────────────────────────┐   │                              │
│  │ @subject (image) - Subject Photo│   │  PROMPT PREVIEW              │
│  │ @pet (text) - Pet Choice        │   │  ┌────────────────────────┐  │
│  │   cat → "holding a cat..."      │   │  │ Transform person in    │  │
│  │   dog → "holding a dog..."      │   │  │ @subject into hobbit.  │  │
│  │ @background (text) - Background │   │  │ They should be holding │  │
│  │ @phrase (text) - Pass-through   │   │  │ a cat (see @cat)...    │  │
│  └─────────────────────────────────┘   │  └────────────────────────┘  │
│  [+ Add Variable]                       │                              │
│                                         │  MEDIA TO SEND               │
│  [Prompt Template]                      │  ┌────┬────┬────┬────┐      │
│  ┌─────────────────────────────────┐   │  │ 📷 │ 🐱 │ 🏡 │ 🎨 │      │
│  │ Transform @subject into hobbit. │   │  └────┴────┴────┴────┘      │
│  │ They should be @pet.            │   │  4 of 5 images               │
│  │ @background. Use @art_style...  │   │                              │
│  └─────────────────────────────────┘   │  [Run Test Generation]       │
│  Type @ to insert variable or media     │                              │
│                                         │  TEST RESULT                 │
│  [Model: gemini-2.5-pro ▼]             │  ┌────────────────────────┐  │
│  [Aspect: 3:2 ▼]                       │  │                        │  │
│                                         │  │    [Generated Image]   │  │
│                                         │  │                        │  │
│                                         │  └────────────────────────┘  │
└─────────────────────────────────────────┴──────────────────────────────┘
```

### 4.2 Test Area Behavior

**Inputs Section:**
- For image variables: Upload button or drag-and-drop
- For text variables WITH valueMap: Dropdown with defined options
- For text variables WITHOUT valueMap: Free text input
- Default values pre-filled

**Prompt Preview:**
- Updates live as inputs change
- Shows resolved prompt with all @references substituted
- Highlights which @media references will trigger image inclusion

**Media to Send:**
- Shows thumbnails of images that will be sent to AI
- Based on @references in resolved prompt
- Shows "X of Y images" indicator

**Test Generation:**
- Button to run actual AI generation
- Shows loading state
- Displays generated image result
- Allows iteration

---

## 5. AI Presets List Page

### 5.1 Route

```
/workspace/:workspaceSlug/ai-presets
```

### 5.2 Features

- List all AI presets in workspace
- Create new preset
- Duplicate preset
- Rename preset
- Delete preset (with confirmation)
- Search/filter presets

### 5.3 Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  AI Presets                                        [+ Create Preset] │
├─────────────────────────────────────────────────────────────────────┤
│  [Search presets...]                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Hobbitify Portrait                                      ⋮    │   │
│  │ Transform a person into a hobbit character                   │   │
│  │ 4 variables • 5 media • Updated 2 hours ago                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Fantasy Background Swap                                 ⋮    │   │
│  │ Replace background with AI-generated fantasy scene           │   │
│  │ 2 variables • 3 media • Updated 1 day ago                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Cartoon Style Transfer                                  ⋮    │   │
│  │ Apply cartoon/anime style to photos                          │   │
│  │ 1 variable • 2 media • Updated 3 days ago                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.4 Preset Card Actions (⋮ menu)

- Edit
- Duplicate
- Rename
- Delete

---

## 6. Integration with Transform Pipeline

### 6.1 AI Image Node Schema Update

```typescript
const aiImageNodeSchema = z.object({
  id: z.string(),
  type: z.literal('aiImage'),

  /** AI Preset ID */
  presetId: z.string(),

  /** Variable bindings: preset variable name → source */
  variableBindings: z.record(z.string(), z.discriminatedUnion('source', [
    // From a previous node output
    z.object({
      source: z.literal('node'),
      nodeId: z.string(),
    }),
    // From an experience step
    z.object({
      source: z.literal('step'),
      stepId: z.string(),
    }),
  ])),
})
```

### 6.2 Pipeline Configuration UX

When configuring an AI Image node in the pipeline:

1. Select AI Preset from dropdown
2. System shows list of variables the preset expects
3. For each variable, user maps to:
   - A previous node output (for image variables)
   - An experience step (for text variables)
4. Validation ensures all required variables are bound

```
┌─────────────────────────────────────────────────────────────┐
│  AI Image Node                                              │
├─────────────────────────────────────────────────────────────┤
│  Preset: [Hobbitify Portrait ▼]                             │
│                                                             │
│  Variable Bindings:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ @subject (image)     →  [RemoveBackground output ▼] │   │
│  │ @pet (text)          →  [Pet Choice step ▼]         │   │
│  │ @background (text)   →  [Background step ▼]         │   │
│  │ @phrase (text)       →  [Phrase Input step ▼]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ✓ All required variables bound                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Security & Permissions

### 7.1 Firestore Rules

```javascript
match /workspaces/{workspaceId}/aiPresets/{presetId} {
  // Workspace members can read
  allow read: if isWorkspaceMember(workspaceId);

  // Workspace admins can write
  allow write: if isWorkspaceAdmin(workspaceId);
}
```

### 7.2 Prompt Security

- AI Presets are admin-only editable
- Guests never see preset contents
- Prompt templates are not exposed to client in guest context

---

## 8. Validation

### 8.1 Preset Validation

At save time:
- All @references in prompt must match either a variable or media entry
- Variable names must be unique
- Media names must be unique
- Required fields must be present

At test time:
- All required variables must have values
- Image variables must have valid image data

### 8.2 Pipeline Binding Validation

At publish time:
- All required preset variables must be bound
- Bound steps must exist in experience
- Step types must be compatible (text step → text variable, capture step → image variable)

---

## 9. Summary

AI Presets provide a clean separation between:
- **Prompt Engineering** (in AI Preset) - The creative, testable prompt configuration
- **Data Flow** (in Transform Pipeline) - Simple wiring of preset variables to experience steps

This architecture enables:
1. Isolated testing of AI generation without full experience
2. Reuse of presets across experiences
3. Clear mental model for users
4. Simpler transform pipeline configuration
