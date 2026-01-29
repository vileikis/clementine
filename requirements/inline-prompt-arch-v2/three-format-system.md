# Three-Format System

**Part of**: [Inline Prompt Architecture (v2)](./README.md)

---

## Overview

The architecture uses three distinct representations of prompts, each optimized for its specific purpose:

| Format | Purpose | Audience |
|--------|---------|----------|
| **Storage** | Parseable, stored in Firestore | System |
| **Display** | User-friendly, shown in Lexical editor | Users |
| **Resolved** | LLM-ready, sent to Gemini API | AI Model |

---

## 1. Storage Format (Plain Text)

### Purpose

Unambiguous, parseable representation stored in Firestore.

### Syntax

```
"Transform @{step:captureStep} into hobbit @{step:petStep}.
 Style: @{ref:abc123xyz}"
```

### Patterns

- **Step mentions**: `@{step:stepName}`
- **RefMedia mentions**: `@{ref:mediaAssetId}`

### Characteristics

- ✅ **Type-safe**: Explicit `step:` and `ref:` prefixes distinguish types
- ✅ **Stable**: MediaAssetIds don't change (unlike display names)
- ✅ **Parseable**: Regex-based extraction is reliable
- ❌ **Not human-friendly**: MediaAssetIds are UUIDs (e.g., `abc123xyz456`)

### Examples

```typescript
// Step reference
"@{step:captureStep}"

// RefMedia reference
"@{ref:abc123xyz456}"

// Combined
"Transform @{step:captureStep} with style @{ref:overlay123}"
```

### Validation Rules

1. Step names must match pattern: `[a-zA-Z_][a-zA-Z0-9_]*`
2. MediaAssetIds must match pattern: `[a-zA-Z0-9_-]+`
3. No whitespace allowed inside `@{...}`

---

## 2. Display Format (Lexical UI)

### Purpose

User-friendly visual representation in the Lexical editor.

### Syntax

```
"Transform @captureStep into hobbit @petStep. Style: @artStyle"
           [blue pill]              [blue pill]     [green pill]
```

### Patterns

- **Step mentions**: `@stepName` (rendered as blue pills)
- **RefMedia mentions**: `@displayName` (rendered as green pills)

### Characteristics

- ✅ **Human-readable**: Uses step names and user-defined displayNames
- ✅ **Visual distinction**: Colored pills differentiate types
- ✅ **Autocomplete-friendly**: Short, memorable names
- ✅ **Clean syntax**: Simple `@name` (no type prefixes needed)

### Pill Colors

| Type | Color | Example |
|------|-------|---------|
| Step mentions | Blue | `@captureStep`, `@petStep` |
| RefMedia mentions | Green | `@artStyle`, `@overlay` |

### Lexical Nodes

```typescript
// Step mention (blue pill)
<StepMentionNode stepName="captureStep" />

// Media mention (green pill)
<MediaMentionNode
  mediaAssetId="abc123xyz456"
  displayName="artStyle"
/>
```

### Serialization

When editor state is saved:
```typescript
// Display format in editor
"@captureStep with @artStyle"

// Serializes to storage format
"@{step:captureStep} with @{ref:abc123xyz456}"
```

See [Lexical Editor](./lexical-editor.md) for implementation details.

---

## 3. Resolved Format (LLM Input)

### Purpose

Final text sent to Gemini API, with all references resolved to mediaAssetIds.

### Syntax

```
"Transform <cap789> into hobbit holding a grumpy cat (see <cat123>).
 Style: <abc123xyz>"
```

### Patterns

- **Placeholder**: `<mediaAssetId>`
- **Missing references**: `<missing>`

### Characteristics

- ✅ **LLM-ready**: Matches Gemini API placeholder pattern
- ✅ **All mediaAssetIds exposed**: Enables image inclusion
- ✅ **No `@` symbols**: Avoids user confusion in preview
- ✅ **Step values resolved**:
  - Capture → `<mediaAssetId>`
  - Multiselect → `promptFragment` + auto-referenced promptMedia
  - Text → raw value

### Resolution Examples

#### Capture Step

```typescript
// Stored
"@{step:captureStep}"

// Input
{ mediaAssetId: "cap789", url: "...", filePath: "..." }

// Resolved
"<cap789>"
```

#### Multiselect Step

```typescript
// Stored
"@{step:petStep}"

// Input
"cat"  // Selected value

// Option config
{
  value: "cat",
  promptFragment: "holding a grumpy cat",
  promptMedia: { mediaAssetId: "cat123" }
}

// Resolved
"holding a grumpy cat (see <cat123>)"
```

#### RefMedia

```typescript
// Stored
"@{ref:abc123xyz456}"

// RefMedia config
{
  mediaAssetId: "abc123xyz456",
  displayName: "artStyle"
}

// Resolved
"<abc123xyz456>"
```

#### Missing Reference

```typescript
// Stored
"@{step:unknownStep}"

// No step named "unknownStep"

// Resolved
"<missing>"
```

---

## Format Transformations

### Storage → Display (Deserialization)

Happens when loading prompt into Lexical editor.

```typescript
function deserializeFromPlainText(
  text: string,
  steps: ExperienceStep[],
  refMedia: RefMediaEntry[]
): EditorState {
  // Parse @{step:stepName} → StepMentionNode
  // Parse @{ref:mediaAssetId} → MediaMentionNode (with displayName lookup)
  // Create Lexical EditorState
}
```

**Example**:
```typescript
Input: "@{step:captureStep} with @{ref:abc123xyz}"

Steps: [{ name: "captureStep", ... }]
RefMedia: [{ mediaAssetId: "abc123xyz", displayName: "artStyle", ... }]

Output (Lexical):
  - TextNode("with")
  - StepMentionNode(stepName="captureStep")  // Blue pill: @captureStep
  - TextNode(" with ")
  - MediaMentionNode(
      mediaAssetId="abc123xyz",
      displayName="artStyle"
    )  // Green pill: @artStyle
```

---

### Display → Storage (Serialization)

Happens when saving editor state to Firestore.

```typescript
function serializeToPlainText(editorState: EditorState): string {
  let text = ''

  editorState.read(() => {
    const root = $getRoot()
    text = root.getTextContent()  // Calls exportText() on all nodes
  })

  return text
}

// Node exportText() methods:
class StepMentionNode {
  exportText(): string {
    return `@{step:${this.__stepName}}`
  }
}

class MediaMentionNode {
  exportText(): string {
    return `@{ref:${this.__mediaAssetId}}`
  }
}
```

**Example**:
```typescript
Input (Lexical):
  - StepMentionNode(stepName="captureStep")
  - TextNode(" with ")
  - MediaMentionNode(mediaAssetId="abc123xyz")

Output: "@{step:captureStep} with @{ref:abc123xyz}"
```

---

### Storage → Resolved (Resolution)

Happens during test runs or runtime generation.

```typescript
function resolvePrompt(
  storedPrompt: string,
  steps: ExperienceStep[],
  inputs: Record<string, any>,
  refMedia: RefMediaEntry[]
): ResolvedPrompt {
  // Parse @{step:...} and resolve based on step type
  // Parse @{ref:...} and replace with <mediaAssetId>
  // Extract all <mediaAssetId> patterns
  // Return resolved text + media references
}
```

**Example**:
```typescript
Input: "@{step:captureStep} with @{ref:abc123xyz}"

Steps: [{ name: "captureStep", type: "capture-photo", ... }]
Inputs: { captureStep: { mediaAssetId: "cap789" } }
RefMedia: [{ mediaAssetId: "abc123xyz", ... }]

Output: {
  text: "<cap789> with <abc123xyz>",
  mediaReferences: ["cap789", "abc123xyz"],
  hasUnresolved: false,
  unresolvedRefs: []
}
```

See [Resolution Algorithm](./resolution-algorithm.md) for complete logic.

---

## Format Comparison Table

| Aspect | Storage | Display | Resolved |
|--------|---------|---------|----------|
| **Pattern** | `@{type:id}` | `@name` | `<id>` |
| **Step ref** | `@{step:captureStep}` | `@captureStep` | `<cap789>` |
| **Media ref** | `@{ref:abc123xyz}` | `@artStyle` | `<abc123xyz>` |
| **Readability** | Low (UUIDs) | High (names) | Medium (IDs) |
| **Parseability** | High (regex) | N/A (Lexical) | High (regex) |
| **Stability** | High (IDs) | Medium (names) | High (IDs) |
| **Visual** | No | Yes (pills) | No |
| **LLM-ready** | No | No | Yes |

---

## Design Rationale

### Why Not One Format?

**Option 1**: Use display format everywhere
- ❌ Breaks when displayNames change
- ❌ Ambiguous when multiple media have same name
- ❌ Not parseable (needs Lexical to interpret)

**Option 2**: Use storage format everywhere
- ❌ Poor UX (users see UUIDs)
- ❌ Hard to autocomplete (UUID completion is useless)
- ❌ Visually cluttered in editor

**Option 3**: Use resolved format everywhere
- ❌ Can't distinguish step vs media references
- ❌ Not user-friendly (UUIDs)
- ❌ Conflicts with LLM placeholder syntax

**Solution**: Three formats, each optimized for its purpose.

---

### Why `<mediaAssetId>` in Resolved Format?

**Requirements**:
1. LLM must understand which text segments refer to images
2. System must know which images to include in API call
3. Clear, unambiguous placeholder pattern

**Gemini API Pattern**:
```typescript
parts: [
  { text: "Image Reference ID: <abc123>" },
  <image_data_abc123>,
  { text: "Transform <abc123> into..." }
]
```

**Solution**: Use `<mediaAssetId>` as placeholder, matches Gemini's expected pattern.

---

## Related Documents

- [Architecture](./architecture.md) - Overall system design
- [Resolution Algorithm](./resolution-algorithm.md) - Storage → Resolved transformation
- [Lexical Editor](./lexical-editor.md) - Display format implementation
- [Data Models](./data-models.md) - Schema definitions
