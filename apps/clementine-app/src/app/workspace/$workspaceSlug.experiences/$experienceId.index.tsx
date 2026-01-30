import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Experience index route - redirects to collect tab
 *
 * Route: /workspace/:workspaceSlug/experiences/:experienceId (exact match)
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Redirects to the Collect tab of the experience designer.
 * The parent route ($experienceId.tsx) handles the designer layout.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId/',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/workspace/$workspaceSlug/experiences/$experienceId/collect',
      params: {
        workspaceSlug: params.workspaceSlug,
        experienceId: params.experienceId,
      },
    })
  },
})
