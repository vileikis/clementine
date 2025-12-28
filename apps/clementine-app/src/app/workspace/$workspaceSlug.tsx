import { Outlet, createFileRoute } from '@tanstack/react-router'

/**
 * Workspace layout route
 *
 * Route: /workspace/:workspaceSlug
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Layout route that renders child routes (projects, settings, etc.)
 */
export const Route = createFileRoute('/workspace/$workspaceSlug')({
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  return <Outlet />
}
