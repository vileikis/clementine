import { createFileRoute } from '@tanstack/react-router'

/**
 * Events list page route (index)
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events (exact match)
 * Access: Admin only (enforced by parent route)
 *
 * Lists all events in the project.
 * Project data is available via parent route loader.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/',
)({
  component: EventsListPage,
})

function EventsListPage() {
  const { projectId } = Route.useParams()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Events</h1>
      <p className="text-muted-foreground mt-2">
        Events list for project {projectId} – work in progress.
      </p>
    </div>
  )
}
