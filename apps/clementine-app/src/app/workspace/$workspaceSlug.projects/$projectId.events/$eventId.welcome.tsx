import { createFileRoute } from '@tanstack/react-router'
import { WelcomeEditorPage } from '@/domains/event'

/**
 * Event welcome tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId/welcome
 * Access: Admin only (enforced by parent route)
 *
 * Welcome/overview page for the event.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome',
)({
  component: WelcomeEditorPage,
})
