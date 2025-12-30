import { Outlet, createFileRoute } from '@tanstack/react-router'

/**
 * Projects layout route
 *
 * Route: /workspace/:workspaceSlug/projects
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Layout route for projects - renders child routes (index for list, $projectId for details).
 * Workspace context is maintained via parent route.
 */
export const Route = createFileRoute('/workspace/$workspaceSlug/projects')({
  component: Outlet,
})
