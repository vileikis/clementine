# Quickstart: 088-functions-hardening

## Files to Change

| File | Action | What |
|------|--------|------|
| `functions/src/http/testVertexAI.ts` | DELETE | Test endpoint |
| `functions/src/http/testImageGeneration.ts` | DELETE | Test endpoint |
| `functions/src/http/testImageGenerationWithReference.ts` | DELETE | Test endpoint |
| `functions/src/index.ts` | MODIFY | Remove 3 test exports |
| `functions/src/tasks/transformPipelineTask.ts` | MODIFY | Memory 2GiB, maxAttempts 2, attempt guard, memory logging |
| `functions/src/repositories/job.ts` | MODIFY | Increment attemptCount in updateJobStarted |
| `functions/src/services/transform/helpers/retryWithBackoff.ts` | NEW | Exponential backoff retry utility |
| `functions/src/services/transform/helpers/index.ts` | MODIFY | Re-export retryWithBackoff |
| `functions/src/services/transform/operations/aiGenerateImage.ts` | MODIFY | personGeneration + retry wrapper |
| `functions/src/services/transform/operations/aiGenerateVideo.ts` | MODIFY | personGeneration + retry wrapper |
| `packages/shared/src/schemas/job/job.schema.ts` | MODIFY | Add optional attemptCount field |

## Build & Verify

```bash
pnpm --filter @clementine/shared build
pnpm functions:build
```

## Key Decisions

- `personGeneration` for image uses uppercase `'ALLOW_ALL'` (per SDK ImageConfig docs)
- `personGeneration` for video uses lowercase `'allow_all'` (per SDK GenerateVideosConfig convention)
- `attemptCount` added to Job schema as optional (backward-compatible with existing docs)
- Retry utility catches `ApiError` from `@google/genai` and checks `.status` for 429/503
- `maxAttempts: 2` allows exactly 1 retry after OOM crash
