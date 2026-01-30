import { createFileRoute } from '@tanstack/react-router'

import { ExperienceGeneratePage } from '@/domains/experience'

/**
 * Experience designer - Generate tab
 *
 * Route: /workspace/:workspaceSlug/experiences/$experienceId/generate
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Configure AI transformation settings (placeholder/WIP).
 * No search params (ignores query params).
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId/generate',
)({
  component: ExperienceGeneratePage,
})
