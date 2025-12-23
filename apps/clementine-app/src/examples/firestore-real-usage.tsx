/**
 * Real-world example: Company → Project → Event
 * Using Firestore with TanStack Query + Real-time updates
 */

import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { queryOptions, useQuery } from '@tanstack/react-query'
import {
  useFirestoreRealtimeSync,
  useFirestoreNestedRealtimeSync,
} from '../lib/firestore-query'

// ============================================
// 1. Server Functions (for SSR + initial load)
// ============================================

export const getCompanyById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { getFirestore } = await import('firebase-admin/firestore')
    const db = getFirestore()

    const docSnap = await db.collection('companies').doc(id).get()

    if (!docSnap.exists) {
      throw new Error('Company not found')
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    }
  })

export const getProjectById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { getFirestore } = await import('firebase-admin/firestore')
    const db = getFirestore()

    const docSnap = await db.collection('projects').doc(id).get()

    if (!docSnap.exists) {
      throw new Error('Project not found')
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    }
  })

export const getEventById = createServerFn({ method: 'GET' })
  .inputValidator((params: { projectId: string; eventId: string }) => params)
  .handler(async ({ data: { projectId, eventId } }) => {
    const { getFirestore } = await import('firebase-admin/firestore')
    const db = getFirestore()

    // Nested collection: /projects/{projectId}/events/{eventId}
    const docSnap = await db
      .collection('projects')
      .doc(projectId)
      .collection('events')
      .doc(eventId)
      .get()

    if (!docSnap.exists) {
      throw new Error('Event not found')
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    }
  })

// ============================================
// 2. Query Options
// ============================================

export const companyQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: ['companies', companyId],
    queryFn: () => getCompanyById({ data: companyId }),
    staleTime: 5 * 60 * 1000, // Companies don't change often
  })

export const projectQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['projects', projectId],
    queryFn: () => getProjectById({ data: projectId }),
    staleTime: 2 * 60 * 1000,
  })

export const eventQueryOptions = (projectId: string, eventId: string) =>
  queryOptions({
    queryKey: ['projects', projectId, 'events', eventId],
    queryFn: () => getEventById({ data: { projectId, eventId } }),
    staleTime: 30 * 1000, // Events change more frequently
  })

// ============================================
// 3. Custom Hooks with Real-time (Optional)
// ============================================

/**
 * Company data - mostly static, so real-time is optional
 */
export function useCompany(companyId: string, realtime = false) {
  const query = useQuery(companyQueryOptions(companyId))

  // Optionally enable real-time updates
  if (realtime) {
    useFirestoreRealtimeSync(['companies', companyId], 'companies', companyId)
  }

  return query
}

/**
 * Project data - may need real-time for QR codes, active events, etc.
 */
export function useProject(projectId: string, realtime = true) {
  const query = useQuery(projectQueryOptions(projectId))

  if (realtime) {
    useFirestoreRealtimeSync(['projects', projectId], 'projects', projectId)
  }

  return query
}

/**
 * Event data - needs real-time for status, guest counts, etc.
 */
export function useEvent(projectId: string, eventId: string, realtime = true) {
  const query = useQuery(eventQueryOptions(projectId, eventId))

  if (realtime) {
    // Nested collection path
    useFirestoreNestedRealtimeSync(
      ['projects', projectId, 'events', eventId],
      ['projects', projectId, 'events', eventId],
    )
  }

  return query
}

// ============================================
// 4. Route Definition
// ============================================

export const EventDetailRoute = createFileRoute(
  '/$companyId/p/$projectId/events/$eventId',
)({
  // Loader: Prefetch all data during SSR
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        companyQueryOptions(params.companyId),
      ),
      context.queryClient.ensureQueryData(
        projectQueryOptions(params.projectId),
      ),
      context.queryClient.ensureQueryData(
        eventQueryOptions(params.projectId, params.eventId),
      ),
    ])
  },

  component: EventDetailComponent,
})

// ============================================
// 5. Component with Real-time Updates
// ============================================

function EventDetailComponent() {
  const { companyId, projectId, eventId } = EventDetailRoute.useParams()

  // Get data from cache (populated by loader)
  // + optionally enable real-time updates
  const { data: company } = useCompany(companyId, false) // Static
  const { data: project } = useProject(projectId, true) // Real-time
  const { data: event } = useEvent(projectId, eventId, true) // Real-time

  return (
    <div>
      {/* Breadcrumb with parent data */}
      <nav className="text-sm text-gray-400 mb-4">
        {company?.name} / {project?.name} / {event?.name}
      </nav>

      {/* Event content that updates in real-time */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{event?.name}</h1>

        {/* This updates in real-time! */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 p-4 rounded">
            <div className="text-sm text-gray-400">Status</div>
            <div className="text-2xl font-bold">{event?.status}</div>
          </div>

          <div className="bg-slate-800 p-4 rounded">
            <div className="text-sm text-gray-400">Guest Count</div>
            <div className="text-2xl font-bold">{event?.guestCount || 0}</div>
          </div>

          <div className="bg-slate-800 p-4 rounded">
            <div className="text-sm text-gray-400">Photos</div>
            <div className="text-2xl font-bold">{event?.photoCount || 0}</div>
          </div>
        </div>

        {/* Project info (also real-time) */}
        <div className="bg-slate-700 p-4 rounded">
          <h2 className="font-semibold mb-2">Project: {project?.name}</h2>
          <p className="text-sm text-gray-300">
            Active Event: {project?.activeEventId === eventId ? 'Yes' : 'No'}
          </p>
        </div>

        {/* Company branding (static, no real-time needed) */}
        <div
          className="p-4 rounded"
          style={{ backgroundColor: company?.brandColor }}
        >
          <p className="text-white font-semibold">{company?.name}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 6. How This Works
// ============================================

/*
FLOW:

1. USER NAVIGATES TO ROUTE
   ↓
2. LOADER RUNS (Server-side during SSR)
   - Fetches company via Firebase Admin SDK
   - Fetches project via Firebase Admin SDK
   - Fetches event via Firebase Admin SDK
   - Populates TanStack Query cache
   ↓
3. DATA DEHYDRATED & SENT TO CLIENT
   - Cache is serialized into HTML
   ↓
4. CLIENT HYDRATES
   - TanStack Query rehydrates cache
   - Component renders with data (no loading state!)
   ↓
5. REAL-TIME LISTENERS START (Client-only)
   - Project listener starts
   - Event listener starts
   - Company listener skipped (realtime=false)
   ↓
6. FIRESTORE UPDATE HAPPENS
   - Event.guestCount changes in Firestore
   ↓
7. SNAPSHOT CALLBACK FIRES
   - Updates TanStack Query cache
   ↓
8. COMPONENT RE-RENDERS
   - Shows new guestCount automatically!

BENEFITS:
✅ Fast initial load (SSR + cache)
✅ Real-time updates where needed
✅ No refetching parent data
✅ Type-safe
✅ Works on server and client
✅ Clean separation of concerns
*/
