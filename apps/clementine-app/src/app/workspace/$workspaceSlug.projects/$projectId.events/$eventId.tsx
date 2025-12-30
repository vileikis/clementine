import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

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
  component: EventLayout,
})

function EventLayout() {
  const { workspaceSlug, projectId, eventId } = Route.useParams()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Event: {eventId}</h1>
        <div className="flex gap-4 mt-4 border-b">
          {/* TODO: Replace with proper tab navigation component */}
          <Link
            to="/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome"
            params={{ workspaceSlug, projectId, eventId }}
            className="px-4 py-2"
            activeProps={{
              className: 'border-b-2 border-primary',
            }}
          >
            Welcome
          </Link>
          <Link
            to="/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme"
            params={{ workspaceSlug, projectId, eventId }}
            className="px-4 py-2"
            activeProps={{
              className: 'border-b-2 border-primary',
            }}
          >
            Theme
          </Link>
        </div>
      </div>
      <Outlet /> {/* Child route renders here */}
    </div>
  )
}
