import { createFileRoute } from '@tanstack/react-router'
import { WelcomeEditorPage } from '@/domains/project-config'

/**
 * Designer welcome tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/designer/welcome
 * Access: Admin only (enforced by parent route)
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/designer/welcome',
)({
  component: WelcomeEditorPage,
})
