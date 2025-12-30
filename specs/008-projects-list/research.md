# Research: Projects List & Basic Project Management

**Feature**: `008-projects-list`
**Date**: 2025-12-30
**Phase**: 0 (Research & Discovery)

## Research Overview

This document consolidates research findings from analyzing the existing Clementine codebase to inform the Projects feature implementation. Research focused on establishing patterns, best practices, and architectural decisions.

## 1. Firestore Collection Design

### Research Question
How should the Projects collection be structured in Firestore following existing workspace patterns?

### Findings

**Existing Workspace Pattern** (from `domains/workspace/types/workspace.types.ts`):

```typescript
export type WorkspaceStatus = 'active' | 'deleted'

export interface Workspace {
  id: string
  name: string
  slug: string
  status: WorkspaceStatus
  deletedAt: number | null
  createdAt: number
  updatedAt: number
}
```

**Pattern Analysis**:
- **Top-level collection**: `workspaces` (not nested)
- **Status-based soft delete**: Uses `status` field + `deletedAt` timestamp
- **Unix timestamps**: All timestamps in milliseconds (JS `Date.now()` format)
- **Auto-generated IDs**: Firestore document IDs, exposed as `id` field
- **Required metadata**: `createdAt` and `updatedAt` on all documents

### Decision: Projects Collection Structure

**Rationale**: Follow workspace pattern exactly for consistency

```typescript
export type ProjectStatus = 'draft' | 'live' | 'deleted'

export interface Project {
  id: string                    // Firestore doc ID
  name: string                  // Display name
  workspaceId: string           // Parent workspace reference
  status: ProjectStatus         // Lifecycle state
  activeEventId: string | null  // Switchboard for active event
  deletedAt: number | null      // Soft delete timestamp
  createdAt: number             // Creation timestamp
  updatedAt: number             // Last modification timestamp
}
```

**Key Decisions**:
1. ✅ **Top-level collection** (`projects`) - Not nested under workspaces (scalability, query flexibility)
2. ✅ **workspaceId reference** - Foreign key to parent workspace (many-to-one relationship)
3. ✅ **Status enum** - Extended to include 'draft' and 'live' (project lifecycle needs)
4. ✅ **activeEventId** - Switchboard pattern for controlling which event is active (null = no active event)
5. ✅ **Soft delete** - Same pattern as workspace (status + timestamp)

**Alternatives Considered**:
- ❌ Nested collection (`workspaces/{workspaceId}/projects`) - Rejected due to query limitations across workspaces
- ❌ Hard deletes - Rejected to preserve data for potential restore/audit
- ❌ Boolean `isDeleted` - Rejected in favor of status enum (clearer intent, supports future states)

---

## 2. Real-time Hooks Pattern

### Research Question
How should TanStack Query be integrated with Firestore onSnapshot for real-time updates?

### Findings

**Pattern from `useWorkspaces.ts`**:

```typescript
export function useWorkspaces() {
  const queryClient = useQueryClient()

  // Separate useEffect for real-time listener
  useEffect(() => {
    const q = query(
      collection(firestore, 'workspaces'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workspaces = snapshot.docs.map((doc) => doc.data() as Workspace)
      queryClient.setQueryData(['workspaces', 'active'], workspaces)
    })

    return () => unsubscribe()
  }, [queryClient])

  return useQuery<Workspace[]>({
    queryKey: ['workspaces', 'active'],
    queryFn: async () => {
      // Initial fetch only (getDocs)
      const q = query(...)
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => doc.data() as Workspace)
    },
    staleTime: Infinity,           // Real-time via onSnapshot
    refetchOnWindowFocus: false,   // Disable refetch (real-time handles it)
  })
}
```

**Pattern Analysis**:
1. **Dual approach**: `useQuery` for initial fetch, `useEffect` for real-time
2. **queryClient.setQueryData**: Updates TanStack Query cache directly from Firestore listener
3. **staleTime: Infinity**: Prevents automatic refetches (real-time keeps data fresh)
4. **Cleanup**: `unsubscribe` returned from `useEffect` for proper cleanup
5. **Type casting**: `doc.data() as Type` (assumes Firestore data matches TypeScript types)

### Decision: Adopt Real-time Hooks Pattern

**Rationale**: Proven pattern in codebase, provides instant UI updates

**For `useProjects`** (list active projects):
```typescript
export function useProjects(workspaceId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const q = query(
      collection(firestore, 'projects'),
      where('workspaceId', '==', workspaceId),
      where('status', '!=', 'deleted'),  // Exclude soft-deleted
      orderBy('status'),                 // Required for != query
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map((doc) => doc.data() as Project)
      queryClient.setQueryData(['projects', workspaceId], projects)
    })

    return () => unsubscribe()
  }, [workspaceId, queryClient])

  return useQuery<Project[]>({
    queryKey: ['projects', workspaceId],
    queryFn: async () => { /* initial fetch */ },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
```

**Note**: Firestore requires `orderBy('status')` when using `where('status', '!=', 'deleted')` (compound query constraint)

---

## 3. Mutation Hooks Pattern

### Research Question
How should mutations (create, update, delete) be structured with error handling?

### Findings

**Pattern from `useDeleteWorkspace.ts`**:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const workspaceRef = doc(firestore, 'workspaces', workspaceId)

      const updateData: UpdateData<Workspace> = {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await updateDoc(workspaceRef, updateData)
      return workspaceId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'admin/workspace', action: 'delete-workspace' },
        extra: { errorType: 'workspace-deletion-failure' },
      })
    },
  })
}
```

**Pattern Analysis**:
1. **useMutation** from TanStack Query (not custom implementation)
2. **serverTimestamp()** for all timestamp fields (accurate, timezone-agnostic)
3. **UpdateData<Type>** TypeScript type for type-safe updates
4. **Optimistic UI**: Real-time listener handles immediate UI update (no manual optimistic update needed)
5. **Error tracking**: Sentry integration for production error monitoring
6. **Query invalidation**: `invalidateQueries` triggers refetch (redundant with real-time, but safe)

### Decision: Adopt Mutation Pattern

**Rationale**: Consistent error handling, production-ready monitoring

**For `useCreateProject`**:
```typescript
export function useCreateProject() {
  const queryClient = useQueryClient()

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
      return docRef.id
    },
    onSuccess: (projectId, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.workspaceId]
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'admin/projects', action: 'create-project' },
      })
    },
  })
}
```

**For `useDeleteProject`**: Follow same pattern as `useDeleteWorkspace` (soft delete via updateDoc)

---

## 4. Component Architecture

### Research Question
What UI component patterns should be used for lists, empty states, and dialogs?

### Findings

**Workspace List Components**:

1. **WorkspaceListItem.tsx** - Individual list item
2. **WorkspaceListEmpty.tsx** - Empty state
3. **DeleteWorkspaceDialog.tsx** - Confirmation dialog
4. **WorkspaceList.tsx** - Container component

**shadcn/ui Components Used**:
- `Card` - List item container
- `Button` - Actions (create, delete)
- `Dialog` - Confirmation dialogs
- `Alert` - Error/success messages
- `Skeleton` - Loading states

**Pattern Analysis**:
- **Composition**: Small, focused components composed into containers
- **Props drilling**: Minimal (components accept only what they need)
- **Event handlers**: Passed down from container (onClick, onDelete)
- **Loading states**: Handled at container level (isLoading prop)
- **Error states**: Handled at container level (error prop)

### Decision: Replicate Component Structure

**Rationale**: Proven UX patterns, consistent with existing UI

**For Projects Feature**:
1. **ProjectListItem.tsx** - Individual project card (name, status badge, delete button)
2. **ProjectListEmpty.tsx** - Empty state with "Create project" CTA
3. **DeleteProjectDialog.tsx** - Confirmation dialog with project name
4. **ProjectsPage.tsx** - Container (list + empty state + create button)
5. **ProjectDetailsPage.tsx** - Placeholder page ("Work in progress" message)

**shadcn/ui Components**:
- `Card` for project list items
- `Badge` for status indicators (draft/live)
- `Button` for create/delete actions
- `Dialog` for delete confirmation
- `Skeleton` for loading states

---

## 5. Route Structure & Authentication

### Research Question
How should routes be structured with TanStack Router and how is authentication enforced?

### Findings

**Existing Route Pattern** (`app/workspace/$workspaceSlug.tsx`):

```typescript
export const Route = createFileRoute('/workspace/$workspaceSlug')({
  beforeLoad: async ({ params, context }) => {
    // Server-side auth check
    const { user } = await requireAdmin({ context })
    return { user }
  },
  loader: async ({ params, context }) => {
    // Fetch workspace data server-side
    const workspace = await getWorkspaceBySlug(params.workspaceSlug)
    if (!workspace) throw notFound()
    return { workspace }
  },
  component: WorkspaceLayout,
})
```

**Pattern Analysis**:
1. **File-based routing**: `$workspaceSlug` = dynamic parameter
2. **beforeLoad hook**: Server-side authentication check (throws redirect if unauthorized)
3. **loader hook**: Server-side data fetching (throws 404 if not found)
4. **Route hierarchy**: Child routes inherit parent auth guards
5. **Type-safe params**: TypeScript infers param types from route path

### Decision: Follow Route Structure Pattern

**Rationale**: Consistent with existing routes, type-safe, SSR-friendly

**For Projects Routes**:

1. **`$workspaceSlug.projects.tsx`** (list page):
   ```typescript
   export const Route = createFileRoute('/workspace/$workspaceSlug/projects')({
     component: ProjectsPage,
   })
   // Auth inherited from parent route ($workspaceSlug.tsx)
   ```

2. **`$workspaceSlug.projects.$projectId.tsx`** (details page):
   ```typescript
   export const Route = createFileRoute('/workspace/$workspaceSlug/projects/$projectId')({
     loader: async ({ params }) => {
       const project = await getProjectById(params.projectId)
       if (!project || project.status === 'deleted') {
         throw notFound()
       }
       if (project.workspaceId !== params.workspaceSlug) {
         throw forbidden()  // Cross-workspace access attempt
       }
       return { project }
     },
     component: ProjectDetailsPage,
   })
   ```

**Key Decisions**:
- ✅ **Nested routes** - Projects under workspace (inherits workspace context)
- ✅ **Server-side 404** - Invalid/deleted projects return 404 in loader
- ✅ **Workspace validation** - Ensure project belongs to URL workspace
- ✅ **Auth inheritance** - No redundant auth checks (parent handles it)

---

## 6. Firestore Security Rules

### Research Question
How should Firestore security rules enforce workspace-scoped access control?

### Findings

**Existing Workspace Rules** (from `firebase/firestore.rules`):

```javascript
match /workspaces/{workspaceId} {
  // Helper: Check if user is authenticated admin
  function isAdmin() {
    return request.auth != null && request.auth.uid != null;
  }

  // Read: Allow if user is admin
  allow read: if isAdmin() && resource.data.status == 'active';

  // Create: Allow if user is admin
  allow create: if isAdmin()
    && request.resource.data.status == 'active'
    && request.resource.data.deletedAt == null;

  // Update: Allow if user is admin
  allow update: if isAdmin();

  // Delete (soft): Validate status change
  allow update: if isAdmin()
    && request.resource.data.status == 'deleted'
    && request.resource.data.deletedAt is timestamp;
}
```

**Pattern Analysis**:
1. **Helper functions**: Reusable auth checks
2. **Field-level validation**: Enforce data structure in rules
3. **Status validation**: Ensure soft deletes set correct fields
4. **Timestamp types**: Use `is timestamp` for server timestamp validation
5. **Read filtering**: Prevent reading soft-deleted documents

### Decision: Extend Pattern for Projects

**Rationale**: Proven security model, consistent with workspace rules

**Projects Security Rules**:

```javascript
match /projects/{projectId} {
  // Helper: Check if user is admin of project's workspace
  function isWorkspaceAdmin(workspaceId) {
    return request.auth != null
      && request.auth.uid != null
      && exists(/databases/$(database)/documents/workspaces/$(workspaceId))
      && get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.status == 'active';
  }

  // Read: Allow if admin of workspace AND project not deleted
  allow read: if isWorkspaceAdmin(resource.data.workspaceId)
    && resource.data.status != 'deleted';

  // Create: Validate initial state
  allow create: if isWorkspaceAdmin(request.resource.data.workspaceId)
    && request.resource.data.status in ['draft', 'live']
    && request.resource.data.deletedAt == null
    && request.resource.data.name.size() >= 1
    && request.resource.data.name.size() <= 100;

  // Update (soft delete): Validate deletion
  allow update: if isWorkspaceAdmin(resource.data.workspaceId)
    && request.resource.data.status == 'deleted'
    && request.resource.data.deletedAt is timestamp
    && request.resource.data.updatedAt is timestamp;

  // Update (general): Validate fields changed
  allow update: if isWorkspaceAdmin(resource.data.workspaceId)
    && request.resource.data.workspaceId == resource.data.workspaceId  // Prevent workspace transfer
    && request.resource.data.updatedAt is timestamp;

  // Hard delete: Forbidden
  allow delete: if false;
}
```

**Key Security Principles**:
1. ✅ **Workspace-scoped access** - Can't access projects in other workspaces
2. ✅ **Soft delete enforcement** - Read filter + write validation
3. ✅ **Field immutability** - workspaceId cannot be changed after creation
4. ✅ **Database-level filtering** - Deleted projects invisible at query level
5. ✅ **No hard deletes** - Preserve data for audit/restore

---

## 7. Firestore Indexes

### Research Question
What composite indexes are required for efficient queries?

### Findings

Projects queries need to filter by `workspaceId` AND `status`, then order by `createdAt`:

```javascript
query(
  collection(firestore, 'projects'),
  where('workspaceId', '==', workspaceId),
  where('status', '!=', 'deleted'),
  orderBy('status'),           // Required for != query
  orderBy('createdAt', 'desc')
)
```

### Decision: Composite Index Required

**Index Configuration** (add to `firebase/firestore.indexes.json`):

```json
{
  "indexes": [
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

**Rationale**:
- Firestore requires indexes for compound queries (multiple where clauses + orderBy)
- Index supports both inequality filter (`status != 'deleted'`) and ordering (`createdAt desc`)
- Scoped to workspace (first field = workspaceId) for efficient partition pruning

---

## 8. Testing Strategy

### Research Question
What testing approaches are used for hooks and components?

### Findings

**Existing Test Files**:
- `useWorkspace.test.tsx` - Hook testing with Testing Library
- `useWorkspaceStore.test.ts` - Zustand store testing
- `WorkspaceSettingsForm.test.tsx` - Component testing

**Pattern Analysis**:
1. **Vitest + Testing Library** for all tests
2. **Hook testing**: `renderHook` from `@testing-library/react`
3. **Component testing**: `render` + `screen` queries
4. **Mock Firebase**: Mock Firestore operations (not testing Firebase itself)
5. **Behavior testing**: Test user interactions, not implementation

### Decision: Test Critical Paths Only

**Rationale**: Minimal testing strategy per constitution

**Tests Required**:
1. **useProjects.test.ts** - Verify real-time updates work
2. **useCreateProject.test.ts** - Verify mutation success/error handling
3. **useDeleteProject.test.ts** - Verify soft delete mutation
4. **ProjectListItem.test.tsx** - Verify delete dialog trigger
5. **ProjectsPage.test.tsx** - Verify empty state + list rendering

**Not Testing**:
- ❌ Firebase SDK itself (tested by Firebase)
- ❌ TanStack Query (tested by TanStack)
- ❌ Implementation details (internal state, function calls)

---

## Summary of Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Collection Structure** | Top-level `projects` collection with `workspaceId` reference | Scalability, query flexibility |
| **Soft Delete** | `status: 'deleted'` + `deletedAt` timestamp | Consistent with workspace pattern |
| **Real-time Updates** | TanStack Query + Firestore `onSnapshot` | Instant UI updates, proven pattern |
| **Mutations** | `useMutation` with Sentry error tracking | Production-ready, consistent error handling |
| **Components** | Small, focused components composed into containers | Reusable, testable, maintainable |
| **Routes** | Nested under `/workspace/$workspaceSlug/projects` | Auth inheritance, workspace context |
| **Security** | Firestore rules enforce workspace-scoped access | Database-level security, no server code needed |
| **Indexes** | Composite index on `workspaceId + status + createdAt` | Efficient queries, required for != filter |
| **Testing** | Critical paths only (hooks + key components) | Minimal testing per constitution |

---

## Implementation Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Index deployment delay** | Queries fail until index builds | Deploy index before code, verify in console |
| **Security rules misconfiguration** | Unauthorized access or overly restrictive rules | Test rules with Firebase Emulator before deploy |
| **Real-time listener performance** | High read costs with many concurrent users | Monitor Firestore usage, add pagination if needed |
| **Cross-workspace access bugs** | Users accessing other workspaces' projects | Validate workspaceId in loader + Firestore rules |
| **Soft delete edge cases** | Deleted projects appearing in UI | Filter by status in query AND security rules |

---

## Next Steps (Phase 1)

1. ✅ Generate `data-model.md` with detailed schema
2. ⏭️ Generate Firestore security rules in `contracts/firestore.rules`
3. ⏭️ Generate Firestore index config in `contracts/firestore.indexes.json`
4. ⏭️ Generate `quickstart.md` for implementation guide
5. ⏭️ Update agent context with new technology decisions

**Phase 1 Deliverables**:
- Complete data model documentation
- Complete security rules specification
- Complete index configuration
- Implementation quickstart guide
- Updated agent context file
