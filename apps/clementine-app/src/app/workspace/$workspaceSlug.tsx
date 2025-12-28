import { createFileRoute } from '@tanstack/react-router'
import { WorkspacePage } from '@/domains/workspace/containers/WorkspacePage'

/**
 * Workspace detail route
 *
 * Route: /workspace/:workspaceSlug
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Displays workspace detail page with workspace-specific features.
 * Shows "Workspace not found" for invalid/deleted workspace slugs.
 */
export const Route = createFileRoute('/workspace/$workspaceSlug')({
  component: () => {
    const { workspaceSlug } = Route.useParams()
    return <WorkspacePage slug={workspaceSlug} />
  },
})
