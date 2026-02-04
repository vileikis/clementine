# Research: Session Responses + Guest Runtime

**Feature**: 060-session-responses
**Date**: 2026-02-04

## Research Questions Resolved

### 1. Existing Schema Structure

**Decision**: Extend existing `sessionResponseSchema` already defined in `session-response.schema.ts`

**Rationale**: The schema already exists with the required fields (stepId, stepName, stepType, value, context, createdAt, updatedAt). Only need to add it to the session schema.

**Alternatives Considered**:
- Create new schema from scratch - Rejected: Would duplicate existing work
- Modify Answer/CapturedMedia schemas - Rejected: Would break backward compatibility

### 2. Backward Compatibility Strategy

**Decision**: Keep `answers[]` and `capturedMedia[]` fields as deprecated but readable; new code writes only to `responses[]`

**Rationale**:
- Existing sessions have data in old fields
- Cloud Functions may still read from old fields
- Gradual migration allows testing before full cutover
- Cleanup planned for PRD 4

**Alternatives Considered**:
- Immediate migration of all data - Rejected: Risk of data loss, requires downtime
- Dual-write to both old and new fields - Rejected: Adds complexity, harder to track migration progress

### 3. Store Update Pattern

**Decision**: Use immutable array pattern with findIndex/map for updating existing responses

**Rationale**:
- Matches existing `setAnswer` pattern in experienceRuntimeStore.ts
- Zustand works best with immutable updates
- Simple to understand and maintain

**Alternatives Considered**:
- Use Map instead of array - Rejected: Firestore doesn't support Map type directly
- Use object keyed by stepId - Rejected: Array maintains insertion order, simpler schema

### 4. MediaReference Schema

**Decision**: Define MediaReference type with mediaAssetId, url, filePath, displayName

**Rationale**:
- `mediaAssetId` - Unique identifier for the asset
- `url` - Public URL for display
- `filePath` - Storage path for Cloud Functions to process
- `displayName` - Human-readable name from step definition

**Alternatives Considered**:
- Reuse existing CapturedMedia type - Rejected: Missing filePath and displayName fields
- Store only assetId - Rejected: Would require extra lookups for URL and path

### 5. Firestore Sync Strategy

**Decision**: Sync `responses[]` array on forward navigation (same as current `answers[]`/`capturedMedia[]` strategy)

**Rationale**:
- Consistent with existing behavior
- Minimizes Firestore writes
- Back navigation remains local-only

**Alternatives Considered**:
- Sync on every change - Rejected: Too many writes, poor performance
- Sync only on completion - Rejected: Risk of data loss if user abandons session

## Existing Code Analysis

### Files to Modify

| File | Current State | Required Changes |
|------|---------------|------------------|
| `session.schema.ts` | Has answers[], capturedMedia[] | Add responses[] field |
| `session-response.schema.ts` | Has SessionResponse schema | Already complete |
| `experienceRuntimeStore.ts` | Has setAnswer, setCapturedMedia | Add responses state, setResponse action |
| `useRuntime.ts` | Exposes setAnswer, getAnswer | Add setResponse, getResponse, getResponses |
| `useUpdateSessionProgress.ts` | Accepts answers, capturedMedia | Add responses parameter |
| `ExperienceRuntime.tsx` | Syncs answers, capturedMedia | Sync responses instead |
| `GuestRuntimeContent.tsx` | Uses handleAnswer | Use setResponse |

### Existing Patterns to Follow

1. **Schema pattern**: Use `z.looseObject()` for forward compatibility
2. **Store pattern**: Immutable array updates with spread operator
3. **Hook pattern**: Wrap store actions in useCallback
4. **Sync pattern**: Transaction-based Firestore updates

## Technical Decisions

### Type Definitions

```typescript
// Already exists in session-response.schema.ts
export const sessionResponseSchema = z.object({
  stepId: z.string(),
  stepName: z.string(),
  stepType: z.string(),
  value: sessionResponseValueSchema.nullable().default(null),
  context: z.unknown().nullable().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
})

// New: MediaReference for capture context
export const mediaReferenceSchema = z.object({
  mediaAssetId: z.string(),
  url: z.string(),
  filePath: z.string(),
  displayName: z.string(),
})
```

### Response Building Helper

```typescript
// In useRuntime.ts
const buildResponse = (step: ExperienceStep, value: AnswerValue | null, context: unknown | null): SessionResponse => {
  const now = Date.now()
  return {
    stepId: step.id,
    stepName: step.name,
    stepType: step.type,
    value,
    context,
    createdAt: now,
    updatedAt: now,
  }
}
```

## Open Questions (Resolved)

All research questions have been resolved. No NEEDS CLARIFICATION items remain.
