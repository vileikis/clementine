# Quickstart: Experience Designer Draft & Publish Versioning

**Feature**: 030-exp-versioning
**Date**: 2026-01-15

## Overview

This guide covers implementing version tracking for Experience Designer, following the same pattern used in Event Designer.

## Prerequisites

- Familiarity with TanStack Query mutations
- Understanding of Firestore transactions and `increment()`
- Knowledge of Zod schema definitions

## Key Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `experience.schema.ts` | Add fields | Add `draftVersion` and `publishedVersion` to schema |
| `useUpdateExperienceDraft.ts` | Modify | Add `increment(1)` for draft version |
| `usePublishExperience.ts` | Modify | Sync `publishedVersion = draftVersion` |
| `ExperienceDesignerLayout.tsx` | Modify | Use actual versions in EditorChangesBadge |

## Implementation Steps

### Step 1: Update Experience Schema

Add version fields to the schema:

```typescript
// experience.schema.ts
export const experienceSchema = z.looseObject({
  // ... existing fields ...

  // VERSIONING (add after CONFIGURATION section)
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable().default(null),

  // ... rest of schema ...
})
```

### Step 2: Create Shared Update Helper (Optional)

Create a helper function similar to Event Designer's `updateEventConfigField`:

```typescript
// lib/updateExperienceConfigField.ts
import { doc, increment, runTransaction, serverTimestamp } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

export async function updateExperienceConfigField(
  workspaceId: string,
  experienceId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const expRef = doc(firestore, `workspaces/${workspaceId}/experiences/${experienceId}`)

    // Prefix updates with 'draft.' for nested field updates
    const firestoreUpdates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      firestoreUpdates[`draft.${key}`] = value
    }

    transaction.update(expRef, {
      ...firestoreUpdates,
      draftVersion: increment(1),
      updatedAt: serverTimestamp(),
    })
  })
}
```

### Step 3: Update Draft Mutation Hook

Modify `useUpdateExperienceDraft` to increment version:

```typescript
// useUpdateExperienceDraft.ts
mutationFn: async (input) => {
  await runTransaction(firestore, async (transaction) => {
    const expRef = doc(firestore, `workspaces/${workspaceId}/experiences/${experienceId}`)

    transaction.update(expRef, {
      draft: input.draft,
      draftVersion: increment(1),  // Add this line
      updatedAt: serverTimestamp(),
    })
  })
}
```

### Step 4: Update Publish Hook

Modify `usePublishExperience` to sync versions:

```typescript
// usePublishExperience.ts
mutationFn: async () => {
  await runTransaction(firestore, async (transaction) => {
    const expRef = doc(firestore, `workspaces/${workspaceId}/experiences/${experienceId}`)
    const expDoc = await transaction.get(expRef)
    const experience = expDoc.data()

    // ... existing validation ...

    transaction.update(expRef, {
      published: experience.draft,
      publishedVersion: experience.draftVersion,  // Sync version
      publishedAt: serverTimestamp(),
      publishedBy: userId,
      updatedAt: serverTimestamp(),
    })
  })
}
```

### Step 5: Update EditorChangesBadge Usage

Replace hard-coded values with actual versions:

```tsx
// ExperienceDesignerLayout.tsx
<EditorChangesBadge
  draftVersion={experience.draftVersion}
  publishedVersion={experience.publishedVersion}
/>
```

## Testing

### Manual Testing

1. **Create new experience**: Verify `draftVersion: 1`, `publishedVersion: null`
2. **Edit draft**: Verify `draftVersion` increments, badge shows "changes"
3. **Publish**: Verify `publishedVersion` matches `draftVersion`, badge clears
4. **Edit after publish**: Verify badge shows "changes" again

### Unit Tests

```typescript
// experience.schema.test.ts
describe('version fields', () => {
  it('should default draftVersion to 1', () => {
    const result = experienceSchema.parse({ /* minimal required fields */ })
    expect(result.draftVersion).toBe(1)
  })

  it('should default publishedVersion to null', () => {
    const result = experienceSchema.parse({ /* minimal required fields */ })
    expect(result.publishedVersion).toBeNull()
  })
})
```

## Reference Implementation

The Event Designer implements this same pattern:

- **Schema**: `domains/event/shared/schemas/project-event-full.schema.ts`
- **Update helper**: `domains/event/shared/lib/updateEventConfigField.ts`
- **Publish hook**: `domains/event/designer/hooks/usePublishEvent.ts`

## Common Pitfalls

1. **Forgetting `increment()`**: Using `draftVersion + 1` instead of `increment(1)` creates race conditions
2. **Not using transactions**: Updates without transactions may have inconsistent states
3. **Overwriting entire draft**: Use dot-notation for partial updates to preserve other fields

## Validation Checklist

- [ ] Schema has `draftVersion` defaulting to 1
- [ ] Schema has `publishedVersion` defaulting to null
- [ ] Draft updates use `increment(1)`
- [ ] Publish syncs `publishedVersion = draftVersion`
- [ ] EditorChangesBadge receives actual version values
- [ ] Tests verify version behavior
