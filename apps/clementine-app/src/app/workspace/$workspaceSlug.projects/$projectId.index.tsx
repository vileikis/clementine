import { createFileRoute } from '@tanstack/react-router'
import { ProjectEventsPage } from '@/domains/project/events'

/**
 * Project details page route (index)
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId (exact match)
 * Access: Admin only (enforced by parent route)
 *
 * Displays project events management interface.
 * ProjectEventsPage now fetches activeEventId automatically via useProjectEvents hook.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/',
)({
  component: function ProjectDetailsRoute() {
    const { projectId } = Route.useParams()

    return <ProjectEventsPage projectId={projectId} />
  },
})
