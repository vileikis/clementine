# Data Model: AI Preset Editor - Preview Panel

**Feature**: 045-ai-preset-preview
**Date**: 2025-01-28
**Status**: Complete

## Overview

This document defines the data entities used in the AI Preset Editor Preview Panel. All entities are **client-side only** with no backend storage or API contracts. The preview panel reads existing preset data from Firestore and maintains temporary state for testing purposes.

## Entity Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│               Firestore (Source of Truth)               │
│  /workspaces/{workspaceId}/aiPresets/{presetId}       │
│  • promptTemplate (plain text with @{type:name})      │
│  • variables (array of PresetVariable)                │
│  • mediaRegistry (array of PresetMediaEntry)          │
└─────────────────────────────────────────────────────────┘
                           ↓ (via TanStack Query)
┌─────────────────────────────────────────────────────────┐
│            Preview Panel Component (Mounted)            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ TestInputState (useState)                        │  │
│  │ • Temporary test values                          │  │
│  │ • Cleared on unmount                             │  │
│  └──────────────────────────────────────────────────┘  │
│                           ↓ (via useMemo)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ResolvedPrompt (computed)                        │  │
│  │ • Parse prompt template                          │  │
│  │ • Substitute test values                         │  │
│  └──────────────────────────────────────────────────┘  │
│                           ↓                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ MediaReferenceList (computed)                    │  │
│  │ • Extract references from resolved prompt        │  │
│  │ • Look up URLs from registry + test uploads      │  │
│  └──────────────────────────────────────────────────┘  │
│                           ↓                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ValidationState (computed)                       │  │
│  │ • Check for missing inputs                       │  │
│  │ • Check for undefined references                 │  │
│  │ • Generate warnings                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Core Entities

### 1. TestInputState

**Purpose**: Holds temporary test values for variables during preview session.

**Storage**: Component state (useState in AIPresetPreviewPanel)

**Lifecycle**:
- **Created**: On component mount with default values
- **Updated**: On user input (text entry, dropdown selection, image upload)
- **Cleared**: On component unmount

**Shape**:

```typescript
type TestInputState = {
  [variableName: string]: string | File | null
}

// Example:
{
  "userName": "Alice",           // Text variable without value map
  "style": "modern",             // Text variable with value map (selected key)
  "userPhoto": File {...},       // Image variable (uploaded file)
  "optionalVar": null            // Variable with no test input yet
}
```

**Validation Rules**:
- Keys MUST match existing variable names in `preset.draft.variables`
- Values for text variables MUST be strings (empty string if not provided)
- Values for image variables MUST be File objects or null
- Variables not in state default to their `defaultValue` from preset configuration

**State Management Hook**:

```typescript
// hooks/useTestInputs.ts
function useTestInputs(variables: PresetVariable[]) {
  const [testInputs, setTestInputs] = useState<TestInputState>(() => {
    // Initialize with default values
    const initialState: TestInputState = {}
    for (const variable of variables) {
      initialState[variable.name] = variable.defaultValue || null
    }
    return initialState
  })

  const updateInput = (name: string, value: string | File | null) => {
    setTestInputs(prev => ({ ...prev, [name]: value }))
  }

  const resetToDefaults = () => {
    const resetState: TestInputState = {}
    for (const variable of variables) {
      resetState[variable.name] = variable.defaultValue || null
    }
    setTestInputs(resetState)
  }

  return { testInputs, updateInput, resetToDefaults }
}
```

### 2. ResolvedPrompt

**Purpose**: Fully substituted prompt text ready for display, with all `@{type:name}` references replaced.

**Storage**: Derived state (useMemo)

**Lifecycle**:
- **Computed**: On every change to prompt template, test inputs, variables, or media registry
- **Invalidated**: When dependencies change
- **Garbage Collected**: On component unmount

**Shape**:

```typescript
type ResolvedPrompt = {
  text: string             // Fully resolved prompt with substitutions
  characterCount: number   // Length of resolved text (for display)
  hasUnresolved: boolean   // True if any references failed to resolve
  unresolvedRefs: Array<{  // List of unresolved references
    type: 'text' | 'input' | 'ref'
    name: string
  }>
}

// Example:
{
  text: "Create a modern portrait of Alice. Style: minimalist and clean. [Image: userPhoto] [Media: styleReference]",
  characterCount: 112,
  hasUnresolved: false,
  unre solvedRefs: []
}
```

**Resolution Logic**:

```typescript
// lib/prompt-resolution.ts
function resolvePrompt(
  promptTemplate: string,
  testInputs: TestInputState,
  variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[]
): ResolvedPrompt {
  const regex = /@\{(text|input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g
  let resolvedText = promptTemplate
  const unresolved: Array<{ type: string, name: string }> = []

  // Replace all references
  resolvedText = resolvedText.replace(regex, (match, type, name) => {
    if (type === 'text') {
      const variable = variables.find(v => v.name === name && v.type === 'text')
      if (!variable) {
        unresolved.push({ type, name })
        return `[Undefined: ${name}]`
      }
      const inputValue = testInputs[name]
      // Check value mapping
      if (variable.valueMap && inputValue) {
        const mapped = variable.valueMap.find(m => m.value === inputValue)
        return mapped ? mapped.text : (variable.defaultValue || `[No mapping: ${name}]`)
      }
      return inputValue || variable.defaultValue || `[No value: ${name}]`
    }

    if (type === 'input') {
      const variable = variables.find(v => v.name === name && v.type === 'image')
      if (!variable) {
        unresolved.push({ type, name })
        return `[Undefined: ${name}]`
      }
      const file = testInputs[name]
      return file ? `[Image: ${name}]` : `[Image: ${name} (missing)]`
    }

    if (type === 'ref') {
      const media = mediaRegistry.find(m => m.name === name)
      if (!media) {
        unresolved.push({ type, name })
        return `[Media: ${name} (missing)]`
      }
      return `[Media: ${name}]`
    }

    return match
  })

  return {
    text: resolvedText,
    characterCount: resolvedText.length,
    hasUnresolved: unresolved.length > 0,
    unresolvedRefs: unresolved
  }
}
```

**Hook Implementation**:

```typescript
// hooks/usePromptResolution.ts
function usePromptResolution(
  promptTemplate: string,
  testInputs: TestInputState,
  variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[]
): ResolvedPrompt {
  return useMemo(() => {
    return resolvePrompt(promptTemplate, testInputs, variables, mediaRegistry)
  }, [promptTemplate, testInputs, variables, mediaRegistry])
}
```

### 3. MediaReferenceList

**Purpose**: Collection of images (with URLs) that will be sent to the AI model, derived from prompt references.

**Storage**: Derived state (useMemo)

**Lifecycle**:
- **Computed**: On every change to resolved prompt, test inputs, or media registry
- **Invalidated**: When dependencies change
- **Garbage Collected**: On component unmount

**Shape**:

```typescript
type MediaReference = {
  name: string              // Reference name (variable name or media name)
  url: string               // Public URL for thumbnail display
  source: 'registry' | 'test'  // Origin of the image
  type: 'ref' | 'input'     // Reference type from prompt
}

type MediaReferenceList = MediaReference[]

// Example:
[
  {
    name: "styleReference",
    url: "https://storage.googleapis.com/...",
    source: "registry",
    type: "ref"
  },
  {
    name: "userPhoto",
    url: "blob:http://localhost:3000/...", // Local blob URL from File
    source: "test",
    type: "input"
  }
]
```

**Extraction Logic**:

```typescript
// lib/prompt-resolution.ts
function extractMediaReferences(
  promptTemplate: string,
  testInputs: TestInputState,
  variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[]
): MediaReferenceList {
  const regex = /@\{(input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g
  const references: MediaReferenceList = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(promptTemplate)) !== null) {
    const [, type, name] = match

    if (type === 'input') {
      const file = testInputs[name]
      if (file instanceof File) {
        references.push({
          name,
          url: URL.createObjectURL(file), // Create blob URL for preview
          source: 'test',
          type: 'input'
        })
      }
    }

    if (type === 'ref') {
      const media = mediaRegistry.find(m => m.name === name)
      if (media) {
        references.push({
          name,
          url: media.url,
          source: 'registry',
          type: 'ref'
        })
      }
    }
  }

  return references
}
```

**Hook Implementation**:

```typescript
// hooks/useMediaReferences.ts
function useMediaReferences(
  promptTemplate: string,
  testInputs: TestInputState,
  variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[]
): MediaReferenceList {
  return useMemo(() => {
    return extractMediaReferences(promptTemplate, testInputs, variables, mediaRegistry)
  }, [promptTemplate, testInputs, variables, mediaRegistry])
}
```

### 4. ValidationState

**Purpose**: Tracks errors (blocking) and warnings (non-blocking) for display and button disabling.

**Storage**: Derived state (useMemo)

**Lifecycle**:
- **Computed**: On every change to test inputs, resolved prompt, or media references
- **Invalidated**: When dependencies change
- **Garbage Collected**: On component unmount

**Shape**:

```typescript
type ValidationError = {
  field: string          // Variable name
  message: string        // Human-readable error
}

type ValidationWarning = {
  type: 'undefined-variable' | 'undefined-media' | 'unmapped-value'
  message: string        // Human-readable warning
  reference?: string     // Optional reference name
}

type ValidationState = {
  status: 'valid' | 'invalid' | 'incomplete'
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

// Example (incomplete state):
{
  status: "incomplete",
  errors: [
    { field: "userPhoto", message: "Image required for: userPhoto" }
  ],
  warnings: [
    {
      type: "undefined-variable",
      message: "Undefined variable: @{text:deletedVar}",
      reference: "deletedVar"
    }
  ]
}

// Example (valid state):
{
  status: "valid",
  errors: [],
  warnings: []
}
```

**Validation Logic**:

```typescript
// lib/validation.ts
function validatePresetInputs(
  variables: PresetVariable[],
  testInputs: TestInputState,
  resolvedPrompt: ResolvedPrompt
): ValidationState {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check for missing required inputs
  for (const variable of variables) {
    const inputValue = testInputs[variable.name]

    // Image variables must have a file
    if (variable.type === 'image' && !inputValue) {
      errors.push({
        field: variable.name,
        message: `Image required for: ${variable.name}`
      })
    }

    // Text variables with no default and no input
    if (variable.type === 'text' && !inputValue && !variable.defaultValue) {
      errors.push({
        field: variable.name,
        message: `Value required for: ${variable.name}`
      })
    }
  }

  // Check for unresolved references
  for (const ref of resolvedPrompt.unresolvedRefs) {
    if (ref.type === 'text' || ref.type === 'input') {
      warnings.push({
        type: 'undefined-variable',
        message: `Undefined variable: @{${ref.type}:${ref.name}}`,
        reference: ref.name
      })
    }
    if (ref.type === 'ref') {
      warnings.push({
        type: 'undefined-media',
        message: `Undefined media: @{ref:${ref.name}}`,
        reference: ref.name
      })
    }
  }

  // Determine overall status
  let status: 'valid' | 'invalid' | 'incomplete'
  if (errors.length > 0) {
    status = 'incomplete'
  } else if (warnings.length > 0) {
    status = 'invalid'
  } else {
    status = 'valid'
  }

  return { status, errors, warnings }
}
```

**Hook Implementation**:

```typescript
// hooks/usePresetValidation.ts
function usePresetValidation(
  variables: PresetVariable[],
  testInputs: TestInputState,
  resolvedPrompt: ResolvedPrompt
): ValidationState {
  return useMemo(() => {
    return validatePresetInputs(variables, testInputs, resolvedPrompt)
  }, [variables, testInputs, resolvedPrompt])
}
```

## Relationships

```
AIPreset (Firestore)
  ├── promptTemplate: string
  ├── variables: PresetVariable[]
  └── mediaRegistry: PresetMediaEntry[]

PresetVariable
  ├── name: string
  ├── type: 'text' | 'image'
  ├── defaultValue?: string
  └── valueMap?: Array<{ value: string, text: string }>

PresetMediaEntry
  ├── name: string (reference name)
  ├── url: string (public URL)
  └── mediaAssetId: string

TestInputState (Component State)
  └── [variableName]: string | File | null

ResolvedPrompt (Derived)
  ├── Depends on: promptTemplate, testInputs, variables, mediaRegistry
  └── Output: { text, characterCount, hasUnresolved, unresolvedRefs }

MediaReferenceList (Derived)
  ├── Depends on: promptTemplate, testInputs, mediaRegistry
  └── Output: Array<{ name, url, source, type }>

ValidationState (Derived)
  ├── Depends on: variables, testInputs, resolvedPrompt
  └── Output: { status, errors, warnings }
```

## Data Flow

```
1. Component Mount
   ↓
2. useAIPreset(workspaceId, presetId)
   ↓ (Firestore read via TanStack Query)
3. Preset data cached in TanStack Query
   ↓
4. Initialize TestInputState with default values
   ↓
5. User interacts (types, selects, uploads)
   ↓
6. TestInputState updates (useState)
   ↓
7. useMemo hooks recompute:
   - ResolvedPrompt (text substitution)
   - MediaReferenceList (extract references + look up URLs)
   - ValidationState (check for errors/warnings)
   ↓
8. Components re-render with new derived state
   ↓
9. Component Unmount
   ↓
10. TestInputState garbage collected (not persisted)
```

## Performance Considerations

### Memoization Strategy

All derived state uses useMemo to prevent unnecessary recomputations:

- **ResolvedPrompt**: Only recomputes when promptTemplate, testInputs, variables, or mediaRegistry change
- **MediaReferenceList**: Only recomputes when promptTemplate, testInputs, or mediaRegistry change
- **ValidationState**: Only recomputes when variables, testInputs, or resolvedPrompt change

### Complexity Analysis

- **resolvePrompt**: O(n) where n = length of promptTemplate (single regex scan)
- **extractMediaReferences**: O(n × m) where n = references in prompt, m = media registry size (includes lookups)
- **validatePresetInputs**: O(v + r) where v = number of variables, r = number of unresolved refs

All operations are fast enough for real-time computation (<10ms for typical presets).

## Type Definitions

```typescript
// types.ts (to be created)

export type TestInputState = {
  [variableName: string]: string | File | null
}

export type ResolvedPrompt = {
  text: string
  characterCount: number
  hasUnresolved: boolean
  unresolvedRefs: Array<{
    type: 'text' | 'input' | 'ref'
    name: string
  }>
}

export type MediaReference = {
  name: string
  url: string
  source: 'registry' | 'test'
  type: 'ref' | 'input'
}

export type MediaReferenceList = MediaReference[]

export type ValidationError = {
  field: string
  message: string
}

export type ValidationWarning = {
  type: 'undefined-variable' | 'undefined-media' | 'unmapped-value'
  message: string
  reference?: string
}

export type ValidationState = {
  status: 'valid' | 'invalid' | 'incomplete'
  errors: ValidationError[]
  warnings: ValidationWarning[]
}
```

## Testing Strategy

### Unit Tests (Pure Functions)

Test files: `tests/unit/domains/ai-presets/editor/`

**prompt-resolution.test.ts**:
- `resolvePrompt` function with various inputs
- Text variable substitution (with and without value maps)
- Image variable placeholder text
- Media reference placeholder text
- Undefined reference handling
- Edge cases (empty prompt, no references, malformed syntax)

**validation.test.ts**:
- `validatePresetInputs` function with various states
- Missing required inputs (errors)
- Undefined references (warnings)
- Valid state (no errors/warnings)
- Edge cases (all variables optional, no variables)

**media-extraction.test.ts**:
- `extractMediaReferences` function with various prompts
- Extract `@{input:name}` references
- Extract `@{ref:name}` references
- Handle missing media in registry
- Edge cases (no references, duplicate references)

### Component Tests

**TestInputsForm.test.tsx**:
- Renders correct input fields based on variables
- Text inputs update state correctly
- Dropdowns show value map options
- Image upload zones trigger file selection
- Reset button restores defaults

**PromptPreview.test.tsx**:
- Displays resolved prompt text
- Shows character count
- Highlights unresolved references
- Updates when test inputs change

**ValidationDisplay.test.tsx**:
- Shows error messages for missing inputs
- Shows warning messages for undefined references
- Displays correct status indicator (valid/invalid/incomplete)
- Updates when validation state changes

## API Contracts

**None** - This is a client-side only feature with no backend endpoints.

## Migration Notes

**No migration required** - Preview panel adds new functionality without changing existing data schemas.

## Conclusion

Data model is complete. All entities are well-defined with clear lifecycles, relationships, and validation rules. Implementation can proceed to Phase 2 (Task Generation).

**Next Step**: Generate quickstart.md and run `/speckit.tasks`
