import { createFileRoute } from '@tanstack/react-router'
import { ShareEditorPage } from '@/domains/project-config/share'

/**
 * Project share tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/share
 * Access: Admin only (enforced by parent route)
 *
 * Share screen editor for configuring share screen content and options.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/share',
)({
  component: ShareEditorPage,
})
