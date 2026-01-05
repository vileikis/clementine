# Data Fetching Strategy: TanStack Query + Firebase Real-time Updates

**Specification:** 011 - Events Domain Backbone
**Date:** 2026-01-05
**Status:** Proposed

## Overview

This document outlines the data fetching strategy for the Events Domain, integrating TanStack Query with Firebase real-time updates for optimal performance, developer experience, and real-time capabilities.

## Problem Statement

Current implementation in `$eventId.tsx` route:
- Fetches data directly in loader using Firebase `getDoc()`
- No real-time updates for event/project changes
- Duplicates fetching logic (loader fetches, component needs data)
- Doesn't leverage TanStack Query caching and optimizations
- Inconsistent with existing `useProject` hook pattern

## Solution: Query Options + Custom Hooks + Loader Integration

### Pattern Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LOADER (Server/Initial)                                   │
│    - ensureQueryData() → Validate & cache event              │
│    - Throw notFound() if missing/deleted                     │
│    - Prefetch project data                                   │
│    - Return nothing (data in cache)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. COMPONENT (Client)                                        │
│    - useProjectEvent() → Get event from cache                │
│    - useProject() → Get project from cache                   │
│    - Data available immediately (no loading state)           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. REAL-TIME UPDATES (Client)                                │
│    - onSnapshot() → Firebase real-time listener              │
│    - setQueryData() → Update TanStack Query cache            │
│    - Component re-renders with new data                      │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Loader validates, hooks provide data**
   - Loader ensures data exists and handles 404s
   - Component uses hooks for data access and real-time updates

2. **Single source of truth: TanStack Query cache**
   - All data flows through query cache
   - Real-time updates via `setQueryData()`
   - Consistent caching strategy across app

3. **No loading states in components**
   - Loader pre-warms cache with `ensureQueryData()`
   - Hooks return cached data immediately
   - Real-time updates happen seamlessly

## Implementation Details

### 1. Query Options Factory

Create reusable query configuration following TanStack Query best practices.

**File:** `src/domains/event/shared/queries/project-event.query.ts`

```typescript
import { queryOptions } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import { projectEventFullSchema } from '../schemas/project-event-full.schema'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query options for fetching a project event
 *
 * Used by:
 * - Route loader (ensureQueryData)
 * - useProjectEvent hook (useQuery)
 *
 * @param projectId - Parent project ID
 * @param eventId - Event ID
 */
export const projectEventQuery = (projectId: string, eventId: string) =>
  queryOptions({
    queryKey: ['project-event', projectId, eventId],
    queryFn: async () => {
      const eventRef = doc(
        firestore,
        `projects/${projectId}/events/${eventId}`
      )
      const eventSnapshot = await getDoc(eventRef)

      if (!eventSnapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(eventSnapshot, projectEventFullSchema)
    },
  })
```

**Key points:**
- Returns `null` if event doesn't exist (loader checks and throws `notFound()`)
- Uses same schema as current implementation (`projectEventFullSchema`)
- Query key structure: `['project-event', projectId, eventId]`

### 2. Real-time Hook

Create hook that combines TanStack Query with Firebase `onSnapshot` for real-time updates.

**File:** `src/domains/event/shared/hooks/useProjectEvent.ts`

```typescript
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, onSnapshot } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import { projectEventFullSchema } from '../schemas/project-event-full.schema'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'
import { projectEventQuery } from '../queries/project-event.query'
import type { ProjectEventFull } from '../schemas/project-event-full.schema'

/**
 * Fetch project event with real-time updates
 *
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - TanStack Query cache integration
 * - Automatic subscription cleanup
 * - Immediate data availability (if loader pre-warmed cache)
 *
 * Pattern: Follows same approach as useProject hook
 *
 * @param projectId - Parent project ID
 * @param eventId - Event ID
 * @returns TanStack Query result with real-time event data
 *
 * @example
 * ```tsx
 * const { data: event } = useProjectEvent(projectId, eventId)
 * const eventName = event?.name
 * ```
 */
export function useProjectEvent(projectId: string, eventId: string) {
  const queryClient = useQueryClient()

  // Set up real-time listener for event
  useEffect(() => {
    const eventRef = doc(firestore, `projects/${projectId}/events/${eventId}`)

    const unsubscribe = onSnapshot(eventRef, (snapshot) => {
      if (!snapshot.exists()) {
        queryClient.setQueryData<ProjectEventFull | null>(
          ['project-event', projectId, eventId],
          null
        )
        return
      }

      // Convert Firestore document (Timestamps → numbers) and validate
      const event = convertFirestoreDoc(snapshot, projectEventFullSchema)

      queryClient.setQueryData<ProjectEventFull>(
        ['project-event', projectId, eventId],
        event
      )
    })

    return () => {
      unsubscribe()
    }
  }, [projectId, eventId, queryClient])

  return useQuery(projectEventQuery(projectId, eventId))
}
```

**Key points:**
- Mirrors `useProject` hook implementation pattern
- `onSnapshot` updates query cache via `setQueryData`
- Returns `useQuery` (not `useSuspenseQuery`) - data already in cache from loader
- Automatic cleanup via `useEffect` return

### 3. Route Loader Integration

Update loader to use `ensureQueryData` for validation and cache warming.

**File:** `src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx`

```typescript
import { createFileRoute, notFound } from '@tanstack/react-router'
import { projectEventQuery } from '@/domains/event'

export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId',
)({
  loader: async ({ params, context }) => {
    // Ensure event data is in cache (fetches if not cached)
    const event = await context.queryClient.ensureQueryData(
      projectEventQuery(params.projectId, params.eventId)
    )

    // Handle 404 cases
    if (!event) {
      throw notFound()
    }

    // Return 404 for soft-deleted events
    if (event.status === 'deleted') {
      throw notFound()
    }

    // Optional: Prefetch project data for breadcrumb (don't await)
    context.queryClient.prefetchQuery(
      projectQuery(params.projectId)
    )

    // No need to return data - it's in cache for hooks to consume
  },
  component: EventLayout,
  notFoundComponent: EventNotFound,
})
```

**Key points:**
- Uses `ensureQueryData` (fetches if needed, returns cached if available)
- Validates event exists and isn't deleted
- Throws `notFound()` for 404 handling
- Optionally prefetches project (non-blocking)
- **Returns nothing** - data accessed via hooks in component

### 4. Component Integration

Update component to use hooks instead of `useLoaderData()`.

**File:** `src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx`

```typescript
function EventLayout() {
  const { workspaceSlug, projectId, eventId } = Route.useParams()

  // Get data from hooks (real-time updates enabled)
  const { data: project } = useProject(projectId)
  const { data: event } = useProjectEvent(projectId, eventId)

  // Data should be immediately available from loader cache
  // These checks are safety guards only
  if (!project || !event) {
    return null
  }

  const projectPath = `/workspace/${workspaceSlug}/projects/${projectId}`
  const projectsListPath = `/workspace/${workspaceSlug}/projects`

  return (
    <>
      <TopNavBar
        breadcrumbs={[
          {
            label: project.name,
            href: projectPath,
            icon: FolderOpen,
            iconHref: projectsListPath,
          },
          {
            label: event.name,
          },
        ]}
        actions={[
          {
            icon: Play,
            onClick: () => toast.success('Coming soon'),
            variant: 'ghost',
            ariaLabel: 'Preview event',
          },
          {
            label: 'Publish',
            icon: Upload,
            onClick: () => toast.success('Coming soon'),
            variant: 'default',
            ariaLabel: 'Publish event',
          },
        ]}
      />
      <EventDesignerPage />
    </>
  )
}
```

**Key changes:**
- ❌ Remove: `const { event, project } = Route.useLoaderData()`
- ✅ Add: `const { data: project } = useProject(projectId)`
- ✅ Add: `const { data: event } = useProjectEvent(projectId, eventId)`
- No loading states needed (data pre-warmed by loader)
- Real-time updates work automatically

### 5. Project Query (Optional Enhancement)

For consistency, we should also create a query options factory for project.

**File:** `src/domains/project/shared/queries/project.query.ts`

```typescript
import { queryOptions } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { projectSchema } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

/**
 * Query options for fetching a project
 *
 * Used by:
 * - Route loaders (prefetchQuery/ensureQueryData)
 * - useProject hook (useQuery)
 */
export const projectQuery = (projectId: string) =>
  queryOptions({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projectRef = doc(firestore, 'projects', projectId)
      const projectSnapshot = await getDoc(projectRef)

      if (!projectSnapshot.exists()) {
        return null
      }

      return convertFirestoreDoc(projectSnapshot, projectSchema)
    },
  })
```

**Then update `useProject` hook to use it:**

```typescript
// In useProject.ts
import { projectQuery } from '../queries/project.query'

export function useProject(projectId: string) {
  // ... onSnapshot setup ...

  return useQuery(projectQuery(projectId))
}
```

## Benefits

### 1. Performance
- ✅ Server-side cache warming (fast initial render)
- ✅ Client-side real-time updates (no polling needed)
- ✅ Optimistic UI updates possible
- ✅ Automatic deduplication of requests

### 2. Developer Experience
- ✅ Consistent pattern across app (follows `useProject`)
- ✅ Type-safe with full TypeScript inference
- ✅ Reusable query options (DRY principle)
- ✅ Clear separation of concerns (loader validates, hooks provide data)

### 3. User Experience
- ✅ No loading states (instant data)
- ✅ Real-time updates across tabs/users
- ✅ Offline support (via TanStack Query cache)
- ✅ Smooth transitions

### 4. Maintainability
- ✅ Single source of truth (query cache)
- ✅ Easy to test (mock query cache)
- ✅ Follows TanStack best practices
- ✅ Aligns with client-first architecture

## File Structure

```
src/domains/event/
├── shared/
│   ├── hooks/
│   │   ├── index.ts                    # Barrel export
│   │   └── useProjectEvent.ts          # ✨ NEW: Real-time hook
│   ├── queries/
│   │   ├── index.ts                    # ✨ NEW: Barrel export
│   │   └── project-event.query.ts      # ✨ NEW: Query options
│   └── schemas/
│       └── ... (existing)

src/domains/project/
└── shared/
    ├── hooks/
    │   └── useProject.ts               # 🔄 UPDATED: Use query options
    └── queries/
        ├── index.ts                    # ✨ NEW: Barrel export
        └── project.query.ts            # ✨ NEW: Query options

src/app/workspace/.../$eventId.tsx      # 🔄 UPDATED: Use hooks, not loader data
```

## Migration Notes

### Before (Current Implementation)

```typescript
// Loader
loader: async ({ params }) => {
  const projectDoc = await getDoc(projectRef)
  const eventDoc = await getDoc(eventRef)

  if (!eventDoc.exists()) throw notFound()

  const event = convertFirestoreDoc(eventDoc, projectEventFullSchema)
  const project = convertFirestoreDoc(projectDoc, projectSchema)

  return { event, project } as any
}

// Component
function EventLayout() {
  const { event, project } = Route.useLoaderData()
  // No real-time updates
}
```

### After (New Implementation)

```typescript
// Loader
loader: async ({ params, context }) => {
  const event = await context.queryClient.ensureQueryData(
    projectEventQuery(params.projectId, params.eventId)
  )

  if (!event || event.status === 'deleted') throw notFound()

  context.queryClient.prefetchQuery(projectQuery(params.projectId))
  // No return needed
}

// Component
function EventLayout() {
  const { projectId, eventId } = Route.useParams()
  const { data: event } = useProjectEvent(projectId, eventId)
  const { data: project } = useProject(projectId)
  // ✨ Real-time updates enabled
}
```

## Testing Strategy

### Unit Tests

1. **Query Options**
   - Test `projectEventQuery` returns correct query config
   - Test `queryFn` handles missing documents

2. **Hooks**
   - Test `useProjectEvent` sets up onSnapshot correctly
   - Test real-time updates trigger re-renders
   - Test cleanup on unmount

### Integration Tests

1. **Loader**
   - Test 404 thrown for missing events
   - Test 404 thrown for deleted events
   - Test cache warming works

2. **Component**
   - Test data renders from hooks
   - Test real-time updates reflect in UI

## Open Questions

None - ready for implementation.

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Router + Query Integration](https://tanstack.com/router/latest/docs/integrations/query)
- [Firebase onSnapshot](https://firebase.google.com/docs/firestore/query-data/listen)
- [Client-First Architecture](../../apps/clementine-app/standards/global/client-first-architecture.md)
- [Existing useProject Hook](../../apps/clementine-app/src/domains/project/shared/hooks/useProject.ts)

---

**Ready for review and implementation.**
