import { createFileRoute } from '@tanstack/react-router'

/**
 * Event welcome tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId/welcome
 * Access: Admin only (enforced by parent route)
 *
 * Welcome/overview page for the event.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome',
)({
  component: EventWelcomePage,
})

function EventWelcomePage() {
  const { eventId } = Route.useParams()

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Welcome</h2>
      <p className="text-muted-foreground">
        Welcome page for event {eventId} – work in progress.
      </p>
    </div>
  )
}
