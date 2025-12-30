import { createFileRoute } from '@tanstack/react-router'

/**
 * Event theme tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId/theme
 * Access: Admin only (enforced by parent route)
 *
 * Theme customization page for the event.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme',
)({
  component: EventThemePage,
})

function EventThemePage() {
  const { eventId } = Route.useParams()

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Theme</h2>
      <p className="text-muted-foreground">
        Theme customization for event {eventId} – work in progress.
      </p>
    </div>
  )
}
