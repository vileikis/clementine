import { createFileRoute } from '@tanstack/react-router'
import { EventSettingsPage } from '@/domains/event'

/**
 * Settings tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId/settings
 * Access: Admin only (enforced by parent route)
 *
 * WIP: Settings editor (overlays, sharing) placeholder
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings',
)({
  component: EventSettingsPage,
})
