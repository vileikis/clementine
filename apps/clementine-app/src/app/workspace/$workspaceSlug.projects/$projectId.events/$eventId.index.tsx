import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Event index route (redirect)
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId (exact match)
 * Access: Admin only (enforced by parent route)
 *
 * Redirects to the welcome tab by default using beforeLoad.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome',
      params,
    })
  },
})
