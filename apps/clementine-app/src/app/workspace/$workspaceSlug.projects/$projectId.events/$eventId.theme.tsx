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
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Theme Tab</h2>
      <p className="text-muted-foreground mt-2">
        Work in progress - Theme editor coming soon
      </p>
    </div>
  )
}
