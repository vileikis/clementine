import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/domains/auth/guards/guards'
import { WorkspacePage } from '@/domains/workspace/containers/WorkspacePage'

/**
 * Workspace detail route
 *
 * Route: /workspace/:workspaceId (workspaceId is the workspace slug)
 * Access: Admin only (enforced by requireAdmin guard)
 *
 * Displays workspace detail page with workspace-specific features.
 * Shows "Workspace not found" for invalid/deleted workspace slugs.
 */
export const Route = createFileRoute('/workspace/$workspaceId')({
  beforeLoad: async () => {
    await requireAdmin()
  },
  component: () => {
    const { workspaceId } = Route.useParams()
    return <WorkspacePage slug={workspaceId} />
  },
})
