# Quickstart: Transform Cleanup & Guardrails

**Feature Branch**: `063-transform-cleanup`
**Date**: 2026-02-06

## Overview

This document provides a quick reference for developers working on the Transform Cleanup feature. It summarizes the key changes, affected files, and testing approach.

---

## Quick Summary

**What we're doing:**
1. **Removing deprecated schema fields** (`transformNodes`, `answers`, `capturedMedia`) - `z.looseObject()` handles old docs
2. Removing dead code referencing deprecated fields
3. Adding validation guardrails to job creation and execution
4. Removing silent fallbacks to deprecated fields
5. Fixing documentation

**What we're NOT doing:**
- Running data migrations (not needed - `looseObject` ignores unknown fields)
- Changing the outcome-based architecture (already implemented)
- Removing UI (Generate tab already gone)

---

## Files to Modify

### Shared Package (packages/shared/) - **START HERE**

| File | Change | Priority |
|------|--------|----------|
| `src/schemas/session/session.schema.ts` | Remove `answers`, `capturedMedia` fields and related schemas/types | P1 |
| `src/schemas/experience/experience.schema.ts` | Remove `transformNodes` field and import | P1 |
| `src/schemas/experience/transform.schema.ts` | Evaluate for removal (may be unused) | P2 |
| `src/schemas/experience/nodes/` | Evaluate for removal (may be unused) | P2 |

### Frontend (apps/clementine-app/)

| File | Change | Priority |
|------|--------|----------|
| `src/domains/experience/runtime/stores/experienceRuntimeStore.ts` | Remove `answers` fallback in `initFromSession()` | P1 |
| `src/domains/experience/designer/hooks/usePublishExperience.ts` | Remove `transformNodes` handling | P2 |
| `src/domains/experience/shared/hooks/useCreateExperience.ts` | Remove `transformNodes: []` initialization | P2 |
| `src/domains/experience/shared/utils/hasTransformConfig.ts` | Remove file (deprecated functions) | P2 |
| `src/domains/session/shared/hooks/useUpdateSessionProgress.ts` | Clean up deprecated params | P2 |
| `src/app/workspace/$workspaceSlug.experiences/$experienceId.tsx` | Fix comment | P3 |

### Cloud Functions (functions/)

| File | Change | Priority |
|------|--------|----------|
| `src/callable/startTransformPipeline.ts` | Add validation guardrails | P1 |
| `src/services/transform/outcomes/imageOutcome.ts` | Add empty prompt check, convert warnings to errors | P1 |

### Documentation

| File | Change | Priority |
|------|--------|----------|
| `functions/README.md` | Review and update if needed | P3 |

---

## Validation Guardrails to Add

### Job Creation (startTransformPipeline.ts)

```typescript
// Add these checks before buildJobSnapshot():

// 1. Published config check
if (!experience.published) {
  throw new HttpsError('invalid-argument',
    'Cannot create job: experience is not published')
}

// 2. Outcome configured check
if (!experience.published.outcome?.type) {
  throw new HttpsError('invalid-argument',
    'Cannot create job: experience has no outcome configured')
}

// 3. Session responses check
if (!session.responses || session.responses.length === 0) {
  throw new HttpsError('invalid-argument',
    'Cannot create job: session has no responses')
}

// 4. Outcome type implemented check
if (experience.published.outcome.type !== 'image') {
  throw new HttpsError('invalid-argument',
    `Cannot create job: outcome type '${experience.published.outcome.type}' is not implemented`)
}
```

### Image Outcome (imageOutcome.ts)

```typescript
// Add/enhance these checks:

// 1. Empty prompt check (when AI enabled)
if (outcome.aiEnabled && !outcome.imageGeneration?.prompt.trim()) {
  throw new Error('Image outcome has empty prompt')
}

// 2. Convert capture step not found from warning to error
if (!captureResponse) {
  throw new Error(`Capture step not found: ${outcome.captureStepId}`)
}

// 3. Convert empty media from return null to error
if (!mediaRefs || mediaRefs.length === 0) {
  throw new Error(`Capture step has no media: ${captureResponse.stepName}`)
}
```

---

## Fallback Removal

### experienceRuntimeStore.ts

```diff
// In initFromSession():
- const responses = session.responses?.length > 0
-   ? session.responses
-   : session.answers?.map(convertAnswerToResponse) ?? []
+ const responses = session.responses ?? []
```

### usePublishExperience.ts

```diff
// Remove these lines:
- transformNodes: emptyTransformNodes, // Deprecated - always empty on publish
```

### useCreateExperience.ts

```diff
// Remove this initialization:
- transformNodes: [],
```

---

## Testing Checklist

### Manual Testing

- [ ] Create experience, publish, complete session → job succeeds
- [ ] Attempt job on unpublished experience → clear error
- [ ] Attempt job on experience without outcome → clear error
- [ ] Attempt job on session without responses → clear error
- [ ] Attempt job with empty prompt (AI enabled) → clear error
- [ ] Full guest flow works end-to-end

### Code Audit

Run these commands to verify cleanup:

```bash
# Check for deprecated field writes
grep -r "\.answers\s*=" apps/clementine-app/src/
grep -r "\.capturedMedia\s*=" apps/clementine-app/src/

# Check for fallback patterns
grep -rn "??\s*answers" apps/clementine-app/src/ functions/src/
grep -rn "??\s*capturedMedia" apps/clementine-app/src/ functions/src/
grep -rn "??\s*transformNodes" apps/clementine-app/src/ functions/src/

# Check for deprecated field reads in execution
grep -rn "snapshot.*answers" functions/src/
grep -rn "snapshot.*capturedMedia" functions/src/
grep -rn "snapshot.*transformNodes" functions/src/
```

---

## Build & Lint

Before committing:

```bash
# Frontend
cd apps/clementine-app
pnpm check          # Format + lint fix
pnpm type-check     # TypeScript

# Functions
cd functions
pnpm build          # TypeScript compile
pnpm lint           # ESLint
```

---

## Key Design Decisions

1. **Remove deprecated schema fields**: Both schemas use `z.looseObject()` which ignores unknown fields - no migration needed
2. **All errors are non-retryable**: Configuration issues can't be fixed by retrying
3. **Fail fast, fail loud**: Clear errors at creation time, not mid-processing
4. **No silent fallbacks**: Deprecated fields are never read for execution
5. **Old Firestore docs still work**: `looseObject` silently ignores deprecated fields in existing documents
