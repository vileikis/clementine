import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/domains/auth/guards/guards'
import { WorkspacesPage } from '@/domains/admin/workspace/containers/WorkspacesPage'

/**
 * Admin workspaces route
 *
 * Route: /admin/workspaces
 * Access: Admin only (enforced by requireAdmin guard)
 *
 * Displays list of all active workspaces with navigation to workspace detail pages.
 */
export const Route = createFileRoute('/admin/workspaces')({
  beforeLoad: async () => {
    await requireAdmin()
  },
  component: WorkspacesPage,
})
