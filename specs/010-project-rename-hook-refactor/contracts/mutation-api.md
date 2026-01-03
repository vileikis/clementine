# Mutation API Contract: Project Rename & Hook Refactor

**Feature**: 010-project-rename-hook-refactor
**Date**: 2026-01-03
**Contract Type**: Client-Side Mutation Hooks (TanStack Query)

## Overview

This document defines the API contract for mutation hooks in the project rename feature. Since this is a client-first architecture using Firebase Client SDK, there are no REST/GraphQL endpoints. Instead, we define the TypeScript API for React hooks that consumers will use.

---

## Hook: `useRenameProject`

### Purpose

Rename an existing project in a workspace.

### Hook Signature

```typescript
export function useRenameProject(
  workspaceId: string
): UseMutationResult<RenameProjectOutput, Error, RenameProjectInput>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | string | Yes | Workspace ID for query invalidation context |

### Input Type

```typescript
interface RenameProjectInput {
  projectId: string  // ID of the project to rename
  name: string       // New project name (1-100 characters)
}
```

### Input Validation

```typescript
const updateProjectInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long'),
})
```

**Validation Errors**:
- Empty string: `"Project name is required"`
- >100 characters: `"Project name too long"`
- Non-string: Zod type error

### Output Type

```typescript
interface RenameProjectOutput {
  projectId: string
  name: string
}
```

### Return Value

```typescript
UseMutationResult<RenameProjectOutput, Error, RenameProjectInput>
```

**Properties**:
- `mutate(input)` - Fire-and-forget mutation
- `mutateAsync(input)` - Promise-based mutation (for error handling)
- `isPending` - Loading state
- `isError` - Error state
- `isSuccess` - Success state
- `error` - Error object (if any)
- `data` - Output data (if successful)
- `reset()` - Reset mutation state

### Side Effects

**onSuccess**:
- Invalidates `['projects', workspaceId]` query cache
- Does NOT navigate (consumer handles navigation)
- Does NOT show toast (consumer handles UI feedback)

**onError**:
- Reports exception to Sentry with tags:
  ```typescript
  {
    tags: {
      domain: 'workspace/projects',
      action: 'rename-project'
    },
    extra: {
      errorType: 'project-rename-failure'
    }
  }
  ```
- Does NOT show user-facing error (consumer handles toast)

### Error Cases

| Error Type | Cause | Error Message |
|------------|-------|---------------|
| `ZodError` | Invalid input (empty, too long) | Zod validation error message |
| `Error` | Project not found | `"Project not found"` |
| `FirebaseError` | Permission denied | Firestore security rule error |
| `FirebaseError` | Network failure | Firebase network error message |

### Usage Example

```typescript
import { useRenameProject } from '@/domains/workspace/projects'

function RenameProjectDialog({ projectId, workspaceId, initialName, open, onOpenChange }) {
  const [name, setName] = useState(initialName)
  const renameProject = useRenameProject(workspaceId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await renameProject.mutateAsync({ projectId, name })
      toast.success('Project renamed')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to rename project. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={renameProject.isPending}
      />
      <button type="submit" disabled={renameProject.isPending}>
        {renameProject.isPending ? 'Renaming...' : 'Rename'}
      </button>
    </form>
  )
}
```

---

## Hook: `useCreateProject` (REFACTORED)

### Purpose

Create a new project in a workspace.

### Changes in This Feature

**What Changed**:
- ❌ Removed navigation side effect from `onSuccess`
- ✅ Kept query invalidation in `onSuccess`
- ✅ Kept return value structure (consumer needs for navigation)

**What Stayed the Same**:
- Hook signature
- Input type
- Output type
- Mutation logic
- Error handling

### Hook Signature

```typescript
export function useCreateProject(): UseMutationResult<CreateProjectOutput, Error, CreateProjectInput>
```

### Input Type

```typescript
interface CreateProjectInput {
  workspaceId: string
  workspaceSlug: string  // Used by consumer for navigation
  name?: string          // Optional, defaults to generated name
}
```

### Output Type

```typescript
interface CreateProjectOutput {
  projectId: string
  workspaceId: string
  workspaceSlug: string  // Consumer uses this for navigation
}
```

### Side Effects (BEFORE)

```typescript
onSuccess: ({ projectId, workspaceId, workspaceSlug }) => {
  queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })

  // ❌ Navigation side effect (REMOVED)
  navigate({
    to: '/workspace/$workspaceSlug/projects/$projectId',
    params: { workspaceSlug, projectId },
  })
}
```

### Side Effects (AFTER)

```typescript
onSuccess: ({ workspaceId }) => {
  queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
  // No navigation - consumer handles this using return value
}
```

### Migration Guide for Consumers

**BEFORE** (old usage):
```typescript
const createProject = useCreateProject()

const handleCreate = () => {
  createProject.mutate({
    workspaceId,
    workspaceSlug,
    name: 'New Project',
  })
  // Navigation happens automatically in hook
}
```

**AFTER** (new usage):
```typescript
const createProject = useCreateProject()

const handleCreate = async () => {
  try {
    const result = await createProject.mutateAsync({
      workspaceId,
      workspaceSlug,
      name: 'New Project',
    })

    // Consumer now handles navigation explicitly
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

**Breaking Changes**: ❌ None
- Hook signature unchanged
- Return value unchanged
- Consumers can opt-in to new pattern gradually
- Old consumers that don't navigate will still work (just won't navigate)

**Recommended Migration**:
1. Update consumers to use `mutateAsync` instead of `mutate`
2. Add explicit navigation after successful mutation
3. Add toast notifications for success/error

---

## Component API: `RenameProjectDialog`

### Purpose

Dialog component for renaming a project.

### Props

```typescript
interface RenameProjectDialogProps {
  projectId: string        // ID of project to rename
  workspaceId: string      // Workspace ID (for hook context)
  initialName: string      // Current project name (pre-fills input)
  open: boolean            // Dialog open state
  onOpenChange: (open: boolean) => void  // Dialog state change handler
}
```

### Behavior

**Input Validation**:
- Min: 1 character (required)
- Max: 100 characters (enforced)
- Real-time validation feedback (via Zod)

**Loading State**:
- Disables input during mutation (`renameProject.isPending`)
- Disables buttons during mutation
- Shows loading text: "Renaming..." instead of "Rename"

**Success Handling**:
- Calls `onOpenChange(false)` to close dialog
- Shows success toast: "Project renamed"
- Resets form state after close

**Error Handling**:
- Shows error toast: "Failed to rename project. Please try again."
- Keeps dialog open for retry
- Does not reset form state

**Keyboard Shortcuts**:
- Enter: Submit form (if input valid)
- Escape: Close dialog (via `onOpenChange(false)`)

**Accessibility**:
- Form semantics (`<form>`, `<button type="submit">`)
- Label associated with input (`htmlFor="name"`)
- Auto-focus on input when dialog opens
- Disabled state on buttons (prevents double-submit)

### Usage Example

```typescript
import { RenameProjectDialog } from '@/domains/workspace/projects'

function ProjectListItem({ project, workspaceId }) {
  const [renameOpen, setRenameOpen] = useState(false)

  return (
    <>
      <div className="project-item">
        <span>{project.name}</span>
        <button onClick={() => setRenameOpen(true)}>Rename</button>
      </div>

      <RenameProjectDialog
        projectId={project.id}
        workspaceId={workspaceId}
        initialName={project.name}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
    </>
  )
}
```

---

## Real-time Updates Contract

### Query Hook: `useProjects`

**Query Key**: `['projects', workspaceId]`

**Invalidation Behavior**:
```typescript
// When useRenameProject succeeds
queryClient.invalidateQueries({
  queryKey: ['projects', workspaceId]
})
```

**Real-time Listener**:
```typescript
// useProjects sets up onSnapshot listener
onSnapshot(
  query(
    collection(firestore, 'projects'),
    where('workspaceId', '==', workspaceId),
    where('status', '!=', 'deleted'),
    orderBy('status'),
    orderBy('createdAt', 'desc')
  ),
  (snapshot) => {
    const projects = snapshot.docs.map(convertFirestoreDoc)
    queryClient.setQueryData(['projects', workspaceId], projects)
  }
)
```

**Update Flow**:
1. User submits rename dialog
2. `useRenameProject` mutation updates Firestore
3. Firestore triggers `onSnapshot` listener
4. Listener updates query cache via `setQueryData`
5. All components using `useProjects` re-render with new name

**Guarantees**:
- Real-time updates across all browser tabs
- No manual refetch needed
- Optimistic updates not required (Firestore is fast enough)
- Transaction ensures `updatedAt` is resolved before listener fires

---

## TypeScript Type Exports

### Public API (exported from domain)

```typescript
// Hooks
export { useRenameProject } from './hooks/useRenameProject'
export { useCreateProject } from './hooks/useCreateProject'

// Components
export { RenameProjectDialog } from './components/RenameProjectDialog'

// Types
export type { RenameProjectInput, UpdateProjectInput } from './types/project.types'
export type { Project, CreateProjectInput, DeleteProjectInput } from './types/project.types'
```

### Internal API (NOT exported)

```typescript
// Schemas (internal validation only)
import { updateProjectInputSchema } from './schemas/project.schemas'

// Mutation functions (wrapped by hooks)
import { renameProjectMutation } from './hooks/useRenameProject'
```

---

## Error Handling Contract

### Hook Layer (Mutation)

**Responsibility**: Report errors to monitoring, no UI handling

```typescript
onError: (error) => {
  // Log to Sentry for debugging
  Sentry.captureException(error, {
    tags: {
      domain: 'workspace/projects',
      action: 'rename-project',
    },
    extra: {
      errorType: 'project-rename-failure',
    },
  })
  // Do NOT show toast or alert - component handles that
}
```

### Component Layer (Dialog)

**Responsibility**: User-facing error messages

```typescript
try {
  await renameProject.mutateAsync({ projectId, name })
  toast.success('Project renamed')
  onOpenChange(false)
} catch (error) {
  // Show user-friendly error message
  toast.error('Failed to rename project. Please try again.')
  // Error already logged by hook
  // Dialog stays open for retry
}
```

### Error Message Standards

| Error Type | User Message | Sentry Tag |
|------------|--------------|------------|
| Validation error | "Project name is required" (from Zod) | N/A (validation) |
| Not found | "Failed to rename project. Please try again." | `action: 'rename-project'` |
| Permission denied | "Failed to rename project. Please try again." | `action: 'rename-project'` |
| Network error | "Failed to rename project. Please try again." | `action: 'rename-project'` |

**Rationale**: Generic user message prevents leaking implementation details, Sentry captures specifics for debugging.

---

## Testing Contract

### Unit Tests (Hook)

**Test Coverage**:
```typescript
describe('useRenameProject', () => {
  it('should rename project successfully')
  it('should handle project not found error')
  it('should validate input with Zod schema')
  it('should invalidate projects query on success')
  it('should report errors to Sentry')
})
```

### Integration Tests (Component)

**Test Coverage**:
```typescript
describe('RenameProjectDialog', () => {
  it('should render with initial name')
  it('should validate input (min/max length)')
  it('should disable inputs during mutation')
  it('should close dialog on success')
  it('should show error toast on failure')
  it('should reset state when dialog closes')
})
```

### E2E Flow (Manual Testing)

1. Open project list
2. Click context menu on project
3. Click "Rename"
4. Dialog opens with current name
5. Edit name and submit
6. Dialog closes
7. Toast shows success
8. Project list updates with new name (real-time)

---

## Summary

**New APIs**:
- ✅ `useRenameProject` hook
- ✅ `RenameProjectDialog` component
- ✅ `RenameProjectInput` type
- ✅ `UpdateProjectInput` type
- ✅ `updateProjectInputSchema` schema

**Refactored APIs**:
- ✅ `useCreateProject` hook (removed navigation side effect)

**Breaking Changes**: ❌ None

**Backward Compatibility**: ✅ Yes
- All existing APIs unchanged
- Hook signature unchanged
- Return values unchanged
- Only internal behavior changed (navigation moved to consumer)
