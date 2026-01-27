import { createFileRoute } from '@tanstack/react-router'
import { ProjectConfigSettingsPage } from '@/domains/project-config/settings'

/**
 * Project settings tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/settings
 * Access: Admin only (enforced by parent route)
 *
 * Renders the settings page with sharing configuration UI
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/settings',
)({
  component: ProjectConfigSettingsPage,
})
