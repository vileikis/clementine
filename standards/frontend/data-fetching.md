# Data Fetching with TanStack Query + Firestore

This document defines patterns for data fetching and mutations using TanStack Query with Firebase Firestore in the TanStack Start application.

## Core Principles

### 1. TanStack Query as the Store
- Use TanStack Query's cache as your data store
- Query hooks provide centralized access to data across the app
- No need for separate state management for server data

### 2. Query Hooks for Reading
- Create "get" hooks (`useWorkspaces`, `useProjects`) for fetching and caching
- Use real-time listeners with `onSnapshot` for live updates
- These hooks are reusable - call them anywhere to access the same cached data

### 3. Mutation Hooks for Writing
- Create dedicated mutation hooks for each business operation
- **ALWAYS use transactions** when using `serverTimestamp()`
- Invalidate queries in `onSuccess` to refresh UI

### 4. Firestore Utils for Conversion
- Use `convertFirestoreDoc()` to convert Firestore types to plain objects
- Validates with Zod schemas during conversion
- Converts Timestamps → numbers, DocumentReferences → IDs

### 5. Routes: Query over Loader
- Handle loading/error/data states in components with query hooks
- **Don't preload data in loaders** except for specific cases:
  - SEO metadata (Open Graph tags, title/description)
  - Auth guards (via `beforeLoad` with server functions)

## Query Hooks Pattern (Reading Data)

### Real-Time Query Hook

**Example: `useProjects.ts`**

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
import { projectSchema } from '../schemas'
import type { Project } from '../types'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * List active projects with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Proper Firestore type conversion (Timestamps → numbers)
 * - TanStack Query cache serves as the store
 * - Reusable across components
 */
export function useProjects(workspaceId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener
  useEffect(() => {
    const q = query(
      collection(firestore, 'projects'),
      where('workspaceId', '==', workspaceId),
      where('status', '!=', 'deleted'),
      orderBy('status'), // Required for != query
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Convert docs and update query cache
      const projects = snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, projectSchema),
      )
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
        orderBy('createdAt', 'desc'),
      )

      // Initial fetch only (onSnapshot handles updates)
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => convertFirestoreDoc(doc, projectSchema))
    },
    staleTime: Infinity, // Never stale (real-time via onSnapshot)
    refetchOnWindowFocus: false, // Disable refetch (real-time handles it)
  })
}
```

**Key patterns:**
- ✅ `useEffect` sets up `onSnapshot` listener
- ✅ Listener updates `queryClient.setQueryData` directly
- ✅ `queryFn` only for initial fetch
- ✅ `convertFirestoreDoc` with Zod schema for type safety
- ✅ `staleTime: Infinity` because real-time keeps it fresh
- ✅ `refetchOnWindowFocus: false` to prevent unnecessary fetches

**Usage in components:**

```tsx
function ProjectsList({ workspaceId }: { workspaceId: string }) {
  const { data: projects, isLoading, error } = useProjects(workspaceId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {projects?.map((project) => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  )
}
```

### Single Document Query Hook

**Example: `useProject.ts`**

```typescript
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { projectSchema } from '../schemas'
import type { Project } from '../types'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Get single project with real-time updates
 */
export function useProject(projectId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const docRef = doc(firestore, 'projects', projectId)

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const project = convertFirestoreDoc(snapshot, projectSchema)
        queryClient.setQueryData(['project', projectId], project)
      }
    })

    return () => unsubscribe()
  }, [projectId, queryClient])

  return useQuery<Project | null>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const docRef = doc(firestore, 'projects', projectId)
      const snapshot = await getDoc(docRef)

      if (!snapshot.exists()) return null

      return convertFirestoreDoc(snapshot, projectSchema)
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
```

## Mutation Hooks Pattern (Writing Data)

### Why ALWAYS Use Transactions

**Critical**: When using `serverTimestamp()`, you MUST use transactions to avoid this race condition:

1. Create doc with `serverTimestamp()` → field is `null` initially
2. Real-time listener fires → Zod schema validation fails on `null`
3. Component crashes with parse error

**Solution**: Transactions ensure serverTimestamp resolves before returning.

### Create Mutation Hook

**Example: `useCreateProject.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { WithFieldValue } from 'firebase/firestore'
import type { CreateProjectInput, Project } from '../types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Create project mutation
 *
 * Uses transaction to ensure serverTimestamp() resolves before returning,
 * preventing Zod parse errors from real-time listeners.
 */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const projectsRef = collection(firestore, 'projects')

      // ALWAYS use transaction with serverTimestamp()
      return await runTransaction(firestore, (transaction) => {
        const newProjectRef = doc(projectsRef)

        const newProject: WithFieldValue<Project> = {
          id: newProjectRef.id,
          name: input.name || 'Untitled project',
          workspaceId: input.workspaceId,
          status: 'draft' as const,
          activeEventId: null,
          deletedAt: null,
          createdAt: serverTimestamp(), // Transaction ensures this resolves
          updatedAt: serverTimestamp(),
        }

        transaction.set(newProjectRef, newProject)

        return Promise.resolve({
          projectId: newProjectRef.id,
          workspaceId: input.workspaceId,
        })
      })
    },
    onSuccess: ({ workspaceId }) => {
      // Invalidate to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['projects', workspaceId],
      })
    },
    onError: (error) => {
      // Report unexpected errors to Sentry
      Sentry.captureException(error, {
        tags: {
          domain: 'workspace/projects',
          action: 'create-project',
        },
      })
    },
  })
}
```

**Key patterns:**
- ✅ `useMutation` from TanStack Query
- ✅ **ALWAYS `runTransaction`** when using `serverTimestamp()`
- ✅ `serverTimestamp()` for accurate server-side timestamps
- ✅ Invalidate queries in `onSuccess`
- ✅ Sentry error tracking in `onError`
- ✅ Return minimal data needed (IDs for navigation, etc.)

**Usage in components:**

```tsx
function CreateProjectButton({ workspaceId }: { workspaceId: string }) {
  const createProject = useCreateProject()

  const handleCreate = () => {
    createProject.mutate(
      { workspaceId, name: 'New Project' },
      {
        onSuccess: ({ projectId }) => {
          toast.success('Project created!')
          navigate(`/projects/${projectId}`)
        },
        onError: (error) => {
          toast.error('Failed to create project')
        },
      }
    )
  }

  return (
    <button onClick={handleCreate} disabled={createProject.isPending}>
      {createProject.isPending ? 'Creating...' : 'Create Project'}
    </button>
  )
}
```

### Update Mutation Hook

**Example: `useUpdateProject.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { UpdateProjectInput } from '../types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Update project mutation
 */
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      return await runTransaction(firestore, (transaction) => {
        const projectRef = doc(firestore, 'projects', projectId)

        transaction.update(projectRef, {
          ...input,
          updatedAt: serverTimestamp(),
        })

        return Promise.resolve({ projectId })
      })
    },
    onSuccess: ({ projectId }) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'workspace/projects', action: 'update-project' },
      })
    },
  })
}
```

### Delete Mutation Hook

**Example: `useDeleteProject.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { firestore } from '@/integrations/firebase/client'

/**
 * Soft delete project mutation
 *
 * Sets status to 'deleted' and deletedAt timestamp.
 * Hard deletes are handled by Admin SDK scheduled jobs.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, workspaceId }: { projectId: string; workspaceId: string }) => {
      return await runTransaction(firestore, (transaction) => {
        const projectRef = doc(firestore, 'projects', projectId)

        // Soft delete
        transaction.update(projectRef, {
          status: 'deleted',
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        return Promise.resolve({ projectId, workspaceId })
      })
    },
    onSuccess: ({ workspaceId }) => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'workspace/projects', action: 'delete-project' },
      })
    },
  })
}
```

## Firestore Utils for Type Conversion

### Why Convert Firestore Types?

Firestore stores data as special objects:
- `Timestamp` objects (not numbers)
- `DocumentReference` objects (not strings)
- `GeoPoint` objects (not plain objects)

These aren't serializable and add Firestore dependency to your domain types.

### Using `convertFirestoreDoc`

**From `@/shared/utils/firestore-utils.ts`:**

```typescript
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'
import { projectSchema } from './schemas'

const docSnap = await getDoc(projectRef)
const project = convertFirestoreDoc(docSnap, projectSchema)

// project.createdAt is now a number (milliseconds)
// project.id is extracted from doc.id
// All data validated with Zod schema
```

**What it does:**
1. Extracts document ID
2. Converts Firestore types to plain JavaScript:
   - `Timestamp` → `number` (milliseconds since epoch)
   - `DocumentReference` → `string` (document ID)
   - `GeoPoint` → `{ lat: number, lng: number }`
3. Validates with Zod schema
4. Returns fully typed object

**Reference implementation:** `apps/clementine-app/src/shared/utils/firestore-utils.ts`

## Route Loading Strategy

### ❌ DON'T: Preload data in loaders

```tsx
// ❌ Bad: Preloading data in loader
export const Route = createFileRoute('/projects/$projectId')({
  loader: async ({ params }) => {
    const project = await getProject(params.projectId)
    return { project }
  },
  component: ProjectPage,
})
```

**Why not?**
- Loses real-time updates
- Duplicates data fetching logic
- Can't share cache with other components
- Harder to handle loading/error states

### ✅ DO: Use query hooks in components

```tsx
// ✅ Good: Query hook in component
export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectPage,
})

function ProjectPage() {
  const { projectId } = Route.useParams()
  const { data: project, isLoading, error } = useProject(projectId)

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!project) return <NotFound />

  return <ProjectDetails project={project} />
}
```

### ✅ DO: Use loaders for specific cases

**1. SEO Metadata:**

```tsx
export const Route = createFileRoute('/projects/$projectId')({
  loader: async ({ params }) => {
    // Load minimal metadata for SSR
    const metadata = await getProjectMetadata(params.projectId)
    return { metadata }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.metadata.title },
      { property: 'og:title', content: loaderData.metadata.title },
      { property: 'og:image', content: loaderData.metadata.image },
    ],
  }),
  component: ProjectPage,
})
```

**2. Auth Guards:**

```tsx
import { requireAdmin } from '@/domains/auth/guards'

export const Route = createFileRoute('/admin/workspaces')({
  beforeLoad: async () => {
    // Check auth before loading route
    await requireAdmin()
  },
  component: AdminWorkspacesPage,
})
```

**Reference implementation:** `apps/clementine-app/src/domains/auth/guards/guards.ts`

## Query Keys Convention

Use hierarchical query keys for easy invalidation:

```typescript
// List queries
['workspaces', 'active'] // All active workspaces
['projects', workspaceId] // Projects in workspace

// Detail queries
['workspace', workspaceId] // Single workspace
['project', projectId] // Single project

// Invalidation examples
queryClient.invalidateQueries({ queryKey: ['workspaces'] }) // All workspace queries
queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] }) // Workspace projects only
```

**Pattern:**
- Plural for lists: `['projects', ...]`
- Singular for details: `['project', ...]`
- More specific keys include parent IDs: `['projects', workspaceId]`

## Error Handling

### Mutation Error Handling

```typescript
/**
 * Determine if error should be reported to Sentry
 * Expected validation errors should not be reported
 */
function shouldReportError(error: unknown): boolean {
  if (error instanceof Error) {
    // Don't report expected validation errors
    const expectedErrors = ['Slug already exists', 'Invalid workspace name']
    return !expectedErrors.some((msg) => error.message.includes(msg))
  }
  return true // Report unknown error types
}

export function useCreateWorkspace() {
  return useMutation({
    mutationFn: async (data) => {
      // ... mutation logic
    },
    onError: (error) => {
      // Report unexpected errors only
      if (shouldReportError(error)) {
        Sentry.captureException(error, {
          tags: { domain: 'workspace', action: 'create' },
        })
      }

      // Error available in mutation.error for UI display
    },
  })
}
```

**Reference implementation:** `apps/clementine-app/src/domains/admin/workspace/hooks/useCreateWorkspace.ts`

### Query Error Handling

```tsx
function ProjectsList() {
  const { data, error, isLoading } = useProjects(workspaceId)

  if (error) {
    return (
      <div className="error-container">
        <p>Failed to load projects. Please try again.</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    )
  }

  if (isLoading) return <LoadingSpinner />

  return <ProjectsGrid projects={data} />
}
```

## Best Practices

### ✅ DO: Use TanStack Query as Store

```typescript
// ✅ Good: Call hook anywhere to access same cached data
function ProjectHeader({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId) // Shared cache
}

function ProjectSidebar({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId) // Same data, no extra fetch
}
```

### ✅ DO: ALWAYS Use Transactions with serverTimestamp()

```typescript
// ✅ Good: Transaction prevents null timestamps
return await runTransaction(firestore, (transaction) => {
  const ref = doc(collection(firestore, 'projects'))
  transaction.set(ref, {
    id: ref.id,
    createdAt: serverTimestamp(), // Resolves before transaction completes
  })
  return Promise.resolve({ id: ref.id })
})

// ❌ Bad: Will cause Zod parse errors
const ref = doc(collection(firestore, 'projects'))
await setDoc(ref, {
  id: ref.id,
  createdAt: serverTimestamp(), // null initially → parse error!
})
```

### ✅ DO: Use convertFirestoreDoc for Type Safety

```typescript
// ✅ Good: Converts types and validates schema
const projects = snapshot.docs.map((doc) =>
  convertFirestoreDoc(doc, projectSchema)
)

// ❌ Bad: Manual conversion, no validation
const projects = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}))
```

### ✅ DO: Invalidate Queries After Mutations

```typescript
// ✅ Good: Invalidate to refresh UI
onSuccess: ({ workspaceId }) => {
  queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
}

// ❌ Bad: UI won't update
onSuccess: () => {
  // Nothing here
}
```

### ✅ DO: Set staleTime and refetchOnWindowFocus for Real-Time

```typescript
// ✅ Good: Prevent refetching with real-time updates
return useQuery({
  queryKey: ['projects', workspaceId],
  queryFn: async () => { /* ... */ },
  staleTime: Infinity, // Never stale (onSnapshot keeps it fresh)
  refetchOnWindowFocus: false, // Don't refetch on focus
})
```

### ❌ DON'T: Preload in Loaders (Except SEO/Auth)

```tsx
// ❌ Bad: Preloading data loses real-time updates
loader: async () => {
  const data = await fetchData()
  return { data }
}

// ✅ Good: Query hook with real-time
function Component() {
  const { data } = useData()
}
```

### ❌ DON'T: Skip Transactions with serverTimestamp()

```typescript
// ❌ Bad: Causes Zod parse errors from null timestamps
await setDoc(docRef, {
  createdAt: serverTimestamp(), // null initially → parse error
})

// ✅ Good: Transaction ensures timestamp resolves
await runTransaction(firestore, (transaction) => {
  transaction.set(docRef, {
    createdAt: serverTimestamp(), // Guaranteed to resolve
  })
})
```

### ❌ DON'T: Forget to Clean Up Listeners

```typescript
// ✅ Good: Return cleanup function
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    // Update data
  })
  return () => unsubscribe() // Clean up on unmount
}, [])

// ❌ Bad: Memory leak
useEffect(() => {
  onSnapshot(docRef, (snapshot) => {
    // Update data
  })
  // No cleanup!
}, [])
```

## Quick Reference

### Query Hook Template (Reading)

```typescript
export function useProjects(workspaceId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const q = query(collection(firestore, 'projects'), where(...))
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => convertFirestoreDoc(doc, schema))
      queryClient.setQueryData(['projects', workspaceId], data)
    })
  }, [workspaceId, queryClient])

  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => { /* initial fetch */ },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
```

### Mutation Hook Template (Writing)

```typescript
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input) => {
      return await runTransaction(firestore, (transaction) => {
        const ref = doc(collection(firestore, 'projects'))
        transaction.set(ref, {
          ...input,
          createdAt: serverTimestamp(),
        })
        return Promise.resolve({ id: ref.id })
      })
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
    },
    onError: (error) => {
      if (shouldReportError(error)) {
        Sentry.captureException(error)
      }
    },
  })
}
```

### Component Usage Template

```tsx
function Component() {
  const { data, isLoading, error } = useProjects(workspaceId)
  const createProject = useCreateProject()

  const handleCreate = () => {
    createProject.mutate(
      { name: 'New Project', workspaceId },
      {
        onSuccess: () => toast.success('Created!'),
        onError: () => toast.error('Failed!'),
      }
    )
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <>
      <button onClick={handleCreate} disabled={createProject.isPending}>
        Create
      </button>
      <ProjectsList projects={data} />
    </>
  )
}
```

## Reference Implementations

Study these files for real-world examples:

**Query Hooks:**
- `apps/clementine-app/src/domains/admin/workspace/hooks/useWorkspaces.ts`
- `apps/clementine-app/src/domains/workspace/projects/hooks/useProjects.ts`

**Mutation Hooks:**
- `apps/clementine-app/src/domains/admin/workspace/hooks/useCreateWorkspace.ts`
- `apps/clementine-app/src/domains/workspace/projects/hooks/useCreateProject.ts`

**Utils:**
- `apps/clementine-app/src/shared/utils/firestore-utils.ts`

**Auth Guards:**
- `apps/clementine-app/src/domains/auth/guards/guards.ts`

## Resources

- [TanStack Query Docs](https://tanstack.com/query)
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [TanStack Router Docs](https://tanstack.com/router)
- [Firestore Real-time Updates](https://firebase.google.com/docs/firestore/query-data/listen)
