# Functions Hardening — Pilot Prep

Brief for pre-pilot changes to `functions/`.

## 1. Remove Test HTTP Functions

Delete the three test HTTP endpoints that are no longer needed:

- `testVertexAI` — `src/http/testVertexAI.ts`
- `testImageGeneration` — `src/http/testImageGeneration.ts`
- `testImageGenerationWithReference` — `src/http/testImageGenerationWithReference.ts`

Remove their exports from `src/index.ts`. Delete the files. This reduces the deployed function count and attack surface.

## 2. Double Memory for `transformPipelineTask`

Increase `transformPipelineTask` memory from **1 GiB → 2 GiB**.

This is the heavy worker that runs FFmpeg and AI generation (Gemini/Veo). The callable `startTransformPipelineV2` stays at defaults (lightweight job-queuing only).

## 3. Remove Safety Filters (personGeneration)

Set `personGeneration: 'allow_all'` on both AI generation operations:

| Operation | File | Current Value |
|-----------|------|---------------|
| AI Image (Gemini) | `src/services/transform/operations/aiGenerateImage.ts` | Not set (default) |
| AI Video (Veo) | `src/services/transform/operations/aiGenerateVideo.ts` | `'allow_adult'` |

Change both to `'allow_all'` to remove content filtering restrictions during pilot.

For **aiGenerateImage**, add `personGeneration: 'allow_all'` inside `imageConfig` in the generation config.

For **aiGenerateVideo**, change `personGeneration` from `'allow_adult'` to `'allow_all'` in the Veo base config.

## 4. OOM Restart Loop Prevention

**Problem:** When `transformPipelineTask` exhausts memory, the instance crashes. Cloud Tasks may redeliver the task, which starts a new instance that hits the same OOM — creating a restart loop.

**Strategy:** Allow one retry (in case the OOM was transient), but fail the job on the second attempt.

### Changes

1. **Retry config:** Change `maxAttempts` from `0` to `2` (allows 1 retry after failure).

2. **Retry detection:** The existing code already checks for `job.status === 'running'` and logs a warning ("Recovering crashed job"). Enhance this to track that it's a retry attempt.

3. **Second-failure guard:** If the job is already in `'running'` state when we pick it up, increment a Firestore field (`attemptCount`). If `attemptCount >= 2`, fail the job immediately instead of re-executing.

4. **Memory usage logging:** Add `process.memoryUsage()` logging at key execution points (job start, after outcome execution, on completion/failure) so we can observe actual heap usage per task type and calibrate memory settings.

### Execution flow

```
Task delivered (attempt 1):
  → job.status = 'pending' → set attemptCount = 1 → execute normally

Task redelivered after OOM crash (attempt 2):
  → job.status = 'running' → set attemptCount = 2 → execute (one retry allowed)

Task redelivered again (attempt 3 — shouldn't happen with maxAttempts: 2):
  → job.status = 'running', attemptCount >= 2 → fail immediately
```

## 5. Vertex AI 429 Retry with Exponential Backoff

**Problem:** Vertex AI returns `429 RESOURCE_EXHAUSTED` when capacity is limited on PayGo. Currently we treat this as a fatal error and fail the job immediately.

**Strategy:** Retry the API call with exponential backoff before giving up. Applies to both AI image (Gemini `generateContent`) and AI video (Veo `generateVideos`).

### Retry parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max retries | 3 | Enough attempts without blocking the 10-min task timeout |
| Initial delay | 2s | Per Google's recommendation for 429s |
| Backoff multiplier | 2x | 2s → 4s → 8s |
| Jitter | ±25% | Avoid thundering herd across concurrent tasks |
| Retryable codes | 429, 503 | Resource exhausted + service unavailable |

### Implementation

Add a shared retry utility (`src/services/transform/helpers/retryWithBackoff.ts`) that:

1. Wraps an async function call
2. Catches errors, checks for retryable status codes (429, 503)
3. Waits with exponential backoff + jitter before retrying
4. Logs each retry attempt with delay and attempt number
5. Throws the original error after max retries exhausted

Apply the wrapper to:

- `aiGenerateImage.ts` — around the `client.models.generateContent()` call
- `aiGenerateVideo.ts` — around the `client.models.generateVideos()` call

Non-retryable errors (400, 403, etc.) propagate immediately without retry.

> **Note:** Provisioned Throughput will be explored separately to reduce 429 frequency at the infrastructure level.
