import { createFileRoute } from '@tanstack/react-router'
import { DistributePage } from '@/domains/project'

/**
 * Distribute tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/distribute
 * Access: Admin only (enforced by parent route)
 *
 * Full-page distribution view with shareable URL, QR code, and instructions.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/distribute',
)({
  component: DistributePage,
})
