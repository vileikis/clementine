import { createFileRoute } from '@tanstack/react-router'
import { ThemeEditorPage } from '@/domains/project-config'

/**
 * Project theme tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/theme
 * Access: Admin only (enforced by parent route)
 *
 * Theme customization page for the project config.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/theme',
)({
  component: ThemeEditorPage,
})
