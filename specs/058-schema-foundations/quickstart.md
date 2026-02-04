# Quickstart: Schema Foundations (PRD 1A)

**Date**: 2026-02-04

## Prerequisites

- Node.js 18+
- pnpm 10.18.1+
- Access to the Clementine monorepo

## Setup

```bash
# From repo root
cd /Users/iggyvileikis/Projects/@attempt-n2/clementine

# Ensure on correct branch
git checkout 058-schema-foundations

# Install dependencies
pnpm install

# Build shared package
pnpm --filter @clementine/shared build
```

## File Locations

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared/src/schemas/media/media-reference.schema.ts` | MODIFY | Add `mediaDisplayNameSchema` |
| `packages/shared/src/schemas/experience/create-outcome.schema.ts` | CREATE | New outcome config schema |
| `packages/shared/src/schemas/session/session-response.schema.ts` | CREATE | New unified response schema |
| `packages/shared/src/schemas/experience/index.ts` | MODIFY | Export create-outcome |
| `packages/shared/src/schemas/session/index.ts` | MODIFY | Export session-response |
| `packages/shared/src/schemas/media/index.ts` | MODIFY | Export mediaDisplayNameSchema |

## Development Workflow

### 1. Build and Watch

```bash
# Watch mode for shared package
pnpm --filter @clementine/shared dev
```

### 2. Run Tests

```bash
# Run shared package tests
pnpm --filter @clementine/shared test

# Watch mode
pnpm --filter @clementine/shared test:watch
```

### 3. Type Check

```bash
# From shared package
cd packages/shared
pnpm build  # tsc --build
```

## Validation Checklist

Before committing, run from repo root:

```bash
# Format and lint (auto-fix)
pnpm app:check

# Type check shared package
pnpm --filter @clementine/shared build

# Run tests
pnpm --filter @clementine/shared test
```

## Usage Examples

### Media Display Name

```typescript
import { mediaDisplayNameSchema } from '@clementine/shared'

// Valid
mediaDisplayNameSchema.parse('hero-shot')      // 'hero-shot'
mediaDisplayNameSchema.parse('User Photo 1')   // 'User Photo 1'
mediaDisplayNameSchema.parse('logo.v2')        // 'logo.v2'

// Invalid (fallback to 'Untitled')
mediaDisplayNameSchema.parse('logo}test')      // 'Untitled'
mediaDisplayNameSchema.parse('')               // 'Untitled'
```

### Create Outcome

```typescript
import { createOutcomeSchema, type CreateOutcome } from '@clementine/shared'

// Full configuration
const outcome: CreateOutcome = createOutcomeSchema.parse({
  type: 'image',
  captureStepId: 'step-123',
  aiEnabled: true,
  imageGeneration: {
    prompt: 'Transform @{step:photo} into a cartoon',
    refMedia: [],
    model: 'gemini-2.5-flash-image',
    aspectRatio: '1:1',
  },
  options: { kind: 'image' },
})

// Minimal (uses defaults)
const minimal = createOutcomeSchema.parse({})
// {
//   type: null,
//   captureStepId: null,
//   aiEnabled: true,
//   imageGeneration: { prompt: '', refMedia: [], model: '...', aspectRatio: '1:1' },
//   options: null,
// }
```

### Session Response

```typescript
import { sessionResponseSchema, type SessionResponse } from '@clementine/shared'

// Text input response
const textResponse: SessionResponse = sessionResponseSchema.parse({
  stepId: 'step-1',
  stepName: 'user_name',
  stepType: 'input.shortText',
  value: 'John Doe',
  context: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

// Capture response
const captureResponse: SessionResponse = sessionResponseSchema.parse({
  stepId: 'step-2',
  stepName: 'photo',
  stepType: 'capture.photo',
  value: null,
  context: [{ mediaAssetId: 'asset-123', url: 'https://...', filePath: null, displayName: 'Photo' }],
  createdAt: Date.now(),
  updatedAt: Date.now(),
})
```

## Troubleshooting

### Import Errors

If imports from `@clementine/shared` fail:

1. Rebuild shared package: `pnpm --filter @clementine/shared build`
2. Check barrel exports in index files
3. Restart TypeScript server in IDE

### Type Inference Issues

If TypeScript can't infer types:

1. Ensure using `z.infer<typeof schema>` for type extraction
2. Check that discriminated unions use literal types (`z.literal()`)
3. Verify default values match expected types
