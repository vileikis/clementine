# Research: Project Rename & Hook Refactor

**Feature**: 010-project-rename-hook-refactor
**Date**: 2026-01-03
**Status**: ✅ Complete

## Overview

This research document consolidates findings about existing patterns, best practices, and architectural decisions for implementing the project rename feature and `useCreateProject` hook refactor.

---

## 1. Mutation Hook Pattern Research

### Decision: Follow `useRenameProjectEvent` Pattern

**Pattern Location**: `apps/clementine-app/src/domains/project/events/hooks/useRenameProjectEvent.ts`

**Key Findings**:
```typescript
// Standard mutation hook structure in Clementine codebase
export function useRenameProjectEvent(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RenameProjectEventInput) => {
      // 1. Validate input with Zod schema
      const validated = updateProjectEventInputSchema.parse(input)

      // 2. Use Firestore transaction (REQUIRED for serverTimestamp)
      return await runTransaction(firestore, async (transaction) => {
        const eventRef = doc(firestore, 'projectEvents', validated.eventId)

        // 3. Verify existence before update
        const eventDoc = await transaction.get(eventRef)
        if (!eventDoc.exists()) {
          throw new Error('Project event not found')
        }

        // 4. Update with serverTimestamp
        transaction.update(eventRef, {
          name: validated.name,
          updatedAt: serverTimestamp(),
        })

        // 5. Return data for consumer
        return { eventId: validated.eventId, name: validated.name }
      })
    },

    // 6. Invalidate query on success (no navigation!)
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projectEvents', projectId],
      })
    },

    // 7. Report errors to Sentry (no UI handling)
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'project/events', action: 'rename-project-event' },
        extra: { errorType: 'project-event-rename-failure' },
      })
    },
  })
}
```

**Rationale**:
- Separation of concerns: Hook handles data, component handles UI
- Testability: Pure data operations are easy to test
- Reusability: Hook can be used anywhere without navigation coupling
- Pattern consistency: All mutations in codebase follow this structure

**Alternatives Considered**:
- ❌ Include navigation in hook → Violates SRP, reduces reusability
- ❌ Include toast notifications in hook → Mixes UI and data layers
- ❌ Skip Firestore transaction → Would cause timestamp parsing errors

---

## 2. Dialog Component Pattern Research

### Decision: Follow `RenameProjectEventDialog` Pattern

**Pattern Location**: `apps/clementine-app/src/domains/project/events/components/RenameProjectEventDialog.tsx`

**Key Findings**:
```typescript
// Standard dialog component structure
export function RenameProjectEventDialog({
  eventId,
  projectId,
  initialName,
  open,
  onOpenChange,
}: RenameProjectEventDialogProps) {
  const [name, setName] = useState(initialName)
  const renameEvent = useRenameProjectEvent(projectId)

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) setName(initialName)
  }, [open, initialName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await renameEvent.mutateAsync({ eventId, name })
      toast.success('Event renamed')
      onOpenChange(false) // Close dialog on success
    } catch (error) {
      toast.error('Failed to rename event')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={renameEvent.isPending}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={renameEvent.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={renameEvent.isPending}
            >
              {renameEvent.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Rationale**:
- Controlled component pattern for form state
- Async/await for better error handling
- Toast notifications at component level (user feedback)
- Auto-close on success (good UX)
- State reset on close (prevents stale data)

**Alternatives Considered**:
- ❌ Uncontrolled form with refs → Less flexible, harder to validate
- ❌ Global state for dialog → Overkill for local UI state
- ❌ Inline error messages → Toast provides better UX

---

## 3. Context Menu Integration Pattern Research

### Decision: Follow `ProjectEventItem` Dropdown Menu Pattern

**Pattern Location**: `apps/clementine-app/src/domains/project/events/components/ProjectEventItem.tsx`

**Key Findings**:
```typescript
// Context menu with multiple actions (rename, delete)
export function ProjectEventItem({ event, projectId }: ProjectEventItemProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <>
      {/* Main content */}
      <div className="flex items-center justify-between">
        <span>{event.name}</span>

        {/* Context menu trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs (rendered outside, controlled by state) */}
      <RenameProjectEventDialog
        eventId={event.id}
        projectId={projectId}
        initialName={event.name}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      />

      <DeleteProjectEventDialog
        eventId={event.id}
        projectId={projectId}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  )
}
```

**Rationale**:
- shadcn/ui DropdownMenu provides accessible, mobile-friendly menu
- Separate state for each dialog (clean separation)
- Icons from lucide-react for visual clarity
- Destructive styling for delete action (visual hierarchy)
- Screen reader support (`sr-only` for accessibility)

**Alternatives Considered**:
- ❌ Inline buttons → Takes up too much space, poor mobile UX
- ❌ Right-click context menu → Not discoverable on mobile/touch
- ❌ Long-press gesture → Not standard web pattern

---

## 4. Schema Validation Pattern Research

### Decision: Separate Entity and Input Schemas

**Pattern Location**: `apps/clementine-app/src/domains/project/events/schemas/project-event.schema.ts`

**Key Findings**:
```typescript
// Entity schema - validates complete Firestore document
export const projectEventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  status: z.enum(['active', 'deleted']),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  deletedAt: z.number().int().positive().nullable(),
})

// Input schema - validates only user-provided fields
export const createProjectEventInputSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100, 'Event name too long'),
})

export const updateProjectEventInputSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100, 'Event name too long'),
})

// Type inference
export type ProjectEvent = z.infer<typeof projectEventSchema>
export type CreateProjectEventInput = z.infer<typeof createProjectEventInputSchema>
export type UpdateProjectEventInput = z.infer<typeof updateProjectEventInputSchema>
```

**Rationale**:
- Entity schema validates Firestore data (runtime safety from database)
- Input schemas validate user operations (different constraints)
- Error messages in input schemas (user-facing validation)
- Type inference ensures TypeScript and runtime stay in sync

**Alternatives Considered**:
- ❌ Single schema with `.partial()` → Loses granular error messages
- ❌ Manual type definitions → Risks TypeScript/runtime mismatch
- ❌ Joi or Yup → Zod integrates better with TypeScript

---

## 5. Firestore Transaction Pattern Research

### Decision: Always Use Transactions for Mutations with serverTimestamp()

**Why Transactions Are Required**:
```typescript
// ❌ BAD: Without transaction
await updateDoc(doc(firestore, 'projects', id), {
  name: 'New Name',
  updatedAt: serverTimestamp(), // Returns placeholder initially
})
// Problem: Real-time listener fires immediately with placeholder timestamp
// Zod schema rejects placeholder, causing parse error

// ✅ GOOD: With transaction
await runTransaction(firestore, async (transaction) => {
  const ref = doc(firestore, 'projects', id)
  const docSnap = await transaction.get(ref)

  if (!docSnap.exists()) {
    throw new Error('Project not found')
  }

  transaction.update(ref, {
    name: 'New Name',
    updatedAt: serverTimestamp(),
  })
})
// Transaction waits for serverTimestamp to resolve before committing
// Real-time listener receives actual timestamp, Zod validation passes
```

**Rationale**:
- Prevents race condition between mutation and real-time listener
- Ensures Zod schema validation passes (expects number, not placeholder)
- Allows read-before-write (existence check)
- Standard pattern across entire Clementine codebase

**Reference**: `standards/backend/firestore.md` - "Always use transactions for writes with serverTimestamp()"

---

## 6. Navigation Side Effects Research

### Decision: Remove Navigation from useCreateProject Hook

**Current Problem**:
```typescript
// useCreateProject.ts (BEFORE refactor)
onSuccess: ({ projectId, workspaceId, workspaceSlug }) => {
  queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })

  // ❌ Navigation side effect - violates SRP
  navigate({
    to: '/workspace/$workspaceSlug/projects/$projectId',
    params: { workspaceSlug, projectId },
  })
}
```

**Why This Is a Problem**:
1. **Violates Single Responsibility Principle**: Hook does data mutation AND navigation
2. **Reduces testability**: Need to mock router in mutation tests
3. **Limits reusability**: What if consumer doesn't want navigation?
4. **Inconsistent with other hooks**: `useRenameProject`, `useDeleteProject` don't navigate

**Refactored Solution**:
```typescript
// Hook (AFTER refactor) - only data operations
onSuccess: ({ workspaceId }) => {
  queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
  // No navigation - consumer handles this
}

// Consumer (ProjectsPage.tsx) - handles navigation
const handleCreateProject = async () => {
  try {
    const result = await createProject.mutateAsync({
      workspaceId,
      workspaceSlug,
      name: 'New Project',
    })

    // Consumer decides to navigate
    navigate({
      to: '/workspace/$workspaceSlug/projects/$projectId',
      params: {
        workspaceSlug: result.workspaceSlug,
        projectId: result.projectId,
      },
    })

    toast.success('Project created')
  } catch (error) {
    toast.error('Failed to create project')
  }
}
```

**Benefits of Refactor**:
- ✅ Hook is purely data operation (easier to test)
- ✅ Consumer controls navigation (more flexible)
- ✅ Consistent with other mutation hooks
- ✅ Easier to add future side effects (analytics, logging) in consumer

**Alternatives Considered**:
- ❌ Keep navigation, make it optional → Adds complexity, still mixed concerns
- ❌ Callback prop pattern → More complex API, not standard TanStack Query pattern
- ❌ Global event system → Overkill for simple navigation

---

## 7. Real-time Updates Pattern Research

### Decision: onSnapshot with Query Invalidation

**Pattern Location**: `apps/clementine-app/src/domains/workspace/projects/hooks/useProjects.ts`

**Key Findings**:
```typescript
export function useProjects(workspaceId: string) {
  const queryClient = useQueryClient()

  // TanStack Query setup
  const query = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      // Initial fetch with getDocs
      const projectsRef = collection(firestore, 'projects')
      const q = query(
        projectsRef,
        where('workspaceId', '==', workspaceId),
        where('status', '!=', 'deleted'),
        orderBy('status'),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(convertFirestoreDoc)
    },
    staleTime: Infinity,        // Never stale (real-time)
    refetchOnWindowFocus: false, // No polling needed
  })

  // Real-time listener (onSnapshot)
  useEffect(() => {
    const projectsRef = collection(firestore, 'projects')
    const q = query(
      projectsRef,
      where('workspaceId', '==', workspaceId),
      where('status', '!=', 'deleted'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    )

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(convertFirestoreDoc)

      // Update query cache directly
      queryClient.setQueryData(['projects', workspaceId], projects)
    })

    return unsubscribe
  }, [workspaceId, queryClient])

  return query
}
```

**How Mutations Trigger Updates**:
1. User clicks "Rename" → Opens dialog
2. Dialog calls `renameProject.mutateAsync()`
3. Mutation updates Firestore
4. Firestore triggers `onSnapshot` listener
5. Listener updates query cache via `setQueryData`
6. UI re-renders with new data

**Rationale**:
- Real-time updates across all tabs/devices
- No manual refetching needed
- Query invalidation ensures data consistency
- `staleTime: Infinity` prevents unnecessary refetches

**Reference**: `standards/frontend/architecture.md` - "Real-time by default: Leverage onSnapshot for collaborative features"

---

## 8. Component Library Best Practices Research

### Decision: Use shadcn/ui Components

**Components Required for This Feature**:
- `Dialog` - Rename dialog modal
- `DropdownMenu` - Context menu for project actions
- `Button` - All button interactions
- `Input` - Name input field
- `Label` - Form labels
- `Icons` (lucide-react) - MoreVertical, Pencil, Trash2

**Key Best Practices** (from `standards/frontend/component-libraries.md`):
1. Always extend shadcn/ui components (don't modify source)
2. Preserve accessibility features (ARIA labels, keyboard nav)
3. Use semantic HTML (form, button[type], label[htmlFor])
4. Mobile-first sizing (44px minimum touch targets)
5. Disable buttons during loading states (prevent double-submit)

**Alternatives Considered**:
- ❌ Build custom components → Reinvents wheel, accessibility harder
- ❌ Material-UI or Chakra → Not in codebase, would break consistency
- ❌ Headless UI → shadcn/ui already uses Radix (headless)

---

## 9. Error Handling Strategy Research

### Decision: Layered Error Handling (Hook + Component)

**Hook Layer** (Sentry reporting only):
```typescript
onError: (error) => {
  Sentry.captureException(error, {
    tags: {
      domain: 'workspace/projects',
      action: 'rename-project',
    },
    extra: {
      errorType: 'project-rename-failure',
    },
  })
  // NO user-facing error handling here
}
```

**Component Layer** (User feedback):
```typescript
try {
  await renameProject.mutateAsync({ projectId, name })
  toast.success('Project renamed')
  onOpenChange(false)
} catch (error) {
  toast.error('Failed to rename project. Please try again.')
  // Error already reported to Sentry by hook
}
```

**Rationale**:
- Separation of concerns: Logging ≠ user feedback
- Hook remains UI-agnostic (could be used in CLI, API, etc.)
- Component controls UX (toast vs inline vs modal)
- Sentry tags enable error tracking and debugging

**Reference**: `standards/global/error-handling.md`

---

## 10. Type Safety Best Practices Research

### Decision: Zod Runtime Validation + TypeScript Static Typing

**Pattern**:
```typescript
// 1. Define Zod schema (single source of truth)
export const updateProjectInputSchema = z.object({
  name: z.string().min(1).max(100),
})

// 2. Infer TypeScript type from schema
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>

// 3. Use in function signatures
export interface RenameProjectInput {
  projectId: string
  name: string // Validated at runtime with Zod
}

// 4. Validate in mutation function
mutationFn: async (input: RenameProjectInput) => {
  const validated = updateProjectInputSchema.parse({ name: input.name })
  // validated.name is guaranteed to be valid
}
```

**Benefits**:
- TypeScript catches type errors at compile time
- Zod catches invalid data at runtime
- Single source of truth (schema defines both)
- Error messages come from Zod schema

**Reference**: `standards/global/zod-validation.md` - "Always validate external input"

---

## 11. Mobile-First Design Research

### Decision: All Interactive Elements ≥ 44x44px

**Findings from Codebase**:
```typescript
// shadcn/ui Button component default sizing
<Button size="icon"> // 44x44px minimum (meets mobile standard)
<Button size="sm">   // 40px height (use sparingly)
<Button size="default"> // 44px height ✅
<Button size="lg">   // 48px height ✅
```

**Dropdown Menu Sizing**:
- Trigger button: 44x44px (icon button)
- Menu items: 40px height (acceptable for tappable list items)
- Touch-friendly spacing: 4px between items

**Dialog Input Sizing**:
- Input height: 44px (via shadcn/ui defaults)
- Button height: 44px
- Touch target spacing: 16px minimum

**Reference**: Constitution Principle I - "Minimum touch target size: 44x44px for all interactive elements"

---

## 12. Testing Strategy Research

### Decision: Unit Tests for Mutation Hook, Integration Tests for Component

**Hook Testing** (following `useUpdateWorkspace.test.tsx` pattern):
```typescript
describe('useRenameProject', () => {
  it('should rename project successfully', async () => {
    // Test mutation function
    // Mock Firestore transaction
    // Verify query invalidation
  })

  it('should handle errors', async () => {
    // Test error handling
    // Verify Sentry reporting
  })

  it('should validate input', async () => {
    // Test Zod schema validation
    // Verify validation errors
  })
})
```

**Component Testing** (following `WorkspaceSettingsForm.test.tsx` pattern):
```typescript
describe('RenameProjectDialog', () => {
  it('should render with initial name', () => {
    // Test component renders
    // Verify input value
  })

  it('should submit rename on form submit', async () => {
    // Test form submission
    // Verify mutation called
    // Verify toast shown
  })
})
```

**Coverage Goal**: ~70% (matches existing feature coverage)

**Reference**: Constitution Principle IV - "Focus on critical user flows"

---

## Summary of Research Decisions

| Decision | Rationale | Alternative Rejected |
|----------|-----------|---------------------|
| Follow `useRenameProjectEvent` pattern | Proven, consistent, testable | Custom implementation (NIH syndrome) |
| Use Firestore transactions | Prevents timestamp placeholder errors | Direct updateDoc (causes parse errors) |
| Remove navigation from hook | Single Responsibility Principle | Keep with optional flag (complexity) |
| shadcn/ui DropdownMenu | Accessible, mobile-friendly | Custom dropdown (accessibility harder) |
| Separate entity/input schemas | Different validation contexts | Single schema with `.partial()` |
| Sentry in hook, toast in component | Layered error handling | All error handling in hook (coupling) |
| onSnapshot + query invalidation | Real-time updates | Polling or manual refetch |
| 44px minimum touch targets | Mobile-first constitution | Desktop-first sizing |

---

**Research Status**: ✅ Complete - No "NEEDS CLARIFICATION" items remaining

All technical decisions documented and justified. Ready to proceed to Phase 1 (Design & Contracts).
