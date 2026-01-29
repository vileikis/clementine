# Validation & Edge Cases

**Part of**: [Inline Prompt Architecture (v2)](./README.md)

---

## Validation Summary

The system validates prompts at multiple levels:

**Errors** (block test generation):
- Missing required step inputs
- Undefined step references in prompt
- DisplayName collisions in refMedia

**Warnings** (allow test generation):
- Undefined refMedia references (might be from step options)
- Empty optional inputs

---

## Validation State Interface

```typescript
interface ValidationState {
  status: 'valid' | 'invalid' | 'incomplete'
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  field: string
  message: string
}

interface ValidationWarning {
  type: string
  message: string
}

// Status logic:
// 'incomplete' - Has errors (missing required inputs)
// 'invalid' - Has warnings only
// 'valid' - No errors or warnings
```

---

## Edge Cases

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

**Validation**: Error if step is required

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

**Rationale**: Allow missing media to pass (might be from step option promptMedia)

---

### Edge Case 5: DisplayName Collision

**Scenario**:
```typescript
RefMedia: [
  { mediaAssetId: 'abc', displayName: 'overlay' },
  { mediaAssetId: 'xyz', displayName: 'overlay' },  // Duplicate!
]
```

**Validation**: Error "DisplayName 'overlay' is used by multiple media. Names must be unique."

**UI**: Show error when adding/editing refMedia

**Prevention**: Validate uniqueness on displayName change

---

### Edge Case 6: Step Name Changes

**Scenario**:
1. Step named "petStep" is referenced in prompt
2. User renames step to "animalStep"
3. Prompt still has `@{step:petStep}`

**Solution**: Validation warning "Step 'petStep' not found. Did you rename it?"

**Future Enhancement**: Auto-update references when step renamed

**Workaround**: User manually updates prompt references

---

### Edge Case 7: Capture Step with No Upload

**Scenario**:
```typescript
Step: capture-photo
Test input: null  // No image uploaded yet
```

**Resolution**: `<missing>`

**Validation**: Error "Image required for step 'captureStep'"

**UI**: Highlight missing field in test input form

---

### Edge Case 8: Text Step with Empty Input

**Scenario**:
```typescript
Step: input-short-text (required: true)
Test input: ""  // Empty string
```

**Resolution**: `<missing>`

**Validation**: Error "Value required for step 'phraseStep'"

**UI**: Show required field indicator

---

### Edge Case 9: PromptMedia Without PromptFragment

**Scenario**:
```typescript
Option: {
  value: "cat",
  // No promptFragment
  promptMedia: { mediaAssetId: "cat123" }
}
```

**Resolution**: Use value + auto-reference
```
"cat (see <cat123>)"
```

**Rationale**: promptMedia is still useful even without custom text

---

### Edge Case 10: Multiselect with Invalid Selection

**Scenario**:
```typescript
Step: options = ["cat", "dog"]
Input: "bird"  // Not in options
```

**Resolution**: Use raw value (no promptFragment lookup)
```
"bird"
```

**Validation**: Warning "Selected value 'bird' is not a valid option"

**Rationale**: Graceful degradation (may be from old data)

---

## Validation Rules

### Schema-Level Validation (Zod)

Performed when saving data to Firestore:

| Field | Rule | Error Message |
|-------|------|---------------|
| `value` | 1-100 chars | "Option value must be 1-100 characters" |
| `promptFragment` | ≤500 chars | "Prompt fragment must be ≤500 characters" |
| `displayName` | ≤100 chars | "Display name must be ≤100 characters" |
| `prompt` | ≥1 char | "Prompt cannot be empty" |
| `options` | 2-10 items | "Must have 2-10 options" |

---

### Application-Level Validation

Performed during editing and test runs:

#### 1. Step Reference Validation

```typescript
function validateStepReferences(
  prompt: string,
  steps: ExperienceStep[]
): ValidationError[] {
  const errors: ValidationError[] = []
  const mentions = parseStepMentions(prompt)

  for (const mention of mentions) {
    const exists = steps.some(s => s.name === mention.stepName)
    if (!exists) {
      errors.push({
        field: 'prompt',
        message: `Step '${mention.stepName}' not found`
      })
    }
  }

  return errors
}
```

---

#### 2. RefMedia Reference Validation

```typescript
function validateRefMediaReferences(
  prompt: string,
  refMedia: RefMediaEntry[]
): ValidationWarning[] {
  const warnings: ValidationWarning[] = []
  const mentions = parseRefMentions(prompt)

  for (const mention of mentions) {
    const exists = refMedia.some(m => m.mediaAssetId === mention.mediaAssetId)
    if (!exists) {
      warnings.push({
        type: 'missing-media',
        message: `Media '${mention.mediaAssetId}' not found in refMedia`
      })
    }
  }

  return warnings
}
```

---

#### 3. DisplayName Uniqueness Validation

```typescript
function validateDisplayNameUniqueness(
  refMedia: RefMediaEntry[]
): ValidationError[] {
  const errors: ValidationError[] = []
  const displayNames = new Map<string, number>()

  for (const entry of refMedia) {
    const name = entry.displayName || deriveDisplayName(entry.filePath)
    const count = displayNames.get(name) || 0
    displayNames.set(name, count + 1)
  }

  for (const [name, count] of displayNames.entries()) {
    if (count > 1) {
      errors.push({
        field: 'refMedia',
        message: `DisplayName '${name}' is used by multiple media. Names must be unique.`
      })
    }
  }

  return errors
}
```

---

#### 4. Required Input Validation

```typescript
function validateRequiredInputs(
  steps: ExperienceStep[],
  inputs: Record<string, any>
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const step of steps) {
    if (!step.config.required) continue

    const value = inputs[step.name]

    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
      errors.push({
        field: step.name,
        message: getRequiredMessage(step)
      })
    }
  }

  return errors
}

function getRequiredMessage(step: ExperienceStep): string {
  switch (step.type) {
    case 'capture-photo':
      return `Image required for step '${step.name}'`
    case 'input-multi-select':
      return `Selection required for step '${step.name}'`
    case 'input-yes-no':
      return `Answer required for step '${step.name}'`
    case 'input-short-text':
    case 'input-long-text':
      return `Value required for step '${step.name}'`
    default:
      return `Input required for step '${step.name}'`
  }
}
```

---

## Validation Display Components

### ValidationStatusBadge

```typescript
interface ValidationStatusBadgeProps {
  status: 'valid' | 'invalid' | 'incomplete'
}

function ValidationStatusBadge({ status }: ValidationStatusBadgeProps) {
  const config = {
    valid: {
      icon: CheckCircleIcon,
      color: 'green',
      label: 'Valid'
    },
    invalid: {
      icon: AlertTriangleIcon,
      color: 'yellow',
      label: 'Has Warnings'
    },
    incomplete: {
      icon: XCircleIcon,
      color: 'red',
      label: 'Incomplete'
    }
  }[status]

  return (
    <div className={`flex items-center gap-2 text-${config.color}-700`}>
      <config.icon className="w-5 h-5" />
      <span className="font-medium">{config.label}</span>
    </div>
  )
}
```

---

### ValidationErrorList

```typescript
interface ValidationErrorListProps {
  errors: ValidationError[]
  warnings: ValidationWarning[]
  onErrorClick?: (field: string) => void
}

function ValidationErrorList({ errors, warnings, onErrorClick }: ValidationErrorListProps) {
  return (
    <div className="space-y-2">
      {/* Errors */}
      {errors.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-red-700 mb-1">Errors</div>
          <ul className="space-y-1">
            {errors.map((error, i) => (
              <li
                key={i}
                className="text-sm text-red-600 cursor-pointer hover:underline"
                onClick={() => onErrorClick?.(error.field)}
              >
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-yellow-700 mb-1">Warnings</div>
          <ul className="space-y-1">
            {warnings.map((warning, i) => (
              <li key={i} className="text-sm text-yellow-600">
                • {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success */}
      {errors.length === 0 && warnings.length === 0 && (
        <div className="text-sm text-green-600">
          ✓ All validation checks passed
        </div>
      )}
    </div>
  )
}
```

---

## Validation Timing

### Real-Time Validation

Performed as user types/edits:

- ✅ DisplayName uniqueness
- ✅ Character count limits
- ✅ Required field presence

**Debounce**: 300ms

---

### On-Demand Validation

Performed when user clicks "Test Run":

- ✅ Step reference existence
- ✅ RefMedia reference existence
- ✅ Required input values
- ✅ Complete validation state

---

### Save-Time Validation

Performed when saving to Firestore:

- ✅ Schema validation (Zod)
- ✅ Type safety
- ✅ Value constraints

---

## Error Recovery Strategies

### Strategy 1: Auto-Correction

When possible, auto-correct instead of blocking:

```typescript
// Empty promptFragment → Use value
if (!option.promptFragment && option.promptMedia) {
  return option.value + ` (see <${option.promptMedia.mediaAssetId}>)`
}
```

---

### Strategy 2: Graceful Degradation

When data is missing, degrade gracefully:

```typescript
// Missing option → Use raw value
if (!option) {
  return selectedValue
}
```

---

### Strategy 3: Clear Error Messages

Provide actionable error messages:

```typescript
// Bad:  "Validation failed"
// Good: "Step 'petStep' not found. Did you rename it?"
```

---

### Strategy 4: Click-to-Fix

Make errors clickable to jump to problem:

```typescript
<li onClick={() => focusField('captureStep')}>
  Image required for step 'captureStep'
</li>
```

---

## Testing Validation

### Unit Tests

```typescript
describe('validation', () => {
  describe('validateStepReferences', () => {
    it('detects missing step references', () => {
      const prompt = "@{step:unknownStep}"
      const steps = []
      const errors = validateStepReferences(prompt, steps)

      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('unknownStep')
    })

    it('passes when all steps exist', () => {
      const prompt = "@{step:captureStep}"
      const steps = [{ name: 'captureStep', type: 'capture-photo' }]
      const errors = validateStepReferences(prompt, steps)

      expect(errors).toHaveLength(0)
    })
  })

  describe('validateDisplayNameUniqueness', () => {
    it('detects duplicate displayNames', () => {
      const refMedia = [
        { mediaAssetId: 'abc', displayName: 'overlay' },
        { mediaAssetId: 'xyz', displayName: 'overlay' }
      ]
      const errors = validateDisplayNameUniqueness(refMedia)

      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('overlay')
    })
  })
})
```

---

## Validation Best Practices

### For Developers

1. **Validate early**: Check at edit time, not just save time
2. **Clear messages**: Tell user what's wrong and how to fix
3. **Non-blocking warnings**: Distinguish errors (block) from warnings (allow)
4. **Graceful fallbacks**: Degrade instead of crashing
5. **Test edge cases**: Cover all resolution paths

### For Users

1. **Test thoroughly**: Use test run dialog before publishing
2. **Check warnings**: Don't ignore yellow warnings
3. **Use descriptive names**: Makes errors easier to understand
4. **Test with real data**: Use actual images and text
5. **Verify media preview**: Ensure correct images appear

---

## Related Documents

- [Architecture](./architecture.md) - System overview
- [Resolution Algorithm](./resolution-algorithm.md) - Resolution logic
- [User Workflows](./user-workflows.md) - Error recovery workflows
- [Data Models](./data-models.md) - Schema validation rules
