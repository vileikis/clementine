import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Experience designer parent route
 *
 * Route: /workspace/:workspaceSlug/experiences/:experienceId
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Redirects to the Collect tab by default (no component rendered).
 * Child routes: /collect, /generate
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/workspace/$workspaceSlug/experiences/$experienceId/collect',
      params,
    })
  },
})
