# Quickstart: Experience Create Outcome Configuration

**Feature**: 059-experience-create
**Date**: 2026-02-04

## Overview

This feature adds the `create` field to experience config and implements publish-time validation. The schema already exists - this integrates it and adds validation.

## Prerequisites

- Node.js 20+
- pnpm 10.18+
- Access to Firebase project

## Quick Setup

```bash
# From monorepo root
pnpm install

# Build shared package (schema changes)
pnpm --filter @clementine/shared build

# Start app for testing
pnpm app:dev
```

## Key Files to Modify

### 1. Schema Integration

**File**: `packages/shared/src/schemas/experience/experience.schema.ts`

```typescript
import { createOutcomeSchema } from './create-outcome.schema'

export const experienceConfigSchema = z.looseObject({
  steps: z.array(experienceStepSchema).default([]),
  transformNodes: z.array(transformNodeSchema).default([]),
  // Add this field:
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

### 2. Export Types

**File**: `packages/shared/src/schemas/experience/index.ts`

```typescript
// Add exports:
export {
  createOutcomeSchema,
  createOutcomeTypeSchema,
  imageGenerationConfigSchema,
  outcomeOptionsSchema,
  type CreateOutcome,
  type CreateOutcomeType,
  type ImageGenerationConfig,
  type OutcomeOptions,
} from './create-outcome.schema'
```

### 3. Validation Function

**File**: `apps/clementine-app/src/domains/experience/shared/lib/create-outcome-validation.ts`

```typescript
import type { CreateOutcome, ExperienceStep } from '@clementine/shared'

export interface CreateOutcomeValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string; stepId?: string }>
}

export function validateCreateOutcome(
  create: CreateOutcome,
  steps: ExperienceStep[]
): CreateOutcomeValidationResult {
  const errors = []

  // Rule 1: type must be set
  if (create.type === null) {
    errors.push({
      field: 'create.type',
      message: 'Select an outcome type (Image, GIF, or Video)',
    })
    return { valid: false, errors }
  }

  // ... implement other rules from spec

  return { valid: errors.length === 0, errors }
}
```

### 4. Integrate with Publish

**File**: `apps/clementine-app/src/domains/experience/designer/hooks/usePublishExperience.ts`

```typescript
import { validateCreateOutcome } from '../../shared/lib/create-outcome-validation'

export function validateForPublish(experience: Experience): PublishValidationResult {
  const errors: PublishValidationError[] = []

  // Existing step validation...

  // Add create outcome validation
  const createValidation = validateCreateOutcome(
    experience.draft.create,
    experience.draft.steps
  )

  if (!createValidation.valid) {
    errors.push(...createValidation.errors.map(e => ({
      field: e.field,
      message: e.message,
      stepId: e.stepId,
    })))
  }

  return { valid: errors.length === 0, errors }
}
```

## Testing

### Unit Tests

```bash
# Run shared package tests
pnpm --filter @clementine/shared test

# Run app tests
pnpm app:test
```

### Manual Testing

1. Create new experience → verify `create` has defaults
2. Try to publish without setting type → should fail with error
3. Set type to 'image', enable AI, add prompt → should publish
4. Disable AI without capture step → should fail
5. Select capture step, disable AI → should publish (passthrough)

## Validation Rules Summary

| Rule | Error Message |
|------|---------------|
| No type selected | "Select an outcome type (Image, GIF, or Video)" |
| Passthrough no source | "Passthrough mode requires a source image..." |
| Invalid capture step | "Selected source step no longer exists" |
| Non-capture step | "Source step must be a capture step" |
| AI without prompt | "Prompt is required when AI is enabled" |
| Duplicate refMedia | "Duplicate reference media names: {names}" |
| GIF/Video selected | "{TYPE} outcome is coming soon" |
| Options mismatch | "Options kind must match outcome type" |

## Common Issues

### Schema not updating in app

```bash
# Rebuild shared package
pnpm --filter @clementine/shared build

# Restart dev server
pnpm app:dev
```

### Type errors after schema change

```bash
# Check types
pnpm app:type-check

# May need to restart TS server in IDE
```

### Existing experiences fail validation

Expected behavior - existing experiences without `create.type` set will fail validation. This is intentional to force explicit configuration.
