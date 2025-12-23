// Real-world example for your use case:
// /[companyId]/p/[projectId]/events/[eventId]

import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

// ============================================
// 1. Server Functions
// ============================================

export const getCompanyById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    // In real app: Firestore query
    return { id, name: 'Acme Corp', brandColor: '#3b82f6' }
  })

export const getProjectById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    // In real app: Firestore query
    return { id, name: 'Summer Campaign', companyId: 'company-1' }
  })

export const getEventById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    // In real app: Firestore query
    return { id, name: 'Beach Party', projectId: 'project-1' }
  })

// ============================================
// 2. Query Options (for caching)
// ============================================

export const companyQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: ['companies', companyId],
    queryFn: () => getCompanyById({ data: companyId }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

export const projectQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['projects', projectId],
    queryFn: () => getProjectById({ data: projectId }),
    staleTime: 5 * 60 * 1000,
  })

export const eventQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ['events', eventId],
    queryFn: () => getEventById({ data: eventId }),
    staleTime: 5 * 60 * 1000,
  })

// ============================================
// 3. Route Definitions
// ============================================

// Route: /$companyId
export const CompanyLayoutRoute = createFileRoute('/$companyId')({
  loader: async ({ params, context }) => {
    // Prefetch company data - will be cached
    await context.queryClient.ensureQueryData(
      companyQueryOptions(params.companyId),
    )
  },
})

// Route: /$companyId/p/$projectId
export const ProjectLayoutRoute = createFileRoute('/$companyId/p/$projectId')({
  loader: async ({ params, context }) => {
    // Prefetch both company (from cache) and project
    await Promise.all([
      context.queryClient.ensureQueryData(
        companyQueryOptions(params.companyId),
      ),
      context.queryClient.ensureQueryData(
        projectQueryOptions(params.projectId),
      ),
    ])
  },
})

// Route: /$companyId/p/$projectId/events/$eventId
export const EventDetailRoute = createFileRoute(
  '/$companyId/p/$projectId/events/$eventId',
)({
  loader: async ({ params, context }) => {
    // Prefetch all three - company and project will use cache!
    await Promise.all([
      context.queryClient.ensureQueryData(
        companyQueryOptions(params.companyId),
      ),
      context.queryClient.ensureQueryData(
        projectQueryOptions(params.projectId),
      ),
      context.queryClient.ensureQueryData(eventQueryOptions(params.eventId)),
    ])
  },

  component: EventDetailComponent,
})

// ============================================
// 4. Component with Access to All Data
// ============================================

function EventDetailComponent() {
  // Get all params from the route (including parent params!)
  const { companyId, projectId, eventId } = EventDetailRoute.useParams()

  // All queries read from cache - NO additional fetches!
  const { data: company } = useQuery(companyQueryOptions(companyId))
  const { data: project } = useQuery(projectQueryOptions(projectId))
  const { data: event } = useQuery(eventQueryOptions(eventId))

  return (
    <div>
      {/* Breadcrumb using parent data */}
      <nav className="text-sm text-gray-400 mb-4">
        {company?.name} / {project?.name} / {event?.name}
      </nav>

      {/* Event details with access to parent data */}
      <div style={{ borderColor: company?.brandColor }}>
        <h1>{event?.name}</h1>
        <p>Part of: {project?.name}</p>
        <p>Company: {company?.name}</p>
      </div>

      {/* You have access to all IDs */}
      <div className="text-xs text-gray-500">
        Company ID: {companyId}
        <br />
        Project ID: {projectId}
        <br />
        Event ID: {eventId}
      </div>
    </div>
  )
}

// ============================================
// WHY THIS APPROACH WORKS BEST
// ============================================

/*
✅ Benefits:

1. NO REFETCHING
   - Company fetched once, cached
   - When you navigate to project route, reads from cache
   - When you navigate to event route, reads from cache

2. TYPE SAFE
   - Params are fully typed
   - Data is fully typed via queryOptions

3. WORKS ON SERVER AND CLIENT
   - Loaders prefetch during SSR
   - Data is dehydrated and sent to client
   - Client rehydrates and uses cache

4. CLEAN SEPARATION
   - Each route declares what data it needs
   - TanStack Query handles caching automatically
   - No manual context passing needed

5. EASY TO INVALIDATE
   - queryClient.invalidateQueries(['companies', companyId])
   - queryClient.invalidateQueries(['projects', projectId])
   - Automatic refetch on mutation

6. OPTIMISTIC UPDATES
   - Easy to implement with TanStack Query
   - Cache updates propagate automatically
*/
