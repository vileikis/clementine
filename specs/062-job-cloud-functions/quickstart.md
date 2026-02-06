# Quickstart: Job + Cloud Functions

**Branch**: `062-job-cloud-functions` | **Date**: 2026-02-05

## Overview

This feature updates the job processing system to use outcome-based execution instead of transform nodes. The key changes are:

1. **Job snapshot schema** - Now includes `sessionResponses` and `outcome`
2. **Outcome dispatcher** - Routes to type-specific executors
3. **Image outcome executor** - Handles passthrough and AI generation modes
4. **Prompt resolution** - Resolves `@{step:...}` and `@{ref:...}` mentions

---

## Prerequisites

- Firebase emulators running (for local development)
- Environment variables set in `functions/.env`
- Shared package built: `pnpm --filter @clementine/shared build`

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/shared/src/schemas/job/job.schema.ts` | Job snapshot schema |
| `functions/src/services/transform/engine/runOutcome.ts` | Outcome dispatcher |
| `functions/src/services/transform/outcomes/imageOutcome.ts` | Image executor |
| `functions/src/services/transform/bindings/resolvePromptMentions.ts` | Prompt resolution |

---

## Usage Examples

### 1. Job Snapshot Structure

```typescript
const snapshot: JobSnapshot = {
  // Unified session responses (replaces answers + capturedMedia)
  sessionResponses: [
    {
      stepId: 'step-1',
      stepName: 'userName',
      stepType: 'input.shortText',
      data: 'John',
      createdAt: 1707100000000,
      updatedAt: 1707100000000,
    },
    {
      stepId: 'step-2',
      stepName: 'selfie',
      stepType: 'capture.photo',
      data: [{ mediaAssetId: '...', url: '...', filePath: '...', displayName: 'selfie.jpg' }],
      createdAt: 1707100001000,
      updatedAt: 1707100001000,
    },
  ],

  // Outcome configuration (from experience.published.outcome)
  outcome: {
    type: 'image',
    captureStepId: 'step-2',  // For image-to-image
    aiEnabled: true,
    imageGeneration: {
      prompt: 'Transform @{step:userName} into a superhero using @{step:selfie}',
      refMedia: [],
      model: 'gemini-2.5-flash-image',
      aspectRatio: '1:1',
    },
    options: { kind: 'image' },
  },

  // Always empty (deprecated)
  transformNodes: [],

  // Project context with overlays
  projectContext: {
    overlays: {
      '1:1': { mediaAssetId: '...', url: '...', filePath: '...', displayName: 'overlay.png' },
    },
    experienceRef: { experienceId: 'exp-1', projectId: 'proj-1' },
  },

  experienceVersion: 5,
}
```

### 2. Prompt Resolution

```typescript
import { resolvePromptMentions } from '../bindings/resolvePromptMentions'

const { text, mediaRefs } = resolvePromptMentions(
  'Transform @{step:userName} into a superhero using @{step:selfie}',
  snapshot.sessionResponses,
  outcome.imageGeneration.refMedia
)

// Result:
// text: "Transform John into a superhero using [IMAGE: selfie]"
// mediaRefs: [{ mediaAssetId: '...', url: '...', ... }]
```

### 3. Outcome Dispatch

```typescript
import { runOutcome } from '../engine/runOutcome'

const output = await runOutcome({
  job,
  snapshot: job.snapshot,
  startTime: Date.now(),
  tmpDir: '/tmp/job-123',
})

// Returns: JobOutput { assetId, url, format, dimensions, sizeBytes, ... }
```

---

## Testing

### Unit Tests

```bash
# Run prompt resolution tests
pnpm --filter functions test resolvePromptMentions

# Run outcome dispatcher tests
pnpm --filter functions test runOutcome
```

### Integration Tests

```bash
# Run with emulators
firebase emulators:start --only firestore,storage

# In another terminal
pnpm --filter functions test:integration
```

---

## Validation Checklist

Before marking complete:

- [ ] `pnpm --filter @clementine/shared build` passes
- [ ] `pnpm --filter functions build` passes
- [ ] `pnpm --filter functions test` passes
- [ ] Type check: `pnpm --filter functions type-check`
- [ ] Lint: `pnpm --filter functions lint`

---

## Common Issues

### 1. "Experience has no outcome configured"

**Cause**: `outcome.type` is null in the experience
**Solution**: Ensure experience is published with outcome type set

### 2. "Passthrough mode requires source image"

**Cause**: `aiEnabled=false` but `captureStepId` is null
**Solution**: Set `captureStepId` to a valid capture step ID

### 3. Unresolved prompt mentions

**Cause**: `stepName` doesn't match any response
**Solution**: Check that prompt uses exact `stepName` values (case-sensitive)
