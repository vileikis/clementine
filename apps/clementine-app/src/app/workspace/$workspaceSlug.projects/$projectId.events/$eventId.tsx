import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  EventDesignerLayout,
  projectEventQuery,
  useProjectEvent,
} from '@/domains/event'
import { projectQuery, useProject } from '@/domains/project'
import { NotFound } from '@/shared/components/NotFound'

/**
 * Event layout route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId
 * Access: Admin only (enforced by parent route)
 *
 * Layout for event routes (welcome, theme, settings, etc.)
 * Renders tab navigation and child routes.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId',
)({
  loader: async ({ params, context }) => {
    // Ensure event data is in cache (fetches if not cached)
    const event = await context.queryClient.ensureQueryData(
      projectEventQuery(params.projectId, params.eventId),
    )

    // Handle 404 cases
    if (!event) {
      throw notFound()
    }

    // Return 404 for soft-deleted events
    if (event.status === 'deleted') {
      throw notFound()
    }

    // Prefetch project data for breadcrumb (non-blocking)
    context.queryClient.prefetchQuery(projectQuery(params.projectId))

    // No need to return data - it's in cache for hooks to consume
  },
  component: EventLayout,
  notFoundComponent: EventNotFound,
})

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

  return (
    <EventDesignerLayout
      event={event}
      project={project}
      workspaceSlug={workspaceSlug}
    />
  )
}

function EventNotFound() {
  const { workspaceSlug, projectId } = Route.useParams()

  return (
    <NotFound
      title="Event Not Found"
      message="The event you're looking for doesn't exist or has been deleted."
      actionLabel="View All Events"
      actionHref={`/workspace/${workspaceSlug}/projects/${projectId}/events`}
    />
  )
}
