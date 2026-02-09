import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Project index route - redirects to designer/welcome
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId (exact match)
 * Access: Admin only (enforced by parent route)
 *
 * Redirects to the welcome tab of the project designer.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/',
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
