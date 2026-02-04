# Research: Experience Create Outcome Configuration

**Feature**: 059-experience-create
**Date**: 2026-02-04

## 1. CreateOutcome Schema Status

**Decision**: Use existing `createOutcomeSchema` from `packages/shared/src/schemas/experience/create-outcome.schema.ts`

**Rationale**: The schema is already fully implemented and tested as part of PRD 1A (Schema Foundations). It includes:
- `type`: `'image' | 'gif' | 'video' | null`
- `captureStepId`: `string | null`
- `aiEnabled`: `boolean`
- `imageGeneration`: prompt, refMedia, model, aspectRatio
- `options`: discriminated union (ImageOptions | GifOptions | VideoOptions | null)

**Alternatives considered**:
- Create new schema → Rejected (duplication, already exists)
- Modify existing schema → Not needed (schema is complete)

## 2. Schema Integration Pattern

**Decision**: Add `create` field to `experienceConfigSchema` using optional with default

**Rationale**: Matches existing pattern for `transformNodes`. Using `.default()` ensures backward compatibility with existing documents that don't have the field.

```typescript
// In experience.schema.ts
export const experienceConfigSchema = z.looseObject({
  steps: z.array(experienceStepSchema).default([]),
  transformNodes: z.array(transformNodeSchema).default([]),
  create: createOutcomeSchema.default({
    type: null,
    captureStepId: null,
    aiEnabled: true,
    imageGeneration: { prompt: '', refMedia: [], model: 'gemini-2.5-flash-image', aspectRatio: '1:1' },
    options: null,
  }),
})
```

**Alternatives considered**:
- Make `create` nullable → Rejected (default provides better DX)
- Make `create` required → Rejected (breaks backward compatibility)

## 3. Capture Step Identification

**Decision**: Check if step type starts with `capture.` prefix

**Rationale**: Existing step registry uses hierarchical naming (e.g., `capture.photo`). This pattern is established and consistent.

```typescript
function isCaptureStep(step: ExperienceStep): boolean {
  return step.type.startsWith('capture.')
}
```

**Alternatives considered**:
- Check against specific list → Rejected (not extensible)
- Add `category` field to steps → Overkill (prefix works fine)

## 4. Validation Location

**Decision**: Create `create-outcome-validation.ts` in `domains/experience/shared/lib/`

**Rationale**:
- Pure function allows unit testing
- Reusable across publish hook and future UI validation
- Follows existing pattern (see `transform-operations.ts`)

**Alternatives considered**:
- Inline in `usePublishExperience` → Rejected (hard to test, not reusable)
- In shared package → Rejected (needs step context from app)

## 5. Publish Behavior

**Decision**: Always set `published.transformNodes = []` on publish

**Rationale**: PRD specifies deprecation of transformNodes. Setting to empty array ensures clean separation from legacy system while maintaining schema compatibility.

**Implementation**:
```typescript
// In publish transaction
transaction.update(experienceRef, {
  published: {
    ...currentExperience.draft,
    transformNodes: [], // Always empty - deprecated
  },
  // ...other fields
})
```

**Alternatives considered**:
- Remove transformNodes entirely → Rejected (breaks schema, may affect existing tools)
- Copy transformNodes as-is → Rejected (contradicts deprecation intent)

## 6. Error Message Format

**Decision**: Return structured errors matching existing `PublishValidationError` interface

**Rationale**: Maintains consistency with existing publish validation. Errors include `field`, `message`, and optional `stepId` for step-specific issues.

```typescript
interface CreateOutcomeValidationError {
  field: string        // e.g., 'create.type', 'create.imageGeneration.prompt'
  message: string      // User-friendly message
  stepId?: string      // For captureStepId validation errors
}
```

**Alternatives considered**:
- Use Zod errors directly → Rejected (messages not user-friendly)
- Create new error format → Rejected (inconsistent with existing code)

## 7. Default Model Selection

**Decision**: Use `'gemini-2.5-flash-image'` as default model

**Rationale**: Already specified in existing `createOutcomeSchema` defaults. Fast, cost-effective, good for most use cases.

**Alternatives considered**:
- `'gemini-3-pro-image-preview'` → Rejected (higher cost, slower)
- No default → Rejected (poor DX, requires explicit selection)

## 8. GIF/Video Handling

**Decision**: Allow selection but prevent publish with "coming soon" message

**Rationale**: PRD explicitly states GIF/video are not yet implemented but should be selectable. This enables UI to show options while blocking actual publishing.

```typescript
if (create.type === 'gif' || create.type === 'video') {
  errors.push({
    field: 'create.type',
    message: `${create.type.toUpperCase()} outcome is coming soon`,
  })
}
```

**Alternatives considered**:
- Hide options entirely → Rejected (doesn't match PRD)
- Allow publishing → Rejected (no backend support)

## 9. Options Kind Validation

**Decision**: Validate `options.kind` matches `type` when both are set

**Rationale**: Discriminated union requires consistency. Mismatch indicates bug or data corruption.

```typescript
if (create.options && create.type && create.options.kind !== create.type) {
  errors.push({
    field: 'create.options',
    message: 'Options kind must match outcome type',
  })
}
```

**Alternatives considered**:
- Auto-correct mismatch → Rejected (hides bugs, data mutation side effect)
- Ignore mismatch → Rejected (can cause runtime errors)

## 10. Existing Experience Migration

**Decision**: No automatic migration - experiences fail validation until configured

**Rationale**:
- Safer than automatic migration
- Forces explicit review by experience creator
- Draft mode continues to work (only publish blocked)

**Alternatives considered**:
- Auto-set type to 'image' → Rejected (may not match intent)
- Migration script → Out of scope (can be added later if needed)
