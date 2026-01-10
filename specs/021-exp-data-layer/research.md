# Research: Experience Data Layer & Event Config Schema

**Date**: 2026-01-10
**Branch**: `021-exp-data-layer`

## Overview

This document consolidates research findings and architectural decisions for implementing the experience data layer (Phase 1) and event config schema updates (Phase 2).

---

## 1. Experience Document Schema Structure

### Decision
Use `z.looseObject()` with Firestore-safe nullable patterns, following the existing experience schema scaffolding.

### Rationale
- `z.looseObject()` provides forward compatibility for schema evolution
- Nullable fields with `.nullable().default(null)` avoid `undefined` values (Firestore doesn't support undefined)
- Consistent with existing patterns in `workspace`, `project`, and `event` schemas

### Alternatives Considered
| Alternative | Rejected Because |
|------------|------------------|
| `z.object()` | Less forward-compatible; breaks on unknown fields |
| Optional fields with `undefined` | Firestore doesn't support undefined values |
| Separate draft/published schemas | Adds complexity; existing experience schema already handles this with `draft`/`published` config |

### Reference Files
- `/apps/clementine-app/src/domains/experience/shared/schemas/experience.schema.ts` (existing scaffolding)
- `/apps/clementine-app/src/domains/workspace/shared/schemas/workspace.schemas.ts` (pattern reference)

---

## 2. Experience Profile Implementation

### Decision
Define profiles as a Zod enum with static step category mappings.

### Rationale
- Profiles are immutable after creation (PRD requirement)
- Static mappings are simpler than database-driven rules
- Enables compile-time type safety for profile-step validation

### Implementation Approach
```typescript
export const experienceProfileSchema = z.enum(['freeform', 'survey', 'informational'])
export type ExperienceProfile = z.infer<typeof experienceProfileSchema>

export const PROFILE_ALLOWED_STEP_CATEGORIES: Record<ExperienceProfile, StepCategory[]> = {
  freeform: ['info', 'input', 'capture', 'transform', 'share'],
  survey: ['info', 'input', 'capture', 'share'],
  informational: ['info'],
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|------------|------------------|
| Database-stored profile rules | Over-engineering for static MVP profiles |
| Profile inheritance | Adds complexity; not needed for 3 fixed profiles |

---

## 3. CRUD Hook Pattern

### Decision
Follow the established two-part pattern: Query Options + Hook with real-time listener.

### Rationale
- Consistent with existing hooks in `event` and `workspace` domains
- Real-time updates via `onSnapshot()` integrated with TanStack Query cache
- Separation of concerns: query options reusable, hooks add real-time behavior

### Implementation Approach

**Query Options Pattern:**
```typescript
export const workspaceExperiencesQuery = (workspaceId: string) =>
  queryOptions({
    queryKey: ['experiences', workspaceId],
    queryFn: async () => {
      const experiencesRef = collection(firestore, `workspaces/${workspaceId}/experiences`)
      const q = query(experiencesRef, where('status', '==', 'active'), orderBy('updatedAt', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => convertFirestoreDoc(doc, workspaceExperienceSchema))
    },
  })
```

**Hook with Real-Time Pattern:**
```typescript
export function useWorkspaceExperiences(workspaceId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const experiencesRef = collection(firestore, `workspaces/${workspaceId}/experiences`)
    const q = query(experiencesRef, where('status', '==', 'active'), orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const experiences = snapshot.docs.map(doc =>
        convertFirestoreDoc(doc, workspaceExperienceSchema)
      )
      queryClient.setQueryData(['experiences', workspaceId], experiences)
    })

    return () => unsubscribe()
  }, [workspaceId, queryClient])

  return useQuery(workspaceExperiencesQuery(workspaceId))
}
```

---

## 4. Event Config Experiences Schema

### Decision
Add `experiences` field to `projectEventConfigSchema` with structure matching PRD.

### Rationale
- Main slot as array supports multiple experiences with ordering
- Pregate/preshare as optional single objects matches slot semantics
- Enabled flag allows toggling without removing from config

### Implementation Approach
```typescript
export const experienceReferenceSchema = z.looseObject({
  experienceId: z.string(),
  enabled: z.boolean().default(true),
})

export const eventExperiencesConfigSchema = z.looseObject({
  main: z.array(experienceReferenceSchema).default([]),
  pregate: experienceReferenceSchema.nullable().default(null),
  preshare: experienceReferenceSchema.nullable().default(null),
})
```

### Migration Strategy
- No migration needed (user confirmed experiences is a new field)
- Schema uses `.default([])` and `.nullable().default(null)` for backward compatibility
- Existing events without experiences field will parse correctly

---

## 5. Experience Releases Collection

### Decision
Create new collection at `/projects/{projectId}/experienceReleases/{releaseId}`.

### Rationale
- Project-scoped (not workspace-scoped) per architecture document
- Immutable after creation (frozen copy of experience at publish time)
- Guests read releases, never mutable experiences

### Schema Structure
```typescript
export const experienceReleaseSchema = z.looseObject({
  id: z.string(),
  experienceId: z.string(),
  sourceEventId: z.string(),
  data: z.looseObject({
    profile: experienceProfileSchema,
    media: experienceMediaSchema.nullable().default(null),
    steps: z.array(stepSchema).default([]),
  }),
  createdAt: z.number(),
  createdBy: z.string(),
})
```

### Notes
- This schema is created now for Phase 2 but will be used in Phase 17 (Event Publish)
- No hooks needed yet (publishing flow is out of scope)

---

## 6. Firestore Security Rules

### Decision
Extend existing rules with workspace experiences subcollection.

### Rationale
- Follows existing pattern: admin-only write, subcollection inherits parent permissions
- Consistent with projects and events security model

### Implementation Approach
```firestore-rules
match /workspaces/{workspaceId} {
  // ... existing workspace rules ...

  match /experiences/{experienceId} {
    allow read, create, update: if isAdmin();
    allow delete: if false; // Soft delete only
  }
}

match /projects/{projectId} {
  // ... existing project rules ...

  match /experienceReleases/{releaseId} {
    allow read: if true; // Guests can read releases
    allow create, update: if isAdmin();
    allow delete: if false;
  }
}
```

---

## 7. Profile Validation Utilities

### Decision
Implement as pure functions with explicit step category to step type mapping.

### Rationale
- Pure functions are easy to test
- Step categories group related step types
- Validation runs at multiple points: editor (feedback), save (warning), publish (blocking)

### Implementation Approach
```typescript
export function validateExperienceProfile(
  profile: ExperienceProfile,
  steps: Step[],
): ValidationResult {
  const allowedCategories = PROFILE_ALLOWED_STEP_CATEGORIES[profile]
  const violations = steps.filter(step => {
    const category = getStepCategory(step.type)
    return !allowedCategories.includes(category)
  })

  return {
    valid: violations.length === 0,
    violations: violations.map(step => ({
      stepId: step.id,
      stepType: step.type,
      message: `Step type "${step.type}" not allowed for profile "${profile}"`,
    })),
  }
}
```

---

## 8. Slot Compatibility Validation

### Decision
Implement as pure function checking profile against slot constraints.

### Rationale
- Slot constraints are static (from PRD)
- Used by experience picker to filter compatible experiences
- Prevents invalid assignments at UI level

### Implementation Approach
```typescript
export const SLOT_ALLOWED_PROFILES: Record<ExperienceSlot, ExperienceProfile[]> = {
  main: ['freeform', 'survey'],
  pregate: ['informational', 'survey'],
  preshare: ['informational', 'survey'],
}

export function isProfileCompatibleWithSlot(
  profile: ExperienceProfile,
  slot: ExperienceSlot,
): boolean {
  return SLOT_ALLOWED_PROFILES[slot].includes(profile)
}
```

---

## Summary

All technical decisions follow established patterns in the codebase:

| Decision | Pattern Source |
|----------|---------------|
| Schema structure | `experience.schema.ts`, `workspace.schemas.ts` |
| CRUD hooks | `useProjectEvent.ts`, `useCreateProject.ts` |
| Query options | `project-event.query.ts` |
| Security rules | `firestore.rules` (existing patterns) |
| Profile validation | New, but follows pure function pattern |

No NEEDS CLARIFICATION items remain - all decisions are informed by architecture documents, PRD, and existing codebase patterns.
