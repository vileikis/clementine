import { createFileRoute } from '@tanstack/react-router'

import { ExperienceCreatePage } from '@/domains/experience'

/**
 * Experience designer - Create tab
 *
 * Route: /workspace/:workspaceSlug/experiences/$experienceId/create
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Configure AI transformation settings (placeholder/WIP).
 * No search params (ignores query params).
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId/create',
)({
  component: ExperienceCreatePage,
})
