import { createFileRoute } from '@tanstack/react-router'
import { SettingsSharingPage } from '@/domains/event/settings'

/**
 * Settings tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId/settings
 * Access: Admin only (enforced by parent route)
 *
 * Renders the settings page with sharing configuration UI
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings',
)({
  component: SettingsSharingPage,
})
