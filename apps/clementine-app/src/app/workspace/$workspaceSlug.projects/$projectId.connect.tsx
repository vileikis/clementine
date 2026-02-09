import { createFileRoute } from '@tanstack/react-router'
import { ConnectPage } from '@/domains/project'

/**
 * Connect tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/connect
 * Access: Admin only (enforced by parent route)
 *
 * WIP placeholder for integrations & webhooks.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/connect',
)({
  component: ConnectPage,
})
