# Data Model: Error Capture & Safety Filter Reporting

**Feature**: 090-error-capture-safety-filters
**Date**: 2026-03-06

## Entity Changes

### 1. Job Error (Modified)

**Location**: `packages/shared/src/schemas/job/job.schema.ts` → `jobErrorSchema`

**Current fields**:
- `code: string` — Error classification code
- `message: string` — User-safe message
- `step: string | null` — Pipeline step where error occurred
- `isRetryable: boolean` — Whether retryable (always false currently)
- `timestamp: number` — Unix milliseconds

**New field**:
- `details: Record<string, unknown> | null` — Optional structured metadata for operational analysis

**Validation**: `z.record(z.unknown()).nullable().default(null)`

**Usage examples**:
```
// Safety-filtered video
{
  code: "SAFETY_FILTERED",
  message: "Content was blocked by safety filters.",
  step: "outcome",
  isRetryable: false,
  timestamp: 1709740800000,
  details: {
    raiMediaFilteredCount: 1,
    raiMediaFilteredReasons: ["violence"]
  }
}

// Safety-filtered image
{
  code: "SAFETY_FILTERED",
  message: "Content was blocked by safety filters.",
  step: "outcome",
  isRetryable: false,
  timestamp: 1709740800000,
  details: {
    blockReason: "IMAGE_SAFETY",
    finishReason: "SAFETY",
    safetyRatings: [{ category: "HARM_CATEGORY_VIOLENCE", blocked: true }]
  }
}

// AI provider error (no details needed)
{
  code: "AI_MODEL_ERROR",
  message: "The AI service is temporarily unavailable.",
  step: "outcome",
  isRetryable: false,
  timestamp: 1709740800000,
  details: null
}
```

---

### 2. Session (Modified)

**Location**: `packages/shared/src/schemas/session/session.schema.ts` → `sessionSchema`

**Existing relevant fields**:
- `jobId: string | null` — Transform job ID
- `jobStatus: JobStatus | null` — Synced from job document

**New field**:
- `jobErrorCode: string | null` — Error classification code, written only when `jobStatus` is `'failed'`

**Validation**: `z.string().nullable().default(null)`

**Behavior**:
- Set alongside `jobStatus: 'failed'` when a job fails
- Omitted (remains null) for successful jobs or legacy failed jobs without error codes
- Read by the share page to determine which error message to display

---

### 3. Sanitized Error Codes (Modified)

**Location**: `functions/src/repositories/job.ts` → `SANITIZED_ERROR_MESSAGES`

**New entry**:
```
SAFETY_FILTERED: "Content was blocked by safety filters."
```

**Complete set after change**:
| Code | Message |
|------|---------|
| `INVALID_INPUT` | The request could not be processed due to invalid input. |
| `PROCESSING_FAILED` | An error occurred while processing your request. |
| `AI_MODEL_ERROR` | The AI service is temporarily unavailable. |
| `STORAGE_ERROR` | Unable to save the result. Please try again. |
| `TIMEOUT` | Processing took too long and was cancelled. |
| `CANCELLED` | The request was cancelled. |
| `UNKNOWN` | An unexpected error occurred. |
| **`SAFETY_FILTERED`** | **Content was blocked by safety filters.** |

---

### 4. AiTransformErrorCode (Modified)

**Location**: `functions/src/services/ai/providers/types.ts`

**New code added**: `'SAFETY_FILTERED'`

**Complete type after change**:
```
'API_ERROR' | 'INVALID_CONFIG' | 'REFERENCE_IMAGE_NOT_FOUND' | 'INVALID_INPUT_IMAGE' | 'TIMEOUT' | 'SAFETY_FILTERED'
```

**New property on AiTransformError class**: `metadata?: Record<string, unknown>`

## State Transitions

### Job Error Flow

```
Generation function throws AiTransformError (with code + metadata)
  ↓
handleJobFailure receives error
  ↓
Maps AiTransformError.code → sanitized error code
  ↓
createSanitizedError(code, step, details?) → JobError
  ↓
updateJobError writes JobError to job document
  ↓
updateSessionJobStatus writes jobErrorCode to session document
  ↓
SharePage reads jobErrorCode from session → displays differentiated message
```

### Error Code Mapping

```
AiTransformError.SAFETY_FILTERED  → SAFETY_FILTERED
AiTransformError.API_ERROR        → AI_MODEL_ERROR
AiTransformError.TIMEOUT          → TIMEOUT
AiTransformError.INVALID_CONFIG   → INVALID_INPUT
AiTransformError.INVALID_INPUT_IMAGE → INVALID_INPUT
AiTransformError.REFERENCE_IMAGE_NOT_FOUND → INVALID_INPUT
OutcomeError.INVALID_INPUT        → INVALID_INPUT
(unknown error)                   → PROCESSING_FAILED
```

## Backward Compatibility

- **Existing job documents**: Unaffected. The `details` field defaults to `null` via Zod schema.
- **Existing session documents**: Unaffected. The `jobErrorCode` field defaults to `null` via Zod schema.
- **Existing failed sessions without error code**: SharePage falls back to generic "Something went wrong" message (same as current behavior).
- **No migration needed**: Both new fields are optional with null defaults.
