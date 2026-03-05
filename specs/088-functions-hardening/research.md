# Research: 088-functions-hardening

## R-001: personGeneration SDK Support

### Decision
Use string literals matching SDK documentation for each API.

### Findings

**AI Image (Gemini `GenerateContentConfig` → `imageConfig`):**
- `ImageConfig.personGeneration` is typed as `string`
- Documented values: `ALLOW_ALL`, `ALLOW_ADULT`, `ALLOW_NONE` (uppercase)
- Goes inside `imageConfig` block in the generation config

**AI Video (Veo `GenerateVideosConfig`):**
- `GenerateVideosConfig.personGeneration` is typed as `string`
- Documented values: `dont_allow`, `allow_adult` (lowercase)
- SDK docs only mention `dont_allow` and `allow_adult` — `allow_all` is undocumented for video but the type accepts any string
- Current code uses `'allow_adult' as const`

### Alternatives Considered
- Using the `PersonGeneration` enum from SDK — rejected because the enum is only on some config interfaces; `imageConfig` and `GenerateVideosConfig` use plain strings
- Setting `safetyFilterLevel` to `OFF` — out of scope; user specifically requested `personGeneration` change only

## R-002: attemptCount on Job Document

### Decision
Add `attemptCount` as a Firestore field written directly via Admin SDK. Use `z.looseObject` flexibility — no schema change needed.

### Rationale
The Job schema uses `z.looseObject`, so extra fields pass validation. Adding `attemptCount` to the formal schema is optional but adds type safety. We'll add it as an optional field with default `0`.

### Implementation
- `updateJobStarted()` in `job.ts` will increment `attemptCount` using `FieldValue.increment(1)`
- `prepareJobExecution()` reads the current `attemptCount` from the fetched job
- If `attemptCount >= 2` and job is already `running`, fail immediately

## R-003: @google/genai Error Structure

### Decision
Catch `ApiError` (exported from `@google/genai`) which has a `.status` property (HTTP status code).

### Findings
- SDK exports `ApiError` class with `status: number` and `message: string`
- 429 errors throw `ApiError` with `status: 429`
- The error message contains the JSON body with `RESOURCE_EXHAUSTED` status
- Stack trace shows: `throwErrorIfNotOK` → `Models.generateContent`

### Retry Detection
```typescript
function isRetryableApiError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 429 || error.status === 503
  }
  return false
}
```

## R-004: Existing Helpers

### Findings
- `sleep.ts` exists at `src/services/transform/helpers/sleep.ts` — reuse for backoff delays
- No retry/backoff utilities exist — need to create `retryWithBackoff.ts`
- Helpers barrel export at `src/services/transform/helpers/index.ts`

## R-005: Test Functions Dependencies

### Decision
Safe to delete — no references beyond `src/index.ts` exports.

### Files
- `src/http/testVertexAI.ts` (88 lines)
- `src/http/testImageGeneration.ts` (142 lines)
- `src/http/testImageGenerationWithReference.ts` (304 lines)
- `src/index.ts` lines 20-24 (exports + comment block)

### References checked
- No imports from other source files
- No test file references
- Only appears in compiled `dist/` output (regenerated on build)
