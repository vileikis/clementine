# PRD 4: Cleanup & Guardrails

**Epic**: [Outcome-based Create](./epic.md)
**Status**: Draft
**Dependencies**: PRD 3 (Job + Cloud Functions)
**Enables**: None (final PRD)

---

## Overview

Remove deprecated code paths, add safety checks, and ensure no silent fallbacks to old behavior.

---

## 1. Remove Transform Nodes UI

Remove all UI related to transform nodes.

### Components to Remove

- Generate tab in experience editor
- Node editor components
- Node type selector
- Node configuration forms
- Node preview components

### Routes to Remove/Redirect

- `/experience/:id/generate` → redirect to `/experience/:id/create`
- Any deep links to node editing

### Acceptance Criteria

- [ ] AC-1.1: Generate tab no longer visible
- [ ] AC-1.2: No node editor components in bundle
- [ ] AC-1.3: Old Generate URLs redirect to Create tab
- [ ] AC-1.4: No 404s for users with bookmarked Generate URLs

---

## 2. Remove answers/capturedMedia Code Paths

Remove deprecated session data handling.

### Frontend Changes

**Runtime Store**:
- Remove `setAnswer()` action (or mark as no-op with deprecation warning)
- Remove `setCapturedMedia()` action
- Remove `answers` and `capturedMedia` from state (keep in schema for parsing old data)

**Runtime Hook**:
- Remove `setAnswer()` and `setMedia()` from public API
- Only expose `setResponse()`

**Firestore Sync**:
- Remove code that writes `answers` and `capturedMedia`
- Only write `responses`

### Cloud Functions

- Remove code that reads `answers` and `capturedMedia` from session
- Only read `responses` from job snapshot
- Capture media is in `response.context` as `MediaReference[]`, not a separate `media` field

### Schema Cleanup (after migration complete)

When all runtime code uses `responses[]` and old sessions are abandoned:
- Remove `answers` field from `sessionSchema`
- Remove `capturedMedia` field from `sessionSchema`
- Remove `answerSchema` and `capturedMediaSchema` if not used elsewhere
- Update any analytics/reporting queries to use `responses[]`

### Acceptance Criteria

- [ ] AC-2.1: No code writes to `session.answers`
- [ ] AC-2.2: No code writes to `session.capturedMedia`
- [ ] AC-2.3: CF only reads `snapshot.sessionInputs.responses`
- [ ] AC-2.4: CF extracts capture media from `response.context` (not a `media` field)
- [ ] AC-2.5: Old sessions with only answers/capturedMedia are not processed (expected: abandoned)

---

## 3. Remove Transform Node Execution

Remove node-based execution from Cloud Functions.

### Changes

- Remove node executor registry
- Remove individual node executors (unless reused by outcomes)
- Remove `runTransformPipeline()` or equivalent
- Remove node snapshot reading logic

### Keep (if reused)

- AI generation logic (reused by imageOutcome)
- Overlay logic (reused by outcomes)
- Media processing utilities

### Acceptance Criteria

- [ ] AC-3.1: No code reads `snapshot.transformNodes` for execution
- [ ] AC-3.2: Transform node executors removed or consolidated
- [ ] AC-3.3: `runOutcome()` is the only execution entry point

---

## 4. Job Creation Guardrails

Fail fast with clear errors at job creation.

### Validation Rules

```ts
function validateJobCreation(params: CreateJobParams): void {
  const { experience, session } = params

  // Rule 1: Must have published config
  if (!experience.published) {
    throw new NonRetryableError(
      'Cannot create job: experience is not published'
    )
  }

  // Rule 2: Must have create outcome
  if (!experience.published.create?.type) {
    throw new NonRetryableError(
      'Cannot create job: experience has no create outcome configured'
    )
  }

  // Rule 3: Must have responses
  if (!session.responses || session.responses.length === 0) {
    throw new NonRetryableError(
      'Cannot create job: session has no responses'
    )
  }

  // Rule 4: Outcome type must be implemented
  const outcomeType = experience.published.create.type
  if (outcomeType !== 'image') {
    throw new NonRetryableError(
      `Cannot create job: outcome type '${outcomeType}' is not implemented`
    )
  }
}
```

### Acceptance Criteria

- [ ] AC-4.1: Job creation fails if experience.published is null
- [ ] AC-4.2: Job creation fails if create.type is null
- [ ] AC-4.3: Job creation fails if session has no responses
- [ ] AC-4.4: Job creation fails for unimplemented outcome types
- [ ] AC-4.5: All errors are non-retryable with clear messages

---

## 5. Runtime Guardrails

Fail fast during job execution.

### Validation in Outcome Executor

```ts
// In imageOutcome.ts
if (!createOutcome.image) {
  throw new NonRetryableError(
    'Image outcome missing configuration'
  )
}

if (!createOutcome.image.prompt.trim()) {
  throw new NonRetryableError(
    'Image outcome has empty prompt'
  )
}

if (createOutcome.image.captureStepId) {
  const captureResponse = responses.find(
    r => r.stepId === createOutcome.image!.captureStepId
  )
  if (!captureResponse) {
    throw new NonRetryableError(
      `Capture step not found: ${createOutcome.image.captureStepId}`
    )
  }
  // Capture media is stored in context as MediaReference[]
  const mediaRefs = captureResponse.context as MediaReference[] | null
  if (!mediaRefs || mediaRefs.length === 0) {
    throw new NonRetryableError(
      `Capture step has no media: ${captureResponse.stepName}`
    )
  }
}
```

### Acceptance Criteria

- [ ] AC-5.1: Missing image config fails with clear error
- [ ] AC-5.2: Empty prompt fails with clear error
- [ ] AC-5.3: Invalid captureStepId fails with clear error
- [ ] AC-5.4: Missing capture media (empty context) fails with clear error

---

## 6. No Silent Fallbacks

Ensure system never silently falls back to old behavior.

### Anti-patterns to Prevent

```ts
// BAD: Silent fallback
const data = snapshot.sessionInputs.responses ?? snapshot.sessionInputs.answers

// BAD: Silent fallback
const config = experience.published.create ?? inferFromTransformNodes(...)

// BAD: Ignoring errors
try {
  await runOutcome(ctx)
} catch {
  await runTransformPipeline(ctx)  // NO!
}
```

### Good Pattern

```ts
// GOOD: Explicit requirement
const responses = snapshot.sessionInputs.responses
if (!responses) {
  throw new NonRetryableError('Session responses required')
}
```

### Acceptance Criteria

- [ ] AC-6.1: No `??` fallbacks to deprecated fields
- [ ] AC-6.2: No try/catch that falls back to old behavior
- [ ] AC-6.3: Deprecated fields are never read for execution logic

---

## 7. Deprecation Warnings (Development)

Add console warnings for deprecated usage during development.

### Example

```ts
// In development only
if (process.env.NODE_ENV === 'development') {
  if (experience.draft.transformNodes.length > 0) {
    console.warn(
      '[DEPRECATED] Experience has transformNodes configured. ' +
      'These are ignored. Use create outcome instead.'
    )
  }
}
```

### Acceptance Criteria

- [ ] AC-7.1: Dev warnings for deprecated transformNodes usage
- [ ] AC-7.2: Dev warnings for deprecated answers/capturedMedia usage
- [ ] AC-7.3: Warnings only in development (not production)

---

## 8. Documentation Cleanup

Update documentation to reflect new architecture.

### Files to Update

- `functions/README.md` - Update transform pipeline docs
- `CLAUDE.md` - Update if mentions transform nodes
- Schema JSDoc comments - Mark deprecated fields

### Acceptance Criteria

- [ ] AC-8.1: README reflects outcome-based architecture
- [ ] AC-8.2: Deprecated fields have JSDoc `@deprecated` tags
- [ ] AC-8.3: No documentation references old transform node workflow

---

## Files Changed

| File | Action |
|------|--------|
| Generate tab components | REMOVE |
| Node editor components | REMOVE |
| Runtime store (old actions) | MODIFY |
| Runtime hook (old API) | MODIFY |
| Job creation validation | MODIFY |
| CF transform node executors | REMOVE |
| Documentation | MODIFY |

---

## Testing

- [ ] Smoke test: full guest flow with new architecture
- [ ] Negative test: job creation fails without published experience
- [ ] Negative test: job creation fails without create outcome
- [ ] Negative test: job execution fails for unimplemented outcome
- [ ] Audit: grep codebase for `transformNodes`, `answers`, `capturedMedia` usage
- [ ] Audit: no silent fallbacks in error handling
