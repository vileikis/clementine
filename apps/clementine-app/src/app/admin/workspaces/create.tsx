import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/domains/auth/guards/guards'
import { CreateWorkspacePage } from '@/domains/admin/workspace/containers/CreateWorkspacePage'

/**
 * Create workspace route
 *
 * Route: /admin/workspaces/create
 * Access: Admin only (enforced by requireAdmin guard)
 *
 * Form for creating a new workspace.
 */
export const Route = createFileRoute('/admin/workspaces/create')({
  beforeLoad: async () => {
    await requireAdmin()
  },
  component: CreateWorkspacePage,
})
