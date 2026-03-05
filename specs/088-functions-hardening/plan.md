# Implementation Plan: Functions Hardening — Pilot Prep

**Branch**: `088-functions-hardening` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/088-functions-hardening/spec.md`

## Summary

Harden Firebase Cloud Functions for pilot launch: remove 3 test endpoints, double task worker memory (1→2 GiB), set `personGeneration` to allow all on both AI operations, add OOM restart loop prevention with attempt tracking, and implement exponential backoff retry for Vertex AI 429/503 errors.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: Firebase Cloud Functions v2, `@google/genai` v1.38.0, Zod 4.1.12
**Storage**: Firestore (job documents), Firebase Storage (media)
**Testing**: Vitest
**Target Platform**: Firebase Cloud Functions (Cloud Run, europe-west1)
**Project Type**: Monorepo — changes scoped to `functions/` workspace
**Constraints**: 10-minute task timeout, 2 GiB memory limit (new), concurrency=1 per instance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First | N/A | Backend-only changes |
| II. Clean Code & Simplicity | PASS | Retry utility is single-purpose, ~40 lines |
| III. Type-Safe Development | PASS | Using SDK types, Zod for job schema |
| IV. Minimal Testing | PASS | Unit tests for retry utility only |
| V. Validation Gates | PASS | `pnpm functions:build` + type-check |
| VI. Frontend Architecture | N/A | No frontend changes |
| VII. Backend & Firebase | PASS | Admin SDK for job writes, follows existing patterns |
| VIII. Project Structure | PASS | New file follows existing helpers/ convention |

## Project Structure

### Documentation (this feature)

```text
specs/088-functions-hardening/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
└── quickstart.md        # Implementation quickstart
```

### Source Code (changes)

```text
functions/src/
├── index.ts                                        # MODIFY: remove 3 test exports
├── tasks/
│   └── transformPipelineTask.ts                    # MODIFY: memory 2GiB, maxAttempts 2, attempt tracking, memory logging
├── repositories/
│   └── job.ts                                      # MODIFY: add attemptCount increment to updateJobStarted
├── services/transform/
│   ├── helpers/
│   │   ├── retryWithBackoff.ts                     # NEW: exponential backoff retry utility
│   │   └── index.ts                                # MODIFY: re-export retryWithBackoff
│   └── operations/
│       ├── aiGenerateImage.ts                      # MODIFY: personGeneration + retry wrapper
│       └── aiGenerateVideo.ts                      # MODIFY: personGeneration + retry wrapper
└── http/
    ├── testVertexAI.ts                             # DELETE
    ├── testImageGeneration.ts                      # DELETE
    └── testImageGenerationWithReference.ts          # DELETE

packages/shared/src/schemas/job/
└── job.schema.ts                                   # MODIFY: add optional attemptCount field
```

## Implementation Details

### Phase 1: Remove Test Functions (R-001)

1. Delete `functions/src/http/testVertexAI.ts`
2. Delete `functions/src/http/testImageGeneration.ts`
3. Delete `functions/src/http/testImageGenerationWithReference.ts`
4. Remove exports and comment block from `functions/src/index.ts` (lines 19-24)

### Phase 2: Memory & Config Changes (R-002, R-003)

**transformPipelineTask.ts:**
- Change `memory: '1GiB'` → `memory: '2GiB'`

**aiGenerateImage.ts:**
- Add `personGeneration: 'ALLOW_ALL'` inside `imageConfig` block

**aiGenerateVideo.ts:**
- Change `personGeneration: 'allow_adult' as const` → `personGeneration: 'allow_all'` in `baseConfig`

### Phase 3: Retry Utility (R-005)

Create `functions/src/services/transform/helpers/retryWithBackoff.ts`:

```typescript
import { ApiError } from '@google/genai'
import { logger } from 'firebase-functions/v2'
import { sleep } from './sleep'

interface RetryConfig {
  maxRetries: number      // default: 3
  initialDelayMs: number  // default: 2000
  backoffMultiplier: number // default: 2
  jitterFraction: number  // default: 0.25
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 429 || error.status === 503
  }
  return false
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  label: string,
  config?: Partial<RetryConfig>,
): Promise<T> {
  // exponential backoff with jitter, log each retry, throw after exhausted
}
```

Apply to:
- `aiGenerateImage.ts` → wrap `client.models.generateContent()` call
- `aiGenerateVideo.ts` → wrap `client.models.generateVideos()` call

### Phase 4: OOM Prevention (R-004)

**job.schema.ts (shared package):**
- Add `attemptCount: z.number().int().nonnegative().default(0)` to `jobSchema`

**job.ts (repository):**
- In `updateJobStarted()`: add `attemptCount: FieldValue.increment(1)` to the update

**transformPipelineTask.ts:**
- Change `retryConfig.maxAttempts` from `0` to `2`
- In `prepareJobExecution()`: when `job.status === 'running'`, check `job.attemptCount`:
  - If `attemptCount >= 2` → fail the job immediately (mark failed, throw)
  - Otherwise → allow recovery (existing behavior)
- Add memory logging helper:

```typescript
function logMemoryUsage(phase: string, jobId: string): void {
  const mem = process.memoryUsage()
  logger.info('[TransformJob] Memory usage', {
    phase,
    jobId,
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    rssMB: Math.round(mem.rss / 1024 / 1024),
    externalMB: Math.round(mem.external / 1024 / 1024),
  })
}
```

Log at: job start, after outcome execution, on completion, on failure.

### Phase 5: Validation

- `pnpm --filter @clementine/shared build`
- `pnpm functions:build` (type-check + compile)
- Verify no type errors from schema changes
- Manual test: deploy to emulator and trigger a job

## Complexity Tracking

No constitution violations. All changes are minimal and focused.
