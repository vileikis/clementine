import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Designer index route - redirects to welcome
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/designer (exact match)
 * Access: Admin only (enforced by parent route)
 *
 * Redirects to the welcome tab within the designer.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/designer/',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/workspace/$workspaceSlug/projects/$projectId/designer/welcome',
      params: {
        workspaceSlug: params.workspaceSlug,
        projectId: params.projectId,
      },
    })
  },
})
