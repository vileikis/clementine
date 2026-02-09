import { createFileRoute } from '@tanstack/react-router'
import { ThemeEditorPage } from '@/domains/project-config'

/**
 * Designer theme tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/designer/theme
 * Access: Admin only (enforced by parent route)
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/designer/theme',
)({
  component: ThemeEditorPage,
})
