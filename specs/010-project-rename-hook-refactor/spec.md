# PRD: Project Rename & Hook Refactor

## Goal

Add the ability to rename projects and refactor mutation hooks to follow the principle of minimal side effects (database operations only, no navigation).

---

## Scope

This PRD covers:

1. **Rename Project Feature** - Allow workspace admins to rename projects
2. **Hook Refactor** - Update `useCreateProject` to not include navigation side effects

---

## Users

- **Workspace Admin** (authenticated, authorized for the workspace)

---

## Part 1: Rename Project Feature

### Pattern Reference

Follow the same pattern as event renaming in `domains/project/events`:

- Hook: `useRenameProjectEvent.ts`
- Dialog: `RenameProjectEventDialog.tsx`
- Schema: `updateProjectEventInputSchema`
- Integration: `ProjectEventItem.tsx`

### Implementation Requirements

#### 1.1 Schema Addition

**Location:** `domains/workspace/projects/schemas/project.schemas.ts`

Add an update schema for project renaming:

```ts
export const updateProjectInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long'),
})

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>
```

#### 1.2 Rename Hook

**Location:** `domains/workspace/projects/hooks/useRenameProject.ts`

Create a new hook following the `useRenameProjectEvent` pattern:

```ts
export interface RenameProjectInput {
  projectId: string
  name: string
}

export function useRenameProject(workspaceId: string)
```

**Behavior:**

- Accepts `projectId` and `name` as input
- Uses Firestore transaction (same pattern as events)
- Validates input with `updateProjectInputSchema`
- Verifies project exists before updating
- Updates `name` and `updatedAt` fields
- Invalidates `['projects', workspaceId]` query on success
- Reports errors to Sentry with domain tag `workspace/projects`

#### 1.3 Rename Dialog Component

**Location:** `domains/workspace/projects/components/RenameProjectDialog.tsx`

Create a dialog component following `RenameProjectEventDialog` pattern:

**Props:**

```ts
export interface RenameProjectDialogProps {
  projectId: string
  workspaceId: string
  initialName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Features:**

- Input validation (min 1 char, max 100 chars)
- Loading state during mutation
- Auto-close on successful rename
- Keyboard shortcuts (Enter to submit, Escape to cancel)
- Toast notifications for success/error
- Accessible with proper labels

#### 1.4 ProjectListItem Update

**Location:** `domains/workspace/projects/components/ProjectListItem.tsx`

Update to include rename functionality:

**New Props:**

```ts
interface ProjectListItemProps {
  project: Project
  workspaceId: string // Add for rename hook
  workspaceSlug: string
  onDelete: (projectId: string) => void
  isDeleting: boolean
}
```

**New Features:**

- Add context menu (DropdownMenu) with actions:
  - **Rename** - Opens RenameProjectDialog
  - **Delete** - Opens DeleteProjectDialog (existing)
- Replace direct delete button with context menu trigger
- Follow same UX pattern as `ProjectEventItem.tsx`

#### 1.5 Type Export

**Location:** `domains/workspace/projects/types/project.types.ts`

Add:

```ts
export interface RenameProjectInput {
  projectId: string
  name: string
}

export interface UpdateProjectInput {
  name: string
}
```

#### 1.6 Barrel Exports

Update `domains/workspace/projects/hooks/index.ts`:

```ts
export * from './useRenameProject'
```

Update `domains/workspace/projects/components/index.ts`:

```ts
export * from './RenameProjectDialog'
```

---

## Part 2: useCreateProject Hook Refactor

### Current Problem

The `useCreateProject` hook currently includes navigation as a side effect in `onSuccess`, which:

- Violates the principle of single responsibility
- Makes the hook harder to test
- Limits reusability (what if we don't want to navigate?)

### Implementation Requirements

#### 2.1 Remove Navigation Side Effect

**Location:** `domains/workspace/projects/hooks/useCreateProject.ts`

**Before:**

```ts
onSuccess: ({ projectId, workspaceId, workspaceSlug }) => {
  queryClient.invalidateQueries({
    queryKey: ['projects', workspaceId],
  })

  // Navigation should be removed
  navigate({
    to: '/workspace/$workspaceSlug/projects/$projectId',
    params: { workspaceSlug, projectId },
  })
},
```

**After:**

```ts
onSuccess: ({ workspaceId }) => {
  queryClient.invalidateQueries({
    queryKey: ['projects', workspaceId],
  })
  // No navigation - consumers handle this
},
```

#### 2.2 Return Value

The hook should return the mutation result that includes:

```ts
{
  projectId: string
  workspaceId: string
  workspaceSlug: string
}
```

This allows consumers to use `mutateAsync` and handle navigation:

```ts
const createProject = useCreateProject()

const handleCreate = async () => {
  const result = await createProject.mutateAsync({
    workspaceId,
    workspaceSlug,
    name: 'My Project',
  })

  // Consumer decides navigation
  navigate({
    to: '/workspace/$workspaceSlug/projects/$projectId',
    params: { workspaceSlug: result.workspaceSlug, projectId: result.projectId },
  })
}
```

#### 2.3 Update Consumers

Find and update all consumers of `useCreateProject` to handle navigation themselves.

**Likely locations:**

- `ProjectsPage.tsx` or similar container
- Any "Create Project" button component

---

## Files to Create

| File                                                                | Description             |
| ------------------------------------------------------------------- | ----------------------- |
| `domains/workspace/projects/hooks/useRenameProject.ts`              | Rename mutation hook    |
| `domains/workspace/projects/components/RenameProjectDialog.tsx`     | Rename dialog component |

---

## Files to Modify

| File                                                                | Changes                                       |
| ------------------------------------------------------------------- | --------------------------------------------- |
| `domains/workspace/projects/schemas/project.schemas.ts`             | Add `updateProjectInputSchema`                |
| `domains/workspace/projects/types/project.types.ts`                 | Add `RenameProjectInput`, `UpdateProjectInput` types |
| `domains/workspace/projects/hooks/index.ts`                         | Export `useRenameProject`                     |
| `domains/workspace/projects/components/index.ts`                    | Export `RenameProjectDialog`                  |
| `domains/workspace/projects/components/ProjectListItem.tsx`         | Add context menu with rename action           |
| `domains/workspace/projects/hooks/useCreateProject.ts`              | Remove navigation side effect                 |
| Consumer components (e.g., `ProjectsPage.tsx`)                      | Add navigation after create                   |

---

## Non-Goals

- Bulk rename functionality
- Rename history/undo
- Real-time rename sync across tabs (Firestore handles this)
- Renaming from project details page (future enhancement)

---

## Acceptance Criteria

### Rename Project

- [ ] Admin can click a menu button on a project item to see actions
- [ ] "Rename" option opens a dialog with the current project name
- [ ] Dialog validates name (1-100 characters, non-empty)
- [ ] Submitting updates the project name in Firestore
- [ ] Success shows a toast notification "Project renamed"
- [ ] Error shows appropriate error message
- [ ] Dialog closes on successful rename
- [ ] Project list updates to show new name (query invalidation)
- [ ] Keyboard shortcuts work (Enter to submit, Escape to cancel)

### useCreateProject Refactor

- [ ] `useCreateProject` no longer navigates after creation
- [ ] `useCreateProject` still invalidates the projects query
- [ ] `useCreateProject` returns project data for consumer navigation
- [ ] All consumers of `useCreateProject` handle navigation themselves
- [ ] Create project flow still navigates to project details (from consumer)

---

## Technical Notes

### Query Key Pattern

Projects use `['projects', workspaceId]` as the query key. Both rename and create operations must invalidate this key to trigger list refresh.

### Transaction Pattern

Both rename and existing create/delete operations use Firestore transactions to ensure:

1. Server timestamps resolve before returning
2. Document existence is verified before updates
3. Consistent read-then-write operations

### Error Handling Pattern

All mutations follow the established pattern:

```ts
onError: (error) => {
  Sentry.captureException(error, {
    tags: {
      domain: 'workspace/projects',
      action: 'rename-project', // or 'create-project'
    },
    extra: {
      errorType: 'project-rename-failure',
    },
  })
}
```

UI error handling (toasts) is done in the component layer, not the hook layer.

