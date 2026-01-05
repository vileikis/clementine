import { createFileRoute } from '@tanstack/react-router'
import { ThemeEditorPage } from '@/domains/event'

/**
 * Event theme tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId/theme
 * Access: Admin only (enforced by parent route)
 *
 * Theme customization page for the event.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme',
)({
  component: ThemeEditorPage,
})
