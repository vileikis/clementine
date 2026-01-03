import { Navigate, createFileRoute } from '@tanstack/react-router'

/**
 * Event index route (redirect)
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId (exact match)
 * Access: Admin only (enforced by parent route)
 *
 * Redirects to the welcome tab by default.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/',
)({
  component: EventIndexRedirect,
})

function EventIndexRedirect() {
  const { workspaceSlug, projectId, eventId } = Route.useParams()

  return (
    <Navigate
      to="/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome"
      params={{ workspaceSlug, projectId, eventId }}
      replace={true}
    />
  )
}
