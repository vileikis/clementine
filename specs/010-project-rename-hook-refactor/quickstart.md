# Quickstart: Project Rename & Hook Refactor

**Feature**: 010-project-rename-hook-refactor
**Date**: 2026-01-03
**Estimated Time**: 2-3 hours
**Skill Level**: Intermediate

## Overview

This quickstart guide walks you through implementing the project rename feature and refactoring the `useCreateProject` hook step-by-step. Follow the order exactly to avoid circular dependencies and ensure smooth implementation.

**What You'll Build**:
- ✅ Rename project functionality (hook + dialog)
- ✅ Refactored `useCreateProject` (remove navigation side effect)
- ✅ Context menu integration (dropdown with actions)
- ✅ Real-time UI updates via Firestore

**Prerequisites**:
- Familiarity with TypeScript, React, TanStack Query
- Understanding of Firebase Firestore client SDK
- Basic knowledge of Zod validation
- Experience with shadcn/ui components

---

## Step 1: Add Schema and Types (5 minutes)

### 1.1 Update Project Schema

**File**: `apps/clementine-app/src/domains/workspace/projects/schemas/project.schemas.ts`

Add the update input schema after existing schemas:

```typescript
/**
 * Validates project update input (rename operation)
 */
export const updateProjectInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long'),
})

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>
```

### 1.2 Update Project Types

**File**: `apps/clementine-app/src/domains/workspace/projects/types/project.types.ts`

Add these type definitions after existing types:

```typescript
/**
 * Input type for renaming a project
 */
export interface RenameProjectInput {
  projectId: string
  name: string
}

/**
 * Input type for updating project fields
 * Aligned with updateProjectInputSchema
 */
export interface UpdateProjectInput {
  name: string
}
```

**Checkpoint**: Run `pnpm type-check` to verify no type errors.

---

## Step 2: Create Rename Hook (15 minutes)

### 2.1 Create Hook File

**File**: `apps/clementine-app/src/domains/workspace/projects/hooks/useRenameProject.ts`

**Pattern Reference**: Copy structure from `domains/project/events/hooks/useRenameProjectEvent.ts`

```typescript
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import { firestore } from '@/integrations/firebase/client'
import { updateProjectInputSchema } from '../schemas/project.schemas'
import type { RenameProjectInput } from '../types/project.types'

export function useRenameProject(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RenameProjectInput) => {
      // Validate input
      const validated = updateProjectInputSchema.parse({
        name: input.name,
      })

      // Use transaction to ensure serverTimestamp resolves
      return await runTransaction(firestore, async (transaction) => {
        const projectRef = doc(firestore, 'projects', input.projectId)

        // Verify project exists
        const projectDoc = await transaction.get(projectRef)
        if (!projectDoc.exists()) {
          throw new Error('Project not found')
        }

        // Update name and timestamp
        transaction.update(projectRef, {
          name: validated.name,
          updatedAt: serverTimestamp(),
        })

        // Return data for consumer
        return {
          projectId: input.projectId,
          name: validated.name,
        }
      })
    },

    onSuccess: () => {
      // Invalidate projects query to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['projects', workspaceId],
      })
    },

    onError: (error) => {
      // Report to Sentry (no UI handling)
      Sentry.captureException(error, {
        tags: {
          domain: 'workspace/projects',
          action: 'rename-project',
        },
        extra: {
          errorType: 'project-rename-failure',
        },
      })
    },
  })
}
```

### 2.2 Export Hook

**File**: `apps/clementine-app/src/domains/workspace/projects/hooks/index.ts`

Add export to barrel file:

```typescript
export * from './useRenameProject'
```

**Checkpoint**: Run `pnpm type-check` - should pass without errors.

---

## Step 3: Create Rename Dialog Component (20 minutes)

### 3.1 Create Dialog Component

**File**: `apps/clementine-app/src/domains/workspace/projects/components/RenameProjectDialog.tsx`

**Pattern Reference**: Copy structure from `domains/project/events/components/RenameProjectEventDialog.tsx`

```typescript
import { useState, useEffect, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/ui-kit/components/dialog'
import { Button } from '@/ui-kit/components/button'
import { Input } from '@/ui-kit/components/input'
import { Label } from '@/ui-kit/components/label'
import { useRenameProject } from '../hooks/useRenameProject'

export interface RenameProjectDialogProps {
  projectId: string
  workspaceId: string
  initialName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameProjectDialog({
  projectId,
  workspaceId,
  initialName,
  open,
  onOpenChange,
}: RenameProjectDialogProps) {
  const [name, setName] = useState(initialName)
  const renameProject = useRenameProject(workspaceId)

  // Reset name when dialog closes or initialName changes
  useEffect(() => {
    if (!open) {
      setName(initialName)
    }
  }, [open, initialName])

  const handleSubmit = async (e: FormEvent) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={renameProject.isPending}
                autoFocus
                placeholder="Enter project name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={renameProject.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={renameProject.isPending}
            >
              {renameProject.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 3.2 Export Component

**File**: `apps/clementine-app/src/domains/workspace/projects/components/index.ts`

Add export to barrel file:

```typescript
export * from './RenameProjectDialog'
```

**Checkpoint**: Run `pnpm type-check` - should pass.

---

## Step 4: Update ProjectListItem with Context Menu (25 minutes)

### 4.1 Add Context Menu to ProjectListItem

**File**: `apps/clementine-app/src/domains/workspace/projects/components/ProjectListItem.tsx`

**Pattern Reference**: Follow `domains/project/events/components/ProjectEventItem.tsx`

**Changes**:
1. Add `workspaceId` prop (needed for rename hook context)
2. Add state for rename dialog open
3. Replace delete button with dropdown menu
4. Add rename and delete menu items
5. Render `RenameProjectDialog` component

```typescript
import { useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/ui-kit/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui-kit/components/dropdown-menu'
import { RenameProjectDialog } from './RenameProjectDialog'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import type { Project } from '../types/project.types'

export interface ProjectListItemProps {
  project: Project
  workspaceId: string        // ADD: needed for rename hook
  workspaceSlug: string
  onDelete: (projectId: string) => void
  isDeleting: boolean
}

export function ProjectListItem({
  project,
  workspaceId,              // ADD: new prop
  workspaceSlug,
  onDelete,
  isDeleting,
}: ProjectListItemProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)  // ADD
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg">
        {/* Project info */}
        <div className="flex-1">
          <h3 className="font-medium">{project.name}</h3>
          <p className="text-sm text-muted-foreground">
            Status: {project.status}
          </p>
        </div>

        {/* Context menu (REPLACE delete button with this) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
            >
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

      {/* Rename dialog (ADD) */}
      <RenameProjectDialog
        projectId={project.id}
        workspaceId={workspaceId}
        initialName={project.name}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      />

      {/* Delete dialog (EXISTING - move outside div) */}
      <DeleteProjectDialog
        projectId={project.id}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => onDelete(project.id)}
        isDeleting={isDeleting}
      />
    </>
  )
}
```

### 4.2 Update ProjectsPage Container

**File**: `apps/clementine-app/src/domains/workspace/projects/containers/ProjectsPage.tsx`

Update `ProjectListItem` usage to pass `workspaceId`:

```typescript
<ProjectListItem
  project={project}
  workspaceId={workspaceId}  // ADD: pass workspace ID
  workspaceSlug={workspaceSlug}
  onDelete={handleDeleteProject}
  isDeleting={deleteProject.isPending}
/>
```

**Checkpoint**:
- Run `pnpm type-check` - should pass
- Run `pnpm dev` and test rename feature in browser

---

## Step 5: Refactor useCreateProject Hook (10 minutes)

### 5.1 Remove Navigation Side Effect

**File**: `apps/clementine-app/src/domains/workspace/projects/hooks/useCreateProject.ts`

**BEFORE**:
```typescript
onSuccess: ({ projectId, workspaceId, workspaceSlug }) => {
  queryClient.invalidateQueries({
    queryKey: ['projects', workspaceId],
  })

  // ❌ REMOVE: Navigation side effect
  navigate({
    to: '/workspace/$workspaceSlug/projects/$projectId',
    params: { workspaceSlug, projectId },
  })
},
```

**AFTER**:
```typescript
onSuccess: ({ workspaceId }) => {
  queryClient.invalidateQueries({
    queryKey: ['projects', workspaceId],
  })
  // Navigation now handled by consumer
},
```

**Changes**:
1. Remove `navigate` import
2. Remove navigation logic from `onSuccess`
3. Keep query invalidation
4. Keep return value structure (consumer needs it)

**Checkpoint**: Run `pnpm type-check` - should pass.

---

## Step 6: Update Create Project Consumer (15 minutes)

### 6.1 Update ProjectsPage to Handle Navigation

**File**: `apps/clementine-app/src/domains/workspace/projects/containers/ProjectsPage.tsx`

**BEFORE**:
```typescript
const handleCreateProject = () => {
  createProject.mutate({
    workspaceId,
    workspaceSlug,
    name: 'New Project',
  })
  // Navigation happens in hook
}
```

**AFTER**:
```typescript
const handleCreateProject = async () => {
  try {
    const result = await createProject.mutateAsync({
      workspaceId,
      workspaceSlug,
      name: 'New Project',
    })

    // Consumer handles navigation
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

**Changes**:
1. Make function `async`
2. Change `mutate` to `mutateAsync`
3. Add navigation after successful mutation
4. Add toast notifications for success/error
5. Add try/catch for error handling

**Imports to add**:
```typescript
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
```

**Checkpoint**:
- Run `pnpm type-check` - should pass
- Run `pnpm dev` and test create project flow

---

## Step 7: Validation & Testing (20 minutes)

### 7.1 Run Validation Gates

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Formatting
pnpm format

# All checks
pnpm check
```

**Expected**: All checks pass ✅

### 7.2 Manual Testing Checklist

**Rename Project**:
- [ ] Click context menu (three dots) on project
- [ ] Click "Rename" - dialog opens with current name
- [ ] Edit name and submit - dialog closes, toast shows "Project renamed"
- [ ] Project list updates with new name (real-time)
- [ ] Try empty name - shows validation error
- [ ] Try name >100 chars - shows validation error
- [ ] Test on mobile viewport (320px) - touch targets ≥44px

**Create Project (Refactored)**:
- [ ] Click "Create Project" button
- [ ] Navigates to new project details page
- [ ] Toast shows "Project created"
- [ ] Try creating with network error - shows error toast
- [ ] Navigation still works after successful create

**Context Menu UX**:
- [ ] Menu trigger is ≥44px (mobile-friendly)
- [ ] Dropdown aligns to right edge (doesn't overflow)
- [ ] Delete option has red text (destructive styling)
- [ ] Keyboard navigation works (Tab, Enter, Escape)

### 7.3 Edge Cases to Test

| Scenario | Expected Behavior |
|----------|-------------------|
| Rename to same name | Success (no-op) |
| Rename during slow network | Loading state shown, button disabled |
| Open rename dialog, close without submitting | State resets to initial name |
| Open two rename dialogs (tabs/windows) | Both work independently, real-time sync |
| Rename non-existent project | Error toast shown, Sentry error logged |
| Create project without name | Generates default name |

---

## Step 8: Final Review (10 minutes)

### 8.1 Code Quality Checklist

- [ ] All TypeScript types defined (no `any`)
- [ ] Zod schema validates all user inputs
- [ ] Hook handles only data operations (no UI logic)
- [ ] Component handles UI feedback (toasts)
- [ ] Error reporting to Sentry in hooks
- [ ] Barrel exports updated (`hooks/index.ts`, `components/index.ts`)
- [ ] No console.log statements left behind
- [ ] Code follows existing patterns (consistency)

### 8.2 Standards Compliance Review

**Design System** (`frontend/design-system.md`):
- [ ] Using theme tokens (no hard-coded colors)
- [ ] Using shadcn/ui components (no custom UI)
- [ ] Proper variant usage (`variant="outline"`, `variant="ghost"`)

**Component Libraries** (`frontend/component-libraries.md`):
- [ ] Extending shadcn/ui components (not modifying source)
- [ ] Accessibility preserved (ARIA labels, keyboard nav)
- [ ] Semantic HTML (`<form>`, `<button type="submit">`)

**Firestore** (`backend/firestore.md`):
- [ ] Using transactions for `serverTimestamp()` mutations
- [ ] Reading document before update (existence check)
- [ ] Query invalidation after mutations

**Project Structure** (`global/project-structure.md`):
- [ ] Following vertical slice architecture (all code in `projects/`)
- [ ] Barrel exports in place
- [ ] Only exporting public API (components, hooks, types)

---

## Troubleshooting

### Issue: Type errors in ProjectListItem

**Symptom**: `Property 'workspaceId' does not exist`

**Solution**: Make sure you updated `ProjectListItemProps` interface to include `workspaceId: string`

---

### Issue: Dialog doesn't close after rename

**Symptom**: Dialog stays open after successful rename

**Solution**: Verify `onOpenChange(false)` is called in `handleSubmit` after successful mutation

---

### Issue: Zod validation error on timestamp

**Symptom**: `Expected number, received object`

**Solution**: Make sure you're using `runTransaction` (not `updateDoc`) to wait for `serverTimestamp()` to resolve

---

### Issue: Navigation doesn't work after create

**Symptom**: Project created but page doesn't navigate

**Solution**: Check that you're using `mutateAsync` (not `mutate`) and awaiting the result before calling `navigate()`

---

### Issue: Real-time updates not working

**Symptom**: Renamed project doesn't update in list without refresh

**Solution**:
1. Verify query invalidation is happening in hook's `onSuccess`
2. Check that `useProjects` has `onSnapshot` listener set up
3. Confirm query key matches: `['projects', workspaceId]`

---

## Next Steps

After completing this feature:

1. **Run Tests**: Write unit tests for `useRenameProject` hook
2. **Document**: Update component library docs if needed
3. **Deploy**: Create PR following team process
4. **Monitor**: Check Sentry for any rename-related errors post-deploy

---

## Summary

**What You Built**:
- ✅ Rename project hook (`useRenameProject`)
- ✅ Rename dialog component (`RenameProjectDialog`)
- ✅ Context menu with rename/delete actions
- ✅ Refactored `useCreateProject` (no navigation side effect)
- ✅ Updated consumers to handle navigation

**Files Created** (2):
- `hooks/useRenameProject.ts`
- `components/RenameProjectDialog.tsx`

**Files Modified** (6):
- `schemas/project.schemas.ts`
- `types/project.types.ts`
- `hooks/index.ts`
- `components/index.ts`
- `components/ProjectListItem.tsx`
- `containers/ProjectsPage.tsx`
- `hooks/useCreateProject.ts`

**Total Time**: ~2-3 hours

**Validation Gates**: ✅ All passed (type-check, lint, format, manual testing)
