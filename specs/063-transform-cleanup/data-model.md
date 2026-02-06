# Data Model: Transform Cleanup & Guardrails

**Feature Branch**: `063-transform-cleanup`
**Date**: 2026-02-06

## Overview

This cleanup work **removes deprecated schema fields** from Session and Experience schemas. Because both schemas use `z.looseObject()`, old Firestore documents with these fields will still parse successfully - the fields are simply ignored.

**No data migration required.**

## Entity Summary

| Entity | Schema Location | Changes |
|--------|-----------------|---------|
| Session | `packages/shared/src/schemas/session/session.schema.ts` | **Remove** `answers`, `capturedMedia` fields and related schemas |
| Experience | `packages/shared/src/schemas/experience/experience.schema.ts` | **Remove** `transformNodes` field |
| Job | `packages/shared/src/schemas/job/job.schema.ts` | No changes |
| JobSnapshot | `packages/shared/src/schemas/job/job.schema.ts` | No changes |

---

## Session Entity

### Schema Changes

**Fields to REMOVE:**
- `answers: z.array(answerSchema).default([])` - Deprecated, never written by current code
- `capturedMedia: z.array(capturedMediaSchema).default([])` - Deprecated, never written by current code

**Schemas to REMOVE:**
- `answerSchema` - No longer referenced
- `answerValueSchema` - No longer referenced
- `capturedMediaSchema` - No longer referenced

**Type exports to REMOVE:**
- `Answer`
- `AnswerValue`
- `CapturedMedia`

### Schema After Cleanup

```typescript
// packages/shared/src/schemas/session/session.schema.ts

sessionSchema = z.looseObject({
  // ... identification fields ...

  // Unified responses from all steps
  responses: z.array(sessionResponseSchema).default([]),

  // ... other fields (resultMedia, jobId, jobStatus, etc.) ...
})
```

### Why This Works

The schema uses `z.looseObject()` which:
- Parses known fields into TypeScript types
- **Ignores unknown fields** (like `answers`, `capturedMedia` in old docs)
- No runtime errors when parsing old Firestore documents

### Behavioral Changes

| Operation | Before Cleanup | After Cleanup |
|-----------|----------------|---------------|
| Zod parsing of old docs | Deprecated fields parsed into types | Deprecated fields silently ignored |
| Frontend read on init | Falls back to `answers` if `responses` empty | Only reads `responses` |
| Frontend write | Writes to `responses` only | Same (no change) |
| CF job creation | Reads `responses` only | Reads `responses`; validates non-empty |

### SessionResponse Structure (No Changes)

```typescript
sessionResponseSchema = z.object({
  stepId: z.string(),
  stepName: z.string(),
  stepType: z.string(),
  data: z.union([
    z.string(),
    z.array(multiSelectOptionSchema),
    z.array(mediaReferenceSchema),
    z.null()
  ]),
  createdAt: z.number(),
  updatedAt: z.number()
})
```

### Data Types by Step Type

| Step Type | `data` Type | Example |
|-----------|-------------|---------|
| `input.scale` | `string` | `"4"` |
| `input.yesNo` | `string` | `"yes"` |
| `input.shortText` | `string` | `"Hello world"` |
| `input.longText` | `string` | `"Longer text..."` |
| `input.multiSelect` | `MultiSelectOption[]` | `[{id, label, promptFragment}]` |
| `capture.photo` | `MediaReference[]` | `[{mediaAssetId, url, filePath}]` |
| `capture.video` | `MediaReference[]` | `[{mediaAssetId, url, filePath}]` |

---

## Experience Entity

### Schema Changes

**Fields to REMOVE from `experienceConfigSchema`:**
- `transformNodes: z.array(transformNodeSchema).default([])` - Deprecated, always empty

**Imports to REMOVE:**
- `import { transformNodeSchema } from './transform.schema'`

**Files to EVALUATE for removal:**
- `packages/shared/src/schemas/experience/transform.schema.ts`
- `packages/shared/src/schemas/experience/nodes/` directory

### Schema After Cleanup

```typescript
// packages/shared/src/schemas/experience/experience.schema.ts

experienceConfigSchema = z.looseObject({
  /** Array of steps in the experience */
  steps: z.array(experienceStepSchema).default([]),

  /** Outcome configuration (replaces transformNodes) */
  outcome: outcomeSchema.nullable().default(null),
})
```

### Why This Works

The schema uses `z.looseObject()` which:
- Parses known fields into TypeScript types
- **Ignores unknown fields** (like `transformNodes` in old docs)
- No runtime errors when parsing old Firestore documents

### Behavioral Changes

| Operation | Before Cleanup | After Cleanup |
|-----------|----------------|---------------|
| Zod parsing of old docs | `transformNodes` parsed into types | `transformNodes` silently ignored |
| Frontend create | Initializes `transformNodes: []` | Removes initialization |
| Frontend publish | Sets `transformNodes: emptyTransformNodes` | Removes this code |
| CF job creation | Reads `outcome` only | Reads `outcome`; validates non-null |

### Outcome Structure (No Changes)

```typescript
outcomeSchema = z.object({
  type: z.enum(['image', 'gif', 'video']),
  captureStepId: z.string().nullable().default(null),
  aiEnabled: z.boolean().default(true),
  imageGeneration: imageGenerationConfigSchema.nullable().default(null),
})

imageGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: z.string().default('gemini-2.0-flash-exp'),
  aspectRatio: z.string().default('1:1'),
  refMedia: z.array(mediaReferenceSchema).default([]),
})
```

---

## JobSnapshot Entity

### Structure (No Changes)

```typescript
// packages/shared/src/schemas/job/job.schema.ts

jobSnapshotSchema = z.object({
  sessionResponses: z.array(sessionResponseSchema).default([]),
  outcome: outcomeSchema.nullable().default(null),
  projectContext: projectContextSnapshotSchema,
  experienceVersion: z.number().int().positive(),
})
```

### Validation Requirements (New)

| Field | Validation | Error Message |
|-------|------------|---------------|
| `outcome` | Must not be null | "Experience has no outcome configured" |
| `outcome.type` | Must be implemented | "Outcome type '{type}' is not implemented" |
| `sessionResponses` | Must not be empty | "Session has no responses" |

---

## Validation Rules

### Job Creation Validation (startTransformPipeline)

```typescript
// Pseudo-code for required validation

function validateJobCreation(experience: Experience, session: Session): void {
  // Rule 1: Must have published config
  if (!experience.published) {
    throw NonRetryableError('Cannot create job: experience is not published')
  }

  // Rule 2: Must have outcome configured
  if (!experience.published.outcome?.type) {
    throw NonRetryableError('Cannot create job: experience has no outcome configured')
  }

  // Rule 3: Must have responses
  if (!session.responses || session.responses.length === 0) {
    throw NonRetryableError('Cannot create job: session has no responses')
  }

  // Rule 4: Outcome type must be implemented
  if (experience.published.outcome.type !== 'image') {
    throw NonRetryableError(
      `Cannot create job: outcome type '${experience.published.outcome.type}' is not implemented`
    )
  }
}
```

### Image Outcome Validation (imageOutcome)

```typescript
// Pseudo-code for required validation

function validateImageOutcome(outcome: Outcome, responses: SessionResponse[]): void {
  // Rule 1: Must have imageGeneration config
  if (!outcome.imageGeneration) {
    throw NonRetryableError('Image outcome missing configuration')
  }

  // Rule 2: AI mode requires non-empty prompt
  if (outcome.aiEnabled && !outcome.imageGeneration.prompt.trim()) {
    throw NonRetryableError('Image outcome has empty prompt')
  }

  // Rule 3: Capture step must exist (if specified)
  if (outcome.captureStepId) {
    const captureResponse = responses.find(r => r.stepId === outcome.captureStepId)
    if (!captureResponse) {
      throw NonRetryableError(`Capture step not found: ${outcome.captureStepId}`)
    }

    // Rule 4: Capture step must have media
    const mediaRefs = captureResponse.data as MediaReference[] | null
    if (!mediaRefs || mediaRefs.length === 0) {
      throw NonRetryableError(`Capture step has no media: ${captureResponse.stepName}`)
    }
  }
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Guest captures data                                                    │
│         │                                                                │
│         ▼                                                                │
│   setStepResponse(step, data)                                           │
│         │                                                                │
│         ▼                                                                │
│   Store: responses[] ◄──── NO fallback to answers                       │
│         │                                                                │
│         ▼                                                                │
│   Firestore sync: { responses: [...] }                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLOUD FUNCTIONS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   startTransformPipelineV2                                               │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────┐                           │
│   │ VALIDATION GUARDRAILS (NEW)             │                           │
│   │ • experience.published not null         │                           │
│   │ • outcome.type is set                   │                           │
│   │ • session.responses not empty           │                           │
│   │ • outcome type is implemented           │                           │
│   └─────────────────────────────────────────┘                           │
│         │                                                                │
│         ▼                                                                │
│   buildJobSnapshot(session, experience)                                  │
│   • sessionResponses = session.responses                                │
│   • outcome = experience.published.outcome                              │
│         │                                                                │
│         ▼                                                                │
│   Create Job Document + Queue Task                                       │
│         │                                                                │
│         ▼                                                                │
│   transformPipelineJob                                                   │
│         │                                                                │
│         ▼                                                                │
│   runOutcome(ctx)                                                        │
│         │                                                                │
│         ▼                                                                │
│   imageOutcome(ctx)                                                      │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────┐                           │
│   │ RUNTIME GUARDRAILS (ENHANCED)           │                           │
│   │ • imageGeneration config present        │                           │
│   │ • prompt not empty (if AI enabled)      │                           │
│   │ • capture step exists (if specified)    │                           │
│   │ • capture step has media                │                           │
│   └─────────────────────────────────────────┘                           │
│         │                                                                │
│         ▼                                                                │
│   Process (AI generation or passthrough)                                │
│         │                                                                │
│         ▼                                                                │
│   Update session.resultMedia                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Migration Notes

### No Data Migration Required

This cleanup does not require migrating existing data because:

1. **Deprecated fields are still parsed**: Schema allows both old (`answers`) and new (`responses`) fields
2. **Old sessions are abandoned**: Per PRD assumptions, legacy sessions can be ignored
3. **New sessions already use `responses`**: Frontend already writes to `responses` only

### Future Consideration: Field Removal

When ready to remove deprecated fields entirely:

1. Run codebase audit to confirm zero usage
2. Create migration script to remove fields from existing documents (optional)
3. Remove fields from schema
4. Update Firestore security rules if needed

This is out of scope for current cleanup but documented for future reference.
