# Resolution Algorithm

**Part of**: [Inline Prompt Architecture (v2)](./README.md)

---

## Overview

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

## Complete Algorithm

```typescript
interface ResolvedPrompt {
  text: string                      // Resolved prompt text
  characterCount: number            // Length
  mediaReferences: string[]         // All mediaAssetIds to include
  hasUnresolved: boolean            // Any missing references?
  unresolvedRefs: Reference[]       // List of missing refs
}

interface Reference {
  type: 'step' | 'refMedia'
  name: string
}

function resolvePrompt(
  storedPrompt: string,
  steps: ExperienceStep[],
  testInputs: Record<string, any>,
  refMedia: RefMediaEntry[],
): ResolvedPrompt {
  let resolved = storedPrompt
  const unresolvedRefs: Reference[] = []

  // ============================================
  // 1. RESOLVE STEP MENTIONS: @{step:stepName}
  // ============================================

  const stepMentions = parseStepMentions(storedPrompt)

  for (const mention of stepMentions) {
    const step = steps.find((s) => s.name === mention.stepName)

    if (!step) {
      // Step not found
      unresolvedRefs.push({ type: 'step', name: mention.stepName })
      resolved = resolved.replace(`@{step:${mention.stepName}}`, `<missing>`)
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
        const values = Array.isArray(inputValue) ? inputValue : [inputValue]

        // Map each value to promptFragment + auto-reference
        const fragments = values
          .filter((val) => val != null)
          .map((val) => {
            const option = step.config.options.find((opt) => opt.value === val)

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
        replacement = fragments.length > 0 ? fragments.join(', ') : `<missing>`
        break
      }

      case 'input-yes-no': {
        // Bonus phase - similar to multiselect but simpler
        const selectedOption =
          inputValue === 'yes'
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
    resolved = resolved.replace(`@{step:${mention.stepName}}`, replacement)
  }

  // ============================================
  // 2. RESOLVE REFMEDIA MENTIONS: @{ref:mediaAssetId}
  // ============================================

  const refMentions = parseRefMentions(storedPrompt)

  for (const mention of refMentions) {
    const media = refMedia.find((m) => m.mediaAssetId === mention.mediaAssetId)

    if (!media) {
      // RefMedia not found
      unresolvedRefs.push({ type: 'refMedia', name: mention.mediaAssetId })
    }

    // Replace @{ref:mediaAssetId} with <mediaAssetId>
    // (Even if not found, show placeholder)
    resolved = resolved.replace(
      `@{ref:${mention.mediaAssetId}}`,
      `<${mention.mediaAssetId}>`,
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

## Helper Functions

### parseStepMentions

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
```

**Example**:
```typescript
Input: "Transform @{step:captureStep} into @{step:petStep}"
Output: [
  { stepName: "captureStep" },
  { stepName: "petStep" }
]
```

---

### parseRefMentions

```typescript
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
```

**Example**:
```typescript
Input: "Style: @{ref:abc123xyz} and @{ref:overlay456}"
Output: [
  { mediaAssetId: "abc123xyz" },
  { mediaAssetId: "overlay456" }
]
```

---

### extractMediaIds

```typescript
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

**Example**:
```typescript
Input: "Transform <cap789> into hobbit (see <cat123>). Style: <abc123>"
Output: ["cap789", "cat123", "abc123"]
```

---

## Resolution Examples

### Example 1: Simple Resolution

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

### Example 2: Multi-Selection

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

### Example 3: Missing References

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
  { type: 'refMedia', name: 'unknownMedia' },
]
```

---

### Example 4: Text Step

**Stored Prompt**:
```
"Person wearing @{step:outfitStep}"
```

**Inputs**:
- `outfitStep` → `"wizard robes"`

**Resolved**:
```
"Person wearing wizard robes"
```

**Media References**: `[]` (no media)

---

### Example 5: Yes/No Step (Bonus Phase)

**Stored Prompt**:
```
"Add @{step:wingsStep}"
```

**Inputs**:
- `wingsStep` → `"yes"`
- Option "yes": `{ promptFragment: "magnificent angel wings", promptMedia: { mediaAssetId: "wings123" } }`

**Resolved**:
```
"Add magnificent angel wings (see <wings123>)"
```

**Media References**: `["wings123"]`

---

### Example 6: Fallback Behavior

**Stored Prompt**:
```
"@{step:petStep}"
```

**Inputs**:
- `petStep` → `"cat"`
- Option "cat": `{ promptFragment: "", promptMedia: { mediaAssetId: "cat123" } }`  // Empty fragment

**Resolved**:
```
"cat (see <cat123>)"
```

**Behavior**: Falls back to `value` when `promptFragment` is empty.

---

## Step Type Resolution Matrix

| Step Type | Input | Resolution Logic | Example Output |
|-----------|-------|------------------|----------------|
| `capture-photo` | MediaReference | `<mediaAssetId>` | `<cap789>` |
| `input-multi-select` | string | `promptFragment` or value + auto-ref | `holding cat (see <cat123>)` |
| `input-multi-select` | string[] | Join with `, ` | `holding cat (see <cat123>), with dog (see <dog456>)` |
| `input-yes-no` | "yes" / "no" | `promptFragment` or value + auto-ref | `with wings (see <wings123>)` |
| `input-short-text` | string | Raw value | `wizard robes` |
| `input-long-text` | string | Raw value | `A long description...` |

---

## Edge Case Handling

### Empty PromptFragment

```typescript
Option: {
  value: "cat",
  promptFragment: "",  // Empty
  promptMedia: { mediaAssetId: "cat123" }
}

// Resolution: Fallback to value
"cat (see <cat123>)"
```

---

### Missing PromptMedia

```typescript
Option: {
  value: "cat",
  promptFragment: "holding a grumpy cat",
  // No promptMedia
}

// Resolution: No auto-reference
"holding a grumpy cat"
```

---

### Empty Multi-Selection

```typescript
Step: multiSelect = true
Input: []  // No selections

// Resolution: <missing>
"<missing>"
```

---

### Undefined Option

```typescript
Input: "unknown_value"  // Not in options array

// Resolution: Use raw value
"unknown_value"
```

---

## Performance Considerations

### Regex Efficiency

- Use `exec()` with global flag for multiple matches
- Single pass through prompt text
- O(n) complexity where n = prompt length

### Caching Strategy

```typescript
// Cache parsed mentions to avoid re-parsing
const mentionCache = new Map<string, ParsedMentions>()

function resolvePromptCached(prompt: string, ...args): ResolvedPrompt {
  const cacheKey = prompt
  let parsed = mentionCache.get(cacheKey)

  if (!parsed) {
    parsed = {
      stepMentions: parseStepMentions(prompt),
      refMentions: parseRefMentions(prompt)
    }
    mentionCache.set(cacheKey, parsed)
  }

  // Continue with resolution using cached parsed mentions
  // ...
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('resolvePrompt', () => {
  it('resolves capture step to mediaAssetId', () => {
    // Test capture step resolution
  })

  it('resolves multiselect with promptFragment', () => {
    // Test multiselect with AI-aware option
  })

  it('resolves multiselect with multi-selection', () => {
    // Test multiple selected values
  })

  it('resolves text step to raw value', () => {
    // Test text input
  })

  it('handles missing step references', () => {
    // Test undefined step
  })

  it('handles missing refMedia references', () => {
    // Test undefined refMedia
  })

  it('extracts all media references', () => {
    // Test media extraction
  })

  it('handles empty inputs gracefully', () => {
    // Test missing/empty inputs
  })
})
```

### Integration Tests

```typescript
describe('resolvePrompt integration', () => {
  it('resolves complex prompt with mixed step types', () => {
    // Test real-world scenario with capture + multiselect + text
  })

  it('resolves prompt with multiple refMedia', () => {
    // Test multiple style references
  })
})
```

---

## Related Documents

- [Architecture](./architecture.md) - System overview
- [Three-Format System](./three-format-system.md) - Format specifications
- [Data Models](./data-models.md) - Schema definitions
- [Validation](./validation.md) - Validation rules and edge cases
