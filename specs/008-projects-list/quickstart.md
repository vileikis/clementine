# Implementation Quickstart: Projects List & Basic Project Management

**Feature**: `008-projects-list`
**Branch**: `008-projects-list`
**Date**: 2025-12-30

## Overview

This guide provides step-by-step implementation instructions for the Projects List feature. Follow the phases in order to ensure proper architecture and avoid rework.

## Prerequisites

Before starting implementation:

- [x] Read `research.md` for architectural patterns
- [x] Read `data-model.md` for entity structure
- [x] Review `contracts/` for security rules and indexes
- [ ] Ensure you're on the feature branch: `git checkout 008-projects-list`
- [ ] Ensure dev environment is running: `cd apps/clementine-app && pnpm dev`

## Implementation Phases

### Phase 1: Data Layer (Types, Schemas, Firestore Setup)

**Estimated Time**: 30 minutes

#### 1.1 Create Domain Module Structure

```bash
cd apps/clementine-app/src/domains/admin
mkdir -p projects/{types,schemas,hooks,components,containers}
touch projects/{types,schemas,hooks,components,containers}/index.ts
touch projects/index.ts
```

#### 1.2 Define TypeScript Types

**File**: `domains/admin/projects/types/project.types.ts`

```typescript
/**
 * Project lifecycle state
 * - draft: Project is being configured, not yet live
 * - live: Project is active and accessible to guests
 * - deleted: Project is soft-deleted (hidden from lists, inaccessible)
 */
export type ProjectStatus = 'draft' | 'live' | 'deleted'

/**
 * Project entity representing a photo/video experience
 */
export interface Project {
  /** Unique project identifier (Firestore document ID) */
  id: string

  /** Human-readable project name (1-100 characters) */
  name: string

  /** Reference to parent workspace (workspaceId) */
  workspaceId: string

  /** Current lifecycle state (draft | live | deleted) */
  status: ProjectStatus

  /** Reference to currently active event (null if no active event) */
  activeEventId: string | null

  /** Unix timestamp (ms) when project was soft deleted (null if active) */
  deletedAt: number | null

  /** Unix timestamp (ms) when project was created */
  createdAt: number

  /** Unix timestamp (ms) of last modification */
  updatedAt: number
}

/**
 * Input data for creating a new project
 */
export interface CreateProjectInput {
  /** Parent workspace ID */
  workspaceId: string

  /** Optional custom name (defaults to "Untitled project") */
  name?: string
}

/**
 * Input data for deleting a project
 */
export interface DeleteProjectInput {
  /** Project ID to delete */
  id: string
}
```

**Barrel Export**: `domains/admin/projects/types/index.ts`

```typescript
export * from './project.types'
```

#### 1.3 Define Zod Validation Schemas

**File**: `domains/admin/projects/schemas/project.schemas.ts`

```typescript
import { z } from 'zod'

export const projectStatusSchema = z.enum(['draft', 'live', 'deleted'])

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  workspaceId: z.string().min(1),
  status: projectStatusSchema,
  activeEventId: z.string().nullable(),
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createProjectInputSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(100).optional().default('Untitled project'),
})

export const deleteProjectInputSchema = z.object({
  id: z.string().min(1),
})

export type ProjectSchemaType = z.infer<typeof projectSchema>
export type CreateProjectInputSchemaType = z.infer<typeof createProjectInputSchema>
export type DeleteProjectInputSchemaType = z.infer<typeof deleteProjectInputSchema>
```

**Barrel Export**: `domains/admin/projects/schemas/index.ts`

```typescript
export * from './project.schemas'
```

#### 1.4 Deploy Firestore Infrastructure

**Step 1**: Add Firestore Index

Edit `firebase/firestore.indexes.json` and merge the index from `contracts/firestore.indexes.json`:

```json
{
  "indexes": [
    // ... existing indexes ...
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workspaceId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Step 2**: Add Firestore Security Rules

Edit `firebase/firestore.rules` and add the projects rules block from `contracts/firestore.rules` after the workspaces rules.

**Step 3**: Deploy to Firebase

```bash
# From monorepo root
pnpm fb:deploy:indexes   # Deploy indexes (wait for build to complete)
pnpm fb:deploy:rules     # Deploy security rules
```

**Verification**: Check Firebase Console to confirm index is active and rules are deployed.

---

### Phase 2: Data Hooks (React Query + Firestore)

**Estimated Time**: 45 minutes

#### 2.1 Create `useProjects` Hook (List Projects)

**File**: `domains/admin/projects/hooks/useProjects.ts`

```typescript
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import type { Project } from '../types'
import { firestore } from '@/integrations/firebase/client'

/**
 * List active projects in workspace with real-time updates (admin only)
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Filters by workspaceId and excludes soft-deleted projects
 * - Sorted by createdAt descending (newest first)
 *
 * @param workspaceId - Workspace to list projects from
 * @returns TanStack Query result with projects array
 */
export function useProjects(workspaceId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener
  useEffect(() => {
    const q = query(
      collection(firestore, 'projects'),
      where('workspaceId', '==', workspaceId),
      where('status', '!=', 'deleted'),
      orderBy('status'),           // Required for != query
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[]
      queryClient.setQueryData(['projects', workspaceId], projects)
    })

    return () => unsubscribe()
  }, [workspaceId, queryClient])

  return useQuery<Project[]>({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      const q = query(
        collection(firestore, 'projects'),
        where('workspaceId', '==', workspaceId),
        where('status', '!=', 'deleted'),
        orderBy('status'),
        orderBy('createdAt', 'desc')
      )

      // Initial fetch only
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[]
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
```

#### 2.2 Create `useCreateProject` Hook

**File**: `domains/admin/projects/hooks/useCreateProject.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useNavigate } from '@tanstack/react-router'
import * as Sentry from '@sentry/tanstackstart-react'
import type { CreateProjectInput } from '../types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Create project mutation (admin-only operation)
 *
 * Creates a new project with default values and redirects to project details page.
 * Follows "mutations via dedicated hooks" pattern.
 * Security enforced via Firestore rules.
 */
export function useCreateProject() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const projectsRef = collection(firestore, 'projects')

      const newProject = {
        name: input.name || 'Untitled project',
        workspaceId: input.workspaceId,
        status: 'draft' as const,
        activeEventId: null,
        deletedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(projectsRef, newProject)
      return { projectId: docRef.id, workspaceId: input.workspaceId }
    },
    onSuccess: ({ projectId, workspaceId }) => {
      // Invalidate projects list
      queryClient.invalidateQueries({
        queryKey: ['projects', workspaceId],
      })

      // Navigate to project details page
      navigate({
        to: '/workspace/$workspaceSlug/projects/$projectId',
        params: { workspaceSlug: workspaceId, projectId },
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'admin/projects',
          action: 'create-project',
        },
        extra: {
          errorType: 'project-creation-failure',
        },
      })
    },
  })
}
```

#### 2.3 Create `useDeleteProject` Hook

**File**: `domains/admin/projects/hooks/useDeleteProject.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { UpdateData } from 'firebase/firestore'
import type { Project } from '../types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Delete project mutation (admin-only operation)
 *
 * Performs soft delete by updating status and deletedAt fields.
 * Security enforced via Firestore rules.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const projectRef = doc(firestore, 'projects', projectId)

      const updateData: UpdateData<Project> = {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await updateDoc(projectRef, updateData)
      return projectId
    },
    onSuccess: () => {
      // Real-time updates via onSnapshot, but invalidate for consistency
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'admin/projects',
          action: 'delete-project',
        },
        extra: {
          errorType: 'project-deletion-failure',
        },
      })
    },
  })
}
```

**Barrel Export**: `domains/admin/projects/hooks/index.ts`

```typescript
export * from './useProjects'
export * from './useCreateProject'
export * from './useDeleteProject'
```

---

### Phase 3: UI Components

**Estimated Time**: 60 minutes

#### 3.1 Create `ProjectListEmpty` Component

**File**: `domains/admin/projects/components/ProjectListEmpty.tsx`

```typescript
import { Button } from '@/ui-kit/components/button'
import { Card } from '@/ui-kit/components/card'

interface ProjectListEmptyProps {
  onCreateProject: () => void
}

export function ProjectListEmpty({ onCreateProject }: ProjectListEmptyProps) {
  return (
    <Card className="p-8 text-center">
      <h3 className="text-lg font-semibold">No projects yet</h3>
      <p className="text-muted-foreground mt-2 mb-4">
        Create your first project to get started
      </p>
      <Button onClick={onCreateProject}>Create Project</Button>
    </Card>
  )
}
```

#### 3.2 Create `DeleteProjectDialog` Component

**File**: `domains/admin/projects/components/DeleteProjectDialog.tsx`

```typescript
import { Button } from '@/ui-kit/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/components/dialog'

interface DeleteProjectDialogProps {
  open: boolean
  projectName: string
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteProjectDialog({
  open,
  projectName,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{projectName}"? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

#### 3.3 Create `ProjectListItem` Component

**File**: `domains/admin/projects/components/ProjectListItem.tsx`

```typescript
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/ui-kit/components/badge'
import { Button } from '@/ui-kit/components/button'
import { Card } from '@/ui-kit/components/card'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import type { Project } from '../types'

interface ProjectListItemProps {
  project: Project
  workspaceSlug: string
  onDelete: (projectId: string) => void
  isDeleting: boolean
}

export function ProjectListItem({
  project,
  workspaceSlug,
  onDelete,
  isDeleting,
}: ProjectListItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    onDelete(project.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Link
            to="/workspace/$workspaceSlug/projects/$projectId"
            params={{ workspaceSlug, projectId: project.id }}
            className="flex-1"
          >
            <h3 className="font-semibold text-lg">{project.name}</h3>
            <Badge variant={project.status === 'live' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <DeleteProjectDialog
        open={showDeleteDialog}
        projectName={project.name}
        isDeleting={isDeleting}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
      />
    </>
  )
}
```

**Barrel Export**: `domains/admin/projects/components/index.ts`

```typescript
export * from './ProjectListEmpty'
export * from './DeleteProjectDialog'
export * from './ProjectListItem'
```

---

### Phase 4: Page Containers

**Estimated Time**: 30 minutes

#### 4.1 Create `ProjectsPage` Container

**File**: `domains/admin/projects/containers/ProjectsPage.tsx`

```typescript
import { Button } from '@/ui-kit/components/button'
import { Skeleton } from '@/ui-kit/components/skeleton'
import { useProjects, useCreateProject, useDeleteProject } from '../hooks'
import { ProjectListEmpty, ProjectListItem } from '../components'

interface ProjectsPageProps {
  workspaceId: string
  workspaceSlug: string
}

export function ProjectsPage({ workspaceId, workspaceSlug }: ProjectsPageProps) {
  const { data: projects, isLoading } = useProjects(workspaceId)
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()

  const handleCreateProject = () => {
    createProject.mutate({ workspaceId })
  }

  const handleDeleteProject = (projectId: string) => {
    deleteProject.mutate(projectId)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        {projects && projects.length > 0 && (
          <Button onClick={handleCreateProject}>Create Project</Button>
        )}
      </div>

      {projects && projects.length === 0 ? (
        <ProjectListEmpty onCreateProject={handleCreateProject} />
      ) : (
        <div className="space-y-4">
          {projects?.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              workspaceSlug={workspaceSlug}
              onDelete={handleDeleteProject}
              isDeleting={deleteProject.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

#### 4.2 Create `ProjectDetailsPage` Container

**File**: `domains/admin/projects/containers/ProjectDetailsPage.tsx`

```typescript
export function ProjectDetailsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Project Details</h1>
      <p className="text-muted-foreground mt-2">
        Project details – work in progress.
      </p>
    </div>
  )
}
```

**Barrel Export**: `domains/admin/projects/containers/index.ts`

```typescript
export * from './ProjectsPage'
export * from './ProjectDetailsPage'
```

---

### Phase 5: Routes (TanStack Router)

**Estimated Time**: 20 minutes

#### 5.1 Update Projects List Route

**File**: `app/workspace/$workspaceSlug.projects.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/domains/admin/projects'

/**
 * Projects list page route
 *
 * Route: /workspace/:workspaceSlug/projects
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Lists all active projects in the workspace with create/delete actions.
 * Workspace context is maintained via parent route.
 */
export const Route = createFileRoute('/workspace/$workspaceSlug/projects')({
  component: ProjectsPageRoute,
})

function ProjectsPageRoute() {
  const { workspaceSlug } = Route.useParams()

  // TODO: Get actual workspaceId from workspace context/loader
  // For now, using workspaceSlug as workspaceId (temporary)
  const workspaceId = workspaceSlug

  return <ProjectsPage workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
}
```

#### 5.2 Create Project Details Route

**File**: `app/workspace/$workspaceSlug.projects.$projectId.tsx`

```typescript
import { createFileRoute, notFound } from '@tanstack/react-router'
import { doc, getDoc } from 'firebase/firestore'
import { ProjectDetailsPage } from '@/domains/admin/projects'
import { firestore } from '@/integrations/firebase/client'
import type { Project } from '@/domains/admin/projects/types'

/**
 * Project details page route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId
 * Access: Admin only (enforced by parent route)
 *
 * Displays project details (placeholder for now).
 * Returns 404 for non-existent or soft-deleted projects.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId'
)({
  loader: async ({ params }) => {
    const projectRef = doc(firestore, 'projects', params.projectId)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists()) {
      throw notFound()
    }

    const project = { id: projectDoc.id, ...projectDoc.data() } as Project

    // Return 404 for soft-deleted projects
    if (project.status === 'deleted') {
      throw notFound()
    }

    // Validate project belongs to workspace (prevent cross-workspace access)
    if (project.workspaceId !== params.workspaceSlug) {
      throw notFound()
    }

    return { project }
  },
  component: ProjectDetailsPage,
})
```

---

### Phase 6: Public API (Barrel Exports)

**Estimated Time**: 5 minutes

**File**: `domains/admin/projects/index.ts`

```typescript
// Export only public API (components, hooks, types)
// DO NOT export schemas (internal validation logic)

export * from './components'
export * from './containers'
export * from './hooks'
export * from './types'

// Schemas are internal - not exported
```

---

### Phase 7: Testing & Validation

**Estimated Time**: 45 minutes

#### 7.1 Run Validation Loop

```bash
cd apps/clementine-app
pnpm check        # Format + lint
pnpm type-check   # TypeScript validation
```

Fix any errors before proceeding.

#### 7.2 Manual Testing Checklist

Start dev server: `pnpm dev`

- [ ] Navigate to `/workspace/[workspaceSlug]/projects`
- [ ] Verify empty state appears when no projects exist
- [ ] Click "Create Project" → verify redirect to project details page
- [ ] Verify new project appears in list (real-time update)
- [ ] Click on project → verify navigation to details page
- [ ] Click delete icon → verify confirmation dialog appears
- [ ] Confirm deletion → verify project disappears from list
- [ ] Try accessing deleted project URL → verify 404 page appears
- [ ] Check Firebase Console → verify project document has `status: 'deleted'`
- [ ] Create multiple projects → verify newest appears first (sort order)

#### 7.3 Write Unit Tests (Optional, per Constitution)

**File**: `domains/admin/projects/hooks/useProjects.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useProjects } from './useProjects'

// Mock Firebase
jest.mock('@/integrations/firebase/client')

describe('useProjects', () => {
  it('should fetch projects for workspace', async () => {
    const { result } = renderHook(() => useProjects('workspace-123'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toHaveLength(2)
    })
  })

  it('should filter out deleted projects', async () => {
    // Test implementation...
  })
})
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All validation checks pass (`pnpm check`, `pnpm type-check`)
- [ ] Manual testing complete (all scenarios verified)
- [ ] Firestore indexes deployed and active
- [ ] Firestore security rules deployed
- [ ] Test soft delete in staging environment
- [ ] Verify workspace-scoped access control works
- [ ] Monitor Firestore read/write costs after deployment
- [ ] Set up Sentry alerts for project mutation errors

## Common Issues & Solutions

### Issue: "Index not ready" error in queries

**Solution**: Wait for Firestore index to finish building (check Firebase Console). Index build can take 5-30 minutes depending on data size.

### Issue: Permission denied when creating project

**Solution**: Verify Firestore security rules are deployed correctly. Check that `isAdmin()` helper function is available and user has admin token.

### Issue: Real-time updates not working

**Solution**: Verify `useEffect` cleanup function is returning `unsubscribe()`. Check browser console for Firestore listener errors.

### Issue: TypeScript errors on `serverTimestamp()`

**Solution**: Use `UpdateData<Project>` type for update operations. Firestore `serverTimestamp()` is handled differently than regular values.

## Performance Optimization (Future)

Current implementation supports <100 projects per workspace with no pagination. If workspaces grow beyond this:

1. Add pagination to `useProjects` hook (cursor-based)
2. Add infinite scroll to `ProjectsPage` container
3. Consider caching strategy for frequently accessed projects
4. Add search/filter functionality with client-side filtering

## Next Steps

After completing this feature:

1. Run `/speckit.tasks` to generate implementation tasks
2. Run `/speckit.implement` to execute tasks
3. Create PR with `/pr` command
4. Deploy to staging environment for QA testing
5. Monitor production metrics after deployment

## Resources

- [TanStack Query Docs](https://tanstack.com/query)
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [TanStack Router Docs](https://tanstack.com/router)
- [shadcn/ui Components](https://ui.shadcn.com)
