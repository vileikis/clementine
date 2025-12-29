# API Contracts: Workspace View & Settings

**Feature**: 004-workspace-view
**Date**: 2025-12-29
**Architecture**: Client-first with Firebase Firestore

## Overview

This feature uses a **client-first architecture** with Firebase Firestore client SDK for data operations. Server actions are used only for write operations that require validation and authorization. All contracts defined below are TypeScript function signatures (not REST/GraphQL endpoints).

---

## Client Hooks

### useWorkspace

**Purpose**: Fetch a single workspace by slug (read-only)

**Type**: TanStack Query hook (client-side data fetching)

**Signature**:
```typescript
function useWorkspace(slug: string): {
  data: Workspace | null | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slug` | `string` | Yes | Workspace slug to fetch |

**Returns**:
| Field | Type | Description |
|-------|------|-------------|
| `data` | `Workspace \| null \| undefined` | Workspace data if found, `null` if not found, `undefined` while loading |
| `isLoading` | `boolean` | `true` while fetching data |
| `isError` | `boolean` | `true` if query failed |
| `error` | `Error \| null` | Error object if query failed |

**Implementation**:
```typescript
import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

export function useWorkspace(slug: string) {
  return useQuery({
    queryKey: ['workspace', slug],
    queryFn: async () => {
      const q = query(
        collection(firestore, 'workspaces'),
        where('slug', '==', slug),
        where('status', '==', 'active')
      )

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        return null
      }

      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
      } as Workspace
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

**Error Scenarios**:
- **Workspace not found**: Returns `data: null` (not an error)
- **Permission denied**: Throws Firestore permission error (non-admin user)
- **Network error**: Sets `isError: true`, `error` contains error details

---

### useUpdateWorkspace

**Purpose**: Update workspace name and/or slug (mutation)

**Type**: TanStack Query mutation hook

**Signature**:
```typescript
function useUpdateWorkspace(): {
  mutate: (input: UpdateWorkspaceInput) => void
  mutateAsync: (input: UpdateWorkspaceInput) => Promise<void>
  isPending: boolean
  isError: boolean
  error: Error | null
}
```

**Input**:
```typescript
interface UpdateWorkspaceInput {
  id: string
  name?: string
  slug?: string
}
```

**Returns**:
| Field | Type | Description |
|-------|------|-------------|
| `mutate` | `(input: UpdateWorkspaceInput) => void` | Trigger mutation (fire-and-forget) |
| `mutateAsync` | `(input: UpdateWorkspaceInput) => Promise<void>` | Trigger mutation (async/await) |
| `isPending` | `boolean` | `true` while mutation is in progress |
| `isError` | `boolean` | `true` if mutation failed |
| `error` | `Error \| null` | Error object if mutation failed |

**Implementation**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateWorkspace } from '../actions/updateWorkspace'

export function useUpdateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWorkspace,
    onSuccess: (_, variables) => {
      // Invalidate workspace query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['workspace', variables.slug],
      })
    },
  })
}
```

**Error Scenarios**:
- **Slug already in use**: Throws `Error('Slug already in use')`
- **Permission denied**: Throws `Error('Unauthorized: Admin access required')`
- **Validation error**: Throws Zod validation error
- **Workspace not found**: Throws `Error('Workspace not found')`

---

### useWorkspaceStore

**Purpose**: Manage last visited workspace slug with localStorage persistence

**Type**: Zustand store with persist middleware

**Signature**:
```typescript
interface WorkspaceStore {
  lastVisitedWorkspaceSlug: string | null
  setLastVisitedWorkspaceSlug: (slug: string) => void
}

function useWorkspaceStore(): WorkspaceStore
```

**State**:
| Field | Type | Description |
|-------|------|-------------|
| `lastVisitedWorkspaceSlug` | `string \| null` | Last visited workspace slug (null if never visited) |

**Actions**:
| Method | Signature | Description |
|--------|-----------|-------------|
| `setLastVisitedWorkspaceSlug` | `(slug: string) => void` | Update last visited workspace slug |

**Implementation**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceStore {
  lastVisitedWorkspaceSlug: string | null
  setLastVisitedWorkspaceSlug: (slug: string) => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      lastVisitedWorkspaceSlug: null,
      setLastVisitedWorkspaceSlug: (slug) =>
        set({ lastVisitedWorkspaceSlug: slug }),
    }),
    {
      name: 'workspace-storage',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate workspace state:', error)
        }
      },
    }
  )
)
```

**Usage**:
```typescript
// Set last visited workspace
const { setLastVisitedWorkspaceSlug } = useWorkspaceStore()
setLastVisitedWorkspaceSlug('acme-corp')

// Read last visited workspace
const { lastVisitedWorkspaceSlug } = useWorkspaceStore()
```

**Error Scenarios**:
- **localStorage unavailable**: State remains in-memory only (no persistence)
- **Corrupt localStorage data**: Rehydration fails silently, state resets to default

---

## Server Actions

### updateWorkspace

**Purpose**: Update workspace name and/or slug with server-side validation

**Type**: Server action (runs on server, called from client)

**Signature**:
```typescript
async function updateWorkspace(
  input: UpdateWorkspaceInput
): Promise<void>
```

**Input**:
```typescript
interface UpdateWorkspaceInput {
  id: string
  name?: string
  slug?: string
}
```

**Validation**:
1. Parse and validate input with `updateWorkspaceSchema` (Zod)
2. Verify user is admin (Firebase Auth custom claim)
3. If slug is changing, check uniqueness (Firestore transaction)
4. Update workspace document with new values + `updatedAt` timestamp

**Implementation**:
```typescript
import { doc, updateDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/admin'
import { updateWorkspaceSchema } from '../schemas/workspace.schemas'
import { requireAdmin } from '@/utils/requireAdmin'

export async function updateWorkspace(input: UpdateWorkspaceInput): Promise<void> {
  // Validate input
  const validated = updateWorkspaceSchema.parse(input)

  // Require admin authentication
  await requireAdmin()

  const workspaceRef = doc(firestore, 'workspaces', validated.id)

  // If slug is changing, verify uniqueness atomically
  if (validated.slug) {
    await runTransaction(firestore, async (transaction) => {
      // Check if slug already exists
      const q = query(
        collection(firestore, 'workspaces'),
        where('slug', '==', validated.slug!.toLowerCase()),
        where('status', '==', 'active')
      )
      const snapshot = await getDocs(q)

      // Reject if slug exists and it's not the current workspace
      if (!snapshot.empty && snapshot.docs[0].id !== validated.id) {
        throw new Error('Slug already in use')
      }

      // Update workspace
      transaction.update(workspaceRef, {
        ...(validated.name && { name: validated.name }),
        ...(validated.slug && { slug: validated.slug.toLowerCase() }),
        updatedAt: Date.now(),
      })
    })
  } else {
    // Only name is changing - simple update
    await updateDoc(workspaceRef, {
      name: validated.name!,
      updatedAt: Date.now(),
    })
  }
}
```

**Returns**: `Promise<void>` (success = no error thrown)

**Error Scenarios**:
| Error | HTTP Equivalent | Message |
|-------|-----------------|---------|
| Validation error | 400 Bad Request | Zod validation error message |
| Unauthorized | 401 Unauthorized | "Unauthorized: Admin access required" |
| Slug conflict | 409 Conflict | "Slug already in use" |
| Workspace not found | 404 Not Found | "Workspace not found" |
| Network error | 500 Internal Server Error | Firestore error message |

---

### checkSlugUniqueness

**Purpose**: Check if a slug is available (client-side pre-validation)

**Type**: Client-side utility function (not a server action)

**Signature**:
```typescript
async function checkSlugUniqueness(
  slug: string,
  currentWorkspaceId?: string
): Promise<boolean>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slug` | `string` | Yes | Slug to check |
| `currentWorkspaceId` | `string` | No | Current workspace ID (to exclude from check) |

**Returns**: `Promise<boolean>`
- `true` if slug is available
- `false` if slug is already in use

**Implementation**:
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

export async function checkSlugUniqueness(
  slug: string,
  currentWorkspaceId?: string
): Promise<boolean> {
  const q = query(
    collection(firestore, 'workspaces'),
    where('slug', '==', slug.toLowerCase()),
    where('status', '==', 'active')
  )

  const snapshot = await getDocs(q)

  // Unique if no matches, or only match is current workspace
  return (
    snapshot.empty ||
    (snapshot.size === 1 && snapshot.docs[0].id === currentWorkspaceId)
  )
}
```

**Usage**:
```typescript
// In form validation
const isAvailable = await checkSlugUniqueness('new-slug', currentWorkspaceId)
if (!isAvailable) {
  setError('slug', { message: 'Slug already in use' })
}
```

**Note**: This is a **pre-check only**. Final validation happens server-side in `updateWorkspace` action.

---

## Route Loaders

### /workspace/$workspaceSlug

**Purpose**: Resolve workspace by slug and setup context

**Type**: TanStack Router `beforeLoad` loader

**Signature**:
```typescript
interface BeforeLoadContext {
  params: { workspaceSlug: string }
}

interface LoaderReturn {
  workspace: Workspace | null
}

async function beforeLoad(
  context: BeforeLoadContext
): Promise<LoaderReturn>
```

**Implementation**:
```typescript
import { createFileRoute } from '@tanstack/react-router'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import { useWorkspaceStore } from '@/domains/workspace/hooks/useWorkspaceStore'

export const Route = createFileRoute('/workspace/$workspaceSlug')({
  beforeLoad: async ({ params }) => {
    const { workspaceSlug } = params

    const q = query(
      collection(firestore, 'workspaces'),
      where('slug', '==', workspaceSlug),
      where('status', '==', 'active')
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return { workspace: null }
    }

    const workspace = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as Workspace

    // Store last visited workspace
    useWorkspaceStore.getState().setLastVisitedWorkspaceSlug(workspaceSlug)

    return { workspace }
  },
})
```

**Returns**:
- `{ workspace: Workspace }` if found
- `{ workspace: null }` if not found (triggers 404 component)

---

### / (Root Route)

**Purpose**: Redirect to last visited workspace or admin dashboard

**Type**: TanStack Router `beforeLoad` loader with redirect

**Signature**:
```typescript
async function beforeLoad(): Promise<never>
```

**Implementation**:
```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useWorkspaceStore } from '@/domains/workspace/hooks/useWorkspaceStore'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { lastVisitedWorkspaceSlug } = useWorkspaceStore.getState()

    if (lastVisitedWorkspaceSlug) {
      throw redirect({
        to: '/workspace/$workspaceSlug',
        params: { workspaceSlug: lastVisitedWorkspaceSlug },
      })
    }

    throw redirect({ to: '/admin' })
  },
})
```

**Returns**: Never returns (always redirects)

**Redirect Logic**:
1. If `lastVisitedWorkspaceSlug` exists → redirect to `/workspace/[slug]`
2. Otherwise → redirect to `/admin` (which auto-redirects to `/admin/workspaces`)

---

### /workspace (Index Route)

**Purpose**: Redirect to last visited workspace or admin dashboard

**Type**: TanStack Router `beforeLoad` loader with redirect

**Signature**: Same as `/` (root route)

**Implementation**: Same as `/` (root route)

---

## Navigation Domain Utilities

**Note**: Workspace icon generation is handled by the **navigation domain**, not the workspace domain. This maintains separation of concerns: navigation handles UI presentation, workspace handles data operations.

### getWorkspaceInitials (Navigation Domain)

**Purpose**: Generate 1-2 letter initials from workspace name for display in WorkspaceSelector

**Location**: `/domains/navigation/lib/getWorkspaceInitials.ts` (already exists, needs update)

**Type**: Pure utility function (client-side)

**Signature**:
```typescript
function getWorkspaceInitials(workspaceName: string | null | undefined): string
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workspaceName` | `string \| null \| undefined` | Yes | Workspace name (1-100 characters) |

**Returns**: `string` - 1-2 letter uppercase initials

**Algorithm**:
1. Trim and split name into words (by whitespace)
2. If null/undefined/empty → return `"?"`
3. If 1 word → return first letter uppercase
4. If 2+ words → return first letter of first 2 words uppercase

**Implementation** (Update existing):
```typescript
export function getWorkspaceInitials(
  workspaceName: string | null | undefined
): string {
  if (!workspaceName || workspaceName.trim() === '') {
    return '?'
  }

  const words = workspaceName.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  if (words.length === 1) {
    return words[0][0].toUpperCase()
  }

  return (words[0][0] + words[1][0]).toUpperCase()
}
```

**Examples**:
```typescript
getWorkspaceInitials('Acme Corp')           // "AC"
getWorkspaceInitials('Acme Inc')            // "AI"
getWorkspaceInitials('Acme Corporation Inc')// "AC"
getWorkspaceInitials('Acme')                // "A" (single word = 1 letter)
getWorkspaceInitials('  Acme   Corp  ')     // "AC"
getWorkspaceInitials('')                    // "?"
getWorkspaceInitials(null)                  // "?"
```

**Usage**: Called by `WorkspaceSelector` component in navigation domain

---

## Error Handling

### Client-Side Error Handling

**TanStack Query errors** are handled via:
```typescript
const { data, isError, error } = useWorkspace(slug)

if (isError) {
  // Display error UI
  return <ErrorState message={error.message} />
}
```

**Mutation errors** are handled via:
```typescript
const { mutateAsync, isError, error } = useUpdateWorkspace()

try {
  await mutateAsync({ id, name, slug })
} catch (err) {
  // Display inline form error
  if (err.message === 'Slug already in use') {
    setError('slug', { message: err.message })
  }
}
```

### Server-Side Error Handling

All server actions throw errors with descriptive messages:

```typescript
// Validation error (Zod)
throw new ZodError([...])

// Authorization error
throw new Error('Unauthorized: Admin access required')

// Business logic error
throw new Error('Slug already in use')

// Not found error
throw new Error('Workspace not found')
```

Client catches these errors and displays appropriate UI feedback.

---

## Summary

### Workspace Domain

**Client Hooks (3)**:
- `useWorkspace` - Fetch workspace by slug (read)
- `useUpdateWorkspace` - Update workspace (mutation)
- `useWorkspaceStore` - Manage session persistence (Zustand + localStorage)

**Server Actions (1)**:
- `updateWorkspace` - Update workspace with validation

**Route Loaders (3)**:
- `/workspace/$workspaceSlug` - Resolve workspace
- `/` - Redirect logic
- `/workspace` - Redirect logic

**Utilities (1)**:
- `checkSlugUniqueness` - Client-side slug validation (pre-check)

### Navigation Domain

**Utilities (1)**:
- `getWorkspaceInitials` - Generate 1-2 letter initials (existing, needs update)

### Architecture
- **Domain separation**: Navigation (UI) + Workspace (data)
- **Client-first**: 90% client-side code (Firebase client SDK)
- **Server actions**: Only for validated writes
- **Type-safe**: Full TypeScript + Zod validation
- **Real-time ready**: Can extend with `onSnapshot` for real-time updates
- **Co-located tests**: Tests live next to their modules
