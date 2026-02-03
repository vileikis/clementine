# PRD: Session Schema Refactor for Prompt Resolution

**Status**: Future Work (Dependency of 055-lexical-prompt-editor backend resolution)
**Priority**: Required before backend prompt resolution can be implemented
**Created**: 2026-02-01

## Context

The Lexical Prompt Editor (055-lexical-prompt-editor) stores mentions using human-readable names:
- `@{step:Pet Choice}` - references a step by name
- `@{ref:cat image.jpeg}` - references media by display name

For the backend (cloud functions) to resolve these mentions at runtime, it needs to look up session data by name. Currently, the session schema only stores `stepId` in answers and captured media, requiring an additional lookup to the experience config to match names.

This PRD defines the schema changes needed to enable direct name-based resolution.

## Problem Statement

**Current session schema:**
```typescript
answerSchema = {
  stepId: string,        // UUID
  stepType: string,
  value: AnswerValue,
  context: unknown,
  answeredAt: number,
}

capturedMediaSchema = {
  stepId: string,        // UUID
  assetId: string,
  url: string,
  createdAt: number,
}
```

**Resolution challenge:**
To resolve `@{step:Pet Choice}`, the backend must:
1. Load experience config
2. Find step by name: `experience.steps.find(s => s.name === 'Pet Choice')`
3. Get step ID
4. Find answer by ID: `session.answers.find(a => a.stepId === stepId)`

This adds complexity and an extra data fetch.

## Proposed Solution

Add `stepName` to both schemas for direct name-based lookup.

**Updated session schema:**
```typescript
answerSchema = {
  stepId: string,        // UUID (kept for backward compatibility)
  stepName: string,      // NEW: Human-readable name for direct lookup
  stepType: string,
  value: AnswerValue,
  context: unknown,
  answeredAt: number,
}

capturedMediaSchema = {
  stepId: string,        // UUID (kept for backward compatibility)
  stepName: string,      // NEW: Human-readable name for direct lookup
  assetId: string,
  url: string,
  createdAt: number,
}
```

**Simplified resolution:**
```typescript
// Direct lookup by name
const answer = session.answers.find(a => a.stepName === 'Pet Choice')
const capture = session.capturedMedia.find(c => c.stepName === 'Photo')
```

## Requirements

### Functional Requirements

- **FR-001**: `answerSchema` MUST include `stepName` field (string, required)
- **FR-002**: `capturedMediaSchema` MUST include `stepName` field (string, required)
- **FR-003**: Guest runtime MUST populate `stepName` when saving answers
- **FR-004**: Guest runtime MUST populate `stepName` when saving captured media
- **FR-005**: Cloud functions MUST use `stepName` for prompt mention resolution
- **FR-006**: Existing `stepId` field MUST be preserved for backward compatibility

### Schema Changes

**File**: `packages/shared/src/schemas/session/session.schema.ts`

```typescript
// Answer schema
export const answerSchema = z.object({
  stepId: z.string(),
  stepName: z.string(),        // ADD
  stepType: z.string(),
  value: answerValueSchema,
  context: z.unknown().nullable().default(null),
  answeredAt: z.number(),
})

// Captured media schema
export const capturedMediaSchema = z.object({
  stepId: z.string(),
  stepName: z.string(),        // ADD
  assetId: z.string(),
  url: z.string(),
  createdAt: z.number(),
})
```

### Additional Schema Change (Optional but Recommended)

Add validation to media display names to ensure they're safe for mention parsing.

**File**: `packages/shared/src/schemas/media/media-reference.schema.ts`

```typescript
export const mediaDisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be 100 characters or less')
  .regex(
    /^[a-zA-Z0-9 \-_.]+$/,
    'Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
  )
  .default('Untitled')

export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: mediaDisplayNameSchema,  // CHANGE: Add validation
})
```

This prevents display names containing `}` or `:` which would break mention parsing.

## Affected Code

### Guest Runtime (Answer Saving)

**Location**: Code that saves answers when guest completes input steps

```typescript
// Before
const answer = {
  stepId: step.id,
  stepType: step.type,
  value: userInput,
  answeredAt: Date.now(),
}

// After
const answer = {
  stepId: step.id,
  stepName: step.name,  // ADD
  stepType: step.type,
  value: userInput,
  answeredAt: Date.now(),
}
```

### Guest Runtime (Capture Saving)

**Location**: Code that saves captured media when guest completes capture steps

```typescript
// Before
const capture = {
  stepId: step.id,
  assetId: mediaAsset.id,
  url: mediaAsset.url,
  createdAt: Date.now(),
}

// After
const capture = {
  stepId: step.id,
  stepName: step.name,  // ADD
  assetId: mediaAsset.id,
  url: mediaAsset.url,
  createdAt: Date.now(),
}
```

### Cloud Functions (Prompt Resolution)

**Location**: Transform job processing that resolves prompt mentions

```typescript
function resolvePromptMentions(
  prompt: string,
  session: Session,
  refMedia: MediaReference[]
): ResolvedPrompt {
  // Step mentions: @{step:stepName}
  const stepResolved = prompt.replace(
    /@\{step:([^}]+)\}/g,
    (match, stepName) => {
      // Check answers first (input steps)
      const answer = session.answers.find(a => a.stepName === stepName)
      if (answer) {
        return resolveAnswerValue(answer)
      }

      // Check captured media (capture steps)
      const capture = session.capturedMedia.find(c => c.stepName === stepName)
      if (capture) {
        return `<media:${capture.assetId}>`
      }

      // Not found - keep original (will cause generation error)
      return match
    }
  )

  // Media mentions: @{ref:displayName}
  const mediaResolved = stepResolved.replace(
    /@\{ref:([^}]+)\}/g,
    (match, displayName) => {
      const media = refMedia.find(m => m.displayName === displayName)
      if (media) {
        return `<media:${media.mediaAssetId}>`
      }
      return match
    }
  )

  return mediaResolved
}
```

## Migration

### New Sessions

New sessions created after deployment will automatically have `stepName` populated.

### Existing Sessions

Existing sessions without `stepName` can be handled in two ways:

**Option A: Graceful fallback (Recommended)**
```typescript
// Cloud function fallback
const stepName = answer.stepName ?? lookupStepNameById(answer.stepId, experience)
```

**Option B: Backfill migration**
- Run one-time migration to populate `stepName` for existing sessions
- Query sessions, load experience, update each answer/capture with step name

Recommend Option A for simplicity - old sessions can still be resolved with fallback.

## Success Criteria

- **SC-001**: All new sessions include `stepName` in answers and captured media
- **SC-002**: Cloud function can resolve `@{step:stepName}` mentions directly from session data
- **SC-003**: No breaking changes to existing sessions (backward compatible)
- **SC-004**: Media display name validation prevents parsing-unsafe characters

## Dependencies

- **055-lexical-prompt-editor**: Must be completed first (defines the storage format)
- **Guest runtime**: Must be updated to populate stepName
- **Cloud functions**: Must be updated to use stepName for resolution

## Timeline

This work should be completed before:
1. Transform pipeline goes live with prompt mention support
2. Any production experiences use `@{step:...}` mentions in prompts

## Open Questions

1. **Backfill strategy**: Should we backfill existing sessions or use graceful fallback?
   - Recommendation: Graceful fallback (simpler, no migration needed)

2. **Media display name validation**: Should this be a breaking change or only applied to new media?
   - Recommendation: Apply to new media only, existing media grandfathered

## Related Documents

- [055-lexical-prompt-editor spec](./spec.md)
- [055-lexical-prompt-editor plan](./plan.md)
- [Session schema](../../packages/shared/src/schemas/session/session.schema.ts)
- [Media reference schema](../../packages/shared/src/schemas/media/media-reference.schema.ts)
