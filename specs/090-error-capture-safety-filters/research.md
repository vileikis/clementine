# Research: Error Capture & Safety Filter Reporting

**Feature**: 090-error-capture-safety-filters
**Date**: 2026-03-06

## Research Tasks & Findings

### R1: Veo API Safety Filter Data Availability

**Decision**: Read `raiMediaFilteredCount` and `raiMediaFilteredReasons` from the Veo operation response when `generatedVideos` is empty.

**Rationale**: The `@google/genai` SDK v1.38.0 `GenerateVideosResponse` type already exposes these fields:
- `raiMediaFilteredCount?: number` — count of filtered videos
- `raiMediaFilteredReasons?: string[]` — array of reason strings (e.g., "violence", "adult_content")

Currently, `extractVideoUri` in `aiGenerateVideo.ts` (line 399) throws a generic `'Video was filtered by safety policy'` message and ignores both fields entirely.

**Alternatives considered**: None — the data is already available and just needs to be read.

---

### R2: Gemini API Safety Filter Data Availability

**Decision**: Check `response.promptFeedback.blockReason` and `candidate.finishReason` for safety-related values when image generation returns no usable results.

**Rationale**: The `@google/genai` SDK exposes rich safety metadata on Gemini responses:
- `response.promptFeedback?.blockReason` — `BlockedReason` enum (SAFETY, IMAGE_SAFETY, BLOCKLIST, PROHIBITED_CONTENT, etc.)
- `response.promptFeedback?.blockReasonMessage` — human-readable explanation
- `candidate.finishReason` — `FinishReason` enum includes SAFETY, IMAGE_SAFETY, BLOCKLIST values
- `candidate.safetyRatings[]` — per-category ratings with `blocked`, `category`, `probability`

Currently, `extractImageFromResponse` in `aiGenerateImage.ts` (line 234) throws `'No candidates in Gemini API response'` with no filter metadata.

**Alternatives considered**: Only checking `promptFeedback` (insufficient — candidate-level filtering also occurs).

---

### R3: Error Classification Strategy

**Decision**: Extend `AiTransformErrorCode` with `'SAFETY_FILTERED'` and use `instanceof AiTransformError` checks in `handleJobFailure` to map errors to sanitized codes.

**Rationale**: The codebase already has `AiTransformError` (in `functions/src/services/ai/providers/types.ts`) with typed error codes: `API_ERROR`, `INVALID_CONFIG`, `REFERENCE_IMAGE_NOT_FOUND`, `INVALID_INPUT_IMAGE`, `TIMEOUT`. Adding `SAFETY_FILTERED` to this type and throwing `AiTransformError` from the generation functions enables clean `instanceof` classification in `handleJobFailure` — aligned with the project's error-handling standard (`instanceof` checks, no message string matching).

**Error code mapping**:
| `AiTransformErrorCode` | Sanitized Code |
|------------------------|----------------|
| `SAFETY_FILTERED` | `SAFETY_FILTERED` |
| `API_ERROR` | `AI_MODEL_ERROR` |
| `TIMEOUT` | `TIMEOUT` |
| `INVALID_CONFIG` | `INVALID_INPUT` |
| `INVALID_INPUT_IMAGE` | `INVALID_INPUT` |
| `REFERENCE_IMAGE_NOT_FOUND` | `INVALID_INPUT` |
| (other/unknown) | `PROCESSING_FAILED` |

**Alternatives considered**:
- String matching on error messages — fragile and violates error-handling standard
- New error class for each type — over-engineering; existing `AiTransformError` suffices

---

### R4: Error Details Storage Approach

**Decision**: Add an optional `details` field to `jobErrorSchema` as `z.record(z.unknown()).nullable().default(null)`. Add an optional `metadata` property to `AiTransformError` class.

**Rationale**: The `details` field stores structured metadata (e.g., filter reasons) without schema coupling to any specific provider. Using `z.record(z.unknown())` keeps it flexible for future error types. The `metadata` property on `AiTransformError` carries provider-specific data from throw site to `handleJobFailure` without modifying the constructor signature (set as a property after construction).

**Alternatives considered**:
- Typed details schema per error code — premature coupling; filter reason formats may vary across providers
- Encoding details in the error message string — not queryable, hard to parse

---

### R5: Error Propagation Through Outcome Chain

**Decision**: Verify that `AiTransformError` instances propagate from generation functions through outcome executors to `handleJobFailure` without being wrapped.

**Rationale**: The transform pipeline flow is: `transformPipelineTask` → `runOutcome()` → outcome executor (e.g., `aiVideoOutcome`) → generation function (e.g., `aiGenerateVideo`). If any intermediate layer catches and re-wraps the error, the `instanceof AiTransformError` check in `handleJobFailure` will fail. During implementation, verify the outcome executors let errors propagate. If wrapping occurs, use `error.cause` chain to find the original `AiTransformError`.

**Key finding**: `OutcomeError` class exists in `runOutcome.ts` with its own `code` property. This is thrown for invalid/unimplemented outcome types, not for AI generation failures. AI generation errors (thrown as `Error` or `AiTransformError`) should propagate directly.

---

### R6: Session Error Code Propagation

**Decision**: Add optional `jobErrorCode` field to session schema. Extend `updateSessionJobStatus` to accept an optional error code parameter.

**Rationale**: The share page already subscribes to the session document via `useSubscribeSession` hook (real-time `onSnapshot`). Adding `jobErrorCode` to the session means the frontend receives it automatically without any additional data fetching. The field is optional (omitted for non-failed jobs) to maintain backward compatibility with existing sessions.

**Alternatives considered**:
- Having the frontend fetch the job document for error details — adds complexity, latency, and requires additional Firestore reads
- Using the session `status` field (has 'error' value) — this tracks session lifecycle, not job error type

---

### R7: Guest-Facing Error Message Strategy

**Decision**: Map error codes to static messages in the SharePage component. Three message variants: safety-filtered, timeout, and generic fallback.

**Rationale**: The spec defines exactly three guest-facing messages. A simple map/switch in the SharePage component is sufficient. No need for a centralized message system — this is a leaf-node UI concern.

**Guest message mapping**:
| Error Code | Title | Message |
|------------|-------|---------|
| `SAFETY_FILTERED` | "Photo couldn't be processed" | "Your photo couldn't be processed because it didn't meet our content guidelines. Please try a different photo." |
| `TIMEOUT` | "Processing timed out" | "Processing took longer than expected. Please try again." |
| (default) | "Something went wrong" | "Something went wrong. Please try again." |

**Alternatives considered**:
- Centralized error message service — over-engineering for 3 messages
- Server-rendered error messages in session — violates separation of concerns and makes i18n harder later
