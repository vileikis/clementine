import { createFileRoute } from '@tanstack/react-router'
import { ShareEditorPage } from '@/domains/project-config/share'

/**
 * Designer share tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/designer/share
 * Access: Admin only (enforced by parent route)
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/designer/share',
)({
  component: ShareEditorPage,
})
