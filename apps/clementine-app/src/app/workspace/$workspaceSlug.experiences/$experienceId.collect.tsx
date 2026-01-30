import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { ExperienceCollectPage } from '@/domains/experience'

/**
 * Search params schema for Collect tab (step selection)
 */
const collectSearchSchema = z.object({
  step: z.string().optional(),
})

export type CollectSearch = z.infer<typeof collectSearchSchema>

/**
 * Experience designer - Collect tab
 *
 * Route: /workspace/:workspaceSlug/experiences/:experienceId/collect
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Manages data collection steps (info, input, capture steps).
 * Search params: ?step={stepId} for deep linking to specific steps
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId/collect',
)({
  component: CollectTab,
  validateSearch: collectSearchSchema,
})

function CollectTab() {
  // Parent route provides experience, workspace data via hooks
  // No need to pass props - ExperienceCollectPage will use Route.useParams() and hooks
  return <ExperienceCollectPage />
}
