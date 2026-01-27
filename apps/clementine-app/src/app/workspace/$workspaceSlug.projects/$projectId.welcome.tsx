import { createFileRoute } from '@tanstack/react-router'
import { WelcomeEditorPage } from '@/domains/project-config'

/**
 * Project welcome tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/welcome
 * Access: Admin only (enforced by parent route)
 *
 * Welcome/overview page for the project config.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/welcome',
)({
  component: WelcomeEditorPage,
})
