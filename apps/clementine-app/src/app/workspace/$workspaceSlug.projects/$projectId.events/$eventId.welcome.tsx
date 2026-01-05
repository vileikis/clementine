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
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Welcome Tab</h2>
      <p className="text-muted-foreground mt-2">
        Work in progress - Welcome screen editor coming soon
      </p>
    </div>
  )
}
