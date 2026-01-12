# Research: Experience Data Layer & Library

**Feature**: 021-experience-data-library
**Date**: 2026-01-12
**Purpose**: Resolve technical unknowns and document best practices for implementation

## Overview

This research consolidates findings from codebase exploration to guide implementation of the Experience Data Layer & Library feature. All patterns are drawn from existing code in the Clementine codebase.

---

## 1. Schema Migration Strategy

### Decision
Update existing experience schema in-place (not create new file).

### Rationale
- Schema file already exists at `domains/experience/shared/schemas/experience.schema.ts`
- Follows existing pattern where schemas evolve with features
- Epic E1 requirements document specifies exact field changes needed

### Changes Required
| Field | Current | Target |
|-------|---------|--------|
| `profile` enum | `freeform\|main_default\|pregate_default\|preshare_default` | `freeform\|survey\|story` |
| `media` | N/A | `{ mediaAssetId: string, url: string } \| null` |
| `publishedBy` | N/A | `string \| null` |
| `draft.version` | Enum field | Remove (simplify) |
| `published.version` | Enum field | Remove (simplify) |

### Alternatives Considered
- Create new schema file: Rejected - would create duplication and migration complexity
- Version the schema: Rejected - overkill for early-stage product

---

## 2. Real-Time Query Hook Pattern

### Decision
Use TanStack Query with Firestore `onSnapshot` for real-time updates.

### Rationale
- Consistent with existing `useProjects` pattern in workspace domain
- Provides automatic cache management and real-time sync
- `staleTime: Infinity` prevents unnecessary refetches when listener is active

### Pattern Reference
File: `domains/workspace/projects/hooks/useProjects.ts`

```typescript
export function useWorkspaceExperiences(workspaceId: string, filters?: { profile?: ExperienceProfile }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    let q = query(
      collection(firestore, `workspaces/${workspaceId}/experiences`),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    )

    if (filters?.profile) {
      q = query(q, where('profile', '==', filters.profile))
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const experiences = snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, experienceSchema),
      )
      queryClient.setQueryData(['experiences', workspaceId, filters], experiences)
    })

    return () => unsubscribe()
  }, [workspaceId, filters?.profile, queryClient])

  return useQuery<Experience[]>({
    queryKey: ['experiences', workspaceId, filters],
    queryFn: async () => { /* initial fetch */ },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
```

### Alternatives Considered
- Polling: Rejected - wasteful and laggy compared to real-time listeners
- Server-sent events: Rejected - Firestore already provides this natively

---

## 3. Mutation Hook Pattern

### Decision
Use TanStack Query `useMutation` with Firestore transactions and `serverTimestamp()`.

### Rationale
- Transactions ensure `serverTimestamp()` resolves correctly
- Consistent with existing project/event mutation patterns
- Provides optimistic updates and automatic cache invalidation

### Pattern Reference
File: `domains/workspace/projects/hooks/useCreateProject.ts`

```typescript
export function useCreateExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateExperienceInput) => {
      const validated = createExperienceInputSchema.parse(input)
      const experiencesRef = collection(
        firestore,
        `workspaces/${validated.workspaceId}/experiences`
      )

      return await runTransaction(firestore, (transaction) => {
        const newRef = doc(experiencesRef)

        const newExperience: WithFieldValue<Experience> = {
          id: newRef.id,
          name: validated.name,
          profile: validated.profile,
          status: 'active',
          media: null,
          draft: { steps: [] },
          published: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          publishedAt: null,
          publishedBy: null,
          deletedAt: null,
        }

        transaction.set(newRef, newExperience)
        return Promise.resolve({ experienceId: newRef.id, workspaceId: validated.workspaceId })
      })
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['experiences', workspaceId] })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'experience/library', action: 'create-experience' },
      })
    },
  })
}
```

### Alternatives Considered
- Direct `setDoc` without transaction: Rejected - serverTimestamp() may not resolve correctly
- Optimistic updates: Deferred - simpler invalidation approach sufficient for MVP

---

## 4. Firestore Security Rules

### Decision
Add workspace-scoped experience rules following existing pattern.

### Rationale
- Consistent with existing workspace/projects rules structure
- Uses established `isAdmin()` helper function
- Denies hard deletes to enforce soft-delete pattern

### Pattern Reference
File: `firebase/firestore.rules`

```javascript
match /workspaces/{workspaceId}/experiences/{experienceId} {
  // READ: Authenticated users can read experiences
  allow read: if request.auth != null;

  // WRITE: Only admins can create/update
  allow create, update: if isAdmin();

  // DELETE: Forbid hard deletes (soft delete only)
  allow delete: if false;
}
```

### Notes
- Guests will read full document; client filters to `published` field
- Status-based filtering handled in query, not rules (per existing pattern)

---

## 5. Profile Filtering Approach

### Decision
Client-side filtering with Firestore compound query.

### Rationale
- Profile is indexed field suitable for Firestore `where` clause
- Real-time listener automatically updates when filter changes
- No server function needed (client-first architecture)

### Pattern Reference
```typescript
// In useWorkspaceExperiences hook
if (filters?.profile) {
  q = query(q, where('profile', '==', filters.profile))
}
```

### Considerations
- Firestore requires composite index for `status` + `profile` + `createdAt`
- Add index to `firebase/firestore.indexes.json`

---

## 6. Dialog Component Pattern

### Decision
Use shadcn/ui Dialog with controlled open state and separate confirm/cancel handlers.

### Rationale
- Consistent with existing `DeleteProjectDialog` and `RenameProjectDialog`
- Keeps mutation logic in parent component or custom hook
- Simple, predictable state management

### Pattern Reference
File: `domains/workspace/projects/components/DeleteProjectDialog.tsx`

```typescript
interface DeleteExperienceDialogProps {
  open: boolean
  experienceName: string
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteExperienceDialog({
  open, experienceName, isDeleting, onOpenChange, onConfirm
}: DeleteExperienceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Experience</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{experienceName}"?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 7. Form Validation Pattern

### Decision
Use react-hook-form with Zod resolver for create experience form.

### Rationale
- Consistent with existing `WorkspaceSettingsForm` pattern
- Provides field-level and form-level error handling
- Type-safe form values via Zod inference

### Pattern Reference
File: `domains/workspace/settings/components/WorkspaceSettingsForm.tsx`

```typescript
const form = useForm<CreateExperienceInput>({
  resolver: zodResolver(createExperienceInputSchema),
  defaultValues: {
    name: '',
    profile: 'freeform',
  },
})
```

### Notes
- Profile is required at creation, immutable after
- Name validation: 1-100 characters

---

## 8. Empty State Pattern

### Decision
Create dedicated empty state component with contextual messaging.

### Rationale
- Consistent with existing list patterns
- Provides clear call-to-action for users
- Supports filtered vs. unfiltered empty states

### Pattern Reference
```typescript
// No experiences at all
<ExperienceListEmpty variant="no-experiences" onCreate={() => navigate('/create')} />

// No experiences matching filter
<ExperienceListEmpty variant="no-matches" profile={currentFilter} onClearFilter={() => setFilter(null)} />
```

---

## 9. Route Structure

### Decision
Follow existing workspace route hierarchy with file-based routing.

### Rationale
- Consistent with `/workspace/:slug/projects` pattern
- TanStack Router file-based routing conventions
- Thin route components importing from domain containers

### Pattern Reference
```text
app/workspace/
├── $workspaceSlug.experiences/
│   ├── index.tsx           # → ExperiencesPage
│   ├── create.tsx          # → CreateExperiencePage
│   └── $experienceId.tsx   # → ExperienceEditorPage
```

---

## 10. Query Keys Convention

### Decision
Use hierarchical query keys with optional filters object.

### Rationale
- Consistent with existing `['projects', workspaceId]` pattern
- Enables selective invalidation by workspace or by filter
- Type-safe via TanStack Query conventions

### Pattern
```typescript
export const experienceKeys = {
  all: ['experiences'] as const,
  lists: () => [...experienceKeys.all, 'list'] as const,
  list: (workspaceId: string, filters?: { profile?: ExperienceProfile }) =>
    [...experienceKeys.lists(), workspaceId, filters] as const,
  details: () => [...experienceKeys.all, 'detail'] as const,
  detail: (workspaceId: string, experienceId: string) =>
    [...experienceKeys.details(), workspaceId, experienceId] as const,
}
```

---

## Summary

All technical decisions align with existing codebase patterns. No external research or new libraries required. Implementation can proceed directly to Phase 1 design artifacts.
