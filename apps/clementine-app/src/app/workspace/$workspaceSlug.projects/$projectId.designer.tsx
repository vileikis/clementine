import { createFileRoute } from '@tanstack/react-router'
import { ProjectConfigDesignerLayout } from '@/domains/project-config'

/**
 * Designer layout route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/designer
 * Access: Admin only (enforced by parent route)
 *
 * Layout for designer sub-tabs (Welcome, Share, Theme, Settings).
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/designer',
)({
  component: ProjectConfigDesignerLayout,
})
