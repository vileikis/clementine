import { createFileRoute } from '@tanstack/react-router'

import { ExperienceEditorPage } from '@/domains/experience/library'
import { useWorkspace } from '@/domains/workspace'

/**
 * Experience editor page route
 *
 * Route: /workspace/:workspaceSlug/experiences/:experienceId
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Shell page for editing an experience. Full editor coming in E2.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId',
)({
  component: ExperienceEditorPageRoute,
})

function ExperienceEditorPageRoute() {
  const { workspaceSlug, experienceId } = Route.useParams()
  const { data: workspace } = useWorkspace(workspaceSlug)

  return (
    <ExperienceEditorPage
      workspaceId={workspace?.id || ''}
      workspaceSlug={workspaceSlug}
      experienceId={experienceId}
    />
  )
}
