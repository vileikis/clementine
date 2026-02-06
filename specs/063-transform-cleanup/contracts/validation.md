# Validation Contracts: Transform Cleanup & Guardrails

**Feature Branch**: `063-transform-cleanup`
**Date**: 2026-02-06

## Overview

This document specifies the validation contracts for job creation and execution guardrails. These validations ensure fail-fast behavior with clear, non-retryable error messages.

---

## Job Creation Validation

### Endpoint

`startTransformPipelineV2` - Firebase Callable Function

### Request Schema (Unchanged)

```typescript
const startTransformPipelineRequestSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  sessionId: z.string().min(1, 'sessionId is required'),
})
```

### Validation Rules

| Rule ID | Condition | Error Code | Error Message |
|---------|-----------|------------|---------------|
| JC-001 | `experience.published` is null | `invalid-argument` | "Cannot create job: experience is not published" |
| JC-002 | `experience.published.outcome` is null | `invalid-argument` | "Cannot create job: experience has no outcome configured" |
| JC-003 | `experience.published.outcome.type` is null | `invalid-argument` | "Cannot create job: experience has no outcome configured" |
| JC-004 | `session.responses` is empty or undefined | `invalid-argument` | "Cannot create job: session has no responses" |
| JC-005 | `outcome.type` is not `'image'` | `invalid-argument` | "Cannot create job: outcome type '{type}' is not implemented" |

### Error Response Format

```typescript
// HttpsError response
{
  code: 'invalid-argument',
  message: string,  // One of the messages above
  details: undefined
}
```

### Validation Order

Validations MUST be performed in this order (fail fast on first error):

1. Authentication check (existing)
2. Request schema validation (existing)
3. Session existence check (existing)
4. Active job check (existing)
5. Experience existence check (existing)
6. **JC-001**: Published config check (NEW)
7. **JC-002/JC-003**: Outcome configured check (ENHANCED)
8. **JC-004**: Session responses check (NEW)
9. **JC-005**: Outcome type implemented check (NEW - moved from runOutcome)
10. Passthrough source check (existing)

---

## Runtime Validation (Image Outcome)

### Function

`imageOutcome(ctx: OutcomeContext): Promise<JobOutput>`

### Validation Rules

| Rule ID | Condition | Error Type | Error Message |
|---------|-----------|------------|---------------|
| RT-001 | `outcome.imageGeneration` is null (AI mode) | `Error` | "Image outcome missing configuration" |
| RT-002 | `outcome.aiEnabled && !outcome.imageGeneration.prompt.trim()` | `Error` | "Image outcome has empty prompt" |
| RT-003 | `outcome.captureStepId` specified but response not found | `Error` | "Capture step not found: {captureStepId}" |
| RT-004 | Capture response found but `data` is empty/null | `Error` | "Capture step has no media: {stepName}" |

### Validation Order

1. **RT-001**: Image generation config presence (for AI mode)
2. **RT-002**: Prompt not empty (for AI mode)
3. **RT-003**: Capture step exists (if captureStepId specified)
4. **RT-004**: Capture step has media (if captureStepId specified)

### Error Handling

All runtime errors are:
- Non-retryable (job marked as failed permanently)
- Sanitized before storing in Firestore
- Logged with full details server-side

```typescript
// Error sanitization pattern
const sanitizedError = createSanitizedError('INVALID_INPUT', 'outcome')

// Firestore-safe error object
{
  code: 'INVALID_INPUT',
  message: 'The request could not be processed due to invalid input.',
  step: 'outcome',
  isRetryable: false,
  timestamp: number
}
```

---

## Prohibited Patterns

### No Silent Fallbacks

The following patterns are **PROHIBITED**:

```typescript
// ❌ PROHIBITED: Nullish coalescing to deprecated fields
const data = snapshot.sessionInputs.responses ?? snapshot.sessionInputs.answers

// ❌ PROHIBITED: Fallback to legacy config
const config = experience.published.outcome ?? inferFromTransformNodes(...)

// ❌ PROHIBITED: Silent error recovery
try {
  await runOutcome(ctx)
} catch {
  await runTransformPipeline(ctx)  // NO!
}
```

### Required Pattern

```typescript
// ✅ REQUIRED: Explicit requirement with clear error
const responses = snapshot.sessionInputs.responses
if (!responses || responses.length === 0) {
  throw new HttpsError('invalid-argument', 'Cannot create job: session has no responses')
}
```

---

## Test Cases

### Job Creation Validation Tests

```typescript
describe('startTransformPipelineV2 validation', () => {
  test('JC-001: rejects unpublished experience', async () => {
    // Given experience.published is null
    // When job creation is attempted
    // Then error code is 'invalid-argument'
    // And error message is 'Cannot create job: experience is not published'
  })

  test('JC-002: rejects experience without outcome', async () => {
    // Given experience.published.outcome is null
    // When job creation is attempted
    // Then error code is 'invalid-argument'
    // And error message is 'Cannot create job: experience has no outcome configured'
  })

  test('JC-004: rejects session without responses', async () => {
    // Given session.responses is empty
    // When job creation is attempted
    // Then error code is 'invalid-argument'
    // And error message is 'Cannot create job: session has no responses'
  })

  test('JC-005: rejects unimplemented outcome type', async () => {
    // Given experience.published.outcome.type is 'video'
    // When job creation is attempted
    // Then error code is 'invalid-argument'
    // And error message contains 'outcome type'
    // And error message contains 'video'
    // And error message contains 'is not implemented'
  })
})
```

### Runtime Validation Tests

```typescript
describe('imageOutcome validation', () => {
  test('RT-001: fails when imageGeneration config missing', async () => {
    // Given outcome.imageGeneration is null
    // When imageOutcome is executed
    // Then error message is 'Image outcome missing configuration'
    // And job status is 'failed'
    // And job.error.isRetryable is false
  })

  test('RT-002: fails when prompt is empty (AI enabled)', async () => {
    // Given outcome.aiEnabled is true
    // And outcome.imageGeneration.prompt is ''
    // When imageOutcome is executed
    // Then error message is 'Image outcome has empty prompt'
  })

  test('RT-003: fails when capture step not found', async () => {
    // Given outcome.captureStepId is 'step-123'
    // And no response has stepId 'step-123'
    // When imageOutcome is executed
    // Then error message contains 'Capture step not found'
    // And error message contains 'step-123'
  })

  test('RT-004: fails when capture step has no media', async () => {
    // Given outcome.captureStepId is 'step-123'
    // And response with stepId 'step-123' has data: []
    // When imageOutcome is executed
    // Then error message contains 'Capture step has no media'
  })
})
```

---

## Implementation Notes

### Error Message Consistency

All error messages follow this pattern:
- Start with context ("Cannot create job:", "Image outcome")
- Describe the problem clearly
- Include relevant identifiers when available

### Non-Retryable by Design

All validation errors are non-retryable because:
- They indicate configuration issues, not transient failures
- Retrying would not resolve the underlying problem
- Users need to fix configuration and restart

### Logging Requirements

- All validation failures MUST be logged with:
  - Error message
  - Relevant context (projectId, sessionId, experienceId)
  - Stack trace (for unexpected errors)
- Sanitized error stored in Firestore (no sensitive data)
