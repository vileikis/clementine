# Variable Mapping Architecture

## Status: Proposed
**Created**: 2025-01-24
**Last Updated**: 2025-01-24

---

## Core Principles

1. **Images should be attached to prompt only when they are actually going to be used by the prompt.** No sending 9 images when only 3 are needed.

2. **UX for orchestrating transform pipeline should be seamless and streamlined.** Admins shouldn't have to manage complexity scattered across multiple places.

---

## Problem Statement

### Current Structure Limitations

The original variable mapping design had several issues:

### 1. Prompt Enrichment Gap

Raw step values often don't map directly to what should appear in AI prompts.

**Example:**
- User selects: `"cat"`
- What prompt needs: `"holding a cat (see image <cat>)"`

The transformation from user-facing value to prompt-ready text was missing.

### 2. Reference Image Inefficiency

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

### 3. Scattered Image Definitions

An alternative (distributed refs per variable) would scatter image definitions across multiple places, making it hard for admins to see the full picture.

### 4. Mixed Concerns in Variable Mappings

Original design mixed text substitution and media references in the same structure, creating confusion about what `variableMappings` was for.

---

## Proposed Solution

### Semantic Separation

Two distinct concepts, clearly separated:

| Concept | Purpose | Syntax in Prompt |
|---------|---------|------------------|
| **variableMappings** | Text substitution from step answers | `{{variable}}` |
| **mediaRegistry** | Image references (static + captured) | `<label>` |

### How LLMs Handle Labeled Images

LLMs like Gemini expect interleaved text labels and images:

```javascript
// Gemini API expects this pattern
const result = await model.generateContent([
  { text: "Image Reference ID: <user_photo>" },
  userPhotoData,
  { text: "Image Reference ID: <cat>" },
  catImageData,
  { text: "Transform <user_photo> into hobbit holding a cat (see <cat>)..." }
]);
```

Our architecture generates this format automatically based on `<label>` references in the resolved prompt.

---

## Schema Design

### Media Registry

Central place for all image sources - static assets and captured media:

```typescript
const mediaRegistryEntrySchema = z.discriminatedUnion('type', [
  // Static asset from media library
  z.object({
    type: z.literal('asset'),
    label: z.string(),
    assetId: z.string(),
  }),
  // Captured media from a step
  z.object({
    type: z.literal('capturedMedia'),
    label: z.string(),
    stepId: z.string(),
  }),
])

// Array for ordering support in UI
const mediaRegistrySchema = z.array(mediaRegistryEntrySchema)
```

### Variable Mappings

Text substitution from step answers only:

```typescript
const valueMappingEntrySchema = z.object({
  /** The step value to match */
  value: z.string(),
  /** Text to substitute in prompt (can include <label> image refs) */
  text: z.string(),
})

const variableMappingSchema = z.object({
  /** Step to get answer from */
  stepId: z.string(),

  /** Value mappings - array for ordering support */
  valueMap: z.array(valueMappingEntrySchema).optional(),

  /** Fallback when value not mapped or step data missing */
  default: z.object({
    text: z.string(),
  }).optional()
})
```

**Note:** No `type` field needed - variableMappings are always from step answers.

### Transform Config

```typescript
const transformConfigSchema = z.object({
  /** Central registry of all images (static + captured) */
  mediaRegistry: mediaRegistrySchema.default([]),

  /** Text substitution mappings (from step answers) */
  variableMappings: z.record(z.string(), variableMappingSchema).default({}),

  /** Pipeline nodes */
  nodes: z.array(transformNodeSchema).default([]),

  /** Output format */
  outputFormat: transformOutputFormatSchema,
})
```

### Node Input Source (Updated)

Nodes can reference media by label:

```typescript
const nodeInputSourceSchema = z.discriminatedUnion('source', [
  // From media registry by label
  z.object({
    source: z.literal('media'),
    label: z.string(),
  }),
  // From previous node output
  z.object({
    source: z.literal('previousNode'),
  }),
  // From specific node by ID
  z.object({
    source: z.literal('node'),
    nodeId: z.string(),
  }),
])
```

---

## Resolution Logic

### Step 1: Build Media Lookup

```typescript
const mediaLookup = new Map<string, MediaSource>()
for (const entry of transform.mediaRegistry) {
  mediaLookup.set(entry.label, entry)
}
```

### Step 2: Resolve Text Variables

```typescript
function resolveVariable(name: string, sessionAnswers: Record<string, any>): string {
  const mapping = transform.variableMappings[name]
  const rawValue = sessionAnswers[mapping.stepId]

  if (mapping.valueMap) {
    const entry = mapping.valueMap.find(e => e.value === rawValue)
    if (entry) return entry.text
    if (mapping.default) return mapping.default.text
    throw new Error(`No mapping for value: ${rawValue}`)
  }

  // Pass-through mode
  return rawValue ?? mapping.default?.text ?? ''
}
```

### Step 3: Compose Prompt

```typescript
const resolvedPrompt = promptTemplate.replace(
  /\{\{(\w+)\}\}/g,
  (_, name) => resolveVariable(name, sessionAnswers)
)
```

### Step 4: Extract Image References

```typescript
const imageLabels = [...resolvedPrompt.matchAll(/<(\w+)>/g)].map(m => m[1])
```

### Step 5: Build LLM Request

```typescript
const parts = []

for (const label of imageLabels) {
  const media = mediaLookup.get(label)
  if (!media) throw new Error(`Unknown media label: ${label}`)

  // Add label text
  parts.push({ text: `Image Reference ID: <${label}>` })

  // Add image data
  const imageData = await resolveMediaData(media, session)
  parts.push({ inlineData: imageData })
}

// Add the prompt
parts.push({ text: resolvedPrompt })
```

---

## Complete Example

### Transform Config

```typescript
transform: {
  mediaRegistry: [
    // Static assets
    { type: 'asset', label: 'cat', assetId: 'cat123' },
    { type: 'asset', label: 'dog', assetId: 'dog456' },
    { type: 'asset', label: 'hobbiton', assetId: 'hob789' },
    { type: 'asset', label: 'rivendell', assetId: 'riv012' },
    { type: 'asset', label: 'art_style', assetId: 'style999' },

    // Captured media from steps
    { type: 'capturedMedia', label: 'user_photo', stepId: 'captureStep' },
  ],

  variableMappings: {
    pet: {
      stepId: 'petStep',
      valueMap: [
        { value: 'cat', text: 'holding a cat (see image <cat>)' },
        { value: 'dog', text: 'holding a dog (see image <dog>)' },
        { value: 'none', text: 'with empty hands' }
      ],
      default: { text: 'with empty hands' }
    },

    background: {
      stepId: 'bgStep',
      valueMap: [
        { value: 'hobbiton', text: 'Set in the Shire with rolling green hills <hobbiton>' },
        { value: 'rivendell', text: 'Set in the elven realm of Rivendell <rivendell>' }
      ]
    },

    phrase: {
      stepId: 'phraseStep'
      // No valueMap = pass-through raw value
    }
  },

  nodes: [{
    type: 'aiImage',
    input: { source: 'media', label: 'user_photo' },
    promptTemplate: `
      Transform the person in <user_photo> into a hobbit character.
      They should be {{pet}}.
      {{background}}.
      Use <art_style> as the artistic reference.
      Add text overlay: "{{phrase}}"
    `,
    model: 'gemini-2.5-pro',
    aspectRatio: '3:2'
  }],

  outputFormat: 'image'
}
```

### Execution with User Selections

**User selects:** cat, hobbiton, "Adventure awaits!"

```
1. Resolve variables:
   - {{pet}} → "holding a cat (see image <cat>)"
   - {{background}} → "Set in the Shire with rolling green hills <hobbiton>"
   - {{phrase}} → "Adventure awaits!"

2. Composed prompt:
   "Transform the person in <user_photo> into a hobbit character.
    They should be holding a cat (see image <cat>).
    Set in the Shire with rolling green hills <hobbiton>.
    Use <art_style> as the artistic reference.
    Add text overlay: "Adventure awaits!""

3. Extract image labels: [user_photo, cat, hobbiton, art_style]

4. Build LLM request:
   [
     { text: "Image Reference ID: <user_photo>" },
     { inlineData: userPhotoData },
     { text: "Image Reference ID: <cat>" },
     { inlineData: cat123Data },
     { text: "Image Reference ID: <hobbiton>" },
     { inlineData: hob789Data },
     { text: "Image Reference ID: <art_style>" },
     { inlineData: style999Data },
     { text: "Transform the person in <user_photo>..." }
   ]

5. Images sent: 4 (only what's referenced)
   Images NOT sent: dog, rivendell (not selected/referenced)
```

---

## Graduated Complexity

The design supports multiple complexity levels:

| Use Case | valueMap | default | Image Refs |
|----------|----------|---------|------------|
| Pass-through text | - | optional | - |
| Text transformation | entries with text | optional | - |
| Text + image refs | entries with text containing `<label>` | optional | In text |

### Simple Pass-Through

```typescript
phrase: {
  stepId: 'phraseStep'
  // Raw value used directly
}
```

### Pass-Through with Fallback

```typescript
customText: {
  stepId: 'textStep',
  default: { text: 'Welcome!' }
}
```

### Text Transformation Only

```typescript
intensity: {
  stepId: 'scaleStep',
  valueMap: [
    { value: '1', text: 'subtle' },
    { value: '2', text: 'moderate' },
    { value: '3', text: 'dramatic' }
  ]
}
```

### Text + Image References

```typescript
pet: {
  stepId: 'petStep',
  valueMap: [
    { value: 'cat', text: 'holding a cat (see <cat>)' },
    { value: 'dog', text: 'holding a dog (see <dog>)' },
    { value: 'none', text: 'with empty hands' }
  ]
}
```

---

## AI Image Node: Static References

The AI Image node can still have static `references` for images that should always be included regardless of variable selections.

```typescript
{
  type: 'aiImage',
  input: { source: 'media', label: 'user_photo' },
  promptTemplate: '...',

  // Static refs - always included (legacy support or special cases)
  references: [
    { assetId: 'brand-watermark', label: 'watermark' }
  ]
}
```

**Reference composition at execution:**
```
Final images = mediaRegistry refs (from <label> parsing) + node.references (static)
```

However, the preferred approach is to use mediaRegistry + prompt references for consistency.

---

## Design Decisions

### D30: Array for valueMap and mediaRegistry

**Decision**: Use arrays instead of records/maps

**Rationale**:
- Supports reordering (drag-and-drop in admin UI)
- Explicit ordering in data model
- Lookup: `array.find(entry => entry.value === value)`

### D31: Removed `field` from Variable Mapping

**Decision**: Remove `field` property

**Rationale**:
- Current step types return simple values (string, number, boolean)
- No current use case requires field extraction
- Can add later if needed

### D32: Removed `type` from Variable Mapping

**Decision**: Remove `type` field from variableMappings

**Rationale**:
- variableMappings are now purely for text substitution from step answers
- `capturedMedia` moved to mediaRegistry where it semantically belongs
- No need for type discrimination

### D33: Centralized Media Registry

**Decision**: All images (static assets + captured media) defined in central `mediaRegistry`

**Rationale**:
- Single place to see all available images
- Consistent syntax for referencing (`<label>`)
- Clear separation: mediaRegistry = images, variableMappings = text
- Better admin UX than scattered refs

### D34: Prompt-Based Image Inclusion

**Decision**: Images included based on `<label>` references in resolved prompt

**Rationale**:
- Only referenced images are sent to LLM
- Explicit in prompt what images are used
- Automatic optimization - no manual conditional logic
- Matches how Gemini expects labeled images

### D35: Distinct Syntax for Variables vs Images

**Decision**: `{{variable}}` for text, `<label>` for images

**Rationale**:
- Clear visual distinction
- `<label>` matches Gemini's expected reference syntax
- Familiar patterns (mustache for variables, angle brackets for references)

---

## Potential Risks

### 1. Admin UX Complexity

**Risk**: Admins must understand two concepts (variableMappings + mediaRegistry) and two syntaxes.

**Mitigation**:
- Clear UI separation with explanatory labels
- "Insert Variable" and "Insert Image Reference" buttons in prompt editor
- Validation warnings for undefined references

### 2. Forgotten Image References

**Risk**: Admin writes fragment mentioning an image but forgets `<label>`, so image not included.

**Mitigation**:
- This is arguably a feature (explicit is good)
- Validation can warn about mediaRegistry entries not referenced anywhere
- Preview functionality shows which images will be included

### 3. Validation Complexity

**Risk**: Need to validate:
- `<label>` references exist in mediaRegistry
- `{{variable}}` references exist in variableMappings
- Referenced assets exist in media library

**Mitigation**:
- Validate at publish time
- Clear error messages pointing to specific issues
- Preview/test functionality

### 4. Label Conflicts

**Risk**: Same label used for different purposes or typos in labels.

**Mitigation**:
- Labels must be unique in mediaRegistry (enforced)
- Autocomplete in prompt editor for known labels
- Case-sensitive matching (clear rules)

### 5. Migration from Current Design

**Risk**: Existing transform configs use old structure.

**Mitigation**:
- Schema changes are additive where possible
- Migration script to convert old format
- Document breaking changes clearly

### 6. Regex Parsing Limitations

**Risk**: `<label>` pattern might conflict with other text (e.g., HTML tags, comparison operators).

**Mitigation**:
- Labels are alphanumeric + underscore only: `<[a-zA-Z_][a-zA-Z0-9_]*>`
- This excludes HTML tags like `<div>` (would need closing tag anyway)
- Document label naming conventions

---

## Summary

This architecture cleanly separates:

1. **mediaRegistry**: All images (static + captured), referenced by `<label>`
2. **variableMappings**: Text substitution from step answers, using `{{variable}}`

Key benefits:
- Only referenced images sent to LLM (cost + quality optimization)
- Single place to manage all images (better UX)
- Clear mental model (text vs images)
- Explicit prompt control (what you reference is what you get)
- Consistent syntax matching LLM expectations
