import { createFileRoute } from '@tanstack/react-router'

import { CreateExperiencePage } from '@/domains/experience/library'
import { useWorkspace } from '@/domains/workspace'

/**
 * Create experience page route
 *
 * Route: /workspace/:workspaceSlug/experiences/create
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Form for creating a new experience with name and profile selection.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/create',
)({
  component: CreateExperiencePageRoute,
})

function CreateExperiencePageRoute() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace } = useWorkspace(workspaceSlug)

  return (
    <CreateExperiencePage
      workspaceId={workspace?.id || ''}
      workspaceSlug={workspaceSlug}
    />
  )
}
