/**
 * Clean Firestore + TanStack Query Example
 * With proper imports (no more weird inline imports!)
 */

import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { queryOptions, useQuery } from '@tanstack/react-query'

// ✅ Clean client-side imports
import { useFirestoreDocSync } from '../lib/firestore-client'

// ✅ Clean server-side imports (only in server functions)
import { getDoc } from '../lib/firestore-server'

// ============================================
// Types
// ============================================

interface Company {
  id: string
  name: string
  brandColor: string
  status: 'active' | 'inactive'
}

interface Project {
  id: string
  companyId: string
  name: string
  sharePath: string
  activeEventId?: string
}

interface Event {
  id: string
  projectId: string
  name: string
  status: 'draft' | 'active' | 'ended'
  guestCount?: number
  photoCount?: number
}

// ============================================
// Server Functions (Clean!)
// ============================================

export const getCompanyById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    // ✅ Clean server-side Firestore call
    return await getDoc<Company>('companies', id)
  })

export const getProjectById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    return await getDoc<Project>('projects', id)
  })

export const getEventById = createServerFn({ method: 'GET' })
  .inputValidator((params: { projectId: string; eventId: string }) => params)
  .handler(async ({ data: { projectId, eventId } }) => {
    // For nested collections, you can still use the Admin SDK directly:
    const { getFirestore } = await import('firebase-admin/firestore')
    const db = getFirestore()

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
    } as Event
  })

// ============================================
// Query Options
// ============================================

export const companyQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: ['companies', companyId] as const,
    queryFn: () => getCompanyById({ data: companyId }),
    staleTime: 5 * 60 * 1000,
  })

export const projectQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['projects', projectId] as const,
    queryFn: () => getProjectById({ data: projectId }),
    staleTime: 2 * 60 * 1000,
  })

export const eventQueryOptions = (projectId: string, eventId: string) =>
  queryOptions({
    queryKey: ['projects', projectId, 'events', eventId] as const,
    queryFn: () => getEventById({ data: { projectId, eventId } }),
    staleTime: 30 * 1000,
  })

// ============================================
// Custom Hooks with Real-time
// ============================================

export function useCompany(companyId: string, realtime = false) {
  const query = useQuery(companyQueryOptions(companyId))

  // ✅ Clean hook usage - no weird inline imports!
  if (realtime) {
    useFirestoreDocSync(['companies', companyId], 'companies', companyId)
  }

  return query
}

export function useProject(projectId: string, realtime = true) {
  const query = useQuery(projectQueryOptions(projectId))

  if (realtime) {
    useFirestoreDocSync(['projects', projectId], 'projects', projectId)
  }

  return query
}

export function useEvent(projectId: string, eventId: string, realtime = true) {
  const query = useQuery(eventQueryOptions(projectId, eventId))

  if (realtime) {
    // For nested collections, use the nested hook
    const { useFirestoreNestedDocSync } = require('../lib/firestore-client')
    useFirestoreNestedDocSync(
      ['projects', projectId, 'events', eventId],
      ['projects', projectId, 'events', eventId]
    )
  }

  return query
}

// ============================================
// Route
// ============================================

export const EventDetailRoute = createFileRoute(
  '/$companyId/p/$projectId/events/$eventId'
)({
  loader: async ({ params, context }) => {
    // Prefetch all data during SSR
    await Promise.all([
      context.queryClient.ensureQueryData(companyQueryOptions(params.companyId)),
      context.queryClient.ensureQueryData(projectQueryOptions(params.projectId)),
      context.queryClient.ensureQueryData(
        eventQueryOptions(params.projectId, params.eventId)
      ),
    ])
  },
  component: EventDetailComponent,
})

// ============================================
// Component
// ============================================

function EventDetailComponent() {
  const { companyId, projectId, eventId } = EventDetailRoute.useParams()

  // ✅ Clean and readable!
  const { data: company } = useCompany(companyId, false)
  const { data: project } = useProject(projectId, true)
  const { data: event } = useEvent(projectId, eventId, true)

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-4">
        {company?.name} / {project?.name} / {event?.name}
      </nav>

      {/* Event stats (updates in real-time!) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Status</div>
          <div className="text-2xl font-bold capitalize">{event?.status}</div>
        </div>

        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Guests</div>
          <div className="text-2xl font-bold">{event?.guestCount || 0}</div>
        </div>

        <div className="bg-slate-800 p-4 rounded">
          <div className="text-sm text-gray-400">Photos</div>
          <div className="text-2xl font-bold">{event?.photoCount || 0}</div>
        </div>
      </div>
    </div>
  )
}
