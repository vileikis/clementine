import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailsPage } from '@/domains/workspace/projects'

/**
 * Project details page route (index)
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId (exact match)
 * Access: Admin only (enforced by parent route)
 *
 * Displays project details (placeholder for now).
 * Project data is loaded by parent route and available via useLoaderData().
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/',
)({
  component: ProjectDetailsPage,
})
