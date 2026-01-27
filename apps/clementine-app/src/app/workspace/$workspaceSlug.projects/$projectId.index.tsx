import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Project index route - redirects to welcome
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId (exact match)
 * Access: Admin only (enforced by parent route)
 *
 * Redirects to the welcome tab of the project designer.
 * The parent route ($projectId.tsx) handles the designer layout.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/workspace/$workspaceSlug/projects/$projectId/welcome',
      params: {
        workspaceSlug: params.workspaceSlug,
        projectId: params.projectId,
      },
    })
  },
})
