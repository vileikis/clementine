import { createFileRoute } from '@tanstack/react-router'
import { ProjectEventsPage } from '@/domains/project/events'

/**
 * Project details page route (index)
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId (exact match)
 * Access: Admin only (enforced by parent route)
 *
 * Displays project events management interface.
 * Project data is loaded by parent route and available via useLoaderData().
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/',
)({
  component: function ProjectDetailsRoute() {
    const { projectId } = Route.useParams()
    // TODO: Get activeEventId from parent loader data
    const activeEventId = null

    return <ProjectEventsPage projectId={projectId} activeEventId={activeEventId} />
  },
})
