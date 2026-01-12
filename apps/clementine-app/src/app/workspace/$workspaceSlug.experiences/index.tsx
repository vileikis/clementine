import { createFileRoute } from '@tanstack/react-router'

import { ExperiencesPage } from '@/domains/experience/library'
import { useWorkspace } from '@/domains/workspace'

/**
 * Experiences list page route
 *
 * Route: /workspace/:workspaceSlug/experiences (exact match)
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Lists all active experiences in the workspace with profile filtering.
 * Workspace context is maintained via parent route.
 */
export const Route = createFileRoute('/workspace/$workspaceSlug/experiences/')({
  component: ExperiencesPageRoute,
})

function ExperiencesPageRoute() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace } = useWorkspace(workspaceSlug)

  return (
    <ExperiencesPage
      workspaceId={workspace?.id || ''}
      workspaceSlug={workspaceSlug}
    />
  )
}
