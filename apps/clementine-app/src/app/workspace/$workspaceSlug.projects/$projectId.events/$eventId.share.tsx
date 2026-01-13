import { createFileRoute } from '@tanstack/react-router'
import { ShareEditorPage } from '@/domains/event/share'

/**
 * Event share tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId/share
 * Access: Admin only (enforced by parent route)
 *
 * Share screen editor for configuring share screen content and options.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/share',
)({
  component: ShareEditorPage,
})
