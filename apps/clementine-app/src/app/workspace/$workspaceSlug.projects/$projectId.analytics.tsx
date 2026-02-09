import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsPage } from '@/domains/project'

/**
 * Analytics tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/analytics
 * Access: Admin only (enforced by parent route)
 *
 * WIP placeholder for analytics.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/analytics',
)({
  component: AnalyticsPage,
})
