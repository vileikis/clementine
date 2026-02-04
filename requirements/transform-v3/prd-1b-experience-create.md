# PRD 1B: Experience Create Config

**Epic**: [Outcome-based Create](./epic.md)
**Status**: Draft
**Dependencies**: PRD 1A (Schema Foundations)
**Enables**: PRD 2 (Admin Create Tab UX), PRD 3 (Job + CF)

---

## Overview

Add `create` field to experience config schema and implement publish-time validation. This PRD covers the data model changes only - the admin UI is covered in PRD 2.

---

## 1. Experience Config Schema Update

Add `create` field to experience config, deprecate `transformNodes`.

**File**: `packages/shared/src/schemas/experience/experience.schema.ts`

```ts
import { createOutcomeSchema } from './create-outcome.schema'

/**
 * Experience Config Schema
 */
export const experienceConfigSchema = z.looseObject({
  /** Array of steps in the experience */
  steps: z.array(experienceStepSchema).default([]),

  /** @deprecated Use create instead. Kept for backward compatibility. */
  transformNodes: z.array(transformNodeSchema).default([]),

  /** Create outcome configuration (replaces transformNodes) */
  create: createOutcomeSchema.default({
    type: null,
    captureStepId: null,
    aiEnabled: true,
    imageGeneration: {
      prompt: '',
      refMedia: [],
      model: 'gemini-2.5-flash-image',
      aspectRatio: '1:1',
    },
    options: null,
  }),
})
```

### Acceptance Criteria

- [ ] AC-1.1: `experienceConfigSchema` includes `create` field
- [ ] AC-1.2: `transformNodes` field still exists (backward compatible)
- [ ] AC-1.3: Default `create` has sensible defaults with `type: null`

---

## 2. Publish-Time Validation

Validate create outcome configuration at publish time.

**Location**: Experience publish logic (likely in `apps/clementine-app/src/domains/experience/...`)

### Validation Rules

```ts
interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate experience create outcome before publishing
 */
function validateCreateOutcome(
  create: CreateOutcome,
  steps: ExperienceStep[]
): ValidationResult {
  const errors: string[] = []

  // Rule 1: type must be set
  if (create.type === null) {
    errors.push('Select an outcome type (Image, GIF, or Video)')
    return { valid: false, errors }
  }

  // Rule 2: Passthrough requires captureStepId
  if (!create.aiEnabled && !create.captureStepId) {
    errors.push('Passthrough mode requires a source image. Enable AI or select a source step.')
  }

  // Rule 3: captureStepId validation (if set)
  if (create.captureStepId) {
    const sourceStep = steps.find(s => s.id === create.captureStepId)
    if (!sourceStep) {
      errors.push('Selected source step no longer exists')
    } else if (!sourceStep.type.startsWith('capture.')) {
      errors.push('Source step must be a capture step')
    }
  }

  // Rule 4: AI enabled validation
  if (create.aiEnabled) {
    // Prompt required when AI is enabled
    if (!create.imageGeneration.prompt.trim()) {
      errors.push('Prompt is required when AI is enabled')
    }

    // refMedia displayName uniqueness
    const displayNames = create.imageGeneration.refMedia.map(m => m.displayName)
    const duplicates = displayNames.filter((name, i) => displayNames.indexOf(name) !== i)
    if (duplicates.length > 0) {
      errors.push(`Duplicate reference media names: ${[...new Set(duplicates)].join(', ')}`)
    }
  }

  // Rule 5: gif/video not yet implemented
  if (create.type === 'gif' || create.type === 'video') {
    errors.push(`${create.type.toUpperCase()} outcome is coming soon`)
  }

  // Rule 6: options.kind must match type
  if (create.options && create.options.kind !== create.type) {
    errors.push('Options kind must match outcome type')
  }

  return { valid: errors.length === 0, errors }
}
```

### Acceptance Criteria

- [ ] AC-2.1: Publish fails if `create.type` is null
- [ ] AC-2.2: Publish fails if passthrough mode without captureStepId
- [ ] AC-2.3: Publish fails if `captureStepId` references non-existent step
- [ ] AC-2.4: Publish fails if `captureStepId` references non-capture step
- [ ] AC-2.5: Publish fails if AI enabled with empty prompt
- [ ] AC-2.6: Publish fails if refMedia has duplicate displayNames
- [ ] AC-2.7: Publish fails with clear error for gif/video (coming soon)
- [ ] AC-2.8: Error messages are user-friendly and actionable

---

## 3. Publish Behavior

Update publish logic to handle transformNodes deprecation.

### Rules

1. On publish, always set `published.transformNodes = []`
2. Copy `draft.create` to `published.create`
3. Existing experiences without `create` configured fail validation

```ts
// In publish handler
const publishedConfig: ExperienceConfig = {
  steps: draft.steps,
  transformNodes: [], // Always empty
  create: draft.create,
}
```

### Acceptance Criteria

- [ ] AC-3.1: `published.transformNodes` is always `[]` after publish
- [ ] AC-3.2: `published.create` reflects `draft.create` at publish time
- [ ] AC-3.3: Experiences without `create.type` set cannot be published

---

## 4. Draft Initialization

New experiences should have sensible defaults.

### Default Create Config

When creating a new experience:

```ts
const defaultCreate: CreateOutcome = {
  type: null,           // Must be configured before publish
  captureStepId: null,
  aiEnabled: true,
  imageGeneration: {
    prompt: '',
    refMedia: [],
    model: 'gemini-2.5-flash-image',
    aspectRatio: '1:1',
  },
  options: null,
}
```

### Acceptance Criteria

- [ ] AC-4.1: New experiences have `create` with defaults
- [ ] AC-4.2: `create.type` is null (forces admin to make explicit choice)
- [ ] AC-4.3: `create.aiEnabled` defaults to true

---

## 5. Outcome Switching Behavior

When admin switches outcome type, preserve imageGeneration config.

### Implementation

```ts
function handleOutcomeTypeChange(newType: CreateOutcomeType) {
  setCreate(prev => ({
    ...prev,
    type: newType,
    // imageGeneration preserved (prompt, refMedia, model, aspectRatio)
    // options reset to defaults for new type
    options: getDefaultOptionsForType(newType),
  }))
}

function getDefaultOptionsForType(type: CreateOutcomeType): OutcomeOptions {
  switch (type) {
    case 'image':
      return { kind: 'image' }
    case 'gif':
      return { kind: 'gif', fps: 24, duration: 3 }
    case 'video':
      return { kind: 'video', videoPrompt: '', duration: 5 }
  }
}
```

### Acceptance Criteria

- [ ] AC-5.1: Switching outcome type preserves `imageGeneration` block
- [ ] AC-5.2: Switching outcome type resets `options` to defaults
- [ ] AC-5.3: `captureStepId` and `aiEnabled` preserved on switch

---

## Files Changed

| File | Action |
|------|--------|
| `packages/shared/src/schemas/experience/experience.schema.ts` | MODIFY |
| `apps/clementine-app/src/domains/experience/.../publish-validation.ts` | MODIFY/CREATE |
| `apps/clementine-app/src/domains/experience/.../create-experience.ts` | MODIFY |

---

## Testing

- [ ] Unit tests for `validateCreateOutcome()` function
- [ ] Unit tests for outcome switching preserves imageGeneration
- [ ] Integration test: publish with valid create config succeeds
- [ ] Integration test: publish without create.type fails
- [ ] Integration test: publish with passthrough + no source fails
- [ ] Integration test: publish with AI + empty prompt fails
