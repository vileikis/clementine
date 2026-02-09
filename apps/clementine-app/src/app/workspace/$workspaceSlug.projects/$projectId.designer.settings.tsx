import { createFileRoute } from '@tanstack/react-router'
import { ProjectConfigSettingsPage } from '@/domains/project-config/settings'

/**
 * Designer settings tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/designer/settings
 * Access: Admin only (enforced by parent route)
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/designer/settings',
)({
  component: ProjectConfigSettingsPage,
})
